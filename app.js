const form = document.getElementById('calorie-form');
const itemInput = document.getElementById('item');
const quantityInput = document.getElementById('quantity');
const unitSelect = document.getElementById('unit');
const calorieInput = document.getElementById('calorie');
const proteinInput = document.getElementById('protein');
const fatInput = document.getElementById('fat');
const carbsInput = document.getElementById('carbs');
const recordList = document.getElementById('record-list');
const totalSpan = document.getElementById('total');
const dateSelect = document.getElementById('date-select');
const clearAllBtn = document.getElementById('clear-all');

const goal = { cal: 2000, pro: 150, fat: 60, carb: 250 };

const goalCal = document.getElementById('goal-cal');
const goalPro = document.getElementById('goal-pro');
const goalFat = document.getElementById('goal-fat');
const goalCarb = document.getElementById('goal-carb');

let records = {};
const today = new Date().toISOString().split('T')[0];
let chart = null;

const foodData = {
  "卵": { cal: 151, pro: 12.3, fat: 10.3, carb: 0.3, unit: { "個": 50 } },
  "ご飯": { cal: 168, pro: 2.5, fat: 0.3, carb: 37.1, unit: { "杯": 150 } },
  "バナナ": { cal: 86, pro: 1.1, fat: 0.2, carb: 22.5, unit: { "本": 100 } },
  "納豆": { cal: 200, pro: 16.5, fat: 10.0, carb: 12.1, unit: { "パック": 50 } },
  "むね肉（鳥）": { cal: 108, pro: 23.3, fat: 1.5, carb: 0.1, unit: { "g": 100 } },
  "ささみ": { cal: 105, pro: 23.0, fat: 0.8, carb: 0.0, unit: { "g": 100 } },
  "牛肉": { cal: 298, pro: 17.1, fat: 24.7, carb: 0.5, unit: { "g": 100 } },
  "豚肉": { cal: 263, pro: 17.1, fat: 20.1, carb: 0.2, unit: { "g": 100 } },
  "うどん": { cal: 105, pro: 2.6, fat: 0.4, carb: 21.6, unit: { "玉": 200 } },
  "そば": { cal: 130, pro: 4.8, fat: 0.9, carb: 26.0, unit: { "玉": 180 } },
  "牛乳": { cal: 67, pro: 3.3, fat: 3.8, carb: 4.8, unit: { "ml": 100 } },
  "プロテイン": { cal: 120, pro: 23.0, fat: 2.0, carb: 3.0, unit: { "杯": 30 } },
  "鶏もも肉": { cal: 98, pro: 8.0, fat: 7.0, carb: 0.0, unit: { "g": 50 } }
};

window.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('records');
  if (saved) {
    records = JSON.parse(saved);
  }
  populateDateOptions();
  showRecords(today);
  drawChart();
  populateFoodTable();
  populateSuggestions();
});

form.addEventListener('submit', e => {
  e.preventDefault();
  const item = itemInput.value.trim();
  const quantity = parseFloat(quantityInput.value);
  const unit = unitSelect.value;

  if (!item || isNaN(quantity)) return;

  let cal = parseFloat(calorieInput.value);
  let pro = parseFloat(proteinInput.value);
  let fat = parseFloat(fatInput.value);
  let carb = parseFloat(carbsInput.value);

  if (foodData[item]) {
    const refUnit = Object.keys(foodData[item].unit)[0];
    const refGram = foodData[item].unit[refUnit];
    const multiplier = (unit === refUnit) ? (quantity / 1) : (quantity * (unit === "g" ? 1 : 1));
    cal = foodData[item].cal * multiplier;
    pro = foodData[item].pro * multiplier;
    fat = foodData[item].fat * multiplier;
    carb = foodData[item].carb * multiplier;
  }

  if (!records[today]) records[today] = [];
  records[today].push({ item, cal, pro, fat, carb });
  saveData();

  if (dateSelect.value === today) {
    addRecord(item, cal, pro, fat, carb);
    updateTotals();
  }

  form.reset();
});

dateSelect.addEventListener('change', () => {
  showRecords(dateSelect.value);
});

clearAllBtn.addEventListener('click', () => {
  if (confirm("すべての記録を削除しますか？")) {
    localStorage.removeItem('records');
    records = {};
    recordList.innerHTML = "";
    updateTotals();
    populateDateOptions();
    drawChart();
  }
});

function populateDateOptions() {
  dateSelect.innerHTML = "";
  const dates = Object.keys(records).sort().reverse();
  dates.forEach(date => {
    const option = document.createElement('option');
    option.value = date;
    option.textContent = date;
    dateSelect.appendChild(option);
  });
  dateSelect.value = today;
}

function showRecords(date) {
  recordList.innerHTML = "";
  if (!records[date]) return;
  records[date].forEach(({ item, cal, pro, fat, carb }) => {
    addRecord(item, cal, pro, fat, carb, date);
  });
  updateTotals();
}

function addRecord(item, cal, pro, fat, carb, date = today) {
  const li = document.createElement('li');
  li.textContent = `${item}：${Math.round(cal)} kcal / P${pro} F${fat} C${carb}`;

  const btn = document.createElement('button');
  btn.textContent = ' ×';
  btn.style.marginLeft = '10px';
  btn.onclick = () => {
    records[date] = records[date].filter(r => !(r.item === item && r.cal === cal));
    saveData();
    showRecords(dateSelect.value);
    drawChart();
  };

  li.appendChild(btn);
  recordList.appendChild(li);
}

function updateTotals() {
  const date = dateSelect.value;
  if (!records[date]) return;

  let totalCal = 0, totalPro = 0, totalFat = 0, totalCarb = 0;

  records[date].forEach(({ cal, pro, fat, carb }) => {
    totalCal += cal;
    totalPro += pro;
    totalFat += fat;
    totalCarb += carb;
  });

  totalSpan.textContent = Math.round(totalCal);
  goalCal.textContent = `カロリー: ${Math.round(totalCal)} / ${goal.cal} kcal`;
  goalPro.textContent = `たんぱく質: ${Math.round(totalPro)} / ${goal.pro} g`;
  goalFat.textContent = `脂質: ${Math.round(totalFat)} / ${goal.fat} g`;
  goalCarb.textContent = `炭水化物: ${Math.round(totalCarb)} / ${goal.carb} g`;
}

function drawChart() {
  const labels = Object.keys(records).sort();
  const data = labels.map(date =>
    records[date].reduce((sum, r) => sum + r.cal, 0)
  );

  const ctx = document.getElementById('calorieChart').getContext('2d');
  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: '合計カロリー（kcal）',
        data
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

function saveData() {
  localStorage.setItem('records', JSON.stringify(records));
  populateDateOptions();
  drawChart();
}

function populateFoodTable() {
  const table = document.getElementById('food-table');
  if (!table) return;

  table.innerHTML = "";
  for (const name in foodData) {
    const { cal, pro, fat, carb, unit } = foodData[name];
    const u = Object.keys(unit)[0];
    table.insertAdjacentHTML('beforeend',
      `<tr><td>${name}</td><td>${cal}</td><td>${pro}</td><td>${fat}</td><td>${carb}</td><td>${u}(${unit[u]}g)</td></tr>`
    );
  }
}

function populateSuggestions() {
  const dataList = document.getElementById('food-suggestions');
  if (!dataList) return;

  dataList.innerHTML = "";
  Object.keys(foodData).forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    dataList.appendChild(option);
  });
 
}

window.addEventListener('DOMContentLoaded', () => {
  // モーダルを閉じる処理
  document.getElementById('close-modal').addEventListener('click', () => {
    document.getElementById('food-modal').style.display = 'none';
  });

  document.getElementById('food-modal').addEventListener('click', (e) => {
    if (e.target.id === 'food-modal') {
      document.getElementById('food-modal').style.display = 'none';
    }
  });
});
