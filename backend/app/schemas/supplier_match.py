from pydantic import BaseModel, ConfigDict


class SupplierMatchRequirement(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    product: str
    category_id: int
    quantity: str
    budget: str
    location: str
    timeline: str
    notes: str | None


class SupplierMatchResponse(BaseModel):
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

    requirement: SupplierMatchRequirement
