// static/js/sensors/Radar.js
import { SensorBase } from "./SensorBase.js";

export class Radar extends SensorBase {
    addToScene() {
        const shortId = this.id.substring(0, 6);
        this.entity = this.viewer.entities.add({
            id: this.id,
            name: `${this.type} Sensor [${shortId}]`,
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
