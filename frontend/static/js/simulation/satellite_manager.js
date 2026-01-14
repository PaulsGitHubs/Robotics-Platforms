/* global Cesium */

export class SatelliteManager {
  constructor(viewer) {
    this.viewer = viewer;
    this.satellites = [];
    this._onTickHandler = null;
  }

  async start() {
    console.info('[SatelliteManager] Initializing');

    const uri = '/static/assets/models/satellites/satellite.glb'; // canonical name

    // Determine whether the satellite model actually exists on the server by
    // consulting the assets registry. This avoids issuing any HEAD/GET requests
    // for the GLB itself when it is absent.
    let modelAvailable = false;
    try {
      const res = await fetch('/api/assets/registry');
      if (res.ok) {
        const j = await res.json();
        const s = j?.models?.satellite;
        if (s && s.model === uri && s.exists === true) modelAvailable = true;
      }
    } catch (e) {
      // If registry isn't available, fall back to point silently
    }

    const createOrbit = (sat) => {
      sat._lon = 0;
      sat.position = new Cesium.CallbackProperty(() => {
        return Cesium.Cartesian3.fromDegrees(sat._lon, 0, 400000);
      }, false);
    };

    const addPoint = () => {
      const sat = this.viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(0, 0, 400000),
        point: {
          pixelSize: 6,
          color: Cesium.Color.CYAN,
        },
      });
      createOrbit(sat);
      this.satellites.push(sat);
      return sat;
    };

    const addModel = async () => {
      // Only attempt to create the model entity when we have confirmed it exists
      const sat = this.viewer.entities.add({
        model: {
          uri,
          scale: 2,
        },
      });

      createOrbit(sat);
      this.satellites.push(sat);

      if (sat.model && sat.model.readyPromise && typeof sat.model.readyPromise.then === 'function') {
        try {
          await sat.model.readyPromise;
          return sat;
        } catch (err) {
          // If model failed to instantiate despite being present, remove it and fall
          // back to a non-blocking point. Use an info-level message for optional fallback.
          try {
            this.viewer.entities.remove(sat);
          } catch (e) {}
          console.info('[SatelliteManager] Satellite model failed to load → using point fallback');
          return addPoint();
        }
      }

      // If readyPromise isn't present, still treat as failure and fallback to point
      try {
        this.viewer.entities.remove(sat);
      } catch (e) {}
      console.info('[SatelliteManager] Satellite model unavailable → using point fallback');
      return addPoint();
    };

    if (modelAvailable) {
      // attempt once, but do not allow failures to bubble up
      try {
        await addModel();
      } catch (e) {
        // already handled by addModel fallback
      }
    } else {
      // Known-missing: do not request the GLB file; instantiate the lightweight fallback
      addPoint();
    }

    this._onTickHandler = () => {
      const lon = ((Date.now() * 0.00005) * 360) % 360;
      this.satellites.forEach((s) => (s._lon = lon));
    };

    this.viewer.clock.onTick.addEventListener(this._onTickHandler);

    // Return how many satellites were added so callers can continue deterministically
    return this.satellites.length;
  }

  stop() {
    if (this._onTickHandler) {
      this.viewer.clock.onTick.removeEventListener(this._onTickHandler);
      this._onTickHandler = null;
    }

    this.satellites.forEach((s) => {
      try {
        this.viewer.entities.remove(s);
      } catch {}
    });
    this.satellites.length = 0;
  }
}
