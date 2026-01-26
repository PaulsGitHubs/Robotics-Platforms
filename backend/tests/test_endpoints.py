from fastapi.testclient import TestClient
from backend.src.server import app

client = TestClient(app)


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    data = r.json()
    assert data.get("status") == "ok"
    assert "service" in data
    # The health route exposes whether a WebSocket backend is reachable via
    # the optional 'ws' boolean field. Tests should accept either True/False.
    assert "ws" in data
    assert isinstance(data["ws"], bool)


def test_public_data_returns_list():
    
    r = client.get("/api/public-data/?lat=37.7749&lng=-122.4194")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)


def test_digital_twin_template_served():
    """Ensure the FastAPI route that renders the Digital Twin template returns HTML."""
    r = client.get('/digital-twin')
    assert r.status_code == 200
    assert '<div id="viewer"' in r.text
