// static/js/sensors/realtime_ws.js

export class SensorRealtimeWS {
    constructor(url) {
        this.socket = new WebSocket(url);

        this.socket.onopen = () => console.log("WebSocket sensor stream connected.");
        this.socket.onclose = () => console.log("WebSocket sensor stream closed.");
        this.socket.onerror = (err) => console.error("WS Error:", err);
    }

    send(data) {
        if (this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(data));
        }
    }
}
