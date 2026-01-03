from fastapi import APIRouter

# Simplified simulation routes to avoid importing missing intelligence modules
router = APIRouter(prefix="/api/simulation", tags=["Simulation"])

@router.get("/zone")
def zone(lat: float, lng: float, radius: int = 500):
    # Return a stubbed response for tests and to avoid missing dependencies
    return {
        "zone": "unknown",
        "score": 0,
        "correlation": {}
    }

@router.post("/vehicle/action")
def vehicle_action(action: dict):
    """
    Receives AI or user actions like BRAKE, STOP, RESUME
    """
    return {
        "status": "ok",
        "applied_action": action
    }


