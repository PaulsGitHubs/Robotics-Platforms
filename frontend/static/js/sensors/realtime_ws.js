// static/js/sensors/realtime_ws.js

export class SensorRealtimeWS {
    constructor(url) {
        this.socket = new WebSocket(url);
        this._gaveUpLogged = false;

        this.socket.onopen = () => console.log("WebSocket sensor stream connected.");
        this.socket.onclose = () => console.log("WebSocket sensor stream closed.");
        this.socket.onerror = (err) => {
            // Non-fatal: avoid red console.error noise. Log info only once.
            if (!this._gaveUpLogged) {
                console.info('Realtime sensor WS unavailable — proceeding without realtime sensors');
                this._gaveUpLogged = true;
            }
        };
    }

    send(data) {
        if (this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(data));
        }
    }
}
