from fastapi import APIRouter
from ..intelligence.correlation_services import correlate
from ..intelligence.threat_scoring import compute_score
from ..intelligence.zone_analysis import classify
from ..services.osm_services import fetch_osm_objects
from ..services.telecom_services import simulate_telecom_nodes

router = APIRouter(prefix="/api/simulation", tags=["Simulation"])

@router.get("/zone")
def zone(lat: float, lng: float, radius: int = 500):
    osm = fetch_osm_objects(lat, lng, radius)
    telecom = simulate_telecom_nodes(lat, lng)

    correlation = correlate(osm, telecom)
    score = compute_score(correlation)
    zone = classify(score)

    return {
        "zone": zone,
        "score": score,
        "correlation": correlation
    }
