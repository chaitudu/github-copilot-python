import copy
import random

SIZE = 9
EMPTY = 0

def deep_copy(board):
    return copy.deepcopy(board)

def create_empty_board():
    return [[EMPTY for _ in range(SIZE)] for _ in range(SIZE)]

def is_safe(board, row, col, num):
    # Check row and column
    for x in range(SIZE):
        if board[row][x] == num or board[x][col] == num:
            return False
    # Check 3x3 box
    start_row = row - row % 3
    start_col = col - col % 3
    for i in range(3):
        for j in range(3):
            if board[start_row + i][start_col + j] == num:
                return False
    return True

def fill_board(board):
    for row in range(SIZE):
        for col in range(SIZE):
            if board[row][col] == EMPTY:
                possible = list(range(1, SIZE + 1))
                random.shuffle(possible)
                for candidate in possible:
                    if is_safe(board, row, col, candidate):
                        board[row][col] = candidate
                        if fill_board(board):
                            return True
                        board[row][col] = EMPTY
                return False
    return True

def count_solutions(board, limit=2):
    """
    Count the number of solutions for a given puzzle.
    
    Args:
        board: The Sudoku puzzle board
        limit: Stop counting after finding this many solutions (default 2)
    
    Returns:
        The number of solutions found (up to the limit)
    
    Why this works:
        - Uses backtracking to explore all possible valid completions
        - Stops early when we find 2 solutions (no need to find more)
        - Returns the count of solutions found
        - Used to verify puzzles have exactly one solution
    """
    solutions = [0]  # Use list to allow modification in nested function
    
    def backtrack():
        # Early exit: stop if we've found enough solutions
        if solutions[0] >= limit:
            return
        
        # Find the first empty cell
        for row in range(SIZE):
            for col in range(SIZE):
                if board[row][col] == EMPTY:
                    # Try each digit 1-9
                    for num in range(1, SIZE + 1):
                        if is_safe(board, row, col, num):
                            board[row][col] = num
                            backtrack()
                            board[row][col] = EMPTY
                    # No valid number found for this cell in this path
                    return
        
        # No empty cells found; we've completed a solution
        solutions[0] += 1
    
    backtrack()
    return solutions[0]

def remove_cells(board, clues):
    """
    Remove cells from a completed board to create a puzzle with exactly one solution.
    
    Uses a guided approach:
    - Attempts to remove cells one at a time (in random order)
    - After each removal, verifies the puzzle still has exactly one solution
    - If a removal breaks uniqueness, it is undone
    - Continues until reaching the target clue count
    
    Args:
        board: A completed Sudoku board to remove cells from
        clues: Target number of clues (non-empty cells) in the final puzzle
    """
    cells_to_try = [
        (row, col) 
        for row in range(SIZE) 
        for col in range(SIZE)
    ]
    random.shuffle(cells_to_try)
    
    for row, col in cells_to_try:
        # Count current clues
        current_clues = sum(
            1 for r in range(SIZE) 
            for c in range(SIZE) 
            if board[r][c] != EMPTY
        )
        
        # Stop if we've reached target clue count
        if current_clues == clues:
            break
        
        # Try removing this cell
        if board[row][col] != EMPTY:
            removed_value = board[row][col]
            board[row][col] = EMPTY
            
            # Check if puzzle still has exactly one solution
            if count_solutions(deep_copy(board), limit=2) == 1:
                # Keep this removal, continue to next cell
                pass
            else:
                # Restore the cell; this removal breaks uniqueness
                board[row][col] = removed_value

def generate_puzzle(clues=35):
    """
    Generate a Sudoku puzzle with exactly one unique solution.
    
    Args:
        clues: Number of clues (pre-filled cells) in the puzzle (default 35)
    
    Returns:
        (puzzle, solution) tuple where:
        - puzzle: A Sudoku puzzle with exactly one solution and `clues` clues
        - solution: The unique complete solution for the puzzle
    
    Algorithm:
        1. Generate a random complete valid Sudoku solution
        2. Create a copy to serve as the final solution
        3. Remove cells from the board while validating uniqueness:
           - Each removal is verified to maintain exactly one solution
           - Process continues until reaching the target clue count
        4. Return both the puzzle and its solution
    """
    board = create_empty_board()
    fill_board(board)
    solution = deep_copy(board)
    remove_cells(board, clues)
    puzzle = deep_copy(board)
    return puzzle, solution
