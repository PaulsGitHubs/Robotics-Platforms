from fastapi import APIRouter
from .simulation_routes import router as simulation_router
from .geo_routes import geo_router
from .public_data_routes import public_data_router
from .telecom_routes import telecom_router
from .health_routes import health_router

router = APIRouter()
router.include_router(simulation_router)
router.include_router(geo_router)
router.include_router(public_data_router)
router.include_router(telecom_router)
router.include_router(health_router)
