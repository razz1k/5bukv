function buildMinCounts(hit, used) {
  const greenPositions = new Map();

  for (const { letter, pos } of hit) {
    if (!greenPositions.has(letter)) {
      greenPositions.set(letter, new Set());
    }
    greenPositions.get(letter).add(pos);
  }

  const hasYellow = new Set();

  for (const { letter } of used) {
    hasYellow.add(letter);
  }

  const counts = new Map();
  const letters = new Set([...greenPositions.keys(), ...hasYellow]);

  for (const letter of letters) {
    const greenCount = greenPositions.has(letter)
      ? greenPositions.get(letter).size
      : 0;
    const minFromYellow = hasYellow.has(letter) ? 1 : 0;
    counts.set(letter, Math.max(greenCount, minFromYellow));
  }

  return counts;
}

function countLetter(word, letter) {
  let count = 0;

  for (const ch of word) {
    if (ch === letter) {
      count += 1;
    }
  }

  return count;
}

function matchesConstraints(word, { missed, used, hit, maxCounts }) {
  const minCounts = buildMinCounts(hit, used);

  for (const { letter, pos } of hit) {
    if (word[pos - 1] !== letter) {
      return false;
    }
  }

  for (const { letter, pos } of used) {
    if (word[pos - 1] === letter) {
      return false;
    }

    if (!word.includes(letter)) {
      return false;
    }
  }

  for (const [letter, min] of minCounts) {
    if (countLetter(word, letter) < min) {
      return false;
    }
  }

  if (maxCounts) {
    for (const [letter, max] of maxCounts) {
      if (countLetter(word, letter) > max) {
        return false;
      }
    }
  }

  for (const letter of missed) {
    if (minCounts.has(letter)) {
      continue;
    }

    if (maxCounts && maxCounts.has(letter)) {
      continue;
    }

    if (word.includes(letter)) {
      return false;
    }
  }

  return true;
}

function filterWords(words, constraints) {
  return words.filter((word) => matchesConstraints(word, constraints));
}

function constraintsFromAttempts(attempts) {
  const missed = new Set();
  const used = [];
  const hit = [];
  const maxCounts = new Map();

  for (const attempt of attempts) {
    if (!attempt.states.every((state) => state !== 'unset')) {
      continue;
    }

    const byLetter = new Map();

    for (let i = 0; i < 5; i += 1) {
      const letter = attempt.word[i];
      const state = attempt.states[i];
      const pos = i + 1;

      if (!byLetter.has(letter)) {
        byLetter.set(letter, { hits: [], used: [], miss: [] });
      }

      const entry = byLetter.get(letter);

      if (state === 'hit') {
        entry.hits.push(pos);
      } else if (state === 'present') {
        entry.used.push(pos);
      } else if (state === 'miss') {
        entry.miss.push(pos);
      }
    }

    for (const [letter, data] of byLetter) {
      const { hits, used: yellows, miss: greys } = data;
      const confirmedCount = hits.length + yellows.length;

      for (const pos of hits) {
        hit.push({ letter, pos });
      }

      for (const pos of yellows) {
        used.push({ letter, pos });
      }

      if (confirmedCount > 0) {
        const rowMax = confirmedCount;
        const currentMax = maxCounts.get(letter);

        if (currentMax === undefined || rowMax < currentMax) {
          maxCounts.set(letter, rowMax);
        }

        for (const pos of greys) {
          used.push({ letter, pos });
        }
      } else if (greys.length > 0) {
        missed.add(letter);
      }
    }
  }

  return { missed, used, hit, maxCounts };
}
