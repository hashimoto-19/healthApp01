const calendarEl = document.getElementById('calendar');
const modal = document.getElementById('modal');
const cancelModalButton = document.getElementById('cancelModal');
const recordForm = document.getElementById('recordForm');
const weightInput = document.getElementById('weight');
const ctx = document.getElementById("myLineChart");
const weightChart = document.getElementById("weightChart");

// 全角数字を半角数字に変換する関数
function convertToHalfWidth(input) {
  return input.replace(/[０-９]/g, function (s) {
    return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
  });
}

// 全角数字を半角に変換
weightInput.addEventListener('input', function () {
  this.value = convertToHalfWidth(this.value);

  // 3桁を超えた場合は切り捨て
  if (this.value.length > 3) {
    this.value = this.value.slice(0, 3);
  }

  // 数値以外を無効
  this.value = this.value.replace(/[^0-9]/g, '');
});

let selectedDate = null;

// ローカルストレージからデータを読み込む
const healthRecords = JSON.parse(localStorage.getItem("healthRecords")) || [];

// カレンダーの初期化
const calendar = new FullCalendar.Calendar(calendarEl, {
  initialView: 'dayGridMonth', // 月表示
  locale: 'ja', // 日本語対応
  dateClick: function (info) { // 日付マスのクリックイベント
    selectedDate = info.dateStr; // 選択された日付を保存

    // 選択した日付のデータを探す
    const existingRecord = healthRecords.find(record => record.date === selectedDate);

    if (existingRecord) {
      weightInput.value = existingRecord.weight; // 既存データをフォームに入力
    } else {
      recordForm.reset(); // データがない場合はフォームをリセット
    }

    modal.classList.add('active'); // モーダルを表示
  },
  ///登録済みのものを触る場合
  eventClick: function (info) {
    const date = new Date(info.event.start);
    const selectedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')
      }-${String(date.getDate()).padStart(2, '0')}`; // YYYY-MM-DD 形式に変換
    console.log(date);
    console.log(selectedDate);
    // 該当するデータ見つける
    const existingRecord = healthRecords.find(record => record.date === selectedDate);
    console.log(existingRecord);
    if (existingRecord) {
      weightInput.value = existingRecord.weight;
    }
    modal.classList.add('active');
  }
});

// ローカルストレージに保存されている体重データをカレンダーに追加
healthRecords.forEach(record => {
  calendar.addEvent({
    title: `体重: ${record.weight}kg`,
    start: record.date,
    allDay: true, // 終日イベント
    backgroundColor: 'green', // イベント背景色
  });
});

calendar.render();

// 過去1週間の日付を取得
function getPastWeekDates() {
  const today = new Date();
  const dates = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }

  return dates;
}

// 過去1週間の体重データを取得
function getWeeklyWeights() {
  const pastWeekDates = getPastWeekDates();
  const weeklyWeights = pastWeekDates.map(date => {
    const record = healthRecords.find(record => record.date === date);
    return record ? parseFloat(record.weight) : null;
  });
  return {
    labels: pastWeekDates,
    weights: weeklyWeights,
  };
}


// グラフの初期化
let myLineChart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: [], // 日付ラベル
    datasets: [
      {
        label: '体重 (kg)',
        data: [], // 体重データ
        borderColor: "rgba(255,0,0,1)",
        backgroundColor: "rgba(255,0,0,0.2)",
        fill: true,
      }
    ],
  },
  options: {
    title: {
      display: true,
      text: '今週の体重'
    },
    scales: {
      y: {
        // beginAtZero: false,
        min: 30,      // Y軸の最小値を0に設定
        max: 80,

        // suggestedMax: 200,
        // suggestedMin: 30,
        ticks: {
          stepSize: 10,
          callback: function (value) {
            return value + ' kg';
          }
        }
      }
    },
  }
});

// グラフを更新
function updateChart() {
  const { labels, weights } = getWeeklyWeights();
  myLineChart.data.labels = labels;
  myLineChart.data.datasets[0].data = weights;
  myLineChart.update();
}

// フォーム送信処理
recordForm.addEventListener('submit', function (e) {
  e.preventDefault();
  const weight = weightInput.value;

  // 既存データがあるか確認
  const existingRecordIndex = healthRecords.findIndex(record => record.date === selectedDate);

  if (existingRecordIndex !== -1) {
    // 既存データを更新
    healthRecords[existingRecordIndex].weight = weight;
  } else {
    // 新しいデータを追加
    healthRecords.push({
      id: `${Date.now()} - ${Math.random().toString(36).substr(2, 9)}`,
      weight: weight,
      date: selectedDate,
    });
  }

  // ローカルストレージにデータを保存
  localStorage.setItem("healthRecords", JSON.stringify(healthRecords));

  // カレンダーにイベントを更新または追加
  calendar.removeAllEvents(); // 既存のイベントを削除
  healthRecords.forEach(record => {
    calendar.addEvent({
      title: `体重: ${record.weight}kg`,
      start: record.date,
      allDay: true,
      backgroundColor: 'green',
    });
  });

  alert(`体重 ${weight}kg を記録しました: ${selectedDate}`);

  // グラフを更新
  updateChart();

  // モーダルを閉じる
  modal.classList.remove('active');
  recordForm.reset(); // フォームをリセット
});

// フォームのキャンセルボタン
cancelModalButton.addEventListener('click', function () {
  modal.classList.remove('active');
  recordForm.reset();
});

document.getElementById('btnChart').addEventListener('click', function () {
  const weightChart = document.getElementById('weightChart');
  weightChart.classList.toggle('active');
});


// ページロード時にグラフを初期化
updateChart();


