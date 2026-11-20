/* ============ ЯДРО ============ */
import * as draw from './games/draw.js';
import * as speak from './games/speak.js';
import * as show from './games/show.js';
import * as reverse from './games/reverse.js';
import * as yesno from './games/yesno.js';
import * as blitz from './games/blitz.js';
import * as dice from './games/dice.js';
import * as rules from './games/rules.js';

/* Реестр игр: ключ → модуль */
export const GAMES = { draw, speak, show, reverse, yesno, blitz, dice, rules };

/* ============ СОСТОЯНИЕ ============ */
export const state = {
  currentGame: null,
  timerInterval: null,
  countdownInterval: null,
  isRunning: false,
  audioCtx: null
};

/* ============ DOM ============ */
export const $ = sel => document.querySelector(sel);
export const overlay = $('#overlay');
export const content = $('#content');
export const timerDisplay = $('#timer-display');
export const modalButtons = $('#modal-buttons');
export const startBtn = $('#start-btn');
export const closeBtn = $('#close-btn');
export const drawOverlay = $('#draw-overlay');
export const drawTimer = $('#draw-timer');
export const canvas = $('#canvas');

/* ============ УТИЛИТЫ ============ */
export function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function pickN(arr, n) {
  const copy = [...arr];
  const out = [];
  while (out.length < n && copy.length) {
    out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  }
  return out;
}

export function clearIntervals() {
  clearInterval(state.timerInterval);
  clearInterval(state.countdownInterval);
  state.timerInterval = null;
  state.countdownInterval = null;
}

/* ============ ЗВУК ============ */
export function getAudioCtx() {
  if (!state.audioCtx) {
    state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return state.audioCtx;
}

export function beep(freq = 880, duration = 0.25, type = 'sine') {
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

export function signalStart() {
  beep(660, 0.15, 'square');
  setTimeout(() => beep(880, 0.3, 'square'), 160);
}

export function signalEnd() {
  beep(880, 0.2, 'sawtooth');
  setTimeout(() => beep(660, 0.2, 'sawtooth'), 220);
  setTimeout(() => beep(440, 0.4, 'sawtooth'), 440);
}

/* ============ ОБЩИЕ UI-ХЕЛПЕРЫ ============ */
export function hideTimerAndStart() {
  timerDisplay.classList.add('hidden');
  startBtn.classList.add('hidden');
  startBtn.onclick = null;
}

export function showTimerAndStart(value) {
  timerDisplay.classList.remove('hidden');
  timerDisplay.innerHTML = `<span class="timer-label">Время:</span> ${value}`;
  startBtn.classList.remove('hidden');
}

export function showModalButtons() {
  modalButtons.classList.remove('hidden');
}

/* ============ ОТКРЫТИЕ ИГРЫ ============ */
export function openGame(key) {
  const mod = GAMES[key];
  if (!mod) return;

  state.currentGame = {
    key,
    meta: mod.META,
    currentWord: null,
    currentWords: null
  };
  state.isRunning = false;
  clearIntervals();

  overlay.classList.remove('hidden');
  history.pushState({ game: key }, '', ''); // Добавляем запись в историю
  content.innerHTML = '';
  timerDisplay.classList.add('hidden');
  modalButtons.classList.add('hidden');
  startBtn.classList.remove('hidden');
  startBtn.onclick = null;
  closeBtn.onclick = closeOverlay;

  mod.open(state.currentGame);
}

/* ============ ЗАКРЫТИЕ ============ */
export function closeOverlay() {
  clearIntervals();

  if (state.currentGame?.key === 'draw') {
    draw.cleanup?.();
  }

  drawOverlay.classList.add('hidden');
  overlay.classList.add('hidden');
  state.isRunning = false;
  state.currentGame = null;
  timerDisplay.classList.add('hidden');
  timerDisplay.style.color = '#c62828';
  startBtn.classList.remove('hidden');
  startBtn.onclick = null;
}

/* ============ ИНИЦИАЛИЗАЦИЯ ОСНОВНЫХ ИГР ============ */
document.querySelectorAll('[data-game]').forEach(btn => {
  btn.addEventListener('click', () => openGame(btn.dataset.game));
});

overlay.addEventListener('click', (e) => {
  if (e.target === overlay) closeOverlay();
});

/* ============================================================
   ============ МОДУЛЬ ПОДСЧЕТА БАЛЛОВ =========================
   ============================================================ */
function initScoreGame() {
  const SCORE_STORAGE_KEY = 'scoreGameState_v1';
  const SCORE_SPECIAL_POINTS = { 5: 'hard', 15: 'hard', 25: 'hard', 10: 'blitz', 20: 'blitz' };

  const scoreGameBtn = $('#score-game-btn');
  const setupOverlay = $('#score-setup-overlay');
  const boardOverlay = $('#score-board-overlay');
  const teamCountSelect = $('#score-team-count');
  const teamsConfig = $('#score-teams-config');
  const startBtn = $('#score-start-btn');
  const cancelBtn = $('#score-cancel-btn');
  const teamsList = $('#score-teams-list');
  const endTurnBtn = $('#score-end-turn-btn');
  const resetBtn = $('#score-reset-btn');
  const exitBtn = $('#score-exit-btn');
  const pointsModal = $('#score-points-modal');
  const modalTeamName = $('#score-modal-team-name');
  const pointsGrid = $('#score-points-grid');
  const modalCloseBtn = $('#score-modal-close');

  // Если кнопки нет на странице, прерываем инициализацию (защита от ошибок)
  if (!scoreGameBtn) return;

  // ИСПРАВЛЕНИЕ: 8 уникальных цветов для команд
  const DEFAULT_COLORS = [
    '#1565c0', // Синий
    '#c62828', // Красный
    '#2e7d32', // Зеленый
    '#f57c00', // Оранжевый
    '#8e24aa', // Фиолетовый
    '#00838f', // Бирюзовый
    '#d81b60', // Розовый
    '#5d4037'  // Коричневый
  ];

  let scoreState = null;
  let activeTeamIndex = 0;

  // Загрузка состояния при старте
  try {
    const saved = localStorage.getItem(SCORE_STORAGE_KEY);
    if (saved) {
      scoreState = JSON.parse(saved);
      activeTeamIndex = scoreState.activeTeamIndex || 0;
    }
  } catch (e) { console.warn('Ошибка загрузки', e); }

  // --- НАСТРОЙКА ---
  function renderSetupInputs(count) {
    teamsConfig.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const row = document.createElement('div');
      row.className = 'team-input-row';
      row.innerHTML = `
        <input type="text" placeholder="Команда ${i + 1}" value="Команда ${i + 1}">
        <input type="color" value="${DEFAULT_COLORS[i % DEFAULT_COLORS.length]}">
      `;
      teamsConfig.appendChild(row);
    }
  }

  scoreGameBtn.addEventListener('click', () => {
    if (scoreState && scoreState.teams && scoreState.teams.length > 0) {
      renderBoard();
      boardOverlay.classList.remove('hidden');
      history.pushState({ scoreBoard: true }, '', '');
    } else {
      renderSetupInputs(parseInt(teamCountSelect.value, 10));
      setupOverlay.classList.remove('hidden');
      history.pushState({ scoreSetup: true }, '', '');
    }
  });

  teamCountSelect.addEventListener('change', () => renderSetupInputs(parseInt(teamCountSelect.value, 10)));

  cancelBtn.addEventListener('click', () => setupOverlay.classList.add('hidden'));

  startBtn.addEventListener('click', () => {
    const rows = teamsConfig.querySelectorAll('.team-input-row');
    const teams = [];
    rows.forEach((row) => {
      const name = row.querySelector('input[type="text"]').value.trim() || 'Команда';
      const color = row.querySelector('input[type="color"]').value;
      teams.push({ name, color, score: 0 });
    });
    scoreState = { teams };
    activeTeamIndex = 0;
    saveState();
    setupOverlay.classList.add('hidden');
    renderBoard();
    boardOverlay.classList.remove('hidden');
    history.pushState({ scoreBoard: true }, '', '');
  });

  // --- ИГРОВОЕ ТАБЛО ---
  function saveState() {
    if (scoreState) {
      localStorage.setItem(SCORE_STORAGE_KEY, JSON.stringify({ ...scoreState, activeTeamIndex }));
    }
  }

  function renderBoard() {
    if (!scoreState) return;
    teamsList.innerHTML = '';

    scoreState.teams.forEach((team, index) => {
      const btn = document.createElement('button');
      btn.className = 'score-team-btn';

      if (index === activeTeamIndex) btn.classList.add('active');

      const special = SCORE_SPECIAL_POINTS[team.score];
      let badgeHtml = '';

      if (special === 'blitz') {
        btn.classList.add('blitz');
        badgeHtml = '<span class="score-badge">💥 Блиц</span>';
      } else if (special === 'hard') {
        btn.classList.add('hard');
        badgeHtml = '<span class="score-badge">💩 Усложнение</span>';
      }

      // Красим в цвет команды, только если нет особого статуса
      if (!special) {
        btn.style.backgroundColor = team.color;
      }

      btn.innerHTML = `
        <div>${team.name} — ${team.score}</div>
        ${badgeHtml}
      `;

      btn.addEventListener('click', () => openPointsModal(team, index));
      teamsList.appendChild(btn);
    });
  }

  // --- МОДАЛКА БАЛЛОВ ---
  function openPointsModal(team, index) {
    // ПРОВЕРКА: Если кликнули не по активной команде — выходим
    if (index !== activeTeamIndex) {
      if (navigator.vibrate) navigator.vibrate(50); // Легкая вибрация для понимания
      return; 
    }

    modalTeamName.textContent = team.name;
    pointsGrid.innerHTML = '';

    for (let i = -3; i <= 6; i++) {
      if (i === 0) continue;
      const btn = document.createElement('button');
      btn.textContent = i > 0 ? `+${i}` : i;
      btn.className = i > 0 ? 'plus' : 'minus';
      btn.addEventListener('click', () => {
        addPoints(index, i);
        closePointsModal();
      });
      pointsGrid.appendChild(btn);
    }

    const zeroBtn = document.createElement('button');
    zeroBtn.textContent = '0 (без изменений)';
    zeroBtn.className = 'zero';
    zeroBtn.style.gridColumn = '1 / -1';
    zeroBtn.addEventListener('click', closePointsModal);
    pointsGrid.appendChild(zeroBtn);

    pointsModal.classList.remove('hidden');
    history.pushState({ scoreModal: true }, '', '');
  }

  function closePointsModal() {
    pointsModal.classList.add('hidden');
  }

  modalCloseBtn.addEventListener('click', closePointsModal);

  // --- ИЗМЕНЕНИЕ БАЛЛОВ ---
  function addPoints(teamIndex, amount) {
    scoreState.teams[teamIndex].score += amount;
    saveState();
    renderBoard();
  }

  // --- УПРАВЛЕНИЕ ХОДОМ ---
  endTurnBtn.addEventListener('click', () => {
    activeTeamIndex = (activeTeamIndex + 1) % scoreState.teams.length;
    saveState();
    renderBoard();
  });

  // --- СБРОС И ВЫХОД ---
  resetBtn.addEventListener('click', () => {
    if (confirm('Сбросить все баллы и начать заново?')) {
      localStorage.removeItem(SCORE_STORAGE_KEY);
      scoreState = null;
      activeTeamIndex = 0;
      boardOverlay.classList.add('hidden');
      renderSetupInputs(parseInt(teamCountSelect.value, 10));
      setupOverlay.classList.remove('hidden');
      history.pushState({ scoreSetup: true }, '', '');
    }
  });

  exitBtn.addEventListener('click', () => {
    boardOverlay.classList.add('hidden');
  });
}

// Запуск модуля подсчета
initScoreGame();

/* ============ ОБРАБОТКА СИСТЕМНОЙ КНОПКИ "НАЗАД" ============ */
window.addEventListener('popstate', () => {
  // 1. Если открыта модалка с баллами
  const pointsModal = $('#score-points-modal');
  if (pointsModal && !pointsModal.classList.contains('hidden')) {
    pointsModal.classList.add('hidden');
    return;
  }

  // 2. Если открыто табло игры
  const boardOverlay = $('#score-board-overlay');
  if (boardOverlay && !boardOverlay.classList.contains('hidden')) {
    boardOverlay.classList.add('hidden');
    return;
  }

  // 3. Если открыты настройки команд
  const setupOverlay = $('#score-setup-overlay');
  if (setupOverlay && !setupOverlay.classList.contains('hidden')) {
    setupOverlay.classList.add('hidden');
    return;
  }

  // 4. Если открыто окно рисования или любой другой игры
  if (!drawOverlay.classList.contains('hidden') || !overlay.classList.contains('hidden')) {
    closeOverlay();
    return;
  }
});

/* ============ БЛОКИРОВКА СКРОЛЛА ============ */
const scoreOverlays = [$('#score-setup-overlay'), $('#score-board-overlay'), $('#score-points-modal')];

const observer = new MutationObserver(() => {
  const isAnyOverlayOpen = 
    !overlay.classList.contains('hidden') || 
    !drawOverlay.classList.contains('hidden') ||
    scoreOverlays.some(el => el && !el.classList.contains('hidden'));

  document.body.style.overflow = isAnyOverlayOpen ? 'hidden' : '';
});

observer.observe(overlay, { attributes: true, attributeFilter: ['class'] });
observer.observe(drawOverlay, { attributes: true, attributeFilter: ['class'] });
scoreOverlays.forEach(el => {
  if (el) observer.observe(el, { attributes: true, attributeFilter: ['class'] });
});

/* ============ PWA: автообновление ============ */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('service-worker.js');
      setInterval(() => registration.update(), 30000);
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) registration.update();
      });
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'activated' && navigator.serviceWorker.controller) {
            window.location.reload();
          }
        });
      });
    } catch (e) { /* ignore */ }
  });
}