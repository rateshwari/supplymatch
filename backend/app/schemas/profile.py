from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class ProfileCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    role: Literal["client", "supplier"]
    name: str = Field(min_length=1, max_length=255)
    company: str | None = Field(default=None, min_length=1, max_length=255)


class ProfileUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str | None = Field(default=None, min_length=1, max_length=255)
    company: str | None = Field(default=None, min_length=1, max_length=255)
