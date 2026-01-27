// static/js/sensors/LiDAR.js
import { SensorBase } from "./SensorBase.js";

export class LiDAR extends SensorBase {
    constructor(viewer, options = {}) {
        super(viewer, {
            ...options,
            type: 'LiDAR',
            color: Cesium.Color.GREEN,
            range: options.range || 100,
            fov: options.fov || 10
        });
        this.numRays = 16; // Number of raycast samples
        this.scanRate = 10; // Hz
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
     * Perform raycasting and return distance measurements using sensor orientation
     */
    update(currentTime, viewer) {
        const position = Cesium.Cartesian3.fromDegrees(this.lon, this.lat, this.height);
        const cartographic = Cesium.Cartographic.fromCartesian(position);
        const measurements = [];
        let minDistance = this.range;
        let detected = false;

        // Sample rays in cone pattern
        for (let i = 0; i < this.numRays; i++) {
            const angle = (i / this.numRays) * Math.PI * 2; // Circular pattern around sensor's forward axis
            const elevation = 0; // Rays spread horizontally in sensor's frame
            
            // Get ray direction in world space using sensor's orientation
            const direction = this.getOrientedRayDirection(angle, elevation);
            
            // Raycast against terrain
            const ray = new Cesium.Ray(position, direction);
            let intersection = null;
            
            try {
                intersection = viewer.scene.globe.pick(ray, viewer.scene);
            } catch (e) {
                // Terrain picking may fail, continue to next ray
                continue;
            }
            
            if (intersection) {
                const distance = Cesium.Cartesian3.distance(position, intersection);
                if (distance <= this.range) {
                    measurements.push({
                        angle: Cesium.Math.toDegrees(angle),
                        distance: distance
                    });
                    minDistance = Math.min(minDistance, distance);
                    detected = true;
                }
            }
        }
        
        // Fallback: if no terrain hits and pointing down, check altitude
        if (!detected && this.pitch < -45) {
            const groundHeight = viewer.scene.globe.getHeight(cartographic) || 0;
            const sensorHeight = cartographic.height;
            if (sensorHeight > groundHeight) {
                const dist = sensorHeight - groundHeight;
                if (dist <= this.range) {
                    measurements.push({
                        angle: 0,
                        distance: dist
                    });
                    minDistance = dist;
                    detected = true;
                }
            }
        }

        // Update visualization
        this.updateVisualization(detected);

        this.lastReading = {
            measurements: measurements,
            minDistance: minDistance,
            detectionCount: measurements.length,
            detected: detected,
            heading: this.heading,
            pitch: this.pitch
        };

        return this.lastReading;
    }

    updateVisualization(detected) {
        if (this.entity && this.entity.cylinder) {
            const material = detected 
                ? Cesium.Color.RED.withAlpha(0.5)
                : this.color.withAlpha(0.3);
            this.entity.cylinder.material = material;
        }
    }
}
