"""Pytest configuration and fixtures for Sudoku application tests."""
import sys
import os
from pathlib import Path

import pytest

# Add parent directory to path so we can import app and sudoku_logic
sys.path.insert(0, str(Path(__file__).parent.parent))

import app


@pytest.fixture
def client():
    """Create a test client for the Flask application."""
    app.app.config['TESTING'] = True
    
    with app.app.test_client() as test_client:
        yield test_client


@pytest.fixture
def app_context():
    """Provide application context for tests that need it."""
    with app.app.app_context():
        yield app.app


@pytest.fixture(autouse=True)
def reset_game_state():
    """Reset the CURRENT game state before each test."""
    yield
    # Reset state after each test
    app.CURRENT['puzzle'] = None
    app.CURRENT['solution'] = None
