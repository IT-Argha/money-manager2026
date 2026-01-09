// ========== FIREBASE ==========
const firebaseConfig = {
  apiKey: "AIzaSyDPmg4PcpK5kceWFodPU-7gzzQJ0AWaf5A",
  authDomain: "money-manager2026.firebaseapp.com",
  projectId: "money-manager2026",
  storageBucket: "money-manager2026.firebasestorage.app",
  messagingSenderId: "375955583976",
  appId: "1:375955583976:web:fa53cacc6d9f89057f6a5d"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ========== AUTH ==========
const user = sessionStorage.getItem("user");
if (!user) location.href = "login.html";

// ========== GLOBAL ==========
let weekChartInstance = null;
let payChartInstance = null;

// ========== DOM ==========
const monthPicker = document.getElementById("monthPicker");
const mIncome = document.getElementById("mIncome");
const mExpense = document.getElementById("mExpense");
const mBalance = document.getElementById("mBalance");
const mOnline = document.getElementById("mOnline");
const mOffline = document.getElementById("mOffline");
const mAvg = document.getElementById("mAvg");
const mBorrow = document.getElementById("mBorrow");
const mLend = document.getElementById("mLend");
const maxDay = document.getElementById("maxDay");
const topCategory = document.getElementById("topCategory");
const spendLevel = document.getElementById("spendLevel");
const pAmt = document.getElementById("pAmt");
const oAmt = document.getElementById("oAmt");
const expenseBar = document.getElementById("expenseBar");
const expenseRatio = document.getElementById("expenseRatio");
const monthlyTable = document.getElementById("monthlyTable");
const weekChart = document.getElementById("weekChart");
const payChart = document.getElementById("payChart");

// ========== BAR VALUE PLUGIN ==========
Chart.register({
  id: "barValueTop",
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    ctx.save();
    chart.data.datasets.forEach(ds => {
      chart.getDatasetMeta(0).data.forEach((bar, i) => {
        const v = ds.data[i];
        if (!v) return;
        ctx.font = "bold 12px Arial";
        ctx.fillStyle = "#111";
        ctx.textAlign = "center";
        ctx.fillText(`₹${v.toLocaleString("en-IN")}`, bar.x, bar.y - 6);
      });
    });
    ctx.restore();
  }
});

// ========== INIT ==========
function init() {
  const d = new Date();
  monthPicker.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  loadMonth();
}

// ========== LOAD MONTH ==========
async function loadMonth() {
  const selectedMonth = monthPicker.value;
  if (!selectedMonth) return;

  monthlyTable.innerHTML = `<tr><td colspan="5">Loading...</td></tr>`;

  let income = 0, expense = 0, daily = 0;
  let borrow = 0, lend = 0;

  // 🔹 YES ONLY (for cards)
  let onYes = 0, offYes = 0;

  // 🔹 ALL (for chart)
  let onAll = 0, offAll = 0;

  let p = 0, o = 0;

  const weeks = [0, 0, 0, 0, 0];
  const cat = {};
  const day = {};
  let rowsArr = [];

  const snap = await db.collection("transactions")
    .where("user", "==", user)
    .get();

  snap.forEach(doc => {
    const x = doc.data();
    if (!x.date || !x.date.startsWith(selectedMonth)) return;

    const amt = Number(x.amount) || 0;
    const dayNo = parseInt(x.date.split("-")[2]) || 1;
    const w = Math.min(Math.floor((dayNo - 1) / 7), 4);

    if (x.transaction === "Income") income += amt;

    if (x.transaction === "Expense") {
      expense += amt;

      // ALL → chart
      if (x.payment === "Online") onAll += amt;
      if (x.payment === "Cash") offAll += amt;

      // YES ONLY → cards + weekly
      if (x.countForDaily === true) {
        daily += amt;
        weeks[w] += amt;

        if (x.payment === "Online") onYes += amt;
        if (x.payment === "Cash") offYes += amt;

        cat[x.category] = (cat[x.category] || 0) + amt;
        day[x.date] = (day[x.date] || 0) + amt;

        if (x.type === "Personal") p += amt;
        if (x.type === "Official") o += amt;
      }
    }

    if (x.transaction === "Borrow") borrow += amt;
    if (x.transaction === "Lend") lend += amt;

rowsArr.push({
  date: x.date,
  html: `
    <tr>
      <td>${x.date}</td>
      <td>${x.transaction}</td>
      <td>${x.payment}</td>
      <td>${x.category}</td>
      <td><b>₹${amt.toLocaleString("en-IN")}</b></td>
    </tr>`
});


  });

  rowsArr.sort((a, b) => new Date(b.date) - new Date(a.date));

monthlyTable.innerHTML = rowsArr.length
  ? rowsArr.map(r => r.html).join("")
  : `<tr><td colspan="5">No Data</td></tr>`;

  updateDashboard(income, expense, borrow, lend, onYes, offYes, daily, p, o);
  calculateInsights(cat, day, income, expense, daily);
  drawCharts(weeks, onAll, offAll);
}

// ========== DASHBOARD ==========
function updateDashboard(i, e, b, l, onYes, offYes, d, p, o) {
  const f = n => `₹${n.toLocaleString("en-IN")}`;
  mIncome.textContent = f(i);
  mExpense.textContent = f(e);
  mBalance.textContent = f(i + l - e - b);

  // ✅ YES ONLY
  mOnline.textContent = f(onYes);
  mOffline.textContent = f(offYes);
  mAvg.textContent = f(Math.round(d / 30));

  mBorrow.textContent = b;
  mLend.textContent = l;
  pAmt.textContent = p;
  oAmt.textContent = o;
}

// ========== INSIGHTS ==========
function calculateInsights(cat, day, income, expense, daily) {
  let top = "-", max = 0;
  for (let c in cat) if (cat[c] > max) {
    max = cat[c];
    top = `${c} (₹${max.toLocaleString("en-IN")})`;
  }
  topCategory.textContent = top;

  let md = "-", mv = 0;
  for (let d in day) if (day[d] > mv) {
    mv = day[d];
    const dt = new Date(d);
    md = `${dt.getDate()}/${dt.getMonth() + 1} (₹${mv.toLocaleString("en-IN")})`;
  }
  maxDay.textContent = md;

  const avg = daily / 30;
  spendLevel.textContent =
    avg > 1000 ? "Very High 🔴" :
    avg > 500 ? "High 🟠" :
    avg > 300 ? "Moderate 🟡" : "Low 🟢";

  const ratio = income > 0 ? (expense / income) * 100 : 100;
  expenseBar.style.width = `${Math.min(ratio, 100)}%`;
  expenseRatio.textContent = `${ratio.toFixed(1)}%`;
}

// ========== CHARTS ==========
function drawCharts(weeks, on, off) {
  if (weekChartInstance) weekChartInstance.destroy();
  if (payChartInstance) payChartInstance.destroy();

  // WEEKLY BAR (VALUE ON TOP)
  weekChartInstance = new Chart(weekChart, {
    type: "bar",
    data: {
      labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5+"],
      datasets: [{
        data: weeks,
        backgroundColor: "#3b82f6",
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { callback: v => `₹${v.toLocaleString("en-IN")}` }
        }
      }
    },
    plugins: ["barValueTop"]
  });

  // ONLINE vs CASH
  const total = on + off;

  payChartInstance = new Chart(payChart, {
    type: "doughnut",
    data: {
      labels: [
        `Online:₹${on.toLocaleString("en-IN")}`,
        `Cash:₹${off.toLocaleString("en-IN")}`
      ],
      datasets: [{
        data: [on, off],
        backgroundColor: ["#10b981", "#f59e0b"]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "65%",
      plugins: {
        legend: {
          position: "bottom",
          labels: { font: { size: 13, weight: "bold" } }
        },
        tooltip: {
          callbacks: {
            label: ctx => {
              const val = ctx.raw;
              const p = total ? ((val / total) * 100).toFixed(1) : 0;
              return `₹${val.toLocaleString("en-IN")} (${p}%)`;
            }
          }
        }
      }
    }
  });
}

// ========== EVENTS ==========
monthPicker.addEventListener("change", loadMonth);
document.addEventListener("DOMContentLoaded", init);
