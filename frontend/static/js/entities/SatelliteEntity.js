export default class SatelliteEntity {
  constructor(viewer, options = {}) {
    this.angle = 0;
    this.altitude = options.altitude ?? 400000;
    const useModel = !!options.useModel;

    if (useModel) {
      this.entity = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(0, 0, this.altitude),
        model: { uri: "/static/assets/models/satellites/satellite.glb" }
      });
    } else {
      this.entity = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(0, 0, this.altitude),
        point: { pixelSize: 6, color: Cesium.Color.CYAN }
      });
    }
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
