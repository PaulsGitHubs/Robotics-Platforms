import os

# Default Overpass API endpoint; can be overridden via OSM_OVERPASS_URL env var
OSM_OVERPASS_URL = os.getenv("OSM_OVERPASS_URL", "https://overpass-api.de/api/interpreter")
