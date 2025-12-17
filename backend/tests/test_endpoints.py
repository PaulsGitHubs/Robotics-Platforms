from fastapi.testclient import TestClient
from backend.src.server import app

client = TestClient(app)


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    data = r.json()
    assert data.get("status") == "ok"
    assert "service" in data


def test_public_data_returns_list():
    r = client.get("/api/public-data/?lat=37.7749&lng=-122.4194")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
