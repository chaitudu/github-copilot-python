// Client-side rendering and interaction for the Flask-backed Sudoku
const SIZE = 9;
let puzzle = [];
let solution = null;
let hintCount = 0;
let timerInterval = null;
let elapsedSeconds = 0;
let scoreSaved = false;

// Scoreboard/localStorage (Milestone 6)
const STORAGE_KEY = 'sudoku_top_scores_v1';

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
    return String(s).replace(/[&<>"']/g, function (m) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[m];
    });
}

function formatTimeDisplay(sec) {
  const mm = String(Math.floor(sec / 60)).padStart(2, '0');
  const ss = String(sec % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

function renderScoreboard() {
    const container = document.getElementById('scoreboard');
    if (!container) return;

    const scores = loadScores();

    if (!scores.length) {
        container.innerHTML = '<p class="no-scores">No scores yet.</p>';
        return;
    }

    let html = `
        <table class="score-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Time</th>
                    <th>Difficulty</th>
                    <th>Hints</th>
                </tr>
            </thead>
            <tbody>
    `;

    scores.forEach((score, index) => {
        html += `
            <tr>
                <td>${index + 1}</td>
                <td>${escapeHtml(score.name)}</td>
                <td>${formatTimeDisplay(score.timeSeconds)}</td>
                <td>${escapeHtml(score.difficulty)}</td>
                <td>${score.hints}</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    container.innerHTML = html;
}

function insertScore(score) {
  const normalized = {
    name: String(score.name || 'Anonymous'),
    timeSeconds: Number(score.timeSeconds || 0),
    difficulty: String(score.difficulty || 'medium'),
    hints: Number(score.hints || 0),
    ts: Date.now()
  };
  const scores = loadScores();
  scores.push(normalized);
  scores.sort((a, b) => a.timeSeconds - b.timeSeconds);
  const top = scores.slice(0, 10);
  saveScores(top);
  renderScoreboard();
}

function trySaveScoreOnce() {
  if (scoreSaved) return;
  scoreSaved = true;
  const nameInput = document.getElementById('player-name');
  const name = nameInput && nameInput.value.trim() ? nameInput.value.trim() : 'Anonymous';
  const difficultySelect = document.getElementById('difficulty');
  const difficulty = difficultySelect ? difficultySelect.value : 'medium';
  const sObj = {
    name,
    timeSeconds: elapsedSeconds,
    difficulty,
    hints: hintCount
  };
  insertScore(sObj);
}

// Board creation and rendering
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

// Validation
function validateCell(row, col) {
  const inp = getInput(row, col);
  if (!inp) return;
  if (inp.disabled) {
    inp.classList.remove('incorrect');
    inp.removeAttribute('aria-invalid');
    inp.removeAttribute('title');
    return;
  }
  const valStr = inp.value;
  if (!valStr) {
    inp.classList.remove('incorrect');
    inp.removeAttribute('aria-invalid');
    inp.removeAttribute('title');
    return;
  }
  const val = Number(valStr);
  let conflict = false;
  let message = '';
  for (let c = 0; c < SIZE; c++) {
    if (c === col) continue;
    if (getCellValue(row, c) === val) {
      conflict = true;
      message = `Conflicts with another cell in the same row (column ${c + 1})`;
      break;
    }
  }
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

// Hints
function updateHintCountDisplay() {
  const el = document.getElementById('hint-count');
  if (el) el.textContent = `Hints: ${hintCount}`;
}

function findFirstEmptyEditableCell() {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const inp = getInput(r, c);
      if (inp && !inp.disabled && !inp.value) return { r, c, inp };
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
  const { r, c, inp } = target;
  const correctValue = solution[r][c];
  inp.value = correctValue;
  inp.disabled = true;
  inp.classList.add('prefilled', 'hinted');
  inp.setAttribute('aria-disabled', 'true');
  inp.setAttribute('title', `Hinted cell (value ${correctValue})`);
  hintCount += 1;
  updateHintCountDisplay();
  for (let rr = 0; rr < SIZE; rr++) {
    for (let cc = 0; cc < SIZE; cc++) validateCell(rr, cc);
  }
  checkCompletion();
}

// Timer
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

function updateTimerDisplay() {
  const el = document.getElementById('timer');
  if (el) el.textContent = `Time: ${formatTimeDisplay(elapsedSeconds)}`;
}

// Completion
function checkCompletion() {
  if (!solution) return;
  const inputs = document.querySelectorAll('#sudoku-board input');
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const idx = r * SIZE + c;
      const inp = inputs[idx];
      const val = inp.value ? Number(inp.value) : 0;
      if (val !== solution[r][c]) return;
    }
  }
  const msg = document.getElementById('message');
  if (msg) {
    msg.style.color = '#388e3c';
    msg.innerText = 'Congratulations! You solved it!';
  }
  stopTimer();
  trySaveScoreOnce();
}

// Network/flow
async function newGame() {
  // Get the difficulty selected by the user.
  const difficultySelect = document.getElementById('difficulty');
  const difficulty = difficultySelect ? difficultySelect.value : 'medium';

  // Ask the Flask backend to generate a puzzle for that difficulty.
  const res = await fetch(`/new?difficulty=${encodeURIComponent(difficulty)}`);
  const data = await res.json();
  puzzle = data.puzzle;
  solution = data.solution || null;
  hintCount = 0;
  updateHintCountDisplay();
  scoreSaved = false;
  resetTimer();
  renderPuzzle(puzzle);
  startTimer();
  const msg = document.getElementById('message');
  if (msg) msg.innerText = '';
  renderScoreboard();
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
    if (msg) {
      msg.style.color = '#d32f2f';
      msg.innerText = data.error;
    }
    return;
  }
  const incorrect = new Set(data.incorrect.map(x => x[0]*SIZE + x[1]));
  const inputsArr = Array.from(inputs);
  for (let idx = 0; idx < inputsArr.length; idx++) {
    const inp = inputsArr[idx];
    if (inp.disabled) continue;
    inp.className = 'sudoku-cell';
    if (incorrect.has(idx)) inp.className = 'sudoku-cell incorrect';
  }
  if (incorrect.size === 0) {
    if (msg) {
      msg.style.color = '#388e3c';
      msg.innerText = 'Congratulations! You solved it!';
    }
    stopTimer();
    trySaveScoreOnce();
  } else {
    if (msg) {
      msg.style.color = '#d32f2f';
      msg.innerText = 'Some cells are incorrect.';
    }
  }
}

// Wire buttons
window.addEventListener('load', () => {
  const newBtn = document.getElementById('new-game');
  if (newBtn) newBtn.addEventListener('click', newGame);
  const checkBtn = document.getElementById('check-solution');
  if (checkBtn) checkBtn.addEventListener('click', checkSolution);
  const hintBtn = document.getElementById('hint-button');
  if (hintBtn) hintBtn.addEventListener('click', applyHint);
  renderScoreboard();
  newGame();
});
/* =========================================================
   DARK MODE
   ========================================================= */

function initializeTheme() {
    const themeButton = document.getElementById('theme-toggle');

    if (!themeButton) {
        return;
    }

    // Restore previously selected theme
    const savedTheme = localStorage.getItem('sudoku-theme');

    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeButton.textContent = '☀️ Light Mode';
    }

    themeButton.addEventListener('click', () => {

        document.body.classList.toggle('dark-mode');

        const darkModeEnabled =
            document.body.classList.contains('dark-mode');

        if (darkModeEnabled) {
            localStorage.setItem('sudoku-theme', 'dark');
            themeButton.textContent = '☀️ Light Mode';
        } else {
            localStorage.setItem('sudoku-theme', 'light');
            themeButton.textContent = '🌙 Dark Mode';
        }
    });
}

// Initialize theme after page loads
document.addEventListener('DOMContentLoaded', initializeTheme);