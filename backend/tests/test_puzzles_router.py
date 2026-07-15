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


def test_create_puzzle_accepts_up_to_ten_articles(client):
    payload = {**PUZZLE_PAYLOAD, "articles": [ARTICLE] * 10}
    response = client.post("/api/puzzles", json=payload)
    assert response.status_code == 201


def test_create_puzzle_rejects_more_than_ten_articles(client):
    payload = {**PUZZLE_PAYLOAD, "articles": [ARTICLE] * 11}
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


RESULT_PAYLOAD = {
    "nickname": "alice",
    "score": 1.0,
    "time_taken_secs": 60,
    "answer_details": ["correct"],
}


def test_submit_result_returns_201_with_id(client):
    r = client.post("/api/puzzles", json=PUZZLE_PAYLOAD)
    short_id = r.json()["short_id"]
    response = client.post(f"/api/puzzles/{short_id}/results", json=RESULT_PAYLOAD)
    assert response.status_code == 201
    assert "id" in response.json()


def test_submit_result_404_for_unknown_puzzle(client):
    response = client.post("/api/puzzles/notexist/results", json=RESULT_PAYLOAD)
    assert response.status_code == 404


def test_list_puzzles_completions_count_increments_on_result_submit(client):
    r = client.post("/api/puzzles", json=PUZZLE_PAYLOAD)
    short_id = r.json()["short_id"]
    client.post(f"/api/puzzles/{short_id}/results", json=RESULT_PAYLOAD)
    client.post(f"/api/puzzles/{short_id}/results", json=RESULT_PAYLOAD)
    response = client.get("/api/puzzles")
    assert response.json()[0]["completions"] == 2


def test_list_puzzles_ordered_by_completions_desc(client):
    r1 = client.post("/api/puzzles", json=PUZZLE_PAYLOAD)
    r2 = client.post("/api/puzzles", json=PUZZLE_PAYLOAD)
    short_id_1 = r1.json()["short_id"]
    short_id_2 = r2.json()["short_id"]
    # Give puzzle 1 two completions, puzzle 2 one completion
    client.post(f"/api/puzzles/{short_id_1}/results", json=RESULT_PAYLOAD)
    client.post(f"/api/puzzles/{short_id_1}/results", json=RESULT_PAYLOAD)
    client.post(f"/api/puzzles/{short_id_2}/results", json=RESULT_PAYLOAD)
    response = client.get("/api/puzzles")
    puzzles = response.json()
    assert puzzles[0]["short_id"] == short_id_1
    assert puzzles[0]["completions"] == 2
    assert puzzles[1]["short_id"] == short_id_2
    assert puzzles[1]["completions"] == 1


def test_leaderboard_returns_empty_list_when_no_results(client):
    r = client.post("/api/puzzles", json=PUZZLE_PAYLOAD)
    short_id = r.json()["short_id"]
    response = client.get(f"/api/puzzles/{short_id}/leaderboard")
    assert response.status_code == 200
    assert response.json() == []


def test_leaderboard_404_for_unknown_puzzle(client):
    response = client.get("/api/puzzles/notexist/leaderboard")
    assert response.status_code == 404


def test_leaderboard_entry_has_expected_fields(client):
    r = client.post("/api/puzzles", json=PUZZLE_PAYLOAD)
    short_id = r.json()["short_id"]
    client.post(f"/api/puzzles/{short_id}/results", json=RESULT_PAYLOAD)
    response = client.get(f"/api/puzzles/{short_id}/leaderboard")
    assert response.status_code == 200
    entry = response.json()[0]
    assert entry["nickname"] == "alice"
    assert entry["score"] == 1.0
    assert entry["time_taken_secs"] == 60
    assert "completed_at" in entry


def test_leaderboard_ordered_score_desc_then_time_asc(client):
    r = client.post("/api/puzzles", json={"title": "Q", "size": 3, "articles": [ARTICLE] * 3})
    short_id = r.json()["short_id"]
    # Submit three results with distinct score/time combinations
    client.post(f"/api/puzzles/{short_id}/results", json={
        "nickname": "slow_winner", "score": 3.0, "time_taken_secs": 120, "answer_details": ["correct"] * 3
    })
    client.post(f"/api/puzzles/{short_id}/results", json={
        "nickname": "fast_winner", "score": 3.0, "time_taken_secs": 45, "answer_details": ["correct"] * 3
    })
    client.post(f"/api/puzzles/{short_id}/results", json={
        "nickname": "loser", "score": 1.0, "time_taken_secs": 10, "answer_details": ["correct", "wrong", "wrong"]
    })
    response = client.get(f"/api/puzzles/{short_id}/leaderboard")
    entries = response.json()
    assert entries[0]["nickname"] == "fast_winner"   # score=3.0, time=45
    assert entries[1]["nickname"] == "slow_winner"   # score=3.0, time=120
    assert entries[2]["nickname"] == "loser"          # score=1.0


def test_check_answer_correct(client):
    r = client.post("/api/puzzles", json=PUZZLE_PAYLOAD)
    short_id = r.json()["short_id"]
    response = client.post(
        f"/api/puzzles/{short_id}/check-answer",
        json={"article_index": 0, "guess": "Albert Einstein"},
    )
    assert response.status_code == 200
    assert response.json() == {"correct": True}


def test_check_answer_wrong(client):
    r = client.post("/api/puzzles", json=PUZZLE_PAYLOAD)
    short_id = r.json()["short_id"]
    response = client.post(
        f"/api/puzzles/{short_id}/check-answer",
        json={"article_index": 0, "guess": "Isaac Newton"},
    )
    assert response.status_code == 200
    assert response.json() == {"correct": False}


def test_check_answer_accepts_alt_title(client):
    r = client.post("/api/puzzles", json=PUZZLE_PAYLOAD)
    short_id = r.json()["short_id"]
    response = client.post(
        f"/api/puzzles/{short_id}/check-answer",
        json={"article_index": 0, "guess": "Einstein"},
    )
    assert response.status_code == 200
    assert response.json() == {"correct": True}


def test_check_answer_accepts_typo_within_edit_distance_1(client):
    r = client.post("/api/puzzles", json=PUZZLE_PAYLOAD)
    short_id = r.json()["short_id"]
    # "albert einsten" is edit distance 1 from "albert einstein" (missing 'i')
    response = client.post(
        f"/api/puzzles/{short_id}/check-answer",
        json={"article_index": 0, "guess": "albert einsten"},
    )
    assert response.status_code == 200
    assert response.json() == {"correct": True}


def test_check_answer_404_for_unknown_puzzle(client):
    response = client.post(
        "/api/puzzles/notexist/check-answer",
        json={"article_index": 0, "guess": "anything"},
    )
    assert response.status_code == 404


def test_check_answer_400_for_invalid_article_index(client):
    r = client.post("/api/puzzles", json=PUZZLE_PAYLOAD)
    short_id = r.json()["short_id"]
    response = client.post(
        f"/api/puzzles/{short_id}/check-answer",
        json={"article_index": 99, "guess": "anything"},
    )
    assert response.status_code == 400
