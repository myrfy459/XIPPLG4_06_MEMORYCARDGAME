const themes = {
  buah: ['🍎','🍋','🍇','🍉','🍒','🍍','🥝','🍌','🍑','🥭'],
  hewan: ['🐶','🐱','🦁','🐯','🐸','🐼','🐧','🐢','🐰','🐻'],
  sayur: ['🥦','🥕','🌽','🍆','🥒','🥬','🧄','🧅','🍠','🥔']
};
const themeMusic = {
  buah: 'game-music-loop-6-144641.mp3',
  hewan: 'merx-market-song-33936.mp3',
  sayur: 'game-music-loop-6-144641.mp3'
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

// audio
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
  bgMusic.volume = 0.35;
  bgMusic.play().catch(()=>{});
}
function stopBgMusic() { bgMusic.pause(); }
function setToggleText() {
  if (musicToggle) musicToggle.textContent = isMusicOn ? "🔊 Musik: ON" : "🔇 Musik: OFF";
  if (sfxToggle) sfxToggle.textContent = isSfxOn ? "🔈 SFX: ON" : "🔇 SFX: OFF";
}
function playSfx(kind) {
  if (!isSfxOn) return;
  ensureAudioContext();
  const now = audioCtx.currentTime;
  const createBeep = (f,d,t,type='sine',g=0.2)=>{
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(f,t);
    gain.gain.setValueAtTime(g,t);
    gain.gain.exponentialRampToValueAtTime(0.001,t+d);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(t); osc.stop(t+d);
  };
  switch (kind) {
    case 'click': createBeep(300,0.06,now,'square',0.15); break;
    case 'match': createBeep(520,0.08,now); createBeep(800,0.08,now+0.08); break;
    case 'mismatch': createBeep(220,0.08,now,'sawtooth',0.15); createBeep(180,0.12,now+0.06,'sawtooth',0.12); break;
    case 'win': [523.25,659.25,783.99,1046.5].forEach((f,i)=>createBeep(f,0.1,now+i*0.1,'triangle',0.18)); break;
  }
}

const themeSelect = document.getElementById("themeSelect");
document.getElementById("playBtn").addEventListener("click", () => {
  currentTheme = themeSelect ? themeSelect.value : currentTheme;
  emojisBase = themes[currentTheme];

  document.body.classList.remove("tema-buah","tema-sayur","tema-hewan");
  document.body.classList.add(`tema-${currentTheme}`);

  bgMusic.src = themeMusic[currentTheme];
  playBgMusic();

  document.getElementById("menu").classList.add("hidden");
  board.classList.remove("hidden");
  setupGame();
});

if (musicToggle) {
  musicToggle.addEventListener('click', () => {
    isMusicOn = !isMusicOn;
    setToggleText();
    if (isMusicOn) playBgMusic(); else stopBgMusic();
  });
}
if (sfxToggle) {
  sfxToggle.addEventListener('click', () => {
    isSfxOn = !isSfxOn;
    setToggleText();
    if (isSfxOn && audioCtx && audioCtx.state==='suspended') audioCtx.resume();
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
  steps = 0; matchedPairs = 0; timer = 0;
  firstCard = null; secondCard = null; lock = false;
  clearInterval(timerInterval);
  timerDisplay.textContent = "Waktu: 0 detik";
  stepsDisplay.textContent = "Langkah: 0";
  levelDisplay.textContent = `Level: ${level}`;
  const pairs = 4 + (level - 1) * 2;
  emojis = emojisBase.slice(0,pairs);
  cards = [...emojis,...emojis];
  const gridSize = Math.ceil(Math.sqrt(cards.length));
  board.style.gridTemplateColumns = `repeat(${gridSize},100px)`;
  cards.sort(()=>0.5-Math.random());
  cards.forEach((emoji,i)=>{
    const card = document.createElement("div");
    card.classList.add("card");
    card.dataset.emoji = emoji;
    card.dataset.index = i;
    const inner = document.createElement("div");
    inner.classList.add("card-inner");
    const front = document.createElement("div");
    front.classList.add("card-front");
    front.textContent = "❓";
    const back = document.createElement("div");
    back.classList.add("card-back");
    back.textContent = emoji;
    inner.appendChild(front); inner.appendChild(back);
    card.appendChild(inner);
    card.addEventListener("click",()=>handleCardClick(card));
    board.appendChild(card);
  });
}
function handleCardClick(card) {
  if (lock || card.classList.contains("flipped") || card.classList.contains("matched")) return;
  playSfx('click');
  card.classList.add("flipped");
  if (!firstCard) {
    firstCard = card; if (timer===0) startTimer();
  } else {
    secondCard = card; lock = true; steps++;
    stepsDisplay.textContent = `Langkah: ${steps}`;
    if (firstCard.dataset.emoji===secondCard.dataset.emoji) {
      firstCard.classList.add("matched");
      secondCard.classList.add("matched");
      playSfx('match'); matchedPairs++;
      if (matchedPairs===emojis.length) {
        clearInterval(timerInterval); playSfx('win');
        setTimeout(()=>{
          finalInfo.textContent = `Level ${level} selesai! 🏆\nWaktu: ${timer} detik | Langkah: ${steps}`;
          popup.classList.add("show"); showConfetti();
        },500);
      }
      resetTurn();
    } else {
      playSfx('mismatch');
      setTimeout(()=>{
        firstCard.classList.remove("flipped");
        secondCard.classList.remove("flipped");
        resetTurn();
      },800);
    }
  }
}
function resetTurn() { [firstCard,secondCard]=[null,null]; lock=false; }
function restartGame() { popup.classList.remove("show"); level=1; setupGame(); }
function nextLevel() { popup.classList.remove("show"); level++; setupGame(); }
function showConfetti() {
  const end = Date.now() + 2*1000
}