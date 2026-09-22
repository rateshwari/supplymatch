from types import SimpleNamespace
from unittest.mock import MagicMock

from app.routers.supplier_matches import (
    QUERY_BATCH_SIZE,
    get_matches_for_offerings,
    get_requirements,
    get_supplier_offering_ids,
)


class FakeQuery:
    def __init__(self, responses):
        self.responses = iter(responses)
        self.range_calls = []
        self.in_calls = []

    def select(self, *_args, **_kwargs):
        return self

    def eq(self, *_args, **_kwargs):
        return self

    def range(self, start, end):
        self.range_calls.append((start, end))
        return self

    def in_(self, column, values):
        self.in_calls.append((column, list(values)))
        return self

    def execute(self):
        return next(self.responses)


class FakeSupabase:
    def __init__(self, query):
        self.query = query

    def table(self, _table_name):
        return self.query


def test_get_supplier_offering_ids_paginates():
    rows = (
        [{"id": f"id-{i}"} for i in range(500)],
        [{"id": f"id-{i}"} for i in range(500, 1000)],
        [{"id": "id-1000"}],
    )

    query = FakeQuery(
        [SimpleNamespace(data=batch) for batch in rows]
    )
    supabase = FakeSupabase(query)

    result = get_supplier_offering_ids(
        supabase,
        "supplier-user-id",
    )

    assert len(result) == 1001
    assert result[0] == "id-0"
    assert result[-1] == "id-1000"
    assert query.range_calls == [
        (0, 499),
        (500, 999),
        (1000, 1499),
    ]


def test_get_matches_for_offerings_batches_large_id_list_and_sorts():
    offering_ids = [f"offering-{i}" for i in range(201)]

    responses = [
        SimpleNamespace(
            data=[
                {
                    "id": "match-2",
                    "requirement_id": "req-2",
                    "offering_id": "offering-0",
                    "score": 70,
                    "breakdown": {},
                    "explanation": "lower",
                    "tags": [],
                    "status": "new",
                    "created_at": "2026-01-01T00:00:00Z",
                }
            ]
        ),
        SimpleNamespace(
            data=[
                {
                    "id": "match-1",
                    "requirement_id": "req-1",
                    "offering_id": "offering-100",
                    "score": 95,
                    "breakdown": {},
                    "explanation": "higher",
                    "tags": [],
                    "status": "new",
                    "created_at": "2026-01-01T00:00:00Z",
                }
            ]
        ),
        SimpleNamespace(
            data=[
                {
                    "id": "match-3",
                    "requirement_id": "req-3",
                    "offering_id": "offering-200",
                    "score": 82,
                    "breakdown": {},
                    "explanation": "middle",
                    "tags": [],
                    "status": "new",
                    "created_at": "2026-01-01T00:00:00Z",
                }
            ]
        ),
    ]

    query = FakeQuery(responses)
    supabase = FakeSupabase(query)

    result = get_matches_for_offerings(
        supabase,
        offering_ids,
    )

    assert len(query.in_calls) == 3
    assert [len(values) for _, values in query.in_calls] == [
        QUERY_BATCH_SIZE,
        QUERY_BATCH_SIZE,
        1,
    ]

    assert [match["score"] for match in result] == [
        95,
        82,
        70,
    ]


def test_get_requirements_batches_large_id_list():
    requirement_ids = [f"req-{i}" for i in range(201)]

    responses = [
        SimpleNamespace(
            data=[
                {
                    "id": f"req-{i}",
                    "product": f"Product {i}",
                    "category_id": 1,
                    "quantity": "100",
                    "budget": "1000",
                    "location": "Mumbai",
                    "timeline": "7 days",
                    "notes": None,
                }
                for i in range(100)
            ]
        ),
        SimpleNamespace(
            data=[
                {
                    "id": f"req-{i}",
                    "product": f"Product {i}",
                    "category_id": 1,
                    "quantity": "100",
                    "budget": "1000",
                    "location": "Mumbai",
                    "timeline": "7 days",
                    "notes": None,
                }
                for i in range(100, 200)
            ]
        ),
        SimpleNamespace(
            data=[
                {
                    "id": "req-200",
                    "product": "Product 200",
                    "category_id": 1,
                    "quantity": "100",
                    "budget": "1000",
                    "location": "Mumbai",
                    "timeline": "7 days",
                    "notes": None,
                }
            ]
        ),
    ]

    query = FakeQuery(responses)
    supabase = FakeSupabase(query)

    result = get_requirements(
        supabase,
        requirement_ids,
    )

    assert len(result) == 201
    assert result["req-0"]["product"] == "Product 0"
    assert result["req-200"]["product"] == "Product 200"
    assert [len(values) for _, values in query.in_calls] == [
        QUERY_BATCH_SIZE,
        QUERY_BATCH_SIZE,
        1,
    ]
