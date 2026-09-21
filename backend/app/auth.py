import ssl
from typing import Any
import ssl
import certifi

import certifi
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient
from supabase import Client
from app.deps import get_supabase_client
from app.config import get_settings

security = HTTPBearer(auto_error=False)


def verify_jwt(token: str) -> dict[str, Any]:
    settings = get_settings()

    try:
        header = jwt.get_unverified_header(token)

        if header.get("alg") != "ES256":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token",
            )

        jwks_url = (
            f"{settings.supabase_url}"
            "/auth/v1/.well-known/jwks.json"
        )

        ssl_context = ssl.create_default_context(
        cafile=certifi.where(),
        )

        ssl_context = ssl.create_default_context(
        cafile=certifi.where(),
    )
        jwks_client = PyJWKClient(
            jwks_url,
            ssl_context=ssl_context,
        )

        signing_key = jwks_client.get_signing_key_from_jwt(token)

        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256"],
            audience="authenticated",
            issuer=f"{settings.supabase_url}/auth/v1",
        )

        if not payload.get("sub"):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token",
            )

        return payload

    except HTTPException:
        raise
    except jwt.PyJWTError as exc:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
        ) from exc


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> dict[str, Any]:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return verify_jwt(credentials.credentials)


def require_client_user(
    current_user: dict[str, Any] = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client),
) -> dict[str, Any]:
    user_id = current_user["sub"]

    response = (
        supabase.table("profiles")
        .select("role")
        .eq("id", user_id)
        .maybe_single()
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="Profile not found")

    if response.data["role"] != "client":
        raise HTTPException(
            status_code=403,
            detail="Only client accounts can create requirements",
        )

    return current_user


def require_supplier_user(
    current_user: dict[str, Any] = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client),
) -> dict[str, Any]:
    user_id = current_user["sub"]

    response = (
        supabase.table("profiles")
        .select("role")
        .eq("id", user_id)
        .maybe_single()
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="Profile not found")

    if response.data["role"] != "supplier":
        raise HTTPException(
            status_code=403,
            detail="Only supplier accounts can create offerings",
        )

    return current_user