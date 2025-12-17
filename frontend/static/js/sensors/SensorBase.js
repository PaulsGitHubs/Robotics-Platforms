// static/js/sensors/SensorBase.js

export class SensorBase {
    constructor(viewer, options = {}) {
        this.viewer = viewer;
        this.id = options.id || "sensor_" + Math.random().toString(36).substr(2, 9);
        this.lon = options.lon || 0;
        this.lat = options.lat || 0;
        this.height = options.height || 2;
        this.range = options.range || 10;
        this.fov = options.fov || 30;
        this.color = options.color || Cesium.Color.CYAN;
        this.entity = null;
    }

    addToScene() {
        // Default visualization: sphere for point sensors
        this.entity = this.viewer.entities.add({
            id: this.id,
            position: Cesium.Cartesian3.fromDegrees(this.lon, this.lat, this.height),
            ellipsoid: {
                radii: new Cesium.Cartesian3(this.range, this.range, this.range),
                material: this.color.withAlpha(0.2),
                outline: true,
                outlineColor: this.color
            }
        });
    }

    updatePosition(lon, lat, height = this.height) {
        this.lon = lon;
        this.lat = lat;
        this.height = height;
        if (this.entity) {
            this.entity.position = Cesium.Cartesian3.fromDegrees(lon, lat, height);
        }
    }

    updateRange(range) {
        this.range = range;
        if (this.entity && this.entity.ellipsoid) {
            this.entity.ellipsoid.radii = new Cesium.Cartesian3(range, range, range);
        }
    }
}
