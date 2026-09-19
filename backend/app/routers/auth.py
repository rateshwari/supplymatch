from fastapi import APIRouter, Depends

from app.auth import get_current_user

router = APIRouter(
    prefix="/api/v1/auth",
    tags=["authentication"],
)


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "user_id": current_user["sub"],
        "role": current_user.get("role"),
    }