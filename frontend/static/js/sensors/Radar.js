// static/js/sensors/Radar.js
import { SensorBase } from "./SensorBase.js";

export class Radar extends SensorBase {
    addToScene() {
        this.entity = this.viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(this.lon, this.lat, this.height),
            ellipse: {
                semiMajorAxis: this.range,
                semiMinorAxis: this.range,
                height: this.height,
                material: Cesium.Color.ORANGE.withAlpha(0.2),
                outline: true
            }
        });
    }
}
