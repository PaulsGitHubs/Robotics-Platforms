// static/js/sensors/sensor_factory.js
import { Ultrasonic } from "./Ultrasonic.js";
import { Radar } from "./Radar.js";
import { LiDAR } from "./LiDAR.js";
import { Proximity } from "./Proximity.js";
import { Temperature } from "./Temperature.js";
import { Humidity } from "./Humidity.js";
import { Pressure } from "./Pressure.js";

export const SensorFactory = {
    create(type, viewer, opts = {}) {
        switch (type) {
            case "Ultrasonic": return new Ultrasonic(viewer, opts);
            case "Radar": return new Radar(viewer, opts);
            case "LiDAR": return new LiDAR(viewer, opts);
            case "Proximity": return new Proximity(viewer, opts);
            case "Temperature": return new Temperature(viewer, opts);
            case "Humidity": return new Humidity(viewer, opts);
            case "Pressure": return new Pressure(viewer, opts);
            default:
                console.warn("Unknown sensor type:", type);
                return null;
        }
    }
};
