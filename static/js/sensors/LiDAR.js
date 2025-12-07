// static/js/sensors/LiDAR.js
import { SensorBase } from "./SensorBase.js";

export class LiDAR extends SensorBase {
    addToScene() {
        this.entity = this.viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(this.lon, this.lat, this.height),
            ellipsoid: {
                radii: new Cesium.Cartesian3(this.range, this.range, this.range / 2),
                material: Cesium.Color.GREEN.withAlpha(0.2),
                outline: true
            }
        });
    }
}
