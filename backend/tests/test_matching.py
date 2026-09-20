from app.services.matching import (
    budget_score,
    category_score,
    delivery_score,
    extract_days,
    extract_number,
    location_score,
    quantity_score,
    semantic_score,
    calculate_match,
)


def test_extract_number():
    assert extract_number("500 kg") == 500
    assert extract_number("₹2,00,000") == 200000
    assert extract_number("1.5 tons") == 1.5
    assert extract_number("invalid") is None


def test_extract_days():
    assert extract_days("7 days") == 7
    assert extract_days("2 weeks") == 14
    assert extract_days("48 hours") == 2
    assert extract_days("1 month") == 30


def test_category_exact_match():
    assert category_score(1, 1) == 1.0


def test_category_mismatch():
    assert category_score(1, 2) == 0.0


def test_location_exact_match():
    assert location_score("Mumbai", "Mumbai") == 1.0


def test_location_partial_match():
    assert location_score("Mumbai", "Navi Mumbai") == 0.8


def test_location_mismatch():
    assert location_score("Mumbai", "Delhi") == 0.0


def test_quantity_supplier_can_fulfill():
    assert quantity_score("500 kg", "1000 kg") == 1.0


def test_quantity_partial_fulfillment():
    assert quantity_score("1000 kg", "500 kg") == 0.5


def test_budget_within_budget():
    assert budget_score("₹2,00,000", "₹1,80,000") == 1.0


def test_budget_over_budget():
    assert budget_score("₹1,00,000", "₹2,00,000") == 0.5


def test_delivery_within_timeline():
    assert delivery_score("7 days", "5 days") == 1.0


def test_delivery_exceeds_timeline():
    assert delivery_score("5 days", "10 days") == 0.5


def test_semantic_score():
    assert semantic_score(0.94) == 0.94


def test_semantic_score_clamped():
    assert semantic_score(1.5) == 1.0
    assert semantic_score(-0.5) == 0.0


def test_complete_match():
    result = calculate_match(
        semantic_similarity=0.94,
        requirement_category=1,
        offering_category=1,
        requirement_location="Mumbai",
        offering_location="Navi Mumbai",
        requirement_quantity="500 kg",
        offering_quantity="1000 kg",
        requirement_budget="₹2,00,000",
        offering_price="₹1,80,000",
        requirement_timeline="7 days",
        offering_delivery="5 days",
    )

    assert result.score == 95

    assert result.breakdown["semantic_similarity"] == 0.94
    assert result.breakdown["category"] == 1.0
    assert result.breakdown["location"] == 0.8
    assert result.breakdown["quantity"] == 1.0
    assert result.breakdown["budget"] == 1.0
    assert result.breakdown["delivery"] == 1.0
    assert result.breakdown["final_score"] == 0.95

    assert "strong product similarity" in result.tags
    assert "same category" in result.tags
    assert "location compatible" in result.tags
    assert "quantity compatible" in result.tags
    assert "budget compatible" in result.tags
    assert "delivery compatible" in result.tags


def test_weak_match():
    result = calculate_match(
        semantic_similarity=0.40,
        requirement_category=1,
        offering_category=2,
        requirement_location="Mumbai",
        offering_location="Delhi",
        requirement_quantity="1000 kg",
        offering_quantity="200 kg",
        requirement_budget="₹1,00,000",
        offering_price="₹2,00,000",
        requirement_timeline="5 days",
        offering_delivery="20 days",
    )

    assert result.score < 50
    assert result.breakdown["category"] == 0.0
    assert result.breakdown["location"] == 0.0
    assert result.breakdown["quantity"] == 0.2
    assert result.breakdown["budget"] == 0.5
    assert result.breakdown["delivery"] == 0.25