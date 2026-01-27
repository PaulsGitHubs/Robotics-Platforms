// static/js/sensors/Humidity.js
import { SensorBase } from "./SensorBase.js";

export class Humidity extends SensorBase {
    addToScene() {
        const shortId = this.id.substring(0, 6);
        this.entity = this.viewer.entities.add({
            id: this.id,
            name: `${this.type} Sensor [${shortId}]`,
            position: Cesium.Cartesian3.fromDegrees(this.lon, this.lat, this.height),
            billboard: {
                image: "/static/icons/humidity.png",
                scale: 1.2
            }
        });
    }
}
