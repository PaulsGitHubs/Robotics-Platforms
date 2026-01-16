export default class SatelliteEntity {
  constructor(viewer, options = {}) {
    this.viewer = viewer;
    this.altitude = options.altitude || 400000;
    this.speed = options.speed || 0.01;
    this.angle = 0;

    this.entity = viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(0, 0, this.altitude),
      model: { uri: '/static/assets/models/satellites/satellites.glb' },
    });
  }

  update() {
    this.angle += this.speed;
    const lon = (this.angle * 180) / Math.PI;
    const lat = Math.sin(this.angle) * 30;

    this.entity.position = Cesium.Cartesian3.fromDegrees(lon, lat, this.altitude);
  }
}
