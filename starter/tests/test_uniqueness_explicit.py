"""Explicit uniqueness tests for Milestone 2.

These tests are focused and deterministic:
- test_known_unique_puzzle checks count_solutions on a well-known uniquely solvable puzzle
- test_detects_multiple_solutions constructs a puzzle with multiple solutions and verifies detection
- test_generate_puzzle_is_unique ensures generate_puzzle() returns a puzzle with exactly one solution

They do not modify existing tests or source code.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import sudoku_logic


def test_known_unique_puzzle():
    """A known Sudoku (classic example) has exactly one solution."""
    # Classic example from many Sudoku tutorials; known to have a unique solution
    puzzle = [
        [5, 3, 0, 0, 7, 0, 0, 0, 0],
        [6, 0, 0, 1, 9, 5, 0, 0, 0],
        [0, 9, 8, 0, 0, 0, 0, 6, 0],
        [8, 0, 0, 0, 6, 0, 0, 0, 3],
        [4, 0, 0, 8, 0, 3, 0, 0, 1],
        [7, 0, 0, 0, 2, 0, 0, 0, 6],
        [0, 6, 0, 0, 0, 0, 2, 8, 0],
        [0, 0, 0, 4, 1, 9, 0, 0, 5],
        [0, 0, 0, 0, 8, 0, 0, 7, 9],
    ]

    count = sudoku_logic.count_solutions(sudoku_logic.deep_copy(puzzle), limit=2)
    assert count == 1, f"Known unique puzzle should have exactly 1 solution, got {count}"


def test_detects_multiple_solutions():
    """Construct a puzzle that clearly has multiple solutions and verify detection.

    Using a nearly-empty puzzle (only a couple of clues) guarantees multiple solutions.
    """
    # Start from empty board and add a couple of non-constraining clues
    puzzle = sudoku_logic.create_empty_board()
    puzzle[0][0] = 1
    puzzle[8][8] = 2

    count = sudoku_logic.count_solutions(sudoku_logic.deep_copy(puzzle), limit=2)
    assert count >= 2, f"Puzzle with minimal clues should have multiple solutions, got {count}"


def test_generate_puzzle_is_unique():
    """Ensure generate_puzzle() returns a puzzle with exactly one solution."""
    puzzle, solution = sudoku_logic.generate_puzzle(clues=35)
    puzzle_copy = sudoku_logic.deep_copy(puzzle)
    count = sudoku_logic.count_solutions(puzzle_copy, limit=2)
    assert count == 1, f"Generated puzzle must have exactly 1 solution, got {count}"
