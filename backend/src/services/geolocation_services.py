from .osm_services import fetch_osm_objects


def normalize_coordinates(lat, lng):
    return round(lat, 6), round(lng, 6)


def resolve_location(lat, lng, radius=500):
    """Normalize coordinates and optionally return nearby OSM elements.

    Returns a dict containing normalized lat/lng, radius and a list of OSM elements
    when the Overpass API is available. Any errors from the OSM fetch are
    swallowed and an empty list is returned for elements.
    """
    lat_n, lng_n = normalize_coordinates(lat, lng)
    try:
        elements = fetch_osm_objects(lat_n, lng_n, radius)
    except Exception:
        elements = []
    return {"lat": lat_n, "lng": lng_n, "radius": radius, "elements": elements}
