from fastapi import APIRouter

geo_router = APIRouter(prefix="/api/geo", tags=["Geo"])

@geo_router.get("/info")
def geo_info(lat: float, lng: float):
    return {"lat": lat, "lng": lng}
