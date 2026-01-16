from fastapi.testclient import TestClient
from backend.src.server import app

client = TestClient(app)


def test_assets_registry_returns_models():
    r = client.get("/api/assets/registry")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, dict)
    assert "models" in data
    models = data.get("models")
    assert isinstance(models, dict)
    # models should contain entries like 'car' and 'satellite' per repo registry
    assert "car" in models
    assert "satellite" in models
    for name, meta in models.items():
        assert "model" in meta
        assert "exists" in meta
        assert isinstance(meta["exists"], bool)
