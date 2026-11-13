import {
  state, content, timerDisplay, startBtn, closeBtn,
  rand, signalStart, signalEnd,
  showModalButtons, closeOverlay
} from '../app.js';

export const META = {
  label: 'Слово задом наперёд',
  time: 30,
  points: 1,
  words: [
    'Сказка', 'Молоко', 'Колесо', 'Ворона', 'Барабан',
    'Стадион', 'Подушка', 'Радуга', 'Колобок', 'Телефон'
  ]
};

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

function start(currentGame) {
  if (state.isRunning) return;
  state.isRunning = true;
  startBtn.classList.add('hidden');

  let count = 3;
  content.innerHTML = `<div class="countdown">${count}</div>`;

  state.countdownInterval = setInterval(() => {
    count--;
    if (count > 0) {
      content.innerHTML = `<div class="countdown">${count}</div>`;
    } else if (count === 0) {
      content.innerHTML = `<div class="countdown">Старт!</div>`;
      signalStart();
    } else {
      clearInterval(state.countdownInterval);
      state.countdownInterval = null;
      content.innerHTML = `
        <div class="word">${currentGame.currentWord}</div>
        <div class="points">Баллы: ${META.points}</div>
      `;
      startTimer();
    }
  }, 1000);
}

function startTimer() {
  let left = META.time;
  timerDisplay.textContent = left;
  timerDisplay.classList.remove('hidden');

  state.timerInterval = setInterval(() => {
    left--;
    timerDisplay.textContent = left;
    if (left <= 0) {
      clearInterval(state.timerInterval);
      state.timerInterval = null;
      timerDisplay.textContent = '0';
      signalEnd();
      state.isRunning = false;
    }
  }, 1000);
}
