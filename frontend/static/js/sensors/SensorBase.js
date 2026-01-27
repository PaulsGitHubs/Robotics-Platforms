// static/js/sensors/SensorBase.js

export class SensorBase {
    constructor(viewer, options = {}) {
        this.viewer = viewer;
        this.id = options.id || "sensor_" + Math.random().toString(36).substr(2, 9);
        this.type = options.type || "Unknown";
        this.lon = options.lon || 0;
        this.lat = options.lat || 0;
        this.height = options.height || 2;
        this.range = options.range || 10;
        this.fov = options.fov || 30;
        this.color = options.color || Cesium.Color.CYAN;
        this.entity = null;
        this.enabled = true;
        
        // Orientation (in degrees)
        this.heading = options.heading || 0;   // Rotation around Z-axis (0° = North, 90° = East)
        this.pitch = options.pitch || -90;     // Rotation around Y-axis (-90° = Down, 0° = Horizontal, 90° = Up)
        this.roll = options.roll || 0;         // Rotation around X-axis
        
        // Telemetry state
        this.lastReading = null;
        this.detectionCount = 0;
    }

    addToScene() {
        // Default visualization: sphere for point sensors
        const shortId = this.id.substring(0, 6);
        this.entity = this.viewer.entities.add({
            id: this.id,
            name: `${this.type} Sensor [${shortId}]`,
            position: Cesium.Cartesian3.fromDegrees(this.lon, this.lat, this.height),
            ellipsoid: {
                radii: new Cesium.Cartesian3(this.range, this.range, this.range),
                material: this.color.withAlpha(0.2),
                outline: true,
                outlineColor: this.color
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
     * Update sensor - override in subclasses
     * @returns {Object} Telemetry data object
     */
    update(currentTime, viewer) {
        // Base implementation does nothing
        return null;
    }

    /**
     * Update visual state based on detection
     */
    updateVisualization(detected) {
        if (this.entity && this.entity.ellipsoid) {
            const material = detected 
                ? Cesium.Color.RED.withAlpha(0.4)
                : this.color.withAlpha(0.2);
            this.entity.ellipsoid.material = material;
        }
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

    /**
     * Update sensor orientation
     * @param {number} heading - Rotation around Z-axis in degrees (0° = North)
     * @param {number} pitch - Rotation around Y-axis in degrees (-90° = Down)
     * @param {number} roll - Rotation around X-axis in degrees
     */
    updateOrientation(heading, pitch, roll) {
        this.heading = heading !== undefined ? heading : this.heading;
        this.pitch = pitch !== undefined ? pitch : this.pitch;
        this.roll = roll !== undefined ? roll : this.roll;
        
        // Update entity orientation if it has one
        if (this.entity && this.entity.orientation) {
            const position = Cesium.Cartesian3.fromDegrees(this.lon, this.lat, this.height);
            const hpr = new Cesium.HeadingPitchRoll(
                Cesium.Math.toRadians(this.heading),
                Cesium.Math.toRadians(this.pitch),
                Cesium.Math.toRadians(this.roll)
            );
            this.entity.orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);
        }
    }

    /**
     * Get ray direction in world space based on sensor orientation
     * @param {number} localAzimuth - Angle in sensor's local frame (radians)
     * @param {number} localElevation - Elevation in sensor's local frame (radians)
     * @returns {Cesium.Cartesian3} Direction vector in world space
     */
    getOrientedRayDirection(localAzimuth = 0, localElevation = 0) {
        const position = Cesium.Cartesian3.fromDegrees(this.lon, this.lat, this.height);
        
        // Create local direction vector (in sensor's frame)
        const localX = Math.cos(localElevation) * Math.sin(localAzimuth);
        const localY = Math.cos(localElevation) * Math.cos(localAzimuth);
        const localZ = Math.sin(localElevation);
        const localDirection = new Cesium.Cartesian3(localX, localY, localZ);
        
        // Get transformation matrix from sensor's orientation
        const hpr = new Cesium.HeadingPitchRoll(
            Cesium.Math.toRadians(this.heading),
            Cesium.Math.toRadians(this.pitch),
            Cesium.Math.toRadians(this.roll)
        );
        const transform = Cesium.Transforms.headingPitchRollToFixedFrame(position, hpr);
        
        // Transform local direction to world space
        const worldDirection = Cesium.Matrix4.multiplyByPointAsVector(
            transform,
            localDirection,
            new Cesium.Cartesian3()
        );
        
        return Cesium.Cartesian3.normalize(worldDirection, new Cesium.Cartesian3());
    }

    remove() {
        if (this.entity) {
            this.viewer.entities.remove(this.entity);
            this.entity = null;
        }
    }
}
