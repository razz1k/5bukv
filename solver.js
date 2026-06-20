const WORD_PATTERN = /^[а-яё]{5}$/i;
const STATE_CYCLE = ['miss', 'present', 'hit'];

const statusEl = document.getElementById('status');
const wordInput = document.getElementById('word-input');
const attemptsEl = document.getElementById('attempts');
const resultsSection = document.getElementById('results');
const resultsCount = document.getElementById('results-count');
const resultsList = document.getElementById('results-list');
const resetBtn = document.getElementById('reset');

let dict = null;
const attempts = [];
let won = false;

fetch('./russian_nouns_5dig.txt')
  .then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.text();
  })
  .then((data) => {
    dict = data
      .replace(/\r/g, '')
      .split('\n')
      .filter((word) => word.length === 5);
    statusEl.textContent = '';
    statusEl.hidden = true;
    wordInput.disabled = false;
    wordInput.focus();
    runFilter();
  })
  .catch(() => {
    statusEl.textContent = statusEl.dataset.error;
    wordInput.disabled = true;
  });

wordInput.addEventListener('input', onWordInput);
wordInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    submitWord();
  }
});

resetBtn.addEventListener('click', resetAll);
attemptsEl.addEventListener('click', onAttemptClick);
resultsList.addEventListener('click', onCandidateClick);

function onWordInput() {
  if (won) {
    return;
  }
  const value = normalizeWord(wordInput.value);

  if (value.length > 5) {
    wordInput.value = value.slice(0, 5);
    return;
  }

  wordInput.value = value;

  if (value.length === 5 && WORD_PATTERN.test(value)) {
    submitWord();
  }
}

function normalizeWord(value) {
  return value.toLowerCase().replace(/[^а-яё]/gi, '');
}

function submitWord() {
  const word = normalizeWord(wordInput.value);

  if (!WORD_PATTERN.test(word)) {
    return;
  }

  addAttempt(word);
  wordInput.value = '';
}

function getKnownHits() {
  const known = new Map();

  for (const attempt of attempts) {
    if (!attempt.states.every((state) => state !== 'unset')) {
      continue;
    }

    for (let i = 0; i < 5; i += 1) {
      if (attempt.states[i] === 'hit') {
        known.set(i, attempt.word[i]);
      }
    }
  }

  return known;
}

function createAttempt(word) {
  const knownHits = getKnownHits();

  return {
    word,
    states: word.split('').map((letter, index) => {
      const knownLetter = knownHits.get(index);
      return knownLetter && knownLetter === letter ? 'hit' : 'unset';
    }),
  };
}

function addAttempt(word) {
  attempts.push(createAttempt(word));
  renderAttempts();
  runFilter();
  checkWin();
}

function onCandidateClick(event) {
  if (won) {
    return;
  }
  const item = event.target.closest('li[data-word]');

  if (!item) {
    return;
  }

  addAttempt(item.dataset.word);
  wordInput.value = '';
  wordInput.focus();
}

function onAttemptClick(event) {
  if (won) {
    return;
  }
  const tile = event.target.closest('.tile');
  if (!tile) {
    return;
  }

  const rowIndex = Number(tile.dataset.row);
  const colIndex = Number(tile.dataset.col);
  const attempt = attempts[rowIndex];
  const currentState = attempt.states[colIndex];
  const nextIndex = currentState === 'unset'
    ? 0
    : (STATE_CYCLE.indexOf(currentState) + 1) % STATE_CYCLE.length;

  attempt.states[colIndex] = STATE_CYCLE[nextIndex];
  renderAttempts();
  runFilter();
  checkWin();
}

function renderAttempts() {
  attemptsEl.innerHTML = attempts.map((attempt, rowIndex) => {
    const tiles = attempt.word.split('').map((letter, colIndex) => {
      const state = attempt.states[colIndex];
      const stateClass = state === 'unset' ? 'tile--unset' : `tile--${state}`;
      return `<button type="button" class="tile ${stateClass}" data-row="${rowIndex}" data-col="${colIndex}" aria-label="${letter}">${escapeHtml(letter)}</button>`;
    }).join('');

    return `<div class="attempt-row">${tiles}</div>`;
  }).join('');
}

function runFilter() {
  if (!dict) {
    return;
  }

  const completeAttempts = attempts.filter((attempt) =>
    attempt.states.every((state) => state !== 'unset')
  );

  if (completeAttempts.length === 0) {
    renderResults(null);
    return;
  }

  const constraints = constraintsFromAttempts(attempts);
  const words = filterWords(dict, constraints);
  renderResults(words);
}

function renderResults(words) {
  if (words === null) {
    resultsSection.hidden = true;
    resultsList.innerHTML = '';
    resultsCount.textContent = '';
    return;
  }

  resultsSection.hidden = false;
  resultsCount.textContent = String(words.length);

  if (words.length === 0) {
    resultsList.innerHTML = `<li class="results-empty">${resultsList.dataset.empty}</li>`;
    resultsSection.classList.remove('results-single');
    return;
  }

  if (words.length === 1) {
    resultsSection.classList.add('results-single');
  } else {
    resultsSection.classList.remove('results-single');
  }

  resultsList.innerHTML = words
    .map((word) => `<li class="results-word" data-word="${escapeHtml(word)}" tabindex="0" role="button">${escapeHtml(word)}</li>`)
    .join('');
}

function resetAll() {
  if (won) {
    return;
  }

  attempts.length = 0;
  wordInput.value = '';
  renderAttempts();
  runFilter();
  wordInput.focus();
}

function isWinningAttempt(attempt) {
  return attempt.states.every((state) => state === 'hit');
}

function checkWin() {
  if (won) {
    return;
  }

  const hasWin = attempts.some(isWinningAttempt);

  if (!hasWin) {
    return;
  }

  won = true;
  wordInput.disabled = true;
  resetBtn.disabled = true;
  document.body.classList.add('is-won');
  launchConfetti();
  enableReloadOnTap();
}

function enableReloadOnTap() {
  const reload = () => {
    window.location.reload();
  };

  document.addEventListener('pointerdown', reload, { capture: true });
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
