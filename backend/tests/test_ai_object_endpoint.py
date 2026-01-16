from fastapi.testclient import TestClient
from backend.src.server import app

client = TestClient(app)


def test_ai_object_basic_car():
    payload = {"object": {"model": "sedan.glb"}}
    r = client.post("/ai/object", json=payload)
    assert r.status_code == 200
    data = r.json()
    assert data["classification"] == "car"
    assert "drive" in data["suggestions"]


def test_ai_object_missing_payload():
    r = client.post("/ai/object", json={})
    assert r.status_code == 400
    data = r.json()
    assert "error" in data
