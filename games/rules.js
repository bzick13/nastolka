import {
  content, timerDisplay, startBtn, closeBtn,
  showModalButtons, closeOverlay
} from '../app.js';

export const META = {
  label: 'Правила игры',
  time: 0,
  points: 0,
  rules: true
};

export function open() {
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
  timerDisplay.classList.add('hidden');
  startBtn.classList.add('hidden');
  startBtn.onclick = null;
  showModalButtons();
  closeBtn.onclick = closeOverlay;
}