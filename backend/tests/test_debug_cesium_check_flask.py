import os

import Server_Host


def test_flask_cesium_check(monkeypatch):
    monkeypatch.setenv('CESIUM_ION_TOKEN', 'valid-token')

    class DummyResp:
        status_code = 200
        text = 'ok'

    monkeypatch.setattr('requests.get', lambda url, timeout=5: DummyResp())

    client = Server_Host.app.test_client()
    r = client.get('/debug/cesium_token_check')
    assert r.status_code == 200
    assert r.json['valid'] is True
