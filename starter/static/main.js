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
      // Allow only digits 1-9 and validate immediately when user types
      input.addEventListener('input', (e) => {
        const val = e.target.value.replace(/[^1-9]/g, '');
        e.target.value = val;
        // Validate this cell against current board state
        validateCell(parseInt(e.target.dataset.row, 10), parseInt(e.target.dataset.col, 10));
      });
      rowDiv.appendChild(input);
    }
    boardDiv.appendChild(rowDiv);
  }
}

function getInput(row, col) {
  const boardDiv = document.getElementById('sudoku-board');
  return boardDiv.querySelector(`input[data-row="${row}"][data-col="${col}"]`);
}

function getCellValue(row, col) {
  const inp = getInput(row, col);
  if (!inp) return 0;
  const v = inp.value;
  return v ? parseInt(v, 10) : 0;
}

function validateCell(row, col) {
  const inp = getInput(row, col);
  if (!inp) return;
  const val = inp.value;

  // Clear invalid state for empty cells
  if (!val) {
    inp.classList.remove('incorrect');
    inp.removeAttribute('aria-invalid');
    inp.removeAttribute('title');
    return;
  }

  let invalid = false;
  let message = '';

  // Row check
  for (let c = 0; c < SIZE; c++) {
    if (c === col) continue;
    if (getCellValue(row, c) === parseInt(val, 10)) {
      invalid = true;
      message = `Conflicts with row at column ${c + 1}`;
      break;
    }
  }

  // Column check
  if (!invalid) {
    for (let r = 0; r < SIZE; r++) {
      if (r === row) continue;
      if (getCellValue(r, col) === parseInt(val, 10)) {
        invalid = true;
        message = `Conflicts with column at row ${r + 1}`;
        break;
      }
    }
  }

  // 3x3 box check
  if (!invalid) {
    const startRow = row - (row % 3);
    const startCol = col - (col % 3);
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const rr = startRow + r;
        const cc = startCol + c;
        if (rr === row && cc === col) continue;
        if (getCellValue(rr, cc) === parseInt(val, 10)) {
          invalid = true;
          message = `Conflicts with 3x3 block at row ${rr + 1}, col ${cc + 1}`;
          break;
        }
      }
      if (invalid) break;
    }
  }

  if (invalid) {
    inp.classList.add('incorrect');
    inp.setAttribute('aria-invalid', 'true');
    // Provide a textual message via title for assistive tech; not the only signal
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
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      const idx = i * SIZE + j;
      const val = puzzle[i][j];
      const inp = inputs[idx];
      if (val !== 0) {
        inp.value = val;
        inp.disabled = true; // lock prefilled cells
        inp.className += ' prefilled';
        inp.setAttribute('aria-disabled', 'true');
        inp.setAttribute('title', 'Prefilled cell');
      } else {
        inp.value = '';
        inp.disabled = false;
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
