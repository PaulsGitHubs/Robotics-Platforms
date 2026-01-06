export default class SatelliteEntity {
  constructor(viewer, altitude = 400000) {
    this.angle = 0;
    this.altitude = altitude;

    this.entity = viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(0, 0, altitude),
      model: { uri: "/static/assets/models/satellites/satellite.glb" }
    });
  }

  update() {
    this.angle += 0.002;
    const lon = this.angle * 180 / Math.PI;
    const lat = Math.sin(this.angle) * 20;

    this.entity.position = Cesium.Cartesian3.fromDegrees(
      lon, lat, this.altitude
    );
  }
}
