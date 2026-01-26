from fastapi.testclient import TestClient
from backend.src.server import app

client = TestClient(app)


def test_public_data_with_satellites_returns_items():
    r = client.get("/api/public-data/?lat=37.7749&lng=-122.4194&satellites=true")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    # Ensure at least one satellite or osm item present (satellites param should add items)
    assert any(item.get("type") == "satellite" for item in data)
