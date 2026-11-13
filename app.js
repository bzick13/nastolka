/* ============ НАСТРОЙКИ ИГР ============ */
const GAMES = {
  draw: {
    label: 'Рисовать',
    time: 7,
    points: 3,
    words: [
      'Яблоко', 'Солнце', 'Кот', 'Дом', 'Машина',
      'Дерево', 'Книга', 'Рыба', 'Часы', 'Кресло'
    ]
  },
  speak: {
    label: 'Говорить',
    time: 60,
    points: 2,
    words: [
      'День рождения', 'Морской бриз', 'Горячий чай', 'Красная площадь',
      'Летний дождь', 'Зимнее утро', 'Кошачий лайк', 'Птица счастья'
    ]
  },
  show: {
    label: 'Показывать',
    time: 45,
    points: 3,
    words: [
      'Прыгать', 'Смеяться', 'Плавать', 'Готовить', 'Петь',
      'Танцевать', 'Читать', 'Плакать', 'Играть на гитаре', 'Спать'
    ]
  },
  reverse: {
    label: 'Слово задом наперёд',
    time: 40,
    points: 2,
    words: [
      'Сказка', 'Молоко', 'Колесо', 'Ворона', 'Барабан',
      'Стадион', 'Подушка', 'Радуга', 'Колобок', 'Телефон'
    ]
  },
  yesno: {
    label: 'Да/Нет',
    time: 30,
    points: 1,
    words: [
      'Ты любишь кофе?', 'Ты был в Париже?', 'Ты умеешь плавать?',
      'Ты боишься пауков?', 'Ты читал «Войну и мир»?', 'Ты играешь в шахматы?'
    ]
  },
  blitz: {
    label: 'Блиц',
    time: 30,
    points: 5,
    words: [
      'Кошка', 'Собака', 'Солнце', 'Луна', 'Море', 'Лес', 'Гора',
      'Река', 'Звезда', 'Облако', 'Дождь', 'Снег', 'Ветер', 'Огонь',
      'Молоко', 'Хлеб', 'Яблоко', 'Стол', 'Стул', 'Окно'
    ]
  },
  dice: {
    label: 'Бросить кубик',
    time: 0,
    points: 0,
    words: [
      '1 — сделай шаг назад', '2 — пропусти ход', '3 — скажи комплимент',
      '4 — поменяйся местами', '5 — выбери другого', '6 — брось ещё раз'
    ]
  },
  rules: {
    label: 'Правила игры',
    time: 0,
    points: 0,
    rules: true
  }
};

/* ============ СОСТОЯНИЕ ============ */
let currentGame = null;
let timerInterval = null;
let countdownInterval = null;
let audioCtx = null;
let isRunning = false;

/* ============ ЗВУК ============ */
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function beep(freq = 880, duration = 0.25, type = 'sine') {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) { /* ignore */ }
}

function signalStart() {
  beep(660, 0.15, 'square');
  setTimeout(() => beep(880, 0.3, 'square'), 160);
}

function signalEnd() {
  beep(880, 0.2, 'sawtooth');
  setTimeout(() => beep(660, 0.2, 'sawtooth'), 220);
  setTimeout(() => beep(440, 0.4, 'sawtooth'), 440);
}

/* ============ УТИЛИТЫ ============ */
const $ = sel => document.querySelector(sel);
const overlay = $('#overlay');
const modal = $('#modal');
const content = $('#content');
const timerDisplay = $('#timer-display');
const modalButtons = $('#modal-buttons');
const startBtn = $('#start-btn');
const closeBtn = $('#close-btn');
const drawOverlay = $('#draw-overlay');
const drawTimer = $('#draw-timer');
const canvas = $('#canvas');

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN(arr, n) {
  const copy = [...arr];
  const out = [];
  while (out.length < n && copy.length) {
    out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  }
  return out;
}

function clearIntervals() {
  clearInterval(timerInterval);
  clearInterval(countdownInterval);
  timerInterval = null;
  countdownInterval = null;
}

/* Скрывает таймер и кнопку «Старт» — используется в dice и rules */
function hideTimerAndStart() {
  timerDisplay.classList.add('hidden');
  startBtn.classList.add('hidden');
  startBtn.onclick = null;
}

/* ============ ОТКРЫТИЕ ИГР ============ */
document.querySelectorAll('[data-game]').forEach(btn => {
  btn.addEventListener('click', () => openGame(btn.dataset.game));
});

function openGame(key) {
  const game = GAMES[key];
  if (!game) return;
  currentGame = { key, ...game, currentWord: null, currentWords: null };
  isRunning = false;
  clearIntervals();

  overlay.classList.remove('hidden');
  content.innerHTML = '';
  timerDisplay.classList.add('hidden');
  modalButtons.classList.add('hidden');
  startBtn.classList.remove('hidden');
  startBtn.onclick = null;
  closeBtn.onclick = closeOverlay;

  if (game.rules) {
    renderRules(game);
    return;
  }

  if (key === 'dice') {
    renderDice(game);
    return;
  }

  if (key === 'blitz') {
    renderBlitz(game);
    return;
  }

  renderWord(game);
}

/* ============ РЕНДЕРЫ ============ */

/* Общий рендер: слово фиксируется в currentGame.currentWord */
function renderWord(game) {
  // фиксируем слово на весь раунд
  currentGame.currentWord = rand(game.words);

  content.innerHTML = `
    <div class="word">${currentGame.currentWord}</div>
    <div class="points">Баллы: ${game.points}</div>
  `;
  timerDisplay.classList.remove('hidden');
  timerDisplay.textContent = game.time;
  modalButtons.classList.remove('hidden');
  startBtn.classList.remove('hidden');
  startBtn.onclick = () => {
    if (game.key === 'draw') startDrawGame(game);
    else startCountdownAndTimer(game);
  };
}

/* Блиц: список слов фиксируется в currentGame.currentWords */
function renderBlitz(game) {
  currentGame.currentWords = pickN(game.words, 5);

  content.innerHTML = `
    <div class="blitz-list">${currentGame.currentWords.map(w => `<div>${w}</div>`).join('')}</div>
    <div class="points">Баллы: ${game.points}</div>
  `;
  timerDisplay.classList.remove('hidden');
  timerDisplay.textContent = game.time;
  modalButtons.classList.remove('hidden');
  startBtn.classList.remove('hidden');
  startBtn.onclick = () => startCountdownAndTimer(game);
}

function renderDice(game) {
  const word = rand(game.words);
  content.innerHTML = `
    <div class="word">${word}</div>
  `;
  hideTimerAndStart();
  modalButtons.classList.remove('hidden');
  closeBtn.onclick = closeOverlay;
}

function renderRules(game) {
  content.innerHTML = `
    <div class="rules-text">
      <h3>🎲 Как играть в «Настолку»</h3>
      <p>Игроки делятся на команды. В свой ход команда выбирает одно из заданий.</p>
      <h3>Задания</h3>
      <p><b>🎨 Рисовать</b> — объясните слово, рисуя его на экране. Нельзя писать буквы и цифры.</p>
      <p><b>🗣️ Говорить</b> — объясните слово словами, не используя однокоренные.</p>
      <p><b>🙌 Показывать</b> — покажите слово жестами, без слов и звуков.</p>
      <p><b>🔄 Слово задом наперёд</b> — произнесите слово наоборот и угадайте его.</p>
      <p><b>✅ Да/Нет</b> — отвечайте на вопросы только «да» или «нет».</p>
      <p><b>⚡ Блиц</b> — угадайте сразу 5 слов за короткое время.</p>
      <p><b>🎲 Бросить кубик</b> — выполните случайное действие на игровом поле.</p>
      <h3>Баллы</h3>
      <p>За каждое задание начисляются баллы. Побеждает команда с наибольшим количеством баллов!</p>
    </div>
  `;
  hideTimerAndStart();
  modalButtons.classList.remove('hidden');
  closeBtn.onclick = closeOverlay;
}

/* ============ СТАРТ: ОБЫЧНЫЙ ============ */
function startCountdownAndTimer(game) {
  if (isRunning) return;
  isRunning = true;
  startBtn.classList.add('hidden');

  let count = 3;
  content.innerHTML = `<div class="countdown">${count}</div>`;

  countdownInterval = setInterval(() => {
    count--;
    if (count > 0) {
      content.innerHTML = `<div class="countdown">${count}</div>`;
      beep(440, 0.1);
    } else if (count === 0) {
      content.innerHTML = `<div class="countdown">Старт!</div>`;
      signalStart();
    } else {
      clearInterval(countdownInterval);
      countdownInterval = null;
      if (game.key === 'blitz') renderBlitzAfterStart(game);
      else renderWordAfterStart(game);
      startTimer(game.time);
    }
  }, 1000);
}

/* После отсчёта показываем ТО ЖЕ слово, что было до Старта */
function renderWordAfterStart(game) {
  content.innerHTML = `
    <div class="word">${currentGame.currentWord}</div>
    <div class="points">Баллы: ${game.points}</div>
  `;
}

/* После отсчёта показываем ТОТ ЖЕ список, что был до Старта */
function renderBlitzAfterStart(game) {
  content.innerHTML = `
    <div class="blitz-list">${currentGame.currentWords.map(w => `<div>${w}</div>`).join('')}</div>
    <div class="points">Баллы: ${game.points}</div>
  `;
}

function startTimer(seconds) {
  let left = seconds;
  timerDisplay.textContent = left;
  timerDisplay.classList.remove('hidden');
  timerInterval = setInterval(() => {
    left--;
    timerDisplay.textContent = left;
    if (left <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      timerDisplay.textContent = '0';
      signalEnd();
      isRunning = false;
    }
  }, 1000);
}

/* ============ СТАРТ: РИСОВАНИЕ ============ */
let ctx = null;

function startDrawGame(game) {
  if (isRunning) return;
  isRunning = true;
  startBtn.classList.add('hidden');

  drawOverlay.classList.remove('hidden');
  resizeCanvas();
  ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  let count = 3;
  drawTimer.textContent = `3`;
  drawTimer.style.color = '#1565c0';

  countdownInterval = setInterval(() => {
    count--;
    if (count > 0) {
      drawTimer.textContent = `${count}`;
      beep(440, 0.1);
    } else if (count === 0) {
      drawTimer.textContent = 'Старт!';
      signalStart();
    } else {
      clearInterval(countdownInterval);
      countdownInterval = null;
      enableDrawing();
      startDrawTimer(game);
    }
  }, 1000);
}

function enableDrawing() {
  let drawing = false;

  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return {
      x: (t.clientX - rect.left) * (canvas.width / rect.width),
      y: (t.clientY - rect.top) * (canvas.height / rect.height)
    };
  }

  function start(e) {
    e.preventDefault();
    drawing = true;
    const p = getPos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  }
  function move(e) {
    if (!drawing) return;
    e.preventDefault();
    const p = getPos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }
  function end() {
    drawing = false;
  }

  canvas.addEventListener('mousedown', start);
  canvas.addEventListener('mousemove', move);
  canvas.addEventListener('mouseup', end);
  canvas.addEventListener('mouseleave', end);
  canvas.addEventListener('touchstart', start, { passive: false });
  canvas.addEventListener('touchmove', move, { passive: false });
  canvas.addEventListener('touchend', end);

  canvas._listeners = { start, move, end };
}

function removeDrawingListeners() {
  if (!canvas._listeners) return;
  const { start, move, end } = canvas._listeners;
  canvas.removeEventListener('mousedown', start);
  canvas.removeEventListener('mousemove', move);
  canvas.removeEventListener('mouseup', end);
  canvas.removeEventListener('mouseleave', end);
  canvas.removeEventListener('touchstart', start);
  canvas.removeEventListener('touchmove', move);
  canvas.removeEventListener('touchend', end);
  canvas._listeners = null;
}

function startDrawTimer(game) {
  let left = game.time;
  drawTimer.textContent = left;
  drawTimer.style.color = '#c62828';

  timerInterval = setInterval(() => {
    left--;
    drawTimer.textContent = left;
    if (left <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      signalEnd();
      endDrawRound(game);
    }
  }, 1000);
}

/* После раунда рисования показываем ТО ЖЕ слово, что было зафиксировано */
function endDrawRound(game) {
  removeDrawingListeners();
  drawOverlay.classList.add('hidden');
  isRunning = false;

  content.innerHTML = `
    <div class="word">${currentGame.currentWord}</div>
    <div class="points">Баллы: ${game.points}</div>
  `;
  timerDisplay.textContent = '0';
  timerDisplay.classList.remove('hidden');
  modalButtons.classList.remove('hidden');
  startBtn.classList.add('hidden');
  closeBtn.onclick = closeOverlay;
}

/* ============ RESIZE CANVAS ============ */
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
  if (ctx) {
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#000';
  }
}

window.addEventListener('resize', () => {
  if (!drawOverlay.classList.contains('hidden')) {
    const img = canvas.toDataURL();
    resizeCanvas();
    const image = new Image();
    image.onload = () => ctx.drawImage(
      image, 0, 0,
      canvas.width / (window.devicePixelRatio || 1),
      canvas.height / (window.devicePixelRatio || 1)
    );
    image.src = img;
  }
});

/* ============ ЗАКРЫТИЕ ============ */
function closeOverlay() {
  clearIntervals();
  removeDrawingListeners();
  drawOverlay.classList.add('hidden');
  overlay.classList.add('hidden');
  isRunning = false;
  currentGame = null;
  timerDisplay.classList.add('hidden');
  timerDisplay.style.color = '#c62828';
  startBtn.classList.remove('hidden');
  startBtn.onclick = null;
}

closeBtn.onclick = closeOverlay;

overlay.addEventListener('click', (e) => {
  if (e.target === overlay) closeOverlay();
});

/* ============ PWA ============ */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
  });
}

/* ============ БЛОКИРОВКА СКРОЛЛА ============ */
const observer = new MutationObserver(() => {
  document.body.style.overflow =
    (!overlay.classList.contains('hidden') || !drawOverlay.classList.contains('hidden'))
      ? 'hidden' : '';
});
observer.observe(overlay, { attributes: true, attributeFilter: ['class'] });
observer.observe(drawOverlay, { attributes: true, attributeFilter: ['class'] });
