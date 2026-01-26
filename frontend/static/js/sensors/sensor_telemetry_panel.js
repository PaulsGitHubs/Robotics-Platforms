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
    }

    /**
     * Update sensor data in the panel
     */
    updateSensorData(telemetry) {
        const { sensorId, sensorType, timestamp, data } = telemetry;
        
        // Store latest data
        this.sensorDataMap.set(sensorId, {
            type: sensorType,
            timestamp: timestamp,
            data: data
        });

        // Refresh display
        this.render();
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
