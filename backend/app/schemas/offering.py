from pydantic import BaseModel, ConfigDict, Field


class OfferingCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    product: str = Field(min_length=1, max_length=1000)
    category_id: int = Field(gt=0)
    quantity: str = Field(min_length=1, max_length=255)
    price: str = Field(min_length=1, max_length=255)
    location: str = Field(min_length=1, max_length=255)
    delivery: str = Field(min_length=1, max_length=255)
    notes: str | None = Field(default=None, max_length=2000)


class OfferingResponse(BaseModel):
    id: str
    user_id: str
    product: str
    category_id: int
    quantity: str
    price: str
    location: str
    delivery: str
    notes: str | None
    created_at: str