// static/js/ai/realtime_client.js

export class RealtimeAIClient {
    constructor(url) {
        this.socket = new WebSocket(url);
        this._gaveUpLogged = false;

        this.socket.onopen = () => console.log("Realtime AI connected.");
        this.socket.onclose = () => console.log("Realtime AI disconnected.");
        this.socket.onerror = (err) => {
            if (!this._gaveUpLogged) {
                console.info('Realtime AI WS unavailable — proceeding without realtime AI');
                this._gaveUpLogged = true;
            }
        };
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
