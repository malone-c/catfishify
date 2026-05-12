from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app


def test_health():
    response = TestClient(app).get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_lifespan_calls_alembic_when_run_migrations_set(monkeypatch):
    monkeypatch.setenv("RUN_MIGRATIONS", "1")
    with patch("alembic.command.upgrade") as mock_upgrade:
        with TestClient(app):
            pass
    mock_upgrade.assert_called_once()


def test_lifespan_skips_alembic_when_run_migrations_not_set(monkeypatch):
    monkeypatch.delenv("RUN_MIGRATIONS", raising=False)
    with patch("alembic.command.upgrade") as mock_upgrade:
        with TestClient(app):
            pass
    mock_upgrade.assert_not_called()
