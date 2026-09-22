from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import (
    auth,
    matches,
    notifications,
    offerings,
    profile,
    requirements,
    supplier_matches,
)


settings = get_settings()

app = FastAPI(
    title="SupplyMatch API",
    description="AI-powered B2B supplier matching platform",
    version="0.1.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_origin,
    ],
    allow_credentials=True,
    allow_methods=[
        "GET",
        "POST",
        "PATCH",
        "OPTIONS",
    ],
    allow_headers=[
        "Authorization",
        "Content-Type",
    ],
)


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "SupplyMatch API",
    }


app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(requirements.router)
app.include_router(offerings.router)
app.include_router(matches.router)
app.include_router(notifications.router)
app.include_router(supplier_matches.router)