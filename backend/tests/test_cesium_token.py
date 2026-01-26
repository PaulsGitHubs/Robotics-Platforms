import os
from fastapi.testclient import TestClient
from backend.src.server import app


def test_cesium_token_not_exposed(monkeypatch):
    monkeypatch.setenv('CESIUM_ION_TOKEN', 'test-token-123')
    client = TestClient(app)
    r = client.get('/digital-twin')
    assert r.status_code == 200
    # Ensure the server does not expose the Cesium token to clients by default
    assert 'test-token-123' not in r.text


def test_cesium_token_injected_when_allowed(monkeypatch):
    # When explicitly allowed via ALLOW_CESIUM_TOKEN_IN_TEMPLATE, the token
    # should be injected into the page to support local/dev usage.
    monkeypatch.setenv('CESIUM_ION_TOKEN', 'test-token-xyz')
    monkeypatch.setenv('ALLOW_CESIUM_TOKEN_IN_TEMPLATE', 'true')
    client = TestClient(app)
    r = client.get('/digital-twin')
    assert r.status_code == 200
    assert 'test-token-xyz' in r.text
    # clean up env
    monkeypatch.delenv('ALLOW_CESIUM_TOKEN_IN_TEMPLATE', raising=False)
