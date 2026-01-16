from fastapi import APIRouter, Query
from ..services.satellite_orbit_service import compute_orbit

public_data_router = APIRouter(prefix="/api/public-data", tags=["Public Data"])

@public_data_router.get("/")
def public_data(lat: float, lng: float, radius: int = 500, satellites: bool = Query(False)):
    """Return nearby OSM objects and optionally synthetic satellites.

    Note: import fetch_osm_objects lazily to avoid importing `requests` at module import
    time which can slow startup in constrained environments or tests.
    """
    osm_results = []
    try:
        from ..services.osm_services import fetch_osm_objects
        osm_results = fetch_osm_objects(lat, lng, radius) or []
    except Exception:
        # If OSM fails, return empty list but do not raise
        osm_results = []

    results = []
    for e in osm_results:
        item = {"type": e.get("type"), "id": e.get("id")}
        # nodes tend to have lat/lon, ways/relations may include geometry
        if e.get("lon") and e.get("lat"):
            item.update({"lat": e.get("lat"), "lon": e.get("lon")})
        elif e.get("geometry") and isinstance(e.get("geometry"), list) and e.get("geometry"):
            coords = e.get("geometry")[0]
            item.update({"lat": coords.get("lat"), "lon": coords.get("lon")})
        results.append(item)

    if satellites:
        # Add a small set of synthetic satellites computed from a simple orbit model
        for angle in [0.0, 1.0, 2.5, 4.0]:
            lon, lat, alt = compute_orbit(angle)
            results.append({"type": "satellite", "lon": lon, "lat": lat, "alt": alt})

    return results
