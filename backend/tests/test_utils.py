from unittest.mock import MagicMock

from app.utils import BASE62, generate_short_id


def test_generate_short_id_is_8_chars():
    session = MagicMock()
    session.query.return_value.filter_by.return_value.first.return_value = None
    result = generate_short_id(session)
    assert len(result) == 8


def test_generate_short_id_only_base62_chars():
    session = MagicMock()
    session.query.return_value.filter_by.return_value.first.return_value = None
    result = generate_short_id(session)
    assert all(c in BASE62 for c in result)


def test_generate_short_id_retries_on_collision():
    session = MagicMock()
    # First call finds a collision (truthy), second call finds nothing (None)
    session.query.return_value.filter_by.return_value.first.side_effect = [object(), None]
    result = generate_short_id(session)
    assert len(result) == 8
    assert session.query.return_value.filter_by.return_value.first.call_count == 2
