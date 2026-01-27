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

        const position = Cesium.Cartesian3.fromDegrees(this.lon, this.lat, this.height);
        
        // Create orientation quaternion
        const hpr = new Cesium.HeadingPitchRoll(
            Cesium.Math.toRadians(this.heading),
            Cesium.Math.toRadians(this.pitch),
            Cesium.Math.toRadians(this.roll)
        );
        const orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);

        const shortId = this.id.substring(0, 6);
        this.entity = this.viewer.entities.add({
            id: this.id,
            name: `${this.type} Sensor [${shortId}]`,
            position: position,
            orientation: orientation,
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
     * Ultrasonic distance measurement using sensor orientation
     */
    update(currentTime, viewer) {
        const position = Cesium.Cartesian3.fromDegrees(this.lon, this.lat, this.height);
        const cartographic = Cesium.Cartographic.fromCartesian(position);
        
        // Get ray direction based on sensor's orientation
        // In sensor's local frame: forward is Y-axis (azimuth=0, elevation=0)
        const direction = this.getOrientedRayDirection(0, 0);
        
        const ray = new Cesium.Ray(position, direction);
        
        // Try terrain picking first
        let intersection = null;
        try {
            intersection = viewer.scene.globe.pick(ray, viewer.scene);
        } catch (e) {
            // Terrain picking failed
        }
        
        let distance = this.range;
        let detected = false;

        if (intersection) {
            const dist = Cesium.Cartesian3.distance(position, intersection);
            if (dist <= this.range) {
                distance = dist;
                detected = true;
            }
        } else if (this.pitch < -45) {
            // Fallback for downward-pointing sensors: check altitude
            const groundHeight = viewer.scene.globe.getHeight(cartographic) || 0;
            const sensorHeight = cartographic.height;
            if (sensorHeight > groundHeight) {
                const dist = sensorHeight - groundHeight;
                if (dist <= this.range) {
                    distance = dist;
                    detected = true;
                }
            }
        }

        // Update visualization
        this.updateVisualization(detected);

        this.lastReading = {
            distance: distance,
            detected: detected,
            inRange: detected,
            heading: this.heading,
            pitch: this.pitch
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
