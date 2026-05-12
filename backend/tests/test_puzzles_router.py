ARTICLE = {
    "wikipedia_title": "Albert Einstein",
    "categories": ["1879 births", "Nobel laureates in Physics"],
    "alt_titles": ["Einstein", "A. Einstein"],
}

PUZZLE_PAYLOAD = {
    "title": "Scientist Quiz",
    "description": "Famous scientists",
    "size": 1,
    "articles": [ARTICLE],
}


def test_create_puzzle_returns_201_with_short_id(client):
    response = client.post("/api/puzzles", json=PUZZLE_PAYLOAD)
    assert response.status_code == 201
    assert "short_id" in response.json()


def test_create_puzzle_short_id_is_8_chars(client):
    response = client.post("/api/puzzles", json=PUZZLE_PAYLOAD)
    assert len(response.json()["short_id"]) == 8


def test_create_puzzle_each_gets_unique_short_id(client):
    r1 = client.post("/api/puzzles", json=PUZZLE_PAYLOAD)
    r2 = client.post("/api/puzzles", json=PUZZLE_PAYLOAD)
    assert r1.json()["short_id"] != r2.json()["short_id"]


def test_create_puzzle_rejects_missing_title(client):
    payload = {**PUZZLE_PAYLOAD, "title": None}
    response = client.post("/api/puzzles", json=payload)
    assert response.status_code == 422
