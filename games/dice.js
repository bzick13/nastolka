import {
  content, timerDisplay, startBtn, closeBtn,
  rand, showModalButtons, closeOverlay
} from '../app.js';

export const META = {
  label: 'Бросить кубик',
  time: 0,
  points: 0,
  words: [
    '1 — сделай шаг назад', '2 — пропусти ход', '3 — скажи комплимент',
    '4 — поменяйся местами', '5 — выбери другого', '6 — брось ещё раз'
  ]
};

export function open() {
  const word = rand(META.words);
  content.innerHTML = `<div class="word">${word}</div>`;

  timerDisplay.classList.add('hidden');
  startBtn.classList.add('hidden');
  startBtn.onclick = null;
  showModalButtons();
  closeBtn.onclick = closeOverlay;
}