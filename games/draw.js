import {
  state, content, timerDisplay, startBtn, closeBtn,
  drawOverlay, drawTimer, canvas,
  rand, signalStart, signalEnd,
  showModalButtons, closeOverlay
} from '../app.js';

export const META = {
  label: 'Рисовать',
  time: 8,
  points: 3,
  words: [
    'Яблоко', 'Солнце', 'Кот', 'Дом', 'Машина',
    'Дерево', 'Книга', 'Рыба', 'Часы', 'Кресло'
  ]
};

let ctx = null;
let eraserMode = false;
let drawing = false;

const clearBtn = document.getElementById('clear-btn');
const eraserBtn = document.getElementById('eraser-btn');

/* Открытие: слово + кнопка Старт */
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
  startBtn.classList.add('hidden');

  removeDrawingListeners();

  drawOverlay.classList.remove('hidden');

  // 1) сначала готовим размер canvas в CSS-пикселях (без dpr!)
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';

  // 2) получаем контекст уже после установки размера
  ctx = canvas.getContext('2d');

  // 3) чистим холст
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 4) сбрасываем режимы
  eraserMode = false;
  drawing = false;
  eraserBtn.classList.remove('active');
  applyBrush();

  // 5) отсчёт
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
  removeDrawingListeners();
  drawOverlay.classList.add('hidden');
  state.isRunning = false;

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
  if (!ctx) return;
  e.preventDefault();
  drawing = true;
  const p = getPos(e);
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
}

function onMove(e) {
  if (!drawing || !ctx) return;
  e.preventDefault();
  const p = getPos(e);
  ctx.lineTo(p.x, p.y);
  ctx.stroke();
}

function onEnd() {
  drawing = false;
}

function onClear() {
  if (!ctx) return;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  applyBrush();
}

function onToggleEraser() {
  eraserMode = !eraserMode;
  eraserBtn.classList.toggle('active', eraserMode);
  applyBrush();
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

  clearBtn.addEventListener('click', onClear);
  eraserBtn.addEventListener('click', onToggleEraser);
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

  clearBtn.removeEventListener('click', onClear);
  eraserBtn.removeEventListener('click', onToggleEraser);

  drawing = false;
}

/* resize: сохраняем картинку через offscreen canvas */
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
