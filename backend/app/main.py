from fastapi import FastAPI

from app.routers.auth import router as auth_router
from app.routers.profile import router as profile_router
from app.routers.requirements import router as requirements_router
from app.routers.offerings import router as offerings_router
from app.routers import auth, matches, offerings, profile, requirements
from fastapi.middleware.cors import CORSMiddleware
from app.routers import (
    auth,
    matches,
    notifications,
    offerings,
    profile,
    requirements,
)

app = FastAPI(
    title="SupplyMatch API",
    description="AI-powered B2B supplier matching platform",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
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
app.include_router(offerings_router)
app.include_router(matches.router)
app.include_router(notifications.router)