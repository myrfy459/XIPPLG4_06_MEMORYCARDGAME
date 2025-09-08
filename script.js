const themes = {
  buah: ['🍎','🍋','🍇','🍉','🍒','🍍','🥝','🍌','🍑','🥭'],
  hewan: ['🐶','🐱','🦁','🐯','🐸','🐼','🐧','🐢','🐰','🐻'],
  sayur: ['🥦','🥕','🌽','🍆','🥒','🥬','🧄','🧅','🍠','🥔']
};
const themeMusic = {
  buah: 'COBOY JUNIOR - Kamu (Official Music Video) - Coboy Junior Official.mp3',
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
let score = 0;
let playerName = "";
const MAX_LEVEL = 4;   // total level berhenti di level 4
let firstFlipTimeoutId = null;

const board = document.getElementById("board");
const stepsDisplay = document.getElementById("steps");
const timerDisplay = document.getElementById("timer");
const levelDisplay = document.getElementById("level");
const scoreDisplay = document.getElementById("score");
const popup = document.getElementById("popup");
const finalInfo = document.getElementById("final-info");
const showLeaderboardBtn = document.getElementById("showLeaderboardBtn");
const leaderboardEl = document.getElementById("leaderboard");
const leaderboardListEl = document.getElementById("leaderboardList");

const LEADERBOARD_KEY = 'memory_leaderboard_v1';

function updateScoreDisplay() {
  if (scoreDisplay) scoreDisplay.textContent = `Skor: ${score}`;
}
function getLeaderboard() {
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}
function saveLeaderboard(list) {
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(list));
}
function addToLeaderboard(name, value) {
  const list = getLeaderboard();
  list.push({ name, score: value });
  list.sort((a,b)=>b.score - a.score);
  const top5 = list.slice(0,5);
  saveLeaderboard(top5);
}
function renderLeaderboard() {
  if (!leaderboardListEl) return;
  const list = getLeaderboard();
  leaderboardListEl.innerHTML = '';
  list.forEach(item => {
    const li = document.createElement('li');
    li.textContent = `${item.name} - ${item.score}`;
    leaderboardListEl.appendChild(li);
  });
}
if (showLeaderboardBtn) {
  showLeaderboardBtn.addEventListener('click', () => {
    renderLeaderboard();
    if (leaderboardEl) leaderboardEl.classList.toggle('hidden');
  });
}

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

  // === Tanya nama sekali di awal ===
  playerName = prompt("Masukkan nama Anda:", "Player");
  if (!playerName || !playerName.trim()) {
    alert("Nama harus diisi untuk mulai bermain!");
    return; 
  }
  playerName = playerName.trim();

  document.body.classList.remove("tema-buah","tema-sayur","tema-hewan");
  document.body.classList.add(`tema-${currentTheme}`);

  bgMusic.src = themeMusic[currentTheme];
  playBgMusic();

  document.getElementById("menu").classList.add("hidden");
  board.classList.remove("hidden");
  setupGame();
});

// Ganti tema saat sedang bermain: minta konfirmasi dulu
if (themeSelect) {
  themeSelect.addEventListener('change', (e) => {
    const newTheme = themeSelect.value;
    const menuEl = document.getElementById("menu");
    const inGame = menuEl && menuEl.classList.contains('hidden');
    if (inGame) {
      const ok = confirm("Apa anda yakin ingin mengganti Tema? Ini akan mereset level permainan anda!");
      if (!ok) {
        // Batalkan perubahan select
        themeSelect.value = currentTheme;
        return;
      }
      // Konfirmasi: reset level dan setup ulang dengan tema baru
      currentTheme = newTheme;
      emojisBase = themes[currentTheme];
      level = 1;

      document.body.classList.remove("tema-buah","tema-sayur","tema-hewan");
      document.body.classList.add(`tema-${currentTheme}`);

      bgMusic.src = themeMusic[currentTheme];
      playBgMusic();

      // Reset skor atau pertahankan? Instruksi hanya menyebut level, skor tetap.
      setupGame();
    } else {
      // Jika masih di menu, izinkan perubahan tanpa konfirmasi (akan dipakai saat tekan Main)
    }
  });
}

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
  updateScoreDisplay();
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
    // Jika kartu pertama dibalik, mulai timer 2 detik untuk otomatis balik lagi
    firstCard = card; if (timer===0) startTimer();
    if (firstFlipTimeoutId) { clearTimeout(firstFlipTimeoutId); firstFlipTimeoutId = null; }
    firstFlipTimeoutId = setTimeout(()=>{
      // Hanya balik jika masih hanya 1 kartu yang terbuka dan kartu ini belum jadi pasangan
      if (firstCard === card && !secondCard && !card.classList.contains('matched')) {
        card.classList.remove('flipped');
        resetTurn();
      }
    }, 2000);
  } else {
    secondCard = card; lock = true; steps++;
    if (firstFlipTimeoutId) { clearTimeout(firstFlipTimeoutId); firstFlipTimeoutId = null; }
    stepsDisplay.textContent = `Langkah: ${steps}`;
    if (firstCard.dataset.emoji===secondCard.dataset.emoji) {
      firstCard.classList.add("matched");
      secondCard.classList.add("matched");
      playSfx('match'); matchedPairs++;
      score += 10; updateScoreDisplay();
      if (matchedPairs===emojis.length) {
        clearInterval(timerInterval); 
        playSfx('win');
        setTimeout(()=>{
          finalInfo.textContent = `Level ${level} selesai! 🏆\nWaktu: ${timer} detik | Langkah: ${steps}`;
          
          const popupContent = popup.querySelector(".popup-content");
          popupContent.querySelectorAll("button").forEach(btn => btn.remove());

          if (level < MAX_LEVEL) {
            // tombol lanjut level
            const nextBtn = document.createElement("button");
            nextBtn.textContent = "➡️ Lanjut Level";
            nextBtn.onclick = nextLevel;
            popupContent.appendChild(nextBtn);
          } else {
            // tombol selesai
            const finishBtn = document.createElement("button");
            finishBtn.textContent = "✅ Selesai";
            finishBtn.onclick = () => {
              popup.classList.remove("show");
              document.getElementById("menu").classList.remove("hidden");
              board.classList.add("hidden");
              addToLeaderboard(playerName, score);
            };
            popupContent.appendChild(finishBtn);
          }

          // tombol restart
          const restartBtn = document.createElement("button");
          restartBtn.textContent = "🔄 Ulang dari Awal";
          restartBtn.onclick = restartGame;
          popupContent.appendChild(restartBtn);

          popup.classList.add("show"); 
          showConfetti();
        },500);
      }
      resetTurn();
    } else {
      playSfx('mismatch');
      setTimeout(()=>{
        firstCard.classList.remove("flipped");
        secondCard.classList.remove("flipped");
        score -= 2; updateScoreDisplay();
        resetTurn();
      },800);
    }
  }
}
function resetTurn() {
  if (firstFlipTimeoutId) { clearTimeout(firstFlipTimeoutId); firstFlipTimeoutId = null; }
  [firstCard,secondCard] = [null,null];
  lock = false;
}
function restartGame() { popup.classList.remove("show"); level=1; score=0; updateScoreDisplay(); setupGame(); }
function nextLevel() { popup.classList.remove("show"); level++; setupGame(); }
function showConfetti() {
  const end = Date.now() + 2*1000
}

const closeLeaderboardBtn = document.getElementById("closeLeaderboardBtn");
if (closeLeaderboardBtn) {
  closeLeaderboardBtn.addEventListener("click", () => {
    leaderboardEl.classList.add("hidden");
  });
}

