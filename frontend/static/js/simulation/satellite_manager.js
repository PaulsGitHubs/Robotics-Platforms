/* global Cesium */

export class SatelliteManager {
  constructor(viewer) {
    this.viewer = viewer;
    this.satellites = [];
  }

  start() {
    // Add a simple orbiting satellite as a demo, but check whether the model exists and is valid.
    const uri = '/static/assets/models/satellites/satellites.glb';
    const addEntityAsModel = (scale = 2) => {
      const satellite = this.viewer.entities.add({
        model: { uri, scale },
      });
      satellite._lon = 0;
      satellite.position = new Cesium.CallbackProperty(() => {
        return Cesium.Cartesian3.fromDegrees(satellite._lon, 0, 400000);
      }, false);
      this.satellites.push(satellite);
    };

    const addEntityAsPoint = () => {
      const satellite = this.viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(0, 0, 400000),
        point: { pixelSize: 6, color: Cesium.Color.CYAN },
      });
      satellite._lon = 0;
      satellite.position = new Cesium.CallbackProperty(() => {
        return Cesium.Cartesian3.fromDegrees(satellite._lon, 0, 400000);
      }, false);
      this.satellites.push(satellite);
    };

    // Attempt a HEAD request to validate model file; fall back on failure
    (async () => {
      try {
        const head = await fetch(uri, { method: 'HEAD' });
        const contentLen = head.headers.get('content-length');
        if (head.ok && contentLen && parseInt(contentLen, 10) > 200) {
          addEntityAsModel();
        } else {
          console.warn('Satellite model missing or too small — using point fallback');
          addEntityAsPoint();
        }
      } catch (e) {
        console.warn('Satellite model check failed — using point fallback', e);
        addEntityAsPoint();
      }
    })();

    // store handler reference to allow stopping later
    this._onTickHandler = () => {
      const time = Date.now() * 0.00005;
      const lon = (time * 360) % 360;
      this.satellites.forEach((s) => {
        s._lon = lon;
      });
    };

    this.viewer.clock.onTick.addEventListener(this._onTickHandler);
  }

  stop() {
    if (this._onTickHandler) {
      this.viewer.clock.onTick.removeEventListener(this._onTickHandler);
      this._onTickHandler = null;
    }
  }
}
