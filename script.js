// mapping between data-type and storage keys
const MAP = {
  'anc': 'count_anc',
  'void': 'count_void',
  'primal': 'count_primal',
  'sac': 'count_sac'
};

const icons = document.querySelectorAll('.icon');
const countInput = document.getElementById('countInput');
const btnAdd = document.getElementById('btnAdd');
const btnAdd10 = document.getElementById('btnAdd10');
const btnReset = document.getElementById('btnReset');
const displayCount = document.getElementById('displayCount');
const chanceBox = document.getElementById('chanceBox');
const progressBar = document.getElementById('progressBar');
const remainingText = document.getElementById('remainingText');
const openedRow = document.getElementById('openedRow');

let active = 'anc';

// Ensure keys exist
Object.values(MAP).forEach(k => {
  if (localStorage.getItem(k) === null) localStorage.setItem(k, '0');
});

// Load active from storage if present
if (localStorage.getItem('active_shard')) active = localStorage.getItem('active_shard');

// Helper: set active icon UI
function setActiveIcon(type) {
  icons.forEach(ic => ic.classList.toggle('active', ic.getAttribute('data-type') === type));
  localStorage.setItem('active_shard', type);
  active = type;
}

// Add click handlers for top icons
icons.forEach(ic => {
  ic.addEventListener('click', () => {
    ic.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(1.08)' }, { transform: 'scale(1)' }],
      { duration: 320, easing: 'ease-out' }
    );
    setActive(ic.getAttribute('data-type'));
  });
});

// Chance computations based on rules
function computeChance(type, count) {
  if (type === 'anc') { // Ancient (синій)
    const base = 0.5;
    if (count <= 200) return { chance: base, base, step: 5, threshold: 200 };
    return { chance: Math.min(100, base + (count - 200) * 5), base, step: 5, threshold: 200 };
  }
  if (type === 'void') { // Void (темний)
    const base = 0.5;
    if (count <= 200) return { chance: base, base, step: 5, threshold: 200 };
    return { chance: Math.min(100, base + (count - 200) * 5), base, step: 5, threshold: 200 };
  }
  if (type === 'sac') { // Sacred (золотий)
    const base = 6.0;
    if (count <= 12) return { chance: base, base, step: 2, threshold: 12 };
    return { chance: Math.min(100, base + (count - 12) * 2), base, step: 2, threshold: 12 };
  }
  if (type === 'primal') { // Primal (червоний)
    const legBase = 1.0;
    const mythBase = 0.5;
    const legChance = (count <= 75) ? legBase : Math.min(100, legBase + (count - 75) * 1.0);
    const mythChance = (count <= 200) ? mythBase : Math.min(100, mythBase + (count - 200) * 10.0);
    return {
      legendary: legChance,
      mythic: mythChance,
      legBase, mythBase, legStep: 1, mythStep: 10,
      legThreshold: 75, mythThreshold: 200
    };
  }
  return { chance: 0, base: 0, step: 0, threshold: 0 };
}

function formatPct(v) {
  return (Math.round(v * 100) / 100).toFixed(2) + ' %';
}

function computeChanceSingle(base, threshold, step, count) {
  if (count <= threshold) return base;
  return Math.min(100, base + (count - threshold) * step);
}

function remainingForSingle(base, threshold, step, count) {
  const cur = computeChanceSingle(base, threshold, step, count);
  if (cur >= 100) return 0;
  if (count < threshold) {
    const toThreshold = threshold - count;
    const needAfter = Math.ceil((100 - base) / step);
    return toThreshold + needAfter;
  } else {
    return Math.ceil((100 - cur) / step);
  }
}

// Функція для обчислення прогресу для статус-бару
function computeProgress(type, count) {
  if (type === 'anc' || type === 'void') {
    // Для синіх і темних: 0-221 = 0-100%
    // 0 = 0%, 55 = 25%, 110 = 50%, 165 = 75%, 221 = 100%
    const maxCount = 221;
    const progress = Math.min(100, (count / maxCount) * 100);
    return progress;
  }
  if (type === 'sac') {
    // Для золотих: 0-62 = 0-100%
    const maxCount = 62;
    const progress = Math.min(100, (count / maxCount) * 100);
    return progress;
  }
  if (type === 'primal') {
    // Для червоних: беремо максимальний прогрес з легендарного та міфічного
    // Легендарний: 0-100 = 0-100%
    // Міфічний: 0-210 = 0-100%
    const legProgress = Math.min(100, (count / 100) * 100);
    const mythProgress = Math.min(100, (count / 210) * 100);
    return Math.max(legProgress, mythProgress);
  }
  return 0;
}

// Render "Відкрито" small icons + counts
function renderOpenedRow() {
  const order = ['anc', 'void', 'primal', 'sac'];
  openedRow.innerHTML = '';
  order.forEach(key => {
    const val = parseInt(localStorage.getItem(MAP[key]) || '0', 10);
    const div = document.createElement('div');
    div.className = 'opened-item';
    const img = document.createElement('img');
    const fileMap = {
      'anc': 'Ancient_Shard-icon.webp',
      'void': 'Void_Shard-icon.webp',
      'primal': 'Primal_Shard-icon.webp',
      'sac': 'Sacred_Shard-icon.webp'
    };
    img.src = fileMap[key];
    img.alt = key;
    img.width = 32;
    img.height = 32;
    const span = document.createElement('div');
    span.className = 'opened-count';
    span.textContent = val;
    div.appendChild(img);
    div.appendChild(span);
    openedRow.appendChild(div);
  });
}

// Main render
function render() {
  const count = parseInt(localStorage.getItem(MAP[active]) || '0', 10);
  displayCount.textContent = 'Кількість: ' + count;
  countInput.value = count;

  // Обчислюємо прогрес для статус-бару
  const progress = computeProgress(active, count);
  progressBar.style.width = progress + '%';

  if (active === 'primal') {
    const info = computeChance(active, count);
    chanceBox.innerHTML = `<div style="font-weight:800;font-size:18px">Легендарний: ${formatPct(info.legendary)}</div>
                           <div style="font-weight:800;font-size:18px;margin-top:6px">Міфічний: ${formatPct(info.mythic)}</div>`;
    
    const remLeg = remainingForSingle(info.legBase, info.legThreshold, info.legStep, count);
    const remMy = remainingForSingle(info.mythBase, info.mythThreshold, info.mythStep, count);
    
    // Додаємо інформацію про загальний прогрес
    let maxCount = 210; // Для primal беремо міфічний максимум
    const remainingTotal = Math.max(0, maxCount - count);
    
    remainingText.innerHTML = `Загальний прогрес: <strong>${progress.toFixed(1)}%</strong><br>
                               До 100% легендарний: <strong>${remLeg}</strong> відкриттів<br>
                               До 100% міфічний: <strong>${remMy}</strong> відкриттів`;
  } else {
    const info = computeChance(active, count);
    chanceBox.innerHTML = `<div style="font-weight:800;font-size:18px">${formatPct(info.chance)}</div>
                           <div class="muted" style="margin-top:6px">(базовий ${info.base}% — після ${info.threshold} зростає на ${info.step}% за кожне відкриття)</div>`;
    
    const rem = remainingForSingle(info.base, info.threshold, info.step, count);
    
    // Додаємо інформацію про загальний прогрес
    let maxCount = 0;
    if (active === 'anc' || active === 'void') maxCount = 221;
    if (active === 'sac') maxCount = 62;
    
    const remainingTotal = Math.max(0, maxCount - count);
    
    remainingText.innerHTML = `Загальний прогрес: <strong>${progress.toFixed(1)}%</strong><br>
                               До гарантованого: <strong>${rem}</strong> відкриттів<br>
                               До максимуму (${maxCount}): <strong>${remainingTotal}</strong> відкриттів`;
  }

  renderOpenedRow();
}

// Функція для додавання значення
function addToCounter(value) {
  const current = parseInt(localStorage.getItem(MAP[active]) || '0', 10);
  const newCount = current + value;
  
  localStorage.setItem(MAP[active], String(newCount));

  // Візуальний ефект
  const ic = document.querySelector('.icon.active');
  if (ic) {
    ic.animate(
      [
        { transform: 'scale(1)' },
        { transform: 'scale(1.10)' },
        { transform: 'scale(1)' }
      ],
      { duration: 340, easing: 'ease-out' }
    );
  }

  render();
}

// Обробники кнопок
btnAdd.addEventListener('click', () => {
  addToCounter(1);
});

btnAdd10.addEventListener('click', () => {
  addToCounter(10);
});

btnReset.addEventListener('click', () => {
  if (confirm('Скинути лічильник для поточного типу уламку?')) {
    localStorage.setItem(MAP[active], '0');
    render();
  }
});

// setActive wrapper to change progress color + UI
function setActive(type) {
  setActiveIcon(type);
  const bar = document.getElementById('progressBar');
  if (type === 'anc') bar.style.background = 'linear-gradient(90deg,var(--anc),#06b6d4)';
  if (type === 'void') bar.style.background = 'linear-gradient(90deg,var(--void),#a78bfa)';
  if (type === 'primal') bar.style.background = 'linear-gradient(90deg,var(--primal),#f97316)';
  if (type === 'sac') bar.style.background = 'linear-gradient(90deg,var(--sac),#facc15)';
  render();
}

// init on load
window.addEventListener('load', () => {
  const stored = localStorage.getItem('active_shard');
  if (stored && Object.keys(MAP).includes(stored)) setActive(stored);
  else setActive('anc');
  render();
});

// Додаємо обробку клавіші Enter в полі введення
countInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    const value = parseInt(countInput.value) || 0;
    if (value > 0) {
      addToCounter(value);
    }
  }
});

// Додаємо можливість швидкого перемикання при кліку на елементи "Відкрито"
document.addEventListener('click', (e) => {
  const openedItem = e.target.closest('.opened-item');
  if (openedItem) {
    const img = openedItem.querySelector('img');
    if (img) {
      const type = Object.keys(fileMap).find(key => fileMap[key] === img.src.split('/').pop());
      if (type) {
        setActive(type);
        
        // Анімація кліку
        openedItem.animate(
          [
            { transform: 'scale(1)' },
            { transform: 'scale(0.95)' },
            { transform: 'scale(1)' }
          ],
          { duration: 200, easing: 'ease-out' }
        );
      }
    }
  }
});

// Допоміжний об'єкт для пошуку типу за назвою файлу
const fileMap = {
  'anc': 'Ancient_Shard-icon.webp',
  'void': 'Void_Shard-icon.webp',
  'primal': 'Primal_Shard-icon.webp',
  'sac': 'Sacred_Shard-icon.webp'
};