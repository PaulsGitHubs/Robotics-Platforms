// static/js/sensors/Pressure.js
import { SensorBase } from "./SensorBase.js";

export class Pressure extends SensorBase {
    addToScene() {
        this.entity = this.viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(this.lon, this.lat, this.height),
            billboard: {
                image: "/static/icons/pressure.png",
                scale: 1.2
            }
        });
    }
}
