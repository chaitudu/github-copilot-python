// Client-side rendering and interaction for the Flask-backed Sudoku
const SIZE = 9;
let puzzle = [];
let solution = null; // server-provided solution for hints
let hintCount = 0;
let timerInterval = null;
let elapsedSeconds = 0;

// Scoreboard/localStorage (Milestone 6)
const STORAGE_KEY = 'sudoku_top_scores_v1';
let scoreSaved = false; // prevent duplicate saves per completion

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
        checkCompletion();
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

// Hint / timer helpers
function updateHintCountDisplay() {
  const el = document.getElementById('hint-count');
  if (el) el.textContent = `Hints: ${hintCount}`;
}

function findFirstEmptyEditableCell() {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const inp = getInput(r, c);
      if (inp && !inp.disabled && !inp.value) return {r, c, inp};
    }
  }
  return null;
}

function applyHint() {
  if (!solution) return;
  const target = findFirstEmptyEditableCell();
  if (!target) {
    const msg = document.getElementById('message');
    if (msg) {
      msg.style.color = '#1976d2';
      msg.innerText = 'No empty cells to hint.';
      setTimeout(() => { if (msg) msg.innerText = ''; }, 2000);
    }
    return;
  }
  const {r, c, inp} = target;
  const correctValue = solution[r][c];
  inp.value = correctValue;
  inp.disabled = true;
  inp.classList.add('prefilled', 'hinted');
  inp.setAttribute('aria-disabled', 'true');
  inp.setAttribute('title', `Hinted cell (value ${correctValue})`);
  hintCount += 1;
  updateHintCountDisplay();

  // Re-validate board and check completion
  for (let rr = 0; rr < SIZE; rr++) {
    for (let cc = 0; cc < SIZE; cc++) validateCell(rr, cc);
  }
  checkCompletion();
}

// Timer functions
function resetTimer() {
  stopTimer();
  elapsedSeconds = 0;
  updateTimerDisplay();
}

function startTimer() {
  stopTimer();
  timerInterval = setInterval(() => {
    elapsedSeconds += 1;
    updateTimerDisplay();
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function formatTime(seconds) {
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

function updateTimerDisplay() {
  const el = document.getElementById('timer');
  if (el) el.textContent = `Time: ${formatTime(elapsedSeconds)}`;
}

// Scoreboard / localStorage helpers (Milestone 6 integration)
function loadScores() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('Scoreboard: invalid data in localStorage, resetting', e);
    return [];
  }
}

function saveScores(scores) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
  } catch (e) {
    console.warn('Scoreboard: cannot save scores', e);
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>\