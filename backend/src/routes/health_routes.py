from fastapi import APIRouter
import socket

health_router = APIRouter()

@health_router.get("/health")
def health():
    """Return basic health plus whether a WebSocket physics backend is reachable.

    This performs a short TCP probe to localhost:8765 (the default physics WS...
    backend) with a small timeout to avoid delaying the endpoint. The field
    "ws" will be true only when the port is reachable; callers should treat
    a missing or false value as the backend being unavailable.
    """
    ws_available = False
    try:
        # Quick TCP connect test; don't block the health endpoint for long
        with socket.create_connection(("127.0.0.1", 8765), timeout=0.2):
            ws_available = True
    except Exception:
        ws_available = False

    return {"status": "ok", "service": "digital-twin-security-backend", "ws": ws_available}
