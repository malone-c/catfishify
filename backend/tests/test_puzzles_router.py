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


def test_list_puzzles_empty(client):
    response = client.get("/api/puzzles")
    assert response.status_code == 200
    assert response.json() == []


def test_list_puzzles_returns_puzzle_with_zero_completions(client):
    client.post("/api/puzzles", json=PUZZLE_PAYLOAD)
    response = client.get("/api/puzzles")
    assert response.status_code == 200
    puzzles = response.json()
    assert len(puzzles) == 1
    p = puzzles[0]
    assert p["title"] == "Scientist Quiz"
    assert p["description"] == "Famous scientists"
    assert p["size"] == 1
    assert p["completions"] == 0
    assert len(p["short_id"]) == 8


def test_get_puzzle_strips_wikipedia_title(client):
    r = client.post("/api/puzzles", json=PUZZLE_PAYLOAD)
    short_id = r.json()["short_id"]
    response = client.get(f"/api/puzzles/{short_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["short_id"] == short_id
    assert data["title"] == "Scientist Quiz"
    assert data["size"] == 1
    assert len(data["articles"]) == 1
    article = data["articles"][0]
    assert "wikipedia_title" not in article
    assert "alt_titles" not in article
    assert article["categories"] == ["1879 births", "Nobel laureates in Physics"]


def test_get_puzzle_404_for_unknown_short_id(client):
    response = client.get("/api/puzzles/notexist")
    assert response.status_code == 404
