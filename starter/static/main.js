// Client-side rendering and interaction for the Flask-backed Sudoku
const SIZE = 9;
let puzzle = [];

function createBoardElement() {
  const boardDiv = document.getElementById('sudoku-board');
  boardDiv.innerHTML = '';
  for (let i = 0; i < SIZE; i++) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'sudoku-row';
    for (let j = 0; j < SIZE; j++) {
      const input = document.createElement('input');
      input.type = 'text';
      input.maxLength = 1;
      input.className = 'sudoku-cell';
      input.dataset.row = i;
      input.dataset.col = j;

      // Sanitize input and validate on each change
      input.addEventListener('input', (e) => {
        const clean = e.target.value.replace(/[^1-9]/g, '');
        e.target.value = clean;
        validateCell(Number(e.target.dataset.row), Number(e.target.dataset.col));
      });

      rowDiv.appendChild(input);
    }
    boardDiv.appendChild(rowDiv);
  }
}

function getInput(row, col) {
  return document.querySelector(`#sudoku-board input[data-row="${row}"][data-col="${col}"]`);
}

function getCellValue(row, col) {
  const inp = getInput(row, col);
  if (!inp) return 0;
  const v = inp.value;
  return v ? Number(v) : 0;
}

// Validate a cell at (row, col). Adds/removes visual + accessibility markers.
function validateCell(row, col) {
  const inp = getInput(row, col);
  if (!inp) return;

  // Don't validate prefilled (disabled) cells here
  if (inp.disabled) {
    inp.classList.remove('incorrect');
    inp.removeAttribute('aria-invalid');
    inp.removeAttribute('title');
    return;
  }

  const valStr = inp.value;
  if (!valStr) {
    // Empty — clear any invalid state
    inp.classList.remove('incorrect');
    inp.removeAttribute('aria-invalid');
    inp.removeAttribute('title');
    return;
  }

  const val = Number(valStr);
  let conflict = false;
  let message = '';

  // Row
  for (let c = 0; c < SIZE; c++) {
    if (c === col) continue;
    if (getCellValue(row, c) === val) {
      conflict = true;
      message = `Conflicts with another cell in the same row (column ${c + 1})`;
      break;
    }
  }

  // Column
  if (!conflict) {
    for (let r = 0; r < SIZE; r++) {
      if (r === row) continue;
      if (getCellValue(r, col) === val) {
        conflict = true;
        message = `Conflicts with another cell in the same column (row ${r + 1})`;
        break;
      }
    }
  }

  // 3x3 box
  if (!conflict) {
    const startRow = row - (row % 3);
    const startCol = col - (col % 3);
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const rr = startRow + r;
        const cc = startCol + c;
        if (rr === row && cc === col) continue;
        if (getCellValue(rr, cc) === val) {
          conflict = true;
          message = `Conflicts with a cell in the same 3x3 block (row ${rr + 1}, col ${cc + 1})`;
          break;
        }
      }
      if (conflict) break;
    }
  }

  if (conflict) {
    inp.classList.add('incorrect');
    inp.setAttribute('aria-invalid', 'true');
    inp.setAttribute('title', message);
  } else {
    inp.classList.remove('incorrect');
    inp.removeAttribute('aria-invalid');
    inp.removeAttribute('title');
  }
}

function renderPuzzle(puz) {
  puzzle = puz;
  createBoardElement();
  const inputs = document.querySelectorAll('#sudoku-board input');
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      const idx = i * SIZE + j;
      const val = puzzle[i][j];
      const inp = inputs[idx];
      if (val !== 0) {
        inp.value = val;
        inp.disabled = true;
        inp.classList.add('prefilled');
        inp.setAttribute('aria-disabled', 'true');
        inp.setAttribute('title', 'Prefilled cell');
      } else {
        inp.value = '';
        inp.disabled = false;
        inp.classList.remove('prefilled');
        inp.removeAttribute('aria-disabled');
        inp.removeAttribute('title');
      }
    }
  }
}

async function newGame() {
  const res = await fetch('/new');
  const data = await res.json();
  renderPuzzle(data.puzzle);
  document.getElementById('message').innerText = '';
}

async function checkSolution() {
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  const board = [];
  for (let i = 0; i < SIZE; i++) {
    board[i] = [];
    for (let j = 0; j < SIZE; j++) {
      const idx = i * SIZE + j;
      const val = inputs[idx].value;
      board[i][j] = val ? parseInt(val, 10) : 0;
    }
  }
  const res = await fetch('/check', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({board})
  });
  const data = await res.json();
  const msg = document.getElementById('message');
  if (data.error) {
    msg.style.color = '#d32f2f';
    msg.innerText = data.error;
    return;
  }
  const incorrect = new Set(data.incorrect.map(x => x[0]*SIZE + x[1]));
  for (let idx = 0; idx < inputs.length; idx++) {
    const inp = inputs[idx];
    if (inp.disabled) continue;
    inp.className = 'sudoku-cell';
    if (incorrect.has(idx)) {
      inp.className = 'sudoku-cell incorrect';
    }
  }
  if (incorrect.size === 0) {
    msg.style.color = '#388e3c';
    msg.innerText = 'Congratulations! You solved it!';
  } else {
    msg.style.color = '#d32f2f';
    msg.innerText = 'Some cells are incorrect.';
  }
}

// Wire buttons
window.addEventListener('load', () => {
  document.getElementById('new-game').addEventListener('click', newGame);
  document.getElementById('check-solution').addEventListener('click', checkSolution);
  // initialize
  newGame();
});
