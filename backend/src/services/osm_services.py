import requests
from ..config.env import OSM_OVERPASS_URL

def fetch_osm_objects(lat, lng, radius):
    """
    Fetch ALL publicly indexed geospatial objects:
    - buildings
    - roads
    - amenities
    - landuse
    - POIs
    """
    query = f"""
    [out:json][timeout:25];
    (
      node(around:{radius},{lat},{lng});
      way(around:{radius},{lat},{lng});
      relation(around:{radius},{lat},{lng});
    );
    out geom;
    """
    try:
        response = requests.post(OSM_OVERPASS_URL, data=query, timeout=10)
        response.raise_for_status()
        return response.json().get("elements", [])
    except requests.exceptions.RequestException as exc:
        # Avoid propagating external service failures to public endpoints.
        from ..utils.logger import log
        log(f"OSM Overpass request failed: {exc}")
        return []
