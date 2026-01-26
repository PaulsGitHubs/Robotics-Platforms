/* Simple AircraftManager: spawns aircraft and advances them with a basic autopilot
   - spawnAircraft(position, options)
   - update() called on each preUpdate
*/
export default class AircraftManager {
  constructor(viewer) {
    this.viewer = viewer;
    this.aircraft = [];
    this._handler = () => this.update();
    this.started = false;
  }

  start() {
    if (this.started) return;
    this.started = true;
    this.viewer.scene.preUpdate.addEventListener(this._handler);
  }

  stop() {
    if (!this.started) return;
    this.viewer.scene.preUpdate.removeEventListener(this._handler);
    this.started = false;
  }

  spawnAircraft(position, options = {}) {
    const model = options.model || '/static/assets/models/aircraft/airplane.glb';
    const speed = options.speed || 80; // meters per second
    const heading = options.heading || 0;

    const ent = this.viewer.entities.add({
      position,
      model: { uri: model, minimumPixelSize: 64 },
      orientation: Cesium.Transforms.headingPitchRollQuaternion(position, heading, 0, 0),
      name: 'aircraft',
    });

    // attach label onto the aircraft entity
    ent.label = {
      text: ent.name || 'aircraft',
      font: '13px sans-serif',
      pixelOffset: new Cesium.Cartesian2(0, -30),
      showBackground: true,
    };

    // simple aircraft state
    const state = {
      entity: ent,
      speed,
      heading,
      pitch: 0,
    };

    this.aircraft.push(state);
    return state;
  }

  update() {
    const dt = 1 / 60; // approximate step; viewer has variable dt but we keep this simple
    for (const a of this.aircraft) {
      try {
        const pos = a.entity.position.getValue();
        // move forward along local east/north vector rotated by heading
        const heading = a.heading;
        const dx = Math.cos(heading) * a.speed * dt;
        const dy = Math.sin(heading) * a.speed * dt;

        const carto = Cesium.Cartographic.fromCartesian(pos);
        const lat = Cesium.Math.toDegrees(carto.latitude);
        const lon = Cesium.Math.toDegrees(carto.longitude);

        // small displacement in degrees approximation (works for demo-scale)
        const metersPerDeg = 111320; // rough
        const newLon = lon + dx / (metersPerDeg * Math.cos(carto.latitude));
        const newLat = lat + dy / metersPerDeg;
        const newPos = Cesium.Cartesian3.fromDegrees(newLon, newLat, carto.height + 0.5);

        a.entity.position = newPos;
        // update orientation to heading
        a.entity.orientation = Cesium.Transforms.headingPitchRollQuaternion(
          newPos,
          heading,
          a.pitch,
          0
        );
      } catch (e) {
        // ignore per-entity errors
      }
    }
  }
}
