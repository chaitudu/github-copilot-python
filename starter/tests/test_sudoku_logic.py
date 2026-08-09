"""Baseline tests for sudoku_logic module."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import sudoku_logic


class TestBoardCreation:
    """Tests for board initialization and copying."""

    def test_create_empty_board_structure(self):
        """Verify board dimensions and initial state."""
        board = sudoku_logic.create_empty_board()
        
        # Check dimensions
        assert len(board) == 9, "Board should have 9 rows"
        assert all(len(row) == 9 for row in board), "Each row should have 9 columns"
        
        # Check all cells are empty (0)
        assert all(cell == 0 for row in board for cell in row), "All cells should be empty (0)"

    def test_deep_copy_independence(self):
        """Verify copied board is independent from original."""
        original = sudoku_logic.create_empty_board()
        original[0][0] = 5
        
        copied = sudoku_logic.deep_copy(original)
        copied[0][0] = 9
        
        assert original[0][0] == 5, "Original should not be affected by copy modification"
        assert copied[0][0] == 9, "Copy should reflect the modification"


class TestSafePlacement:
    """Tests for is_safe validation function."""

    def test_is_safe_valid_placement(self):
        """Verify valid placements are accepted."""
        board = sudoku_logic.create_empty_board()
        
        # Placing 1 in an empty board should be safe
        assert sudoku_logic.is_safe(board, 0, 0, 1) is True, "Valid placement should return True"

    def test_is_safe_row_conflict(self):
        """Verify row constraint prevents duplicate placement."""
        board = sudoku_logic.create_empty_board()
        board[0][0] = 5
        
        # Placing 5 in the same row should fail
        assert sudoku_logic.is_safe(board, 0, 8, 5) is False, "Row duplicate should return False"

    def test_is_safe_column_conflict(self):
        """Verify column constraint prevents duplicate placement."""
        board = sudoku_logic.create_empty_board()
        board[0][0] = 5
        
        # Placing 5 in the same column should fail
        assert sudoku_logic.is_safe(board, 8, 0, 5) is False, "Column duplicate should return False"

    def test_is_safe_box_conflict(self):
        """Verify 3x3 box constraint prevents duplicate placement."""
        board = sudoku_logic.create_empty_board()
        board[0][0] = 5
        
        # Placing 5 in the same 3x3 box should fail
        # Box (0,0) contains cells (0,0) to (2,2)
        assert sudoku_logic.is_safe(board, 1, 1, 5) is False, "Box duplicate should return False"


class TestBoardFilling:
    """Tests for board solution generation."""

    def test_fill_board_completes(self):
        """Verify board is fully filled with no empty cells."""
        board = sudoku_logic.create_empty_board()
        result = sudoku_logic.fill_board(board)
        
        assert result is True, "fill_board should return True on success"
        assert all(cell != 0 for row in board for cell in row), "All cells should be filled after fill_board"

    def test_fill_board_valid_sudoku(self):
        """Verify filled board is a valid completed Sudoku."""
        board = sudoku_logic.create_empty_board()
        sudoku_logic.fill_board(board)
        
        # Check each row contains all digits 1-9
        for row in board:
            assert sorted(row) == list(range(1, 10)), f"Row {row} should contain all digits 1-9"
        
        # Check each column contains all digits 1-9
        for col in range(sudoku_logic.SIZE):
            column = [board[row][col] for row in range(sudoku_logic.SIZE)]
            assert sorted(column) == list(range(1, 10)), f"Column {col} should contain all digits 1-9"
        
        # Check each 3x3 box contains all digits 1-9
        for box_row in range(3):
            for box_col in range(3):
                box = []
                for i in range(3):
                    for j in range(3):
                        box.append(board[box_row * 3 + i][box_col * 3 + j])
                assert sorted(box) == list(range(1, 10)), f"Box ({box_row},{box_col}) should contain all digits 1-9"


class TestPuzzleGeneration:
    """Tests for puzzle generation."""

    def test_generate_puzzle_returns_pair(self):
        """Verify generate_puzzle returns (puzzle, solution) tuple."""
        puzzle, solution = sudoku_logic.generate_puzzle()
        
        assert isinstance(puzzle, list), "Puzzle should be a list"
        assert isinstance(solution, list), "Solution should be a list"
        assert len(puzzle) == 9, "Puzzle should have 9 rows"
        assert len(solution) == 9, "Solution should have 9 rows"

    def test_generate_puzzle_clues_count(self):
        """Verify puzzle has the requested number of clues."""
        clues = 35
        puzzle, solution = sudoku_logic.generate_puzzle(clues=clues)
        
        # Count non-zero cells in puzzle
        clue_count = sum(1 for row in puzzle for cell in row if cell != 0)
        
        assert clue_count == clues, f"Puzzle should have {clues} clues, got {clue_count}"


class TestSolutionCounting:
    """Tests for the count_solutions() function."""

    def test_count_solutions_empty_board(self):
        """Verify count_solutions returns multiple solutions for an empty board."""
        board = sudoku_logic.create_empty_board()
        # An empty board has thousands of solutions; we just check it's > 1
        count = sudoku_logic.count_solutions(board, limit=2)
        assert count >= 2, "Empty board should have multiple solutions"

    def test_count_solutions_complete_board(self):
        """Verify count_solutions returns 1 for a complete valid Sudoku."""
        board = sudoku_logic.create_empty_board()
        sudoku_logic.fill_board(board)
        count = sudoku_logic.count_solutions(board, limit=2)
        assert count == 1, "Complete valid Sudoku should have exactly 1 solution"

    def test_count_solutions_early_exit(self):
        """Verify count_solutions stops early when limit is reached."""
        board = sudoku_logic.create_empty_board()
        # An empty board has many solutions, but with limit=2 it should stop after finding 2
        count = sudoku_logic.count_solutions(board, limit=2)
        assert count == 2, "Should stop at limit when multiple solutions exist"

    def test_count_solutions_unique_puzzle(self):
        """Verify a generated puzzle has exactly 1 solution."""
        puzzle, solution = sudoku_logic.generate_puzzle(clues=35)
        count = sudoku_logic.count_solutions(sudoku_logic.deep_copy(puzzle), limit=2)
        assert count == 1, f"Generated puzzle should have exactly 1 solution, got {count}"

    def test_count_solutions_with_multiple_solutions(self):
        """Verify count_solutions detects puzzles with multiple solutions.
        
        Construct a puzzle that has multiple solutions by removing key constraints.
        """
        # Start with a complete solution
        board = sudoku_logic.create_empty_board()
        sudoku_logic.fill_board(board)
        
        # Create a puzzle with only 4 clues (will have multiple solutions)
        sparse_puzzle = sudoku_logic.create_empty_board()
        sparse_puzzle[0][0] = board[0][0]
        sparse_puzzle[4][4] = board[4][4]
        sparse_puzzle[8][8] = board[8][8]
        sparse_puzzle[3][3] = board[3][3]
        
        # Should have multiple solutions
        count = sudoku_logic.count_solutions(sudoku_logic.deep_copy(sparse_puzzle), limit=2)
        assert count >= 2, "Sparse puzzle with 4 clues should have multiple solutions"


class TestUniquenessMilestone:
    """Tests specifically for Milestone 2: Unique Solution Guarantee."""

    def test_generated_puzzle_has_exactly_one_solution(self):
        """Verify every generated puzzle has exactly one unique solution."""
        for _ in range(5):  # Test multiple puzzle generations
            puzzle, solution = sudoku_logic.generate_puzzle(clues=35)
            puzzle_copy = sudoku_logic.deep_copy(puzzle)
            count = sudoku_logic.count_solutions(puzzle_copy, limit=2)
            assert count == 1, f"Generated puzzle must have exactly 1 solution, got {count}"

    def test_generated_puzzle_solution_count_with_different_clue_counts(self):
        """Verify uniqueness holds for different clue counts."""
        for clues in [25, 30, 35, 40]:
            puzzle, solution = sudoku_logic.generate_puzzle(clues=clues)
            puzzle_copy = sudoku_logic.deep_copy(puzzle)
            count = sudoku_logic.count_solutions(puzzle_copy, limit=2)
            assert count == 1, f"Generated puzzle with {clues} clues must have exactly 1 solution, got {count}"

    def test_generated_puzzle_preserves_solution(self):
        """Verify the returned solution is consistent with the puzzle."""
        puzzle, solution = sudoku_logic.generate_puzzle(clues=35)
        
        # Every clue in puzzle should match the solution
        for row in range(sudoku_logic.SIZE):
            for col in range(sudoku_logic.SIZE):
                if puzzle[row][col] != 0:
                    assert puzzle[row][col] == solution[row][col], \
                        f"Puzzle clue at ({row},{col}) should match solution"

    def test_count_solutions_does_not_modify_board(self):
        """Verify count_solutions doesn't modify the input board."""
        puzzle, _ = sudoku_logic.generate_puzzle(clues=35)
        puzzle_copy = sudoku_logic.deep_copy(puzzle)
        
        # Count solutions
        sudoku_logic.count_solutions(puzzle_copy, limit=2)
        
        # Board should remain unchanged
        assert puzzle_copy == puzzle, "count_solutions should not modify the board"
