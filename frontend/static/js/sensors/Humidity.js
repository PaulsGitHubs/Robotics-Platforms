// static/js/sensors/Humidity.js
import { SensorBase } from "./SensorBase.js";

export class Humidity extends SensorBase {
    addToScene() {
        this.entity = this.viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(this.lon, this.lat, this.height),
            billboard: {
                image: "/static/icons/humidity.png",
                scale: 1.2
            }
        });
    }
}
