const themes = {
  buah: ['🍎','🍋','🍇','🍉','🍒','🍍','🥝','🍌','🍑','🥭'],
  hewan: ['🐶','🐱','🦁','🐯','🐸','🐼','🐧','🐢','🐰','🐻'],
  sayur: ['🥦','🥕','🌽','🍆','🥒','🥬','🧄','🧅','🍠','🥔']
};
let currentTheme = 'buah';
let emojisBase = themes[currentTheme];
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

const clickSound = document.getElementById("clickSound");
const matchSound = document.getElementById("matchSound");
const winSound = document.getElementById("winSound");

document.getElementById("playBtn").addEventListener("click", () => {
  document.getElementById("menu").classList.add("hidden");
  board.classList.remove("hidden");
  setupGame();
});

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

  clickSound.play();
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
      matchSound.play();
      matchedPairs++;

      if (matchedPairs === emojis.length) {
        clearInterval(timerInterval);
        winSound.play();
        setTimeout(() => {
          finalInfo.textContent = `Level ${level} selesai! 🏆\nWaktu: ${timer} detik | Langkah: ${steps}`;
          popup.classList.add("show");
        }, 500);
      }
      resetTurn();
    } else {
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
//untuk memilih tema
const themeSelect = document.getElementById("themeSelect");
document.getElementById("playBtn").addEventListener("click", () => {
  currentTheme = themeSelect.value;
  emojisBase = themes[currentTheme];
  document.getElementById("menu").classList.add("hidden");
  board.classList.remove("hidden");
  setupGame();
});

