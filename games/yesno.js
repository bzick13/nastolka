import {
  state, content, timerDisplay, startBtn, closeBtn,
  rand, signalStart, signalEnd,
  showModalButtons, closeOverlay
} from '../app.js';

export const META = {
  label: 'Да/Нет',
  time: 90,
  points: 3,
  words: [
'Айболит',
'Александр Пушкин',
'Арнольд Шварценеггер',
'Артем Дзюба',
'Бетмен',
'Буратино',
'Винни пух',
'Виктор Цой',
'Владимир Владимирович Путин',
'Волан-де-Морт',
'Гарик Харламов',
'Гарри Поттер',
'Гендальф',
'Гитлер',
'Губка Боб',
'Дамблдор',
'Джеймс Бонд',
'Джек Воробей',
'Джокер',
'Джонни Депп',
'Джим Керри',
'Дмитрий Билан',
'Иван Грозный',
'Илон Маск',
'Карлсон',
'Киану Ривз',
'Криштиану Роналдо',
'Крокодил Гена',
'Леди Гага',
'Ленин',
'Леонардо Ди Каприо',
'Майк Тайсон',
'Майкл Джексон',
'Майкл Джордан',
'Маугли',
'Моцарт',
'Ольга Бузова',
'Оптимус Прайм',
'Петр 1',
'Сальвадор Дали',
'Сергей Есенин',
'Сергей Шнуров',
'Снуп Дог',
'Стив Джобс',
'Стив Роджерс (Капитан Америка)',
'Супермен',
'Терминатор',
'Тони Старк (Железный человек)',
'Тор',
'Филипп Киркоров',
'Халк',
'Чак Норрис',
'Чебурашка',
'Человек паук',
'Шапокляк',
'Шерлок Холмс',
'Шрек',
'Элвис Пресли',
'Эминем',
'Юлий Цезарь',
'Юрий Гагарин'
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
