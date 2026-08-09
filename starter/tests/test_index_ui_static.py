"""Static UI tests: verify index page contains expected elements for JS integration.

These tests are lightweight and do not run any JavaScript. They only assert
that the rendered HTML contains the IDs and text the client-side code expects.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import app


def test_index_contains_ui_elements(client):
    """GET / should return HTML containing the UI elements expected by main.js."""
    response = client.get('/')
    assert response.status_code == 200
    html = response.data.decode('utf-8')

    # Page title / heading
    assert 'Sudoku Game' in html

    # Board container
    assert 'id="sudoku-board"' in html

    # Difficulty selector
    assert 'id="difficulty"' in html
    assert 'Easy' in html
    assert 'Medium' in html
    assert 'Hard' in html

    # Client script
    assert '/static/main.js' in html
