from pydantic import BaseModel, ConfigDict


class MatchResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    requirement_id: str
    offering_id: str
    score: int
    breakdown: dict[str, float]
    explanation: str
    tags: list[str]
    status: str
    created_at: str