// static/js/sensors/Ultrasonic.js
import { SensorBase } from "./SensorBase.js";

export class Ultrasonic extends SensorBase {
    addToScene() {
        this.entity = this.viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(this.lon, this.lat, this.height),
            cone: {
                radius: this.range,
                angle: Cesium.Math.toRadians(this.fov),
                material: Cesium.Color.CYAN.withAlpha(0.3)
            }
        });
    }
}
