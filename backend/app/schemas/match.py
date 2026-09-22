from pydantic import BaseModel, ConfigDict


class MatchSupplier(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str
    company: str | None


class MatchOffering(BaseModel):
    model_config = ConfigDict(extra="forbid")

    product: str
    quantity: str
    price: str
    location: str
    delivery: str
    notes: str | None


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

    supplier: MatchSupplier
    offering: MatchOffering