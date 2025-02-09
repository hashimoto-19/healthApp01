const calendarEl = document.getElementById('calendar');
const modal = document.getElementById('modal');
const cancelModalButton = document.getElementById('cancelModal');
const recordForm = document.getElementById('recordForm');
const weightInput = document.getElementById('weight');
const ctx = document.getElementById("myLineChart").getContext("2d");
const weightChart = document.getElementById("weightChart");
const closeChart = document.getElementById("closeChart");
const btnChart = document.getElementById("btnChart");


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

// モーダルが開かれたときに体重と体調をフォームに反映させる
const updateFormWithRecord = (record) => {
  weightInput.value = record.weight; // 体重をフォームに入力

  // 体調のラジオボタンを選択する処理
  const conditionRadio = document.querySelectorAll('input[name="condition"]');
  const todaysDate = document.getElementById('todaysDate');
  if (todaysDate) {
    todaysDate.textContent = selectedDate; // 該当する日付をセット
  }
  console.log(todaysDate);

  conditionRadio.forEach((radio) => {
    if (radio.value === record.condition) {
      radio.checked = true; // 該当する体調のラジオボタンをチェック
    } else {
      radio.checked = false; // 他のラジオボタンはチェックを外す
    }
  });
};

// ローカルストレージからデータを読み込む
const healthRecords = JSON.parse(localStorage.getItem("healthRecords")) || [];

// カレンダーの初期化
const calendar = new FullCalendar.Calendar(calendarEl, {
  initialView: 'dayGridMonth', // 月表示
  locale: 'ja', // 日本語対応
  buttonText: {
    today: '今月'  // 「Today」ボタンのラベルを変更
  },
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'customButton' // ボタンを右側に追加
  },
  titleFormat: { year: 'numeric', month: 'long' },
  customButtons: {
    customButton: {
      text: 'グラフ', // ボタンのテキスト
      click: function () {

        const weightChart = document.getElementById('weightChart');
        weightChart.classList.toggle('active');

      }
    }
  },
  eventDidMount: function () {
    //カレンダーが表示されてから処理が実行される
    // setTimeout(() => {
    const btn = document.querySelector('.fc-customButton-button');
    if (btn) {
      // ボタンクリックでグラフを表示
      btn.addEventListener("click", function () {
        weightChart.classList.add('active');
        updateChart(7); // 初期表示は1週間
      });
    }
    //最低３ミリ秒かかる
    // }, 3);
  },
  dateClick: function (info) { // 日付マスのクリックイベント
    selectedDate = info.dateStr; // 選択された日付を保存

    // 選択した日付のデータを探す
    const existingRecord = healthRecords.find(record => record.date === selectedDate);

    if (existingRecord) {
      updateFormWithRecord(existingRecord); // 体重と体調をフォームに反映
    } else {
      recordForm.reset(); // データがない場合はフォームをリセット
    }

    const todaysDate = document.getElementById('todaysDate');
    if (todaysDate) {
      todaysDate.textContent = selectedDate;
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
      updateFormWithRecord(existingRecord); // 体重と体調をフォームに反映
    }
    //

    modal.classList.add('active');
  }
});
// ローカルストレージに保存されている体重データをカレンダーに追加
healthRecords.forEach(record => {
  calendar.addEvent({
    title: `${record.weight}kg`,
    start: record.date,
    allDay: true, // 終日イベント
    backgroundColor: 'green', // イベント背景色
  });

  calendar.addEvent({
    title: `${record.condition}`,
    start: record.date,
    allDay: true, // 終日イベント
    backgroundColor: 'blue', // イベント背景色
  });
});

// 祝日APIを取得してカレンダーに追加
fetch('https://holidays-jp.github.io/api/v1/date.json')
  .then(response => response.json())
  .then(data => {
    const holidayDates = Object.keys(data); // 祝日の日付を取得

    const holidayEvents = Object.entries(data).map(([date, title]) => ({
      title: title,
      start: date,
      allDay: true,
      // display: 'background',
      backgroundColor: 'transparent', // 祝日の背景色
      textColor: '#333',
      borderColor: 'transparent',
      editable: false,
      className: 'holiday-event'
    }));
    console.log(holidayEvents);

    holidayEvents.forEach(event => calendar.addEvent(event)); // 祝日データをカレンダーに追加

    // 祝日の日付マスの背景色を変更
    calendar.setOption('dayCellDidMount', function (info) {
      // `YYYY-MM-DD` 形式に変換（ローカル時間対応）
      const dateStr = info.date.toLocaleDateString('sv-SE'); // スウェーデン表記: "YYYY-MM-DD"

      if (holidayDates.includes(dateStr)) {
        info.el.style.backgroundColor = 'rgba(0, 255, 119, 0.2)'; // 緑の薄い背景色
      }
    });



  })




calendar.render();

// 過去1週間の日付を取得
function getPastWeekDates() {
  const today = new Date();
  const dates = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
    console.log(dates);
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
        // borderColor: "rgba(255,0,0,1)",
        backgroundColor: "rgba(255,0,0,0.2)",
        fill: true,
        yAxisID: "y" // 体調は右軸
      },
      {
        label: '体調(3段階)', // 棒グラフ用のデータセット
        data: [], // 体重データ
        // borderColor: "rgba(0,0,255,1)", // 線の色（棒グラフ用）
        backgroundColor: "rgba(0,0,255,0.2)", // 棒の背景色
        type: 'bar', // 棒グラフ
        barPercentage: 0.5, // 棒グラフの幅を調整
        yAxisID: "y1" // 体調は右軸
      }
    ],
  },
  options: {
    //   legend: {
    //     display: false
    // },
    responsive: true,
    title: {
      display: true,
      text: '今週の体重と体調'
    },
    scales: {
      y: {
        position: "left",
        // beginAtZero: false,
        min: 30,
        max: 80,
        ticks: {
          stepSize: 5,
          callback: function (value) {
            return value + ' kg';
          }
        }
      },
      y1: {
        position: "right",
        // beginAtZero: false,
        min: 1,
        max: 5,
        ticks: {
          stepSize: 1,
          callback: function (value) {
            if (value === 3) return "良い";
            if (value === 2) return "普通";
            if (value === 1) return "悪い";
            return "";
          }
        }
      }
    },
    // onClick: function(event, elements) {
    //   // クリック時の動作を無効化（何もしない）
    //   event.stopPropagation();
    // }
  }
});

// 過去○日分のデータ取得

function getPastDates(days) {
  const today = new Date();
  const dates = [];

  // 選択された日数分、過去の日付を計算
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }

  return dates;
}


function getWeightsForPeriod(days) {
  const dates = getPastDates(days);
  let lastWeight = null; // 直前の値を保持
  const weights = dates.map(date => {
    const record = healthRecords.find(record => record.date === date);
    if (record && record.weight) {
      lastWeight = parseFloat(record.weight); // 記録があれば更新
    }
    return lastWeight;
  });

  return {
    labels: dates,
    weights: weights,
  };
}
function getConditionsForPeriod(days) {
  const dates = getPastDates(days); // 日付リスト取得
  let lastCondition = 0;

  const conditions = dates.map(date => {
    const record = healthRecords.find(record => record.date === date);
    if (record && record.condition) {
      switch (record.condition) {
        case "良い": lastCondition = 3; break;
        case "普通": lastCondition = 2; break;
        case "悪い": lastCondition = 1; break;
      }
    } else {
      return lastCondition;
    }
  });
  return {
    labels: dates,
    conditions: conditions,
  };
}



// グラフを更新
function updateChart(days) {
  const { labels, weights } = getWeightsForPeriod(days);
  const { conditions } = getConditionsForPeriod(days);

  // console.log("確認", getWeeklyConditions);
  myLineChart.data.labels = labels;
  myLineChart.data.datasets[0].data = weights;
  myLineChart.data.datasets[1].data = conditions; // 体調データ
  myLineChart.update(); // グラフを更新
}

// フォーム送信処理
recordForm.addEventListener('submit', function (e) {
  e.preventDefault();
  const weight = weightInput.value;
  const condition = document.querySelector('input[name="condition"]:checked') ? document.querySelector('input[name="condition"]:checked').value : "未設定";

  // 既存データがあるか確認
  const existingRecordIndex = healthRecords.findIndex(record => record.date === selectedDate);

  if (existingRecordIndex !== -1) {
    // 既存データを更新
    healthRecords[existingRecordIndex].weight = weight;
    healthRecords[existingRecordIndex].condition = condition;
  } else {
    // 新しいデータを追加
    healthRecords.push({
      id: `${Date.now()} - ${Math.random().toString(36).substr(2, 9)}`,
      weight: weight,
      condition: condition,
      date: selectedDate,
    });
  }

  // 祝日APIを取得してカレンダーに追加
  fetch('https://holidays-jp.github.io/api/v1/date.json')
    .then(response => response.json())
    .then(data => {
      const holidayDates = Object.keys(data); // 祝日の日付を取得

      const holidayEvents = Object.entries(data).map(([date, title]) => ({
        title: title,
        start: date,
        allDay: true,
        // display: 'background',
        backgroundColor: 'transparent', // 祝日の背景色
        textColor: '#333',
        borderColor: 'transparent',
        editable: false,
        className: 'holiday-event'
      }));
      console.log(holidayEvents);

      holidayEvents.forEach(event => calendar.addEvent(event)); // 祝日データをカレンダーに追加

      // 祝日の日付マスの背景色を変更
      calendar.setOption('dayCellDidMount', function (info) {
        // `YYYY-MM-DD` 形式に変換（ローカル時間対応）
        const dateStr = info.date.toLocaleDateString('sv-SE'); // スウェーデン表記: "YYYY-MM-DD"

        if (holidayDates.includes(dateStr)) {
          info.el.style.backgroundColor = 'rgba(0, 255, 119, 0.2)'; // 緑の薄い背景色
        }
      });



    })


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
    calendar.addEvent({
      title: `体調: ${record.condition}`,
      start: record.date,
      allDay: true,
      backgroundColor: 'blue', // 色を変えた方がわかりやすいかも
    });
  });


  alert(`体重 ${weight}kg と体調 (${condition}) を記録しました: ${selectedDate}`);

  // グラフを更新
  updateChart(7);

  // モーダルを閉じる
  modal.classList.remove('active');
  recordForm.reset(); // フォームをリセット
});

// フォームのキャンセルボタン
cancelModalButton.addEventListener('click', function () {
  modal.classList.remove('active');
  recordForm.reset();
});

// document.getElementById('btnChart').addEventListener('click', function () {
//   weightChart.classList.add('active');
// });

closeChart.addEventListener("click", function () {
  weightChart.classList.remove('active');
});



//期間切り替え
document.querySelectorAll(".chartChange").forEach(button => {
  button.addEventListener("click", function () {
    // ３０日、９０日、１８０日でグラフの切り替え
    const days = Number(this.dataset.period);
    updateChart(days);
  });
});