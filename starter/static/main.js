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
    container.innerHTML = '<div class="no-scores">No scores yet.</div>';
    return;
  }
  let html = '<table class="score-table"><thead><tr><th>#</th><th>Name</th><th>Time</th><th>Difficulty</th><th>Hints</th></tr></thead><tbody>';
  scores.forEach((s, i) => {
    html += `<tr><td>${i+1}</td><td>${escapeHtml(s.name)}</td><td>${formatTimeDisplay(s.timeSeconds)}</td><td>${escapeHtml(s.difficulty)}</td><td>${s.hints}</td></tr>`;
  });
  html += '</tbody></table>';
  container.innerHTML = html;
}

function insertScore(score) {
  // score: { name, timeSeconds, difficulty, hints }
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

// Ensure scoreboard is rendered on load if element exists
