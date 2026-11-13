import {
  state, content, timerDisplay, startBtn, closeBtn,
  rand, signalStart, signalEnd,
  showModalButtons, closeOverlay
} from '../app.js';

export const META = {
  label: 'Показывать',
  time: 60,
  points: 2,
  words: [
'Автомобиль',
'Автограф',
'Аист',
'Аквариум',
'Аллергия',
'Аукцион',
'Бежать стометровку',
'Бензобак',
'Бессмертие',
'Бессонница',
'Беспозвоночное',
'Богатырь',
'Бульон',
'Вакуум',
'Варенье',
'Вата',
'Ветеринар',
'Ветер с моря дул',
'В лесу родилась елочка',
'Водопад',
'Вождь',
'Вою на луну',
'Волк в овечьей шкуре',
'Задом на перед',
'Идёт бычок касается',
'Казнь',
'Канцтовары',
'Китайская стена',
'Колесо фортуны',
'Кольчуга',
'Космонавт',
'Кот в мешке',
'Креветка',
'Лабубу',
'Ленивый кот',
'Матрица',
'Медведь на ухо наступил',
'Мертвый анархист',
'Минута славы',
'Мыльный пузырь',
'Надавить на совесть',
'Назад в будущее',
'Нас не догонят',
'Неваляшка',
'Новогодний подарок',
'Один в поле не воин',
'Один дома',
'Панцирь',
'Павлин',
'Паспорт',
'Последний герой',
'Профиль',
'Радар',
'Скатертью дорога',
'Тысяча и одна ночь',
'Фейерверк',
'Фобия',
'Человек невидимка',
'Чешуя',
'We will rock you'
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
