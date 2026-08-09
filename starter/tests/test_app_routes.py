"""Baseline tests for Flask application routes."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import app
import json


class TestIndexRoute:
    """Tests for index route."""

    def test_index_route_renders(self, client):
        """Verify index page loads successfully."""
        response = client.get('/')
        
        assert response.status_code == 200, "Index route should return 200"
        assert response.content_type.startswith('text/html'), "Index should return HTML"
        assert b'Sudoku Game' in response.data, "Index should contain title"


class TestNewGameRoute:
    """Tests for new game generation."""

    def test_new_game_generates_puzzle(self, client):
        """Verify puzzle generation endpoint returns valid puzzle."""
        response = client.get('/new')
        
        assert response.status_code == 200, "New game should return 200"
        assert response.content_type == 'application/json', "New game should return JSON"
        
        data = json.loads(response.data)
        assert 'puzzle' in data, "Response should contain puzzle"
        puzzle = data['puzzle']
        
        # Verify puzzle structure: 9x9 grid
        assert len(puzzle) == 9, "Puzzle should have 9 rows"
        assert all(len(row) == 9 for row in puzzle), "Puzzle should be 9x9"

    def test_new_game_stores_state(self, client):
        """Verify in-memory game state is updated."""
        client.get('/new')
        
        assert app.CURRENT['puzzle'] is not None, "CURRENT['puzzle'] should be set"
        assert app.CURRENT['solution'] is not None, "CURRENT['solution'] should be set"
        assert len(app.CURRENT['puzzle']) == 9, "Stored puzzle should be 9x9"
        assert len(app.CURRENT['solution']) == 9, "Stored solution should be 9x9"

    def test_new_game_respects_clues_param(self, client):
        """Verify custom clues parameter is respected."""
        custom_clues = 40
        response = client.get(f'/new?clues={custom_clues}')
        
        assert response.status_code == 200, "New game with custom clues should return 200"
        
        puzzle = json.loads(response.data)['puzzle']
        clue_count = sum(1 for row in puzzle for cell in row if cell != 0)
        
        assert clue_count == custom_clues, f"Puzzle should have {custom_clues} clues, got {clue_count}"


class TestCheckSolutionRoute:
    """Tests for solution validation."""

    def test_check_solution_validates_correctly(self, client):
        """Verify solution checker identifies correct and incorrect cells."""
        # Generate a puzzle
        client.get('/new')
        
        # Get the stored solution
        solution = app.CURRENT['solution']
        
        # Test 1: Correct solution should return empty incorrect list
        response = client.post('/check', 
                              data=json.dumps({'board': solution}),
                              content_type='application/json')
        
        assert response.status_code == 200, "Check solution should return 200"
        data = json.loads(response.data)
        assert 'incorrect' in data, "Response should contain incorrect list"
        assert data['incorrect'] == [], "Correct solution should have empty incorrect list"
        
        # Test 2: Incorrect solution should identify wrong cells
        incorrect_solution = [row[:] for row in solution]  # Deep copy
        incorrect_solution[0][0] = 0  # Change first cell
        incorrect_solution[1][1] = 0  # Change another cell
        
        response = client.post('/check',
                              data=json.dumps({'board': incorrect_solution}),
                              content_type='application/json')
        
        assert response.status_code == 200, "Check solution should return 200"
        data = json.loads(response.data)
        assert len(data['incorrect']) > 0, "Incorrect solution should identify wrong cells"
        assert [0, 0] in data['incorrect'], "Changed cell [0,0] should be marked incorrect"
        assert [1, 1] in data['incorrect'], "Changed cell [1,1] should be marked incorrect"
