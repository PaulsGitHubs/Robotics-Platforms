# Expose router objects at package level so `from .routes import geo_router` works
from .routes import (
    geo_router,
    public_data_router,
    telecom_router,
    simulation_router,
    health_router,
)
from . import assets_routes

__all__ = [
    "geo_router",
    "public_data_router",
    "telecom_router",
    "simulation_router",
    "health_router",
    "assets_routes",
]

# Provide a convenience binding for the router
assets_router = assets_routes.router
