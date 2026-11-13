import {
  content, timerDisplay, startBtn, closeBtn,
  rand, showModalButtons, closeOverlay
} from '../app.js';

export const META = {
  label: 'Бросить кубик',
  time: 0,
  points: 0,
  words: [
    'Рисовать', 'Показывать', 'Говорить',
    'ДА/НЕТ', 'Слово задом наперед'
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
