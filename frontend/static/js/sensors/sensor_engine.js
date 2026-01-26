/**
 * sensor_engine.js
 * 
 * Core sensor simulation engine that integrates with Cesium clock
 * and manages active sensor updates, data generation, and telemetry.
 */

export class SensorEngine {
    constructor(viewer) {
        this.viewer = viewer;
        this.sensors = new Map(); // id -> sensor instance
        this.isRunning = false;
        this.updateFrequency = 10; // Hz - default 10 updates per second
        this.tickHandler = null;
        this.telemetryCallbacks = [];
    }

    /**
     * Register a sensor for simulation
     */
    registerSensor(sensor) {
        this.sensors.set(sensor.id, sensor);
        console.log(`Sensor registered: ${sensor.id} (${sensor.constructor.name})`);
    }

    /**
     * Unregister a sensor
     */
    unregisterSensor(sensorId) {
        const sensor = this.sensors.get(sensorId);
        if (sensor) {
            this.sensors.delete(sensorId);
            console.log(`Sensor unregistered: ${sensorId}`);
        }
    }

    /**
     * Start sensor simulation loop
     */
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        console.log(`Sensor engine started (${this.updateFrequency}Hz)`);

        // Hook into Cesium's render loop
        this.tickHandler = this.viewer.clock.onTick.addEventListener((clock) => {
            this.update(clock);
        });
    }

    /**
     * Stop sensor simulation
     */
    stop() {
        if (!this.isRunning) return;
        
        if (this.tickHandler) {
            this.viewer.clock.onTick.removeEventListener(this.tickHandler);
            this.tickHandler = null;
        }
        
        this.isRunning = false;
        console.log('Sensor engine stopped');
    }

    /**
     * Main update loop - called every frame
     */
    update(clock) {
        if (!this.isRunning) return;

        const currentTime = clock.currentTime;
        
        // Update all active sensors
        for (const [id, sensor] of this.sensors) {
            if (!sensor.enabled) continue;

            try {
                // Update sensor and get telemetry data
                const data = sensor.update(currentTime, this.viewer);
                
                if (data) {
                    // Emit telemetry to callbacks
                    this.emitTelemetry(sensor, data, currentTime);
                }
            } catch (e) {
                console.warn(`Sensor update failed for ${id}:`, e);
            }
        }
    }

    /**
     * Emit sensor telemetry to registered callbacks
     */
    emitTelemetry(sensor, data, time) {
        const telemetry = {
            sensorId: sensor.id,
            sensorType: sensor.type,
            timestamp: Cesium.JulianDate.toIso8601(time),
            data: data
        };

        for (const callback of this.telemetryCallbacks) {
            try {
                callback(telemetry);
            } catch (e) {
                console.warn('Telemetry callback error:', e);
            }
        }
    }

    /**
     * Register a telemetry callback
     */
    onTelemetry(callback) {
        this.telemetryCallbacks.push(callback);
    }

    /**
     * Get sensor by ID
     */
    getSensor(id) {
        return this.sensors.get(id);
    }

    /**
     * Get all sensors
     */
    getAllSensors() {
        return Array.from(this.sensors.values());
    }

    /**
     * Enable/disable a specific sensor
     */
    setSensorEnabled(id, enabled) {
        const sensor = this.sensors.get(id);
        if (sensor) {
            sensor.enabled = enabled;
        }
    }

    /**
     * Set update frequency
     */
    setUpdateFrequency(hz) {
        this.updateFrequency = Math.max(1, Math.min(hz, 60)); // Clamp 1-60 Hz
    }
}
