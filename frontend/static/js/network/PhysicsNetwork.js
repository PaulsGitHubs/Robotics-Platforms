export class PhysicsNetwork {
  constructor(url = 'ws://localhost:8765') {
    this.url = url;
    this.socket = null;
    this.onSnapshot = null; // callback(snapshot)
    this.available = false; // whether the backend network is available

    // connection state bookkeeping to avoid repeated attempts/log spam
    this._connectAttempted = false;
    this._gaveUp = false;
    this._gaveUpLogged = false;
  }

  connect() {
    // Only attempt to connect once; if the first attempt fails, permanently fall back
    if (this._connectAttempted || this._gaveUp) return;
    this._connectAttempted = true;

    // Perform a short HTTP health check before creating a WebSocket to avoid
    // noisy browser WebSocket connection errors when the backend is down.
    (async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 800);
        const res = await fetch('/health', { method: 'GET', signal: controller.signal, cache: 'no-store' });
        clearTimeout(timeout);
        if (!res.ok) {
          this.available = false;
          this._gaveUp = true;
          if (!this._gaveUpLogged) {
            console.info('Physics backend unavailable — using local physics');
            this._gaveUpLogged = true;
          }
          return;
        }

        // Respect the health payload's ws flag when present. If the backend
        // reports it cannot accept WebSocket connections, avoid creating a
        // WebSocket at all (this prevents noisy browser-level WebSocket errors).
        let js = null;
        try {
          js = await res.json();
        } catch (e) {
          js = null;
        }
        if (!js || js.ws !== true) {
          this.available = false;
          this._gaveUp = true;
          if (!this._gaveUpLogged) {
            console.info('Physics backend unavailable — using local physics');
            this._gaveUpLogged = true;
          }
          return;
        }

      } catch (e) {
        // Health check failed or timed out; permanently fall back to local physics
        this.available = false;
        this._gaveUp = true;
        if (!this._gaveUpLogged) {
          console.info('Physics backend unavailable — using local physics');
          this._gaveUpLogged = true;
        }
        return;
      }

      // Health check passed, attempt to open the WebSocket once
      try {
        this.socket = new WebSocket(this.url);
        // Mark as unavailable until we get an open event
        this.available = false;
        this.socket.addEventListener('open', () => {
          this.available = true;
          console.log('[PhysicsNetwork] Connected to', this.url);
        });
        this.socket.addEventListener('message', (ev) => {
          try {
            const js = JSON.parse(ev.data);
            if (js.type === 'snapshot' && this.onSnapshot) {
              this.onSnapshot(js.payload);
            }
          } catch (e) {
            console.warn('Invalid network message', e);
          }
        });
        this.socket.addEventListener('error', () => {
          // disable and permanently fall back to local physics
          this.available = false;
          this._gaveUp = true;
          if (!this._gaveUpLogged) {
            console.info('Physics backend unavailable — using local physics');
            this._gaveUpLogged = true;
          }
        });
        this.socket.addEventListener('close', () => {
          this.available = false;
          this._gaveUp = true;
          if (!this._gaveUpLogged) {
            console.info('Physics backend unavailable — using local physics');
            this._gaveUpLogged = true;
          }
        });
      } catch (e) {
        this.available = false;
        this._gaveUp = true;
        if (!this._gaveUpLogged) {
          console.info('Physics backend unavailable — using local physics');
          this._gaveUpLogged = true;
        }
      }
    })();
  }

  // Developer helper: explicitly reset the client and retry connecting once.
  // This is not used automatically; it allows re-enabling a backend later.
  resetAndRetry() {
    this._connectAttempted = false;
    this._gaveUp = false;
    this._gaveUpLogged = false;
    this.connect();
  }

  sendInput(input) {
    if (!this.available) return;
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    try {
      this.socket.send(JSON.stringify({ type: 'input', payload: input }));
    } catch (e) {}
  }

  close() {
    try {
      this.socket && this.socket.close();
    } catch (e) {}
  }
}
