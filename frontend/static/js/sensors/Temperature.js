// static/js/sensors/Temperature.js
import { SensorBase } from "./SensorBase.js";

export class Temperature extends SensorBase {
    addToScene() {
        this.entity = this.viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(this.lon, this.lat, this.height),
            billboard: {
                image: "/static/icons/temperature.png",
                scale: 1.2
            }
        });
    }
}
