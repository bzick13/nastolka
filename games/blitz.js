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
'Аватар','Адвокат дьявола','Адреналин','Айболит','Аквамен','Акулий торнадо','Аладдин','Аленький цветочек','Алиса в стране чудес','Алькатрас','Амели','Американская история ужасов','Американский пирог','Анаконда','Анастасия','Ангелы Чарли','Анна Каренина','Аннабель','Арахнофобия','Аритмия','Астерикс и Обеликс','Астрал','Атака титанов','Агент 007','Агенты ЩИТ','Аисты',
'Бабник','Балто','Бандитский Петербург','Барби','Батя','Бегущий в лабиринте','Бегущий по лезвию','Без чувств','Белка и стрелка','Белоснежка','Безумный Макс','Бетховен','Бетмен','Бестыжие','Библиотекарь','Битлджус','Блейд','Блондинка в законе','Бой с тенью','Бойцовский клуб','Большой Лебовски','Босс-молокосос','Брат','Бременские музыканты','Бригада','Брильянтовая рука','Бросок кобры','Брюс всемогущий','Бумер','Бумажный дом','Буратино','Бэмби','Бен 10',
'ВАЛЛ-И', 'Вавилон', 'Вампиры средней полосы', 'Ван Хельсинг', 'Вверх', 'Ведьмак', 'Великолепный век', 'Веном', 'Вий', 'Винкс', 'Винни пух', 'Властелин колец', 'Водный мир', 'Во все тяжкие', 'Война миров', 'Волшебный участок', 'Воронины', 'В поисках Немо', 'Впритык', 'Время', 'Всё или ничего', 'Всегда говори да', 'Вспомнить всё', 'Выживший', 'Вышка',
'Гадкий утёнок', 'Гадкий я', 'Ганнибал', 'Гарри Поттер', 'Гарфилд', 'Гензель и Гретель', 'Геракл', 'Гладиатор', 'Глухарь', 'Головоломка', 'Голодные игры', 'Голяк', 'Город героев', 'Город грехов', 'Город Эмбер', 'Горько', 'Готэм', 'Годзилла', 'Грань будущего', 'Гремлины', 'Гримм', 'Гринч', 'Гриффины', 'Грязные деньги', 'Грязные танцы', 'Губка Боб', 'Гулливер',
'Дамбо', 'Двенадцать друзей Оушена', 'Двенадцать месяцев', 'Двенадцать стульев', 'Девушка с татуировкой дракона', 'Девять', 'Дедпул', 'Декстер', 'День выборов', 'День радио', 'День сурка', 'Дети кукурузы', 'Дети шпионов', 'Джек Ричер', 'Джокер', 'Джон УИК', 'Джуманджи', 'Дивергент', 'Дикий ангел', 'Диктатор', 'Дневники вампира', 'Довод', 'Догма', 'Доктор Дулитл', 'Доктор сон', 'Доктор Стрэндж', 'Доктор Хаус', 'Дом восковых фигур', 'Дом дракона', 'Дом у дороги', 'Доспехи бога', 'Достать ножи', 'Драконий жемчуг', 'Дракула', 'Друзья', 'Душа', 'Дьявол носит прада', 'Дюймовочка', 'Дюна' ,
'Евротур', 'Ёжик в тумане', 'Ёлки', 'Ералаш',
'Жажда скорости', 'Железный человек', 'Женщина кошка', 'Жестокие игры', 'Жил был пёс', 'Живая сталь', 'Жизнь Пи', 'Жмурки', 'Жуки'
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
