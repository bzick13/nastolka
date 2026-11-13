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
  currentGame: null,   // { key, meta, currentWord, currentWords }
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
  timerDisplay.textContent = value;
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

/* ============ ИНИЦИАЛИЗАЦИЯ ============ */
document.querySelectorAll('[data-game]').forEach(btn => {
  btn.addEventListener('click', () => openGame(btn.dataset.game));
});

overlay.addEventListener('click', (e) => {
  if (e.target === overlay) closeOverlay();
});

/* ============ PWA: автообновление ============ */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('service-worker.js');

      // Периодическая проверка обновлений
      setInterval(() => registration.update(), 30000);

      // Проверка при возврате на вкладку
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) registration.update();
      });

      // Когда новый SW активировался — перезагружаем страницу
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

/* ============ БЛОКИРОВКА СКРОЛЛА ============ */
const observer = new MutationObserver(() => {
  document.body.style.overflow =
    (!overlay.classList.contains('hidden') || !drawOverlay.classList.contains('hidden'))
      ? 'hidden' : '';
});
observer.observe(overlay, { attributes: true, attributeFilter: ['class'] });
observer.observe(drawOverlay, { attributes: true, attributeFilter: ['class'] });
