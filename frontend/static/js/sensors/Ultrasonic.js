// static/js/sensors/Ultrasonic.js
import { SensorBase } from "./SensorBase.js";

export class Ultrasonic extends SensorBase {
    constructor(viewer, options = {}) {
        super(viewer, {
            ...options,
            type: 'Ultrasonic',
            color: Cesium.Color.CYAN,
            range: options.range || 5,
            fov: options.fov || 30
        });
    }

    addToScene() {
        const halfAngle = Cesium.Math.toRadians(this.fov / 2);
        const bottomRadius = this.range * Math.tan(halfAngle);

        this.entity = this.viewer.entities.add({
            id: this.id,
            position: Cesium.Cartesian3.fromDegrees(this.lon, this.lat, this.height),
            cylinder: {
                length: this.range,
                topRadius: 0,
                bottomRadius: bottomRadius,
                material: this.color.withAlpha(0.3),
                outline: true,
                outlineColor: Cesium.Color.WHITE,
                slices: 32
            },
            label: {
                text: this.type,
                font: '12pt sans-serif',
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
     * Ultrasonic distance measurement (simplified single-ray)
     */
    update(currentTime, viewer) {
        const position = Cesium.Cartesian3.fromDegrees(this.lon, this.lat, this.height);
        
        // Cast single ray forward (simplified)
        const forward = new Cesium.Cartesian3(0, 0, -1); // Downward
        const ray = new Cesium.Ray(position, forward);
        const intersection = viewer.scene.globe.pick(ray, viewer.scene);
        
        let distance = this.range;
        let detected = false;

        if (intersection) {
            const dist = Cesium.Cartesian3.distance(position, intersection);
            if (dist <= this.range) {
                distance = dist;
                detected = true;
            }
        }

        // Update visualization
        this.updateVisualization(detected);

        this.lastReading = {
            distance: distance,
            detected: detected,
            inRange: detected
        };

        return this.lastReading;
    }

    updateVisualization(detected) {
        if (this.entity && this.entity.cylinder) {
            const material = detected 
                ? Cesium.Color.ORANGE.withAlpha(0.5)
                : this.color.withAlpha(0.3);
            this.entity.cylinder.material = material;
        }
    }
}
