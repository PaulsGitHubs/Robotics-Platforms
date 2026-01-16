from fastapi.testclient import TestClient
from backend.src.server import app

client = TestClient(app)

print('GET /health')
r = client.get('/health')
print(r.status_code, r.json())

print('GET /api/public-data/?lat=37.7749&lng=-122.4194')
r = client.get('/api/public-data/?lat=37.7749&lng=-122.4194')
print(r.status_code, r.json())
