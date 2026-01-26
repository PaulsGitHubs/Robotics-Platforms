/* global Cesium */
/* eslint-env browser */
import { SatelliteManager } from './satellite_manager.js';
import { applyCheckpoint } from './event_triggers.js';
import VehicleEntity from '../entities/VehicleEntity.js';
import { enablePhysics } from '../physics_bridge.js';

export class SimulationManager {
  constructor(viewer) {
    this.viewer = viewer;
    this.entities = [];
    this.satellites = new SatelliteManager(viewer);
  }

  async start() {
    // prefer a stable test-friendly id for the primary vehicle, fallback to timestamped id if taken
    // Use a stable id expected by tests
    const vid = 'car1';
    const modelUri = '/static/assets/models/cars/sedan.glb';
    let car = null;

    // Consult the assets registry to determine whether to instantiate the 3D car model
    let carUseModel = false;
    try {
      const res = await fetch('/api/assets/registry');
      if (res.ok) {
        const j = await res.json();
        const m = j?.models?.car;
        if (m && m.exists === true) carUseModel = true;
      }
    } catch (e) {
      // ignore and fall back to point
    }

    if (carUseModel) {
      // Validate GLB header to avoid letting Cesium parse corrupted GLBs.
      try {
        const { validateGlbHeader } = await import('/static/js/asset_utils.js');
        const ok = await validateGlbHeader(modelUri);
        if (ok) {
          car = this.viewer.entities.add({
            id: vid,
            name: vid,
            position: Cesium.Cartesian3.fromDegrees(-74.006, 40.7128),
            model: { uri: modelUri },
          });
          if (car.model && car.model.readyPromise && typeof car.model.readyPromise.then === 'function') {
            try {
              await car.model.readyPromise;
            } catch (e) {
              if (!window.__vehicleModelFallbackLogged) {
                console.info('[VehicleModel] sedan.glb failed to load or is corrupted → using box fallback');
                window.__vehicleModelFallbackLogged = true;
              }
              try { this.viewer.entities.remove(car); } catch (err) {}
              car = this.viewer.entities.add({
                id: vid,
                name: vid,
                position: Cesium.Cartesian3.fromDegrees(-74.006, 40.7128),
                box: { dimensions: new Cesium.Cartesian3(4, 2, 1), material: Cesium.Color.ORANGE }
              });
            }
          }
        } else {
          if (!window.__vehicleModelFallbackLogged) {
            console.info('[VehicleModel] sedan.glb invalid or corrupted → using box fallback');
            window.__vehicleModelFallbackLogged = true;
          }
          car = this.viewer.entities.add({
            id: vid,
            name: vid,
            position: Cesium.Cartesian3.fromDegrees(-74.006, 40.7128),
            box: { dimensions: new Cesium.Cartesian3(4, 2, 1), material: Cesium.Color.ORANGE }
          });
        }
      } catch (e) {
        if (!window.__vehicleModelFallbackLogged) {
          console.info('[VehicleModel] Failed to validate sedan.glb → using box fallback');
          window.__vehicleModelFallbackLogged = true;
        }
        car = this.viewer.entities.add({
          id: vid,
          name: vid,
          position: Cesium.Cartesian3.fromDegrees(-74.006, 40.7128),
          box: { dimensions: new Cesium.Cartesian3(4, 2, 1), material: Cesium.Color.ORANGE }
        });
      }
    } else {
      car = this.viewer.entities.add({
        id: vid,
        name: vid,
        position: Cesium.Cartesian3.fromDegrees(-74.006, 40.7128),
        point: { pixelSize: 10, color: Cesium.Color.ORANGE },
      });
    }

    // Add vehicle wrapper and enable physics so motion is observable
    this.vehicle = new VehicleEntity(vid, car);
    enablePhysics(car, { mass: 1200, drag: 0.02, playerControlled: false });
    this.entities.push(this.vehicle);

    console.log(
      '[SimulationManager] Created car entity with id:',
      car.id || vid,
      'name:',
      car.name || 'N/A'
    );
    try {
      window.__lastCreatedVehicleId = car.id || vid;
    } catch (e) {}

    // register this car as the active vehicle so AI, tracking and labels reference the same entity
    try {
      setActiveVehicleFromEntity(car);
    } catch (e) {
      console.warn('Failed to register active vehicle on start:', e);
    }

    // small delay to ensure entities register in Cesium before continuing
    await new Promise((res) => setTimeout(res, 150));

    // start satellite manager (await and handle failures gracefully)
    if (typeof this.satellites?.start === 'function') {
      try {
        const satCount = await this.satellites.start();
        console.log('[SimulationManager] SatelliteManager started with', satCount, 'satellite(s)');
      } catch (e) {
        console.warn(
          '[SimulationManager] SatelliteManager failed to start, continuing without satellites',
          e
        );
      }
    }

    // Optional: connect to physics server for multiplayer snapshots
    try {
      const { PhysicsNetwork } = await import('/static/js/network/PhysicsNetwork.js');
      const router = await import('/static/js/physics-runtime/PhysicsRouter.js');
      this._net = new PhysicsNetwork();
      this._net.connect();
      // expose a global handle so controllers can route inputs to the network
      try {
        window.__physicsNetwork = this._net;
      } catch (e) {}
      this._net.onSnapshot = (snapshot) => {
        try {
          router.applySnapshot(snapshot);
        } catch (e) {}
      };
      console.log('[SimulationManager] PhysicsNetwork client started');
    } catch (e) {
      // Not critical — continue in single-player mode
      console.warn(
        '[SimulationManager] PhysicsNetwork failed to start (continuing single-player)',
        e
      );
    }

    // create a simple checkpoint a short distance ahead of the car (for braking test)
    this.checkpoint = this.viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(-74.00605, 40.7128),
      point: { pixelSize: 10, color: Cesium.Color.YELLOW },
    });

    // auto-drive: accelerate periodically until stopped
    this._driveInterval = setInterval(() => {
      if (this.vehicle && !this.vehicle.isStopped) {
        this.vehicle.accelerate(0.2);
      }
    }, 200);

    // store bound handler so it can be removed on stop()
    this._preUpdateHandler = () => this.update();
    this.viewer.scene.preUpdate.addEventListener(this._preUpdateHandler);

    // Return a defined startup result to avoid undefined returns
    return { vehicleId: vid, satelliteCount: this.satellites?.satellites.length || 0 };
  }

  stop() {
    if (this._preUpdateHandler && this.viewer?.scene?.preUpdate) {
      this.viewer.scene.preUpdate.removeEventListener(this._preUpdateHandler);
      this._preUpdateHandler = null;
    }

    if (this._driveInterval) {
      clearInterval(this._driveInterval);
      this._driveInterval = null;
    }

    if (this.checkpoint) {
      try {
        this.viewer.entities.remove(this.checkpoint);
      } catch (e) {}
      this.checkpoint = null;
    }

    if (typeof this.satellites?.stop === 'function') {
      this.satellites.stop();
    }

    if (this._net) {
      try {
        this._net.close();
      } catch (e) {}
      try {
        window.__physicsNetwork = null;
      } catch (e) {}
      this._net = null;
    }

    // optionally clear entities
    // this.viewer.entities.removeAll();
  }

  update() {
    this.entities.forEach((e) => e.update?.());

    // apply checkpoint event trigger
    if (this.vehicle && this.checkpoint) {
      const posV = this.vehicle.entity.position.getValue();
      const posC = this.checkpoint.position.getValue();
      const dist = Cesium.Cartesian3.distance(posV, posC);
      applyCheckpoint(this.vehicle, dist);
    }
  }
}

// --- convenience helpers for integration with other modules ---
let _simManager = null;
export function createSimulation(viewer) {
  if (_simManager && _simManager.viewer === viewer) return _simManager;
  _simManager = new SimulationManager(viewer);
  return _simManager;
}

export function getActiveVehicle() {
  return _simManager?.vehicle;
}

export function setActiveVehicleFromEntity(entity) {
  if (!_simManager || !entity) return null;
  // If the entity already has an id, use it; otherwise generate one
  const id = entity.id || `active-${Date.now()}`;
  try {
    // Ensure entity has a label so UI and trackers can use it
    if (!entity.label) {
      entity.label = {
        text: entity.name || id,
        font: '13px sans-serif',
        pixelOffset: new Cesium.Cartesian2(0, -30),
        showBackground: true,
      };
    }

    const v = new VehicleEntity(id, entity);
    _simManager.vehicle = v;
    // add to entities list if not present
    if (!_simManager.entities.includes(v)) {
      _simManager.entities.push(v);
    }
    console.log('Active vehicle set:', id);
    return v;
  } catch (e) {
    console.error('Failed to set active vehicle:', e);
    return null;
  }
}

export function stopSimulation() {
  if (_simManager) {
    _simManager.stop();
    _simManager = null;
  }
}
