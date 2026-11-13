import {
  state, content, timerDisplay, startBtn, closeBtn,
  rand, signalStart, signalEnd,
  showModalButtons, closeOverlay
} from '../app.js';

export const META = {
  label: 'Говорить',
  time: 30,
  points: 1,
  words: [
'Ароматизированная жидкость',
'Безлимитный проезд',
'Биологическая добавка',
'Боевое настроение',
'Бойцовский характер',
'Вершина айсберга',
'Взмахи дирижёра',
'Волнительный момент',
'Встреча выпускников',
'Вулканическая пыль',
'Декоративное освещение',
'Дождевое облако',
'Дополнительный доход',
'Дубовая роща',
'Звуки природы',
'Зимнее утро',
'Золотой телец',
'Играть по правилам',
'Игрушечная булава',
'Искаженный перевод',
'Канализационная шахта',
'Котострофа',
'Кошачий лайк',
'Кровяное давление',
'Кризисная ситуация',
'Любимый герой',
'Масштабный праздник',
'Мгновенная прибыль',
'Мимолетный взгляд',
'Морской бриз',
'Навигационная станция',
'Немой тамада',
'Оборонительная крепость',
'Оборонительный рубеж',
'Перспективное будущее',
'Плавательный бассейн',
'План надёжный как швейцарские часы',
'Пожарный рукав',
'Предупредительный выстрел',
'Продолжительность жизни',
'Проветриваемое помещение',
'Птица счастья',
'Радиоактивный лес',
'Рекламный текст',
'Реактивный ранец',
'Раритетный трамвай',
'Сборник рассказов',
'Сейчас человечек подскочит',
'Семейное торжество',
'Серьезный шаг',
'Сказочная природа',
'Смех гиены',
'Современный дизайн',
'Стремительное падение',
'Сумасшедшие цены',
'Трогательный момент',
'Уборочная техника',
'Хронический стресс',
'Численный перевес',
'Шахматная партия',
'Штрафной бросок',
'Ювелирное украшение',
'Ctrl + Shift + Т'
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
      // ТО ЖЕ слово
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
