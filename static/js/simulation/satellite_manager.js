/* global Cesium */

export class SatelliteManager {
  constructor(viewer) {
    this.viewer = viewer;
    this.satellites = [];
    this._onTickHandler = null;
  }

  async start() {
    console.log('[SatelliteManager] LOADED NEW VERSION');

    const uri = '/static/assets/models/satellites/satellite.glb'; // ✅ verify name

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
      // Ask the assets registry whether the satellite model exists. If the
      // registry indicates the model is absent, do NOT request the GLB and
      // immediately use the lightweight point fallback.
      try {
        const res = await fetch('/api/assets/registry');
        if (!res.ok) return addPoint();
        const j = await res.json();
        const m = j?.models?.satellite;
        if (!m || m.exists !== true) {
          console.info('[SatelliteManager] Satellite model not present → using point fallback');
          return addPoint();
        }
      } catch (e) {
        // Registry unavailable: fallback silently to point
        return addPoint();
      }

      // The registry claims the model exists; create the model entity once.
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
          try {
            this.viewer.entities.remove(sat);
          } catch (e) {}
          console.info('[SatelliteManager] Satellite model failed to load → using point fallback');
          return addPoint();
        }
      }

      try {
        this.viewer.entities.remove(sat);
      } catch (e) {}
      console.info('[SatelliteManager] Satellite model unavailable → using point fallback');
      return addPoint();
    };

    await addModel();

    this._onTickHandler = () => {
      const lon = ((Date.now() * 0.00005) * 360) % 360;
      this.satellites.forEach((s) => (s._lon = lon));
    };

    this.viewer.clock.onTick.addEventListener(this._onTickHandler);
    // Return a concrete value so callers can await this reliably
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
