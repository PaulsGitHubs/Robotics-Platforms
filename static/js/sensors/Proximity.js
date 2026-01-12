// static/js/sensors/Proximity.js
import { SensorBase } from "./SensorBase.js";

export class Proximity extends SensorBase {
    addToScene() {
        this.entity = this.viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(this.lon, this.lat, this.height),
            ellipsoid: {
                radii: new Cesium.Cartesian3(this.range, this.range, this.range),
                material: Cesium.Color.PURPLE.withAlpha(0.25),
                outline: true
            }
        });
    }
}
