// static/js/sensors/Temperature.js
import { SensorBase } from "./SensorBase.js";

export class Temperature extends SensorBase {
    constructor(viewer, options = {}) {
        super(viewer, {
            ...options,
            type: 'Temperature',
            color: Cesium.Color.RED,
            range: 1 // Small visual indicator
        });
        this.baseTemp = 15; // Base temperature in Celsius
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
                text: `${this.type}\n--°C`,
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
     * Simulate temperature based on altitude
     * Decreases ~6.5°C per 1000m (standard atmosphere)
     */
    update(currentTime, viewer) {
        const cartographic = Cesium.Cartographic.fromDegrees(this.lon, this.lat, this.height);
        const altitude = cartographic.height;
        
        // Temperature lapse rate: -6.5°C per 1000m
        const temperature = this.baseTemp - (altitude / 1000) * 6.5;
        
        // Add some noise for realism
        const noise = (Math.random() - 0.5) * 0.5;
        const finalTemp = temperature + noise;

        // Update label
        if (this.entity && this.entity.label) {
            this.entity.label.text = `${this.type}\n${finalTemp.toFixed(1)}°C`;
        }

        this.lastReading = {
            temperature: finalTemp,
            altitude: altitude,
            unit: 'Celsius'
        };

        return this.lastReading;
    }
}
