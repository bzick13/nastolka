import {
  state, content, timerDisplay, startBtn, closeBtn,
  pickN, signalStart, signalEnd,
  showModalButtons, closeOverlay
} from '../app.js';

export const META = {
  label: 'Блиц',
  time: 30,
  points: 5,
  words: [
'Аватар','Адвокат дьявола',
'Адреналин','Айболит','Аквамен','Акулий торнадо','Аладдин','Аленький цветочек','Алиса в стране чудес','Алькатрас','Амели','Американская история ужасов','Американский пирог','Анаконда','Анастасия','Ангелы Чарли','Анна Каренина','Аннабель','Арахнофобия','Аритмия','Астерикс и Обеликс','Астрал','Атака титанов','Агент 007','Агенты ЩИТ','Аисты'
  ]
};

export function open(currentGame) {
  currentGame.currentWords = pickN(META.words, 5);

  content.innerHTML = `
    <div class="blitz-list">${currentGame.currentWords.map(w => `<div>${w}</div>`).join('')}</div>
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
      // ТОТ ЖЕ список
      content.innerHTML = `
        <div class="blitz-list">${currentGame.currentWords.map(w => `<div>${w}</div>`).join('')}</div>
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
