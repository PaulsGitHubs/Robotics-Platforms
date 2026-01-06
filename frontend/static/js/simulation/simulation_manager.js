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
    // generate a stable-ish unique id for the vehicle
    const vid = `vehicle-${Date.now()}`;
    const modelUri = '/static/assets/models/cars/sedan.glb';
    let car = null;

    // Try HEAD to check if model exists / is non-empty; otherwise fallback to a point
    try {
      const head = await fetch(modelUri, { method: 'HEAD' });
      const contentLen = head.headers.get('content-length');
      if (head.ok && contentLen && parseInt(contentLen, 10) > 50) {
        car = this.viewer.entities.add({
          id: vid,
          name: vid,
          position: Cesium.Cartesian3.fromDegrees(-74.006, 40.7128),
          model: { uri: modelUri },
        });
      } else {
        car = this.viewer.entities.add({
          id: vid,
          name: vid,
          position: Cesium.Cartesian3.fromDegrees(-74.006, 40.7128),
          point: { pixelSize: 10, color: Cesium.Color.ORANGE },
        });
      }
    } catch (e) {
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

    // register this car as the active vehicle so AI, tracking and labels reference the same entity
    try {
      setActiveVehicleFromEntity(car);
    } catch (e) {
      console.warn('Failed to register active vehicle on start:', e);
    }

    // start satellite manager
    if (typeof this.satellites?.start === 'function') {
      this.satellites.start();
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
