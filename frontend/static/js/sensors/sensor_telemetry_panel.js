/**
 * sensor_telemetry_panel.js
 * 
 * UI panel for displaying real-time sensor telemetry data
 */

export class SensorTelemetryPanel {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.sensorDataMap = new Map(); // sensorId -> latest data
        this.maxEntries = 100; // Max history entries per sensor
        this.updateThrottle = 1000; // Throttle UI updates to 1000ms (1 update/sec)
        this.lastRenderTime = 0;
        this.pendingUpdate = false;
    }

    /**
     * Update sensor data in the panel
     */
    updateSensorData(telemetry) {
        const { sensorId, sensorType, timestamp, data } = telemetry;
        
        console.log('Telemetry received:', sensorType, sensorId.substring(0, 8), data);
        
        // Store latest data
        this.sensorDataMap.set(sensorId, {
            type: sensorType,
            timestamp: timestamp,
            data: data
        });

        // Throttle the render calls
        const now = Date.now();
        if (now - this.lastRenderTime >= this.updateThrottle) {
            this.lastRenderTime = now;
            this.render();
        } else if (!this.pendingUpdate) {
            // Schedule a delayed update if we're being throttled
            this.pendingUpdate = true;
            setTimeout(() => {
                this.pendingUpdate = false;
                this.lastRenderTime = Date.now();
                this.render();
            }, this.updateThrottle - (now - this.lastRenderTime));
        }
    }

    /**
     * Render the telemetry panel
     */
    render() {
        if (!this.container) return;

        let html = '<div class="telemetry-header"><strong>Sensor Telemetry</strong></div>';
        
        if (this.sensorDataMap.size === 0) {
            html += '<div class="telemetry-empty">No active sensors</div>';
        } else {
            for (const [sensorId, sensorData] of this.sensorDataMap) {
                html += this.renderSensorCard(sensorId, sensorData);
            }
        }

        this.container.innerHTML = html;
        
        // Trigger animation restart by adding a class momentarily
        requestAnimationFrame(() => {
            const cards = this.container.querySelectorAll('.telemetry-card');
            cards.forEach(card => {
                card.style.animation = 'none';
                card.offsetHeight; // Trigger reflow
                card.style.animation = null;
            });
        });
    }

    /**
     * Render individual sensor card
     */
    renderSensorCard(sensorId, sensorData) {
        const { type, timestamp, data } = sensorData;
        const shortId = sensorId.substring(0, 8);

        let dataHtml = '<div class="telemetry-data">';
        
        // Format data based on sensor type
        if (type === 'LiDAR') {
            dataHtml += `<div>Min Distance: <strong>${data.minDistance?.toFixed(2) || '--'} m</strong></div>`;
            dataHtml += `<div>Detections: <strong>${data.detectionCount || 0}</strong></div>`;
            dataHtml += `<div>Status: <strong class="${data.detected ? 'status-active' : 'status-clear'}">${data.detected ? 'DETECTED' : 'CLEAR'}</strong></div>`;
        } else if (type === 'Ultrasonic') {
            dataHtml += `<div>Distance: <strong>${data.distance?.toFixed(2) || '--'} m</strong></div>`;
            dataHtml += `<div>Status: <strong class="${data.detected ? 'status-active' : 'status-clear'}">${data.inRange ? 'IN RANGE' : 'OUT OF RANGE'}</strong></div>`;
        } else if (type === 'Proximity') {
            dataHtml += `<div>Entities: <strong>${data.count || 0}</strong></div>`;
            if (data.nearestDistance) {
                dataHtml += `<div>Nearest: <strong>${data.nearestDistance.toFixed(2)} m</strong></div>`;
            }
            dataHtml += `<div>Status: <strong class="${data.detected ? 'status-active' : 'status-clear'}">${data.detected ? 'DETECTED' : 'CLEAR'}</strong></div>`;
        } else if (type === 'Temperature') {
            dataHtml += `<div>Temp: <strong>${data.temperature?.toFixed(1) || '--'}°C</strong></div>`;
            dataHtml += `<div>Altitude: <strong>${data.altitude?.toFixed(0) || '--'} m</strong></div>`;
        } else if (type === 'Pressure') {
            dataHtml += `<div>Pressure: <strong>${data.pressure?.toFixed(1) || '--'} hPa</strong></div>`;
            dataHtml += `<div>Altitude: <strong>${data.altitude?.toFixed(0) || '--'} m</strong></div>`;
        } else {
            dataHtml += `<pre>${JSON.stringify(data, null, 2)}</pre>`;
        }

        dataHtml += '</div>';

        return `
            <div class="telemetry-card">
                <div class="telemetry-card-header">
                    <span class="sensor-type-badge">${type}</span>
                    <span class="sensor-id">${shortId}</span>
                </div>
                ${dataHtml}
                <div class="telemetry-timestamp">${new Date(timestamp).toLocaleTimeString()}</div>
            </div>
        `;
    }

    /**
     * Clear all telemetry data
     */
    clear() {
        this.sensorDataMap.clear();
        this.render();
    }

    /**
     * Remove sensor from panel
     */
    removeSensor(sensorId) {
        this.sensorDataMap.delete(sensorId);
        this.render();
    }
}
