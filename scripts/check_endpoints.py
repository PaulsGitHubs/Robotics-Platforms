import sys
from pathlib import Path
# Ensure repo root is on sys.path when running as a script
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

print('Running endpoint checks...')

from fastapi.testclient import TestClient
from backend.src.server import app

client = TestClient(app)

print('GET / ->', client.get('/').status_code, client.get('/').json())
print('POST /ai_query ->', client.post('/ai_query', json={'query':'hello'}).status_code, client.post('/ai_query', json={'query':'hello'}).json())
print('GET /sensor_list ->', client.get('/sensor_list').status_code, client.get('/sensor_list').json())
print('GET /3d_objects file ->', client.get('/3d_objects/3d_object_list_for_download.py').status_code, client.get('/3d_objects/3d_object_list_for_download.py').text[:80])