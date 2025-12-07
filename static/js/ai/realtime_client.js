// static/js/ai/realtime_client.js

export class RealtimeAIClient {
    constructor(url) {
        this.socket = new WebSocket(url);

        this.socket.onopen = () => console.log("Realtime AI connected.");
        this.socket.onclose = () => console.log("Realtime AI disconnected.");
        this.socket.onerror = (err) => console.error("Realtime AI error:", err);
    }

    send(text) {
        if (this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ text }));
        }
    }

    onMessage(callback) {
        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            callback(data);
        };
    }
}
