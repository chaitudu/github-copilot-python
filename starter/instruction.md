# GitHub Copilot Instructions — Sudoku Project

## Project Goal

This project is a Flask-based Sudoku web application. The application must provide a playable Sudoku game with reliable puzzle generation, validation, hints, timing, difficulty levels, and a persistent Top 10 scoreboard.

## Project Structure

- `app.py` — Flask application and API routes.
- `sudoku_logic.py` — Sudoku board creation, solving, puzzle generation, and unique-solution validation.
- `templates/index.html` — main Sudoku user interface.
- `static/main.js` — client-side game logic, rendering, validation, hints, timer, difficulty handling, and scoreboard.
- `static/styles.css` — application layout, Sudoku board styling, responsive design, colors, and dark mode.
- `tests/` — pytest tests for Flask routes, Sudoku logic, uniqueness, and UI requirements.

## Coding Standards

- Make small, targeted changes instead of rewriting working files.
- Preserve existing functionality when adding features.
- Keep Python code readable and modular.
- Use meaningful variable and function names.
- Add comments when logic is not immediately obvious.
- Avoid unnecessary dependencies.
- Do not modify tests simply to make failing code pass.
- Run the pytest suite after significant changes.

## Sudoku Rules

- Every Sudoku puzzle must be a valid 9x9 Sudoku.
- Each row must contain digits 1–9 without duplicates.
- Each column must contain digits 1–9 without duplicates.
- Each 3x3 sub-grid must contain digits 1–9 without duplicates.
- Generated puzzles must have exactly one solution.
- Puzzle generation must preserve the corresponding solution.
- Prefilled cells must remain locked and cannot be edited.

## Difficulty

The difficulty selector must affect puzzle generation.

- Easy should provide more prefilled clues.
- Medium should provide a moderate number of clues.
- Hard should provide fewer prefilled clues.

The selected difficulty must be passed correctly from the frontend to the backend.

## Validation

- User entries should be validated immediately where appropriate.
- Conflicting values should be visually highlighted.
- Prefilled cells must remain disabled.
- Check Solution must identify incorrect entries.
- Completing a valid puzzle should stop the timer and display a success message.

## Game Features

The application should support:

- New Game
- Easy / Medium / Hard difficulty
- Immediate cell validation
- Check Solution
- Hint
- Hint counter
- Timer
- Player name
- Top 10 scoreboard
- localStorage persistence
- Prevention of duplicate scoreboard entries for the same completed game

A hint should fill a valid empty cell using the server-provided solution and lock that cell.

## Sudoku Board UI

- The board must always display as a 9x9 grid.
- The 3x3 regions must have clearly visible borders.
- Neighboring 3x3 regions should use alternating background colors in a checkerboard pattern.
- The colors must represent the 3x3 blocks, not whether a cell is prefilled.
- Prefilled cells should remain visually distinguishable.

## Responsive Design

The application must work on desktop and mobile screens.

- Include a responsive viewport meta tag.
- Use responsive CSS and media queries.
- The Sudoku board must fit on narrow screens around 360–375px.
- Controls should not overlap or become unusable.
- Text and buttons must remain readable.

## Dark Mode

The application should provide a dark mode toggle.

- Use a `data-theme="dark"` attribute or equivalent approach.
- Use CSS variables where practical.
- Text, board cells, controls, buttons, and scoreboard must remain readable in dark mode.
- Switching between light and dark mode must not break the Sudoku board.

## Accessibility

- Use meaningful labels and button text.
- Preserve keyboard accessibility.
- Use appropriate visual feedback for invalid cells.
- Do not rely only on color to communicate important game state.

## Testing

Run the complete test suite using:

```text
python -m pytest tests/ -v