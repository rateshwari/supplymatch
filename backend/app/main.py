from fastapi import FastAPI

from app.routers.auth import router as auth_router
from app.routers.profile import router as profile_router
from app.routers.requirements import router as requirements_router

app = FastAPI(
    title="SupplyMatch API",
    description="AI-powered B2B supplier matching platform",
    version="0.1.0",
)


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "SupplyMatch API",
    }


app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(requirements_router)
