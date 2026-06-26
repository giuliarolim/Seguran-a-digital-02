const characterSets = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?/~"
};

const ambiguousCharacters = new Set("il1Lo0O");
const historyLimit = 5;
let generatedHistory = [];

const elements = {
  passwordField: document.getElementById("passwordField"),
  copyButton: document.getElementById("copyButton"),
  generateButton: document.getElementById("generateButton"),
  lengthSlider: document.getElementById("lengthSlider"),
  lengthInput: document.getElementById("lengthInput"),
  uppercase: document.getElementById("uppercase"),
  lowercase: document.getElementById("lowercase"),
  numbers: document.getElementById("numbers"),
  symbols: document.getElementById("symbols"),
  avoidAmbiguous: document.getElementById("avoidAmbiguous"),
  statusMessage: document.getElementById("statusMessage"),
  strengthLabel: document.getElementById("strengthLabel"),
  strengthBar: document.getElementById("strengthBar"),
  entropyValue: document.getElementById("entropyValue"),
  historyList: document.getElementById("historyList"),
  emptyHistory: document.getElementById("emptyHistory"),
  themeToggle: document.getElementById("themeToggle")
};

function getRandomInt(maxExclusive) {
  if (maxExclusive <= 0) {
    throw new Error("Intervalo invalido para geracao segura.");
  }

  const randomBuffer = new Uint32Array(1);
  const limit = Math.floor(0x100000000 / maxExclusive) * maxExclusive;

  do {
    crypto.getRandomValues(randomBuffer);
  } while (randomBuffer[0] >= limit);

  return randomBuffer[0] % maxExclusive;
}

function getSelectedSets() {
  return ["uppercase", "lowercase", "numbers", "symbols"]
    .filter((key) => elements[key].checked)
    .map((key) => {
      const characters = elements.avoidAmbiguous.checked
        ? removeAmbiguous(characterSets[key])
        : characterSets[key];

      return { key, characters };
    })
    .filter((set) => set.characters.length > 0);
}

function removeAmbiguous(characters) {
  return [...characters].filter((character) => !ambiguousCharacters.has(character)).join("");
}

function clampLength(value) {
  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed)) {
    return 12;
  }

  return Math.min(64, Math.max(8, parsed));
}

function shuffleSecure(characters) {
  const shuffled = [...characters];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = getRandomInt(index + 1);
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled.join("");
}

function calculateEntropy(length, poolSize) {
  if (poolSize <= 1) {
    return 0;
  }

  return Math.round(length * Math.log2(poolSize));
}

function getStrength(entropy) {
  if (entropy < 50) {
    return { label: "Fraca", width: "25%" };
  }

  if (entropy < 75) {
    return { label: "Media", width: "50%" };
  }

  if (entropy < 110) {
    return { label: "Forte", width: "75%" };
  }

  return { label: "Muito forte", width: "100%" };
}

function updateStrengthPreview() {
  const selectedSets = getSelectedSets();
  const length = clampLength(elements.lengthInput.value);
  const poolSize = selectedSets.reduce((total, set) => total + set.characters.length, 0);
  const entropy = calculateEntropy(length, poolSize);
  const strength = getStrength(entropy);

  elements.entropyValue.textContent = String(entropy);
  elements.strengthLabel.textContent = strength.label;
  elements.strengthBar.style.width = strength.width;
}

function setStatus(message, isError = false) {
  elements.statusMessage.textContent = message;
  elements.statusMessage.classList.toggle("error", isError);
}

function validateSelection(selectedSets) {
  if (selectedSets.length === 0) {
    setStatus("Selecione pelo menos dois tipos de caracteres.", true);
    alert("Selecione pelo menos dois tipos de caracteres.");
    return false;
  }

  if (selectedSets.length < 2) {
    setStatus("Use no minimo 2 tipos de caracteres para gerar a senha.", true);
    return false;
  }

  return true;
}

function generatePassword() {
  const selectedSets = getSelectedSets();

  if (!validateSelection(selectedSets)) {
    updateStrengthPreview();
    return;
  }

  const length = clampLength(elements.lengthInput.value);
  const allCharacters = selectedSets.map((set) => set.characters).join("");
  const requiredCharacters = selectedSets.map((set) => set.characters[getRandomInt(set.characters.length)]);
  const remainingLength = length - requiredCharacters.length;
  const passwordCharacters = [...requiredCharacters];

  for (let index = 0; index < remainingLength; index += 1) {
    passwordCharacters.push(allCharacters[getRandomInt(allCharacters.length)]);
  }

  const password = shuffleSecure(passwordCharacters);
  elements.passwordField.value = password;
  addToHistory(password);
  updateStrengthPreview();
  setStatus("Senha gerada com seguranca no navegador.");
}

function addToHistory(password) {
  generatedHistory = [password, ...generatedHistory.filter((item) => item !== password)].slice(0, historyLimit);
  renderHistory();
}

function renderHistory() {
  elements.historyList.innerHTML = "";
  elements.emptyHistory.hidden = generatedHistory.length > 0;

  generatedHistory.forEach((password) => {
    const item = document.createElement("li");
    item.textContent = password;
    elements.historyList.appendChild(item);
  });
}

async function copyPassword() {
  const password = elements.passwordField.value;

  if (!password) {
    setStatus("Gere uma senha antes de copiar.", true);
    return;
  }

  try {
    await navigator.clipboard.writeText(password);
    elements.copyButton.textContent = "Copiado";
    setStatus("Senha copiada para a area de transferencia.");
    window.setTimeout(() => {
      elements.copyButton.textContent = "Copiar";
    }, 1400);
  } catch {
    elements.passwordField.select();
    document.execCommand("copy");
    setStatus("Senha copiada usando compatibilidade do navegador.");
  }
}

function syncLength(source) {
  const length = clampLength(source.value);
  elements.lengthInput.value = String(length);
  elements.lengthSlider.value = String(length);
  updateStrengthPreview();
  generatePassword();
}

function toggleTheme() {
  document.body.classList.toggle("light-theme");
  const isLight = document.body.classList.contains("light-theme");
  elements.themeToggle.setAttribute("aria-label", isLight ? "Ativar tema escuro" : "Ativar tema claro");
}

elements.generateButton.addEventListener("click", generatePassword);
elements.copyButton.addEventListener("click", copyPassword);
elements.lengthSlider.addEventListener("input", () => syncLength(elements.lengthSlider));
elements.lengthInput.addEventListener("change", () => syncLength(elements.lengthInput));
elements.themeToggle.addEventListener("click", toggleTheme);

["uppercase", "lowercase", "numbers", "symbols", "avoidAmbiguous"].forEach((key) => {
  elements[key].addEventListener("change", () => {
    const selectedSets = getSelectedSets();

    updateStrengthPreview();

    if (selectedSets.length === 0) {
      setStatus("Selecione pelo menos dois tipos de caracteres.", true);
      alert("Selecione pelo menos dois tipos de caracteres.");
      return;
    }

    if (selectedSets.length < 2) {
      setStatus("Use no minimo 2 tipos de caracteres para gerar a senha.", true);
      return;
    }

    if (selectedSets.length >= 2) {
      generatePassword();
    }
  });
});

document.addEventListener("keydown", (event) => {
  const target = event.target;
  const isTyping = target instanceof HTMLInputElement && target.type !== "checkbox" && target.type !== "range";

  if (event.code === "Space" && !isTyping) {
    event.preventDefault();
    generatePassword();
  }
});

updateStrengthPreview();
generatePassword();
