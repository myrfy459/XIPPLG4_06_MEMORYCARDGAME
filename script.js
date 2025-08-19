const themes = {
  buah: ['🍎','🍋','🍇','🍉','🍒','🍍','🥝','🍌','🍑','🥭'],
  hewan: ['🐶','🐱','🦁','🐯','🐸','🐼','🐧','🐢','🐰','🐻'],
  sayur: ['🥦','🥕','🌽','🍆','🥒','🥬','🧄','🧅','🍠','🥔']
};
let currentTheme = 'buah';
let emojisBase = themes[currentTheme];
let emojis = [];
let cards = [];
let firstCard = null;
let secondCard = null;
let lock = false;
let steps = 0;
let matchedPairs = 0;
let timer = 0;
let timerInterval;
let level = 1;

const board = document.getElementById("board");
const stepsDisplay = document.getElementById("steps");
const timerDisplay = document.getElementById("timer");
const levelDisplay = document.getElementById("level");
const popup = document.getElementById("popup");
const finalInfo = document.getElementById("final-info");

// Audio elements and controls
const bgMusic = document.getElementById("bgMusic");
const musicToggle = document.getElementById("musicToggle");
const sfxToggle = document.getElementById("sfxToggle");
let isMusicOn = true;
let isSfxOn = true;
let audioCtx;

function ensureAudioContext() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    audioCtx = new Ctx();
  }
}

function playBgMusic() {
  if (!isMusicOn) return;
  if (!bgMusic) return;
  bgMusic.volume = 0.35;
  const playPromise = bgMusic.play();
  if (playPromise && typeof playPromise.then === 'function') {
    playPromise.catch(() => {});
  }
}

function stopBgMusic() {
  if (!bgMusic) return;
  bgMusic.pause();
}

function setToggleText() {
  if (musicToggle) musicToggle.textContent = isMusicOn ? "🔊 Musik: ON" : "🔇 Musik: OFF";
  if (sfxToggle) sfxToggle.textContent = isSfxOn ? "🔈 SFX: ON" : "🔇 SFX: OFF";
}

function playSfx(kind) {
  if (!isSfxOn) return;
  ensureAudioContext();
  const now = audioCtx.currentTime;

  const createBeep = (frequency, duration, startTime, type = 'sine', gainValue = 0.2) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, startTime);
    gain.gain.setValueAtTime(gainValue, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration);
  };

  switch (kind) {
    case 'click':
      createBeep(300, 0.06, now, 'square', 0.15);
      break;
    case 'match':
      createBeep(520, 0.08, now, 'sine', 0.2);
      createBeep(800, 0.08, now + 0.08, 'sine', 0.2);
      break;
    case 'mismatch':
      createBeep(220, 0.08, now, 'sawtooth', 0.15);
      createBeep(180, 0.12, now + 0.06, 'sawtooth', 0.12);
      break;
    case 'win':
      // Simple arpeggio
      const freqs = [523.25, 659.25, 783.99, 1046.5];
      freqs.forEach((f, i) => createBeep(f, 0.1, now + i * 0.1, 'triangle', 0.18));
      break;
    default:
      break;
  }
}

// Consolidated Play button handler (also sets theme and starts music)
const themeSelect = document.getElementById("themeSelect");
document.getElementById("playBtn").addEventListener("click", () => {
  currentTheme = themeSelect ? themeSelect.value : currentTheme;
  emojisBase = themes[currentTheme];
  document.getElementById("menu").classList.add("hidden");
  board.classList.remove("hidden");
  setupGame();
  playBgMusic();
});

// Audio toggle handlers
if (musicToggle) {
  musicToggle.addEventListener('click', () => {
    isMusicOn = !isMusicOn;
    setToggleText();
    if (isMusicOn) {
      playBgMusic();
    } else {
      stopBgMusic();
    }
  });
}

if (sfxToggle) {
  sfxToggle.addEventListener('click', () => {
    isSfxOn = !isSfxOn;
    setToggleText();
    if (isSfxOn) {
      // Resume AudioContext on user gesture if needed
      if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    }
  });
}

setToggleText();

function startTimer() {
  timerInterval = setInterval(() => {
    timer++;
    timerDisplay.textContent = `Waktu: ${timer} detik`;
  }, 1000);
}

function setupGame() {
  board.innerHTML = '';
  steps = 0;
  matchedPairs = 0;
  timer = 0;
  firstCard = null;
  secondCard = null;
  lock = false;
  clearInterval(timerInterval);

  timerDisplay.textContent = "Waktu: 0 detik";
  stepsDisplay.textContent = "Langkah: 0";
  levelDisplay.textContent = `Level: ${level}`;

  // Tambah kesulitan: setiap level tambah 2 pasang emoji
  const pairs = 4 + (level - 1) * 2;
  emojis = emojisBase.slice(0, pairs);
  cards = [...emojis, ...emojis];

  // Grid dinamis
  const gridSize = Math.ceil(Math.sqrt(cards.length));
  board.style.gridTemplateColumns = `repeat(${gridSize}, 100px)`;

  cards.sort(() => 0.5 - Math.random());

  cards.forEach((emoji, index) => {
    const card = document.createElement("div");
    card.classList.add("card");
    card.dataset.emoji = emoji;
    card.dataset.index = index;
    card.textContent = "❓";

    card.addEventListener("click", () => handleCardClick(card));
    board.appendChild(card);
  });
}

function handleCardClick(card) {
  if (lock || card.classList.contains("flipped") || card.classList.contains("matched")) return;

  playSfx('click');
  card.textContent = card.dataset.emoji;
  card.classList.add("flipped");

  if (!firstCard) {
    firstCard = card;
    if (timer === 0) startTimer();
  } else {
    secondCard = card;
    lock = true;
    steps++;
    stepsDisplay.textContent = `Langkah: ${steps}`;

    if (firstCard.dataset.emoji === secondCard.dataset.emoji) {
      firstCard.classList.add("matched");
      secondCard.classList.add("matched");
      playSfx('match');
      matchedPairs++;

      if (matchedPairs === emojis.length) {
        clearInterval(timerInterval);
        playSfx('win');
        setTimeout(() => {
          finalInfo.textContent = `Level ${level} selesai! 🏆\nWaktu: ${timer} detik | Langkah: ${steps}`;
          popup.classList.add("show");
        }, 500);
      }
      resetTurn();
    } else {
      playSfx('mismatch');
      setTimeout(() => {
        firstCard.textContent = "❓";
        secondCard.textContent = "❓";
        firstCard.classList.remove("flipped");
        secondCard.classList.remove("flipped");
        resetTurn();
      }, 800);
    }
  }
}

function resetTurn() {
  [firstCard, secondCard] = [null, null];
  lock = false;
}

function restartGame() {
  popup.classList.remove("show");
  level = 1;
  setupGame();
}

function nextLevel() {
  popup.classList.remove("show");
  level++;
  setupGame();
}

