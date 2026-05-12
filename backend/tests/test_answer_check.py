from app.services.answer_check import check_answer, normalize


def test_normalize_lowercases():
    assert normalize("Albert Einstein") == "albert einstein"


def test_normalize_strips_accents():
    assert normalize("Ångström") == "angstrom"


def test_normalize_strips_parenthetical():
    assert normalize("Mercury (planet)") == "mercury"


def test_normalize_strips_square_brackets():
    assert normalize("Title [disambiguation]") == "title"


def test_normalize_handles_no_special_chars():
    assert normalize("hello world") == "hello world"


def test_check_answer_exact_match():
    assert check_answer("albert einstein", "Albert Einstein", []) is True


def test_check_answer_case_insensitive():
    assert check_answer("ALBERT EINSTEIN", "Albert Einstein", []) is True


def test_check_answer_accent_insensitive():
    assert check_answer("angstrom", "Ångström", []) is True


def test_check_answer_levenshtein_1_substitution():
    # "einsteyn" vs "einstein" — one substitution (y→i)
    assert check_answer("einsteyn", "Einstein", []) is True


def test_check_answer_levenshtein_1_deletion():
    # "einsten" vs "einstein" — one deletion (missing i)
    assert check_answer("einsten", "Einstein", []) is True


def test_check_answer_levenshtein_2_fails():
    # "ensten" vs "einstein" — two edits
    assert check_answer("ensten", "Einstein", []) is False


def test_check_answer_matches_alt_title():
    assert check_answer("einstein", "Albert Einstein", ["Einstein", "A. Einstein"]) is True


def test_check_answer_wrong_answer():
    assert check_answer("newton", "Albert Einstein", ["Einstein"]) is False


def test_check_answer_strips_brackets_from_canonical():
    # Canonical has disambiguation brackets; player guesses without them
    assert check_answer("mercury", "Mercury (element)", []) is True
