// static/js/sensors/Pressure.js
import { SensorBase } from "./SensorBase.js";

export class Pressure extends SensorBase {
    constructor(viewer, options = {}) {
        super(viewer, {
            ...options,
            type: 'Pressure',
            color: Cesium.Color.TEAL,
            range: 1
        });
        this.seaLevelPressure = 1013.25; // hPa at sea level
    }

    addToScene() {
        const shortId = this.id.substring(0, 6);
        this.entity = this.viewer.entities.add({
            id: this.id,
            name: `${this.type} Sensor [${shortId}]`,
            position: Cesium.Cartesian3.fromDegrees(this.lon, this.lat, this.height),
            point: {
                pixelSize: 12,
                color: this.color,
                outlineColor: Cesium.Color.WHITE,
                outlineWidth: 2
            },
            label: {
                text: `${this.type}\n---- hPa`,
                font: '11pt monospace',
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(0, -15),
                disableDepthTestDistance: Number.POSITIVE_INFINITY
            }
        });
    }

    /**
     * Calculate atmospheric pressure based on altitude
     * Using barometric formula
     */
    update(currentTime, viewer) {
        const cartographic = Cesium.Cartographic.fromDegrees(this.lon, this.lat, this.height);
        const altitude = cartographic.height;
        
        // Barometric formula (simplified)
        // P = P0 * exp(-altitude / H) where H ≈ 8400m
        const pressure = this.seaLevelPressure * Math.exp(-altitude / 8400);
        
        // Add some noise
        const noise = (Math.random() - 0.5) * 2;
        const finalPressure = pressure + noise;

        // Update label
        if (this.entity && this.entity.label) {
            this.entity.label.text = `${this.type}\n${finalPressure.toFixed(1)} hPa`;
        }

        this.lastReading = {
            pressure: finalPressure,
            altitude: altitude,
            unit: 'hPa'
        };

        return this.lastReading;
    }
}
