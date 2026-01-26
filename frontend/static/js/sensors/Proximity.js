// static/js/sensors/Proximity.js
import { SensorBase } from "./SensorBase.js";

export class Proximity extends SensorBase {
    constructor(viewer, options = {}) {
        super(viewer, {
            ...options,
            type: 'Proximity',
            color: Cesium.Color.PURPLE,
            range: options.range || 10
        });
    }

    addToScene() {
        this.entity = this.viewer.entities.add({
            id: this.id,
            position: Cesium.Cartesian3.fromDegrees(this.lon, this.lat, this.height),
            ellipsoid: {
                radii: new Cesium.Cartesian3(this.range, this.range, this.range),
                material: this.color.withAlpha(0.2),
                outline: true,
                outlineColor: Cesium.Color.WHITE
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
     * Detect entities within spherical range
     */
    update(currentTime, viewer) {
        const sensorPos = Cesium.Cartesian3.fromDegrees(this.lon, this.lat, this.height);
        const detectedEntities = [];
        let nearestDistance = this.range;

        // Check all entities in the scene
        for (let i = 0; i < viewer.entities.values.length; i++) {
            const entity = viewer.entities.values[i];
            
            // Skip self
            if (entity.id === this.id) continue;
            
            // Check if entity has position
            if (entity.position) {
                const entityPos = entity.position.getValue(currentTime);
                if (entityPos) {
                    const distance = Cesium.Cartesian3.distance(sensorPos, entityPos);
                    
                    if (distance <= this.range) {
                        detectedEntities.push({
                            entityId: entity.id,
                            entityName: entity.name || 'Unknown',
                            distance: distance
                        });
                        nearestDistance = Math.min(nearestDistance, distance);
                    }
                }
            }
        }

        const detected = detectedEntities.length > 0;
        this.updateVisualization(detected);

        this.lastReading = {
            detected: detected,
            count: detectedEntities.length,
            entities: detectedEntities,
            nearestDistance: detected ? nearestDistance : null
        };

        return this.lastReading;
    }
}
