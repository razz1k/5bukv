let form = document.querySelector("form"),
  dict,
  prevResult;

fetch('./russian_nouns_5dig.txt')
  .then(response => response.text())
  .then((data) => {
    data = data.replace(/\r/g, "");
    dict = data.split("\n");
  })

form.addEventListener('input', ev => debParseInputs(ev));

function parseInputs(ev) {
  let input = ev.target;
  prevResult = prevResult ? prevResult : dict;

  if (ev.value === '') {
    return;
  } else if (ev.inputType === 'deleteContentBackward') {
    const restInputs = document.querySelectorAll(`input:not([id='${ev.target.id}'])`)
    prevResult = dict;
    restInputs.forEach(input => {
      choice(input);
    });
  }

  choice(input);

  function choice(input) {
    console.clear();

    switch (input.id) {
      case 'missed':
        missed(input);
        break;
      case 'used':
        used(input);
        break;
      case 'hit':
        hit(input);
        break;
      default:
        console.log('err');
        break;
    }
  }
}

function missed(input) {
  if (input.value) {
    const pattern = new RegExp(`[^-${input.value}]`, "gi");
    prevResult = prevResult.filter(word => {
      return word.match(pattern);
    });
  }
  console.log(prevResult);
}

function used(input) {
  inputToArr = input.value.replace(/;\s*$/gi, '');
  if (!inputToArr.match(/[а-я],\d/gi)) {
    return;
  }
  inputToArr = inputToArr.split(";");

  prevResult = prevResult.filter((word) => {
    let result;

    inputToArr.forEach(str => {
      str = str.split(",");
      const letter = str[0];
      const lettersBefore = str[1] - 1;
      const patternNeg = new RegExp(`^[^-]{${lettersBefore}}${letter}`, "gi");
      const patternPos = new RegExp(`${letter}`, "gi");

      result = word.match(patternPos) && !word.match(patternNeg);
    });

    return result;
  });
  console.log(prevResult);
}

function hit(input) {
  inputToArr = input.value.replace(/;\s*$/gi, '');
  if (!inputToArr.match(/[а-я],\d/gi)) {
    return;
  }
  inputToArr = inputToArr.split(";");

  inputToArr.forEach(str => {
    str = str.split(",");
    const letter = str[0];
    const lettersBefore = str[1] - 1;

    prevResult = prevResult.filter((word) => {
      let result;

      const pattern = new RegExp(`^[^-]{${lettersBefore}}${letter}`, "gi");
      result = result? result : word.match(pattern);

      return result;
    });
  });
  console.log(prevResult);
}

function debounce(func, timeout = 500) {
  let timer;

  return debounceEvent = (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, timeout);
  };
}

const debParseInputs = debounce(parseInputs)
