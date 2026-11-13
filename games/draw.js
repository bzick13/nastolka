import {
  state, content, timerDisplay, startBtn, closeBtn,
  drawOverlay, drawTimer, canvas,
  rand, signalStart, signalEnd,
  showModalButtons, closeOverlay
} from '../app.js';

export const META = {
  label: 'Рисовать',
  time: 7,
  points: 3,
  words: [
    'Яблоко', 'Солнце', 'Кот', 'Дом', 'Машина',
    'Дерево', 'Книга', 'Рыба', 'Часы', 'Кресло'
  ]
};

let ctx = null;
let eraserMode = false;
let drawing = false;
let currentGameRef = null;

const clearBtn = document.getElementById('clear-btn');
const eraserBtn = document.getElementById('eraser-btn');
const doneBtn = document.getElementById('done-btn');

/* Открытие */
export function open(currentGame) {
  currentGame.currentWord = rand(META.words);

  content.innerHTML = `
    <div class="word">${currentGame.currentWord}</div>
    <div class="points">Баллы: ${META.points}</div>
  `;
  timerDisplay.classList.remove('hidden');
  timerDisplay.textContent = META.time;
  showModalButtons();
  startBtn.classList.remove('hidden');
  startBtn.onclick = () => start(currentGame);
  closeBtn.onclick = closeOverlay;
}

/* Старт */
function start(currentGame) {
  if (state.isRunning) return;
  state.isRunning = true;
  currentGameRef = currentGame;
  startBtn.classList.add('hidden');

  removeDrawingListeners();

  drawOverlay.classList.remove('hidden');

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';

  ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  eraserMode = false;
  drawing = false;
  eraserBtn.classList.remove('active');
  applyBrush();

  let count = 3;
  drawTimer.textContent = '3';
  drawTimer.style.color = '#1565c0';

  state.countdownInterval = setInterval(() => {
    count--;
    if (count > 0) {
      drawTimer.textContent = `${count}`;
    } else if (count === 0) {
      drawTimer.textContent = 'Старт!';
      signalStart();
    } else {
      clearInterval(state.countdownInterval);
      state.countdownInterval = null;
      enableDrawing();
      startDrawTimer(currentGame);
    }
  }, 1000);
}

function applyBrush() {
  if (!ctx) return;
  if (eraserMode) {
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 30;
  } else {
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
  }
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
}

function startDrawTimer(currentGame) {
  let left = META.time;
  drawTimer.textContent = left;
  drawTimer.style.color = '#c62828';

  state.timerInterval = setInterval(() => {
    left--;
    drawTimer.textContent = left;
    if (left <= 0) {
      clearInterval(state.timerInterval);
      state.timerInterval = null;
      signalEnd();
      endRound(currentGame);
    }
  }, 1000);
}

function endRound(currentGame) {
  // 1. Останавливаем все интервалы
  clearInterval(state.timerInterval);
  clearInterval(state.countdownInterval);
  state.timerInterval = null;
  state.countdownInterval = null;

  // 2. Жёстко прерываем текущий рисунок
  drawing = false;
  if (ctx) {
    ctx.beginPath(); // закрываем текущий путь, чтобы линия не тянулась
  }

  // 3. Снимаем слушатели
  removeDrawingListeners();

  // 4. Скрываем окно и показываем результат
  drawOverlay.classList.add('hidden');
  state.isRunning = false;
  currentGameRef = null;

  content.innerHTML = `
    <div class="word">${currentGame.currentWord}</div>
    <div class="points">Баллы: ${META.points}</div>
  `;
  timerDisplay.textContent = '0';
  timerDisplay.classList.remove('hidden');
  showModalButtons();
  startBtn.classList.add('hidden');
  closeBtn.onclick = closeOverlay;
}

/* ============ РИСОВАНИЕ ============ */
function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  const t = e.touches && e.touches.length ? e.touches[0] : e;
  return {
    x: t.clientX - rect.left,
    y: t.clientY - rect.top
  };
}

function onStart(e) {
  if (!ctx || !state.isRunning || drawOverlay.classList.contains('hidden')) return;
  e.preventDefault();
  drawing = true;
  const p = getPos(e);
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
}

function onMove(e) {
  if (!drawing || !ctx || !state.isRunning) return;
  e.preventDefault();
  const p = getPos(e);
  ctx.lineTo(p.x, p.y);
  ctx.stroke();
}

function onEnd() {
  drawing = false;
  if (ctx) ctx.beginPath();
}

function onClear(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  if (!ctx) return;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  applyBrush();
}

function onToggleEraser(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  eraserMode = !eraserMode;
  eraserBtn.classList.toggle('active', eraserMode);
  applyBrush();
}

/* 🔑 Кнопка «Готово» — досрочное завершение раунда */
function onDone(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  if (!currentGameRef) return;
  signalEnd();
  endRound(currentGameRef);
}

function enableDrawing() {
  drawing = false;

  canvas.addEventListener('mousedown', onStart);
  canvas.addEventListener('mousemove', onMove);
  canvas.addEventListener('mouseup', onEnd);
  canvas.addEventListener('mouseleave', onEnd);
  canvas.addEventListener('touchstart', onStart, { passive: false });
  canvas.addEventListener('touchmove', onMove, { passive: false });
  canvas.addEventListener('touchend', onEnd);
  canvas.addEventListener('touchcancel', onEnd);

  clearBtn.addEventListener('click', onClear);
  eraserBtn.addEventListener('click', onToggleEraser);
  doneBtn.addEventListener('click', onDone);
}

export function cleanup() {
  removeDrawingListeners();
}

function removeDrawingListeners() {
  canvas.removeEventListener('mousedown', onStart);
  canvas.removeEventListener('mousemove', onMove);
  canvas.removeEventListener('mouseup', onEnd);
  canvas.removeEventListener('mouseleave', onEnd);
  canvas.removeEventListener('touchstart', onStart);
  canvas.removeEventListener('touchmove', onMove);
  canvas.removeEventListener('touchend', onEnd);
  canvas.removeEventListener('touchcancel', onEnd);

  clearBtn.removeEventListener('click', onClear);
  eraserBtn.removeEventListener('click', onToggleEraser);
  doneBtn.removeEventListener('click', onDone);

  drawing = false;
  currentGameRef = null;
}

/* resize */
window.addEventListener('resize', () => {
  if (drawOverlay.classList.contains('hidden') || !ctx) return;

  const oldW = canvas.width;
  const oldH = canvas.height;
  const temp = document.createElement('canvas');
  temp.width = oldW;
  temp.height = oldH;
  temp.getContext('2d').drawImage(canvas, 0, 0);

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';

  ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(temp, 0, 0, oldW, oldH);
  applyBrush();
});
