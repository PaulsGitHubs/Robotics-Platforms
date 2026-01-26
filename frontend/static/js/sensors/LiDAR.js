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
     * Perform raycasting and return distance measurements
     */
    update(currentTime, viewer) {
        const position = Cesium.Cartesian3.fromDegrees(this.lon, this.lat, this.height);
        const measurements = [];
        let minDistance = this.range;
        let detected = false;

        // Sample rays in cone pattern
        for (let i = 0; i < this.numRays; i++) {
            const angle = (i / this.numRays) * Math.PI * 2; // Circular pattern
            const pitch = -this.fov / 2; // Downward cone
            
            // Create ray direction
            const direction = this.getRayDirection(angle, pitch);
            
            // Raycast against terrain
            const ray = new Cesium.Ray(position, direction);
            const intersection = viewer.scene.globe.pick(ray, viewer.scene);
            
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

            // Also check for entity collisions
            const pickRay = viewer.camera.getPickRay(new Cesium.Cartesian2(0, 0));
            if (pickRay) {
                // This is simplified - full implementation would check each ray
                // against all entities in the scene
            }
        }

        // Update visualization
        this.updateVisualization(detected);

        this.lastReading = {
            measurements: measurements,
            minDistance: minDistance,
            detectionCount: measurements.length,
            detected: detected
        };

        return this.lastReading;
    }

    getRayDirection(azimuth, elevation) {
        const elevRad = Cesium.Math.toRadians(elevation);
        const x = Math.cos(elevRad) * Math.cos(azimuth);
        const y = Math.cos(elevRad) * Math.sin(azimuth);
        const z = Math.sin(elevRad);
        return Cesium.Cartesian3.normalize(new Cesium.Cartesian3(x, y, z), new Cesium.Cartesian3());
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
