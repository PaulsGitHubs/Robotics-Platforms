from fastapi import APIRouter

telecom_router = APIRouter(prefix="/api/telecom", tags=["Telecom"])

@telecom_router.get("/")
def telecom_root():
    return {"status": "ok"}
