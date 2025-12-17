from fastapi import FastAPI, Response
from .routes import (
    geo_router,
    public_data_router,
    telecom_router,
    simulation_router,
    health_router,
)
from .config.security import apply_security

app = FastAPI(title="Digital Twin Security Backend")

apply_security(app)

@app.get("/")
def root():
    return {"service": "digital-twin-security-backend", "docs": "/docs", "health": "/health"}

@app.get("/favicon.ico")
def favicon():
    return Response(status_code=204)

app.include_router(geo_router)
app.include_router(public_data_router)
app.include_router(telecom_router)
app.include_router(simulation_router)
app.include_router(health_router)
