// ========== FIREBASE ==========
const firebaseConfig = {
  apiKey: "AIzaSyDPmg4PcpK5kceWFodPU-7gzzQJ0AWaf5A",
  authDomain: "money-manager2026.firebaseapp.com",
  projectId: "money-manager2026",
  storageBucket: "money-manager2026.firebasestorage.app",
  messagingSenderId: "375955583976",
  appId: "1:375955583976:web:fa53cacc6d9f89057f6a5d"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// ========== AUTH CHECK ==========
const user = sessionStorage.getItem("user");
if (!user) {
  location.href = "login.html";
}

// ========== GLOBAL VARIABLES ==========
let weekChartInstance = null;
let payChartInstance = null;

// ========== DOM ELEMENTS ==========
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

// ========== INITIALIZATION ==========
function init() {
  // Set current month as default
  const now = new Date();
  const currentMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  monthPicker.value = currentMonth;
  
  // Load data
  loadMonth();
}

// ========== LOAD MONTHLY DATA ==========
async function loadMonth() {
  if (!user) return;
  
  const selectedMonth = monthPicker.value;
  if (!selectedMonth) return;
  
  // Show loading
  monthlyTable.innerHTML = '<tr><td colspan="5" class="loading">Loading monthly data...</td></tr>';
  
  try {
    const snapshot = await db.collection("transactions")
      .where("user", "==", user)
      .get();
    
    if (snapshot.empty) {
      monthlyTable.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #6b7280;">No transactions found</td></tr>';
      resetAllValues();
      return;
    }
    
    // Initialize counters
    let income = 0, expense = 0, daily = 0;
    let borrow = 0, lend = 0;
    let on = 0, off = 0;
    let p = 0, o = 0;
    
    const weeks = [0, 0, 0, 0, 0];
    const cat = {};
    const day = {};
    let rows = "";
    
    // Process transactions
    snapshot.forEach(doc => {
      const x = doc.data();
      
      // Filter by month
      if (!x.date || !x.date.startsWith(selectedMonth)) return;
      
      const amount = Number(x.amount) || 0;
      const dayNo = parseInt(x.date.split("-")[2]) || 1;
      const w = Math.min(Math.floor((dayNo - 1) / 7), 4);
      
      // Categorize transactions
      if (x.transaction === "Income") income += amount;
      if (x.transaction === "Expense") {
        expense += amount;
        if (x.countForDaily) {
          daily += amount;
          weeks[w] += amount;
          x.payment === "Online" ? on += amount : off += amount;
          cat[x.category] = (cat[x.category] || 0) + amount;
          day[x.date] = (day[x.date] || 0) + amount;
        }
      }
      if (x.transaction === "Borrow") borrow += amount;
      if (x.transaction === "Lend") lend += amount;
      if (x.type === "Personal") p += amount;
      if (x.type === "Official") o += amount;
      
      // Build table row
      const txnClass = `monthly-table-${x.transaction.toLowerCase()}`;
      rows += `
        <tr>
          <td>${x.date}</td>
          <td><span class="${txnClass}" style="padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 600;">
              ${x.transaction}
            </span>
          </td>
          <td>${x.payment}</td>
          <td>${x.category}</td>
          <td style="font-weight: 700;">₹${amount.toLocaleString('en-IN')}</td>
        </tr>`;
    });
    
    // Update table
    monthlyTable.innerHTML = rows || '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #6b7280;">No transactions found</td></tr>';
    
    // Update dashboard
    updateDashboard(income, expense, borrow, lend, on, off, daily, p, o);
    
    // Calculate insights
    calculateInsights(cat, day, income, expense, daily);
    
    // Draw charts
    drawCharts(weeks, on, off);
    
  } catch (error) {
    console.error("Error loading monthly data:", error);
    monthlyTable.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #dc2626;">Error loading data</td></tr>';
  }
}

// ========== UPDATE DASHBOARD ==========
function updateDashboard(income, expense, borrow, lend, on, off, daily, p, o) {
  // Format currency function
  const format = (amount) => `₹${amount.toLocaleString('en-IN')}`;
  
  mIncome.textContent = format(income);
  mExpense.textContent = format(expense);
  mBalance.textContent = format(income + lend - expense - borrow);
  mOnline.textContent = format(on);
  mOffline.textContent = format(off);
  mAvg.textContent = format(Math.round(daily / 30));
  mBorrow.textContent = borrow.toLocaleString('en-IN');
  mLend.textContent = lend.toLocaleString('en-IN');
  pAmt.textContent = p.toLocaleString('en-IN');
  oAmt.textContent = o.toLocaleString('en-IN');
}

// ========== CALCULATE INSIGHTS ==========
function calculateInsights(cat, day, income, expense, daily) {
  // Top category
  let top = "-";
  let max = 0;
  for (let c in cat) {
    if (cat[c] > max) {
      max = cat[c];
      top = c + " (₹" + max.toLocaleString('en-IN') + ")";
    }
  }
  topCategory.textContent = top;
  
  // Highest day
  let md = "-";
  let mv = 0;
  for (let d in day) {
    if (day[d] > mv) {
      mv = day[d];
      const dateObj = new Date(d);
      md = dateObj.getDate() + "/" + (dateObj.getMonth() + 1) + " (₹" + mv.toLocaleString('en-IN') + ")";
    }
  }
  maxDay.textContent = md;
  
  // Spending level
  const avgDaily = daily / 30;
  let level = "";
  if (avgDaily > 2000) {
    level = "Very High 🔴";
    spendLevel.style.backgroundColor = "#fee2e2";
    spendLevel.style.color = "#991b1b";
  } else if (avgDaily > 1000) {
    level = "High 🟠";
    spendLevel.style.backgroundColor = "#fef3c7";
    spendLevel.style.color = "#92400e";
  } else if (avgDaily > 300) {
    level = "Moderate 🟡";
    spendLevel.style.backgroundColor = "#fef9c3";
    spendLevel.style.color = "#854d0e";
  } else {
    level = "Low 🟢";
    spendLevel.style.backgroundColor = "#dcfce7";
    spendLevel.style.color = "#166534";
  }
  spendLevel.textContent = level;
  
  // Expense ratio
  const expensePercent = income > 0 ? Math.min((expense / income) * 100, 100) : 100;
  expenseBar.style.width = expensePercent + "%";
  expenseRatio.textContent = expensePercent.toFixed(1) + "%";
}

// ========== DRAW CHARTS ==========
function drawCharts(weeks, on, off) {
  // Destroy existing charts
  if (weekChartInstance) weekChartInstance.destroy();
  if (payChartInstance) payChartInstance.destroy();
  
  // Weekly Chart
  const weekCtx = weekChart.getContext('2d');
  weekChartInstance = new Chart(weekCtx, {
    type: 'bar',
    data: {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5+'],
      datasets: [{
        label: 'Expense (₹)',
        data: weeks,
        backgroundColor: '#3b82f6',
        borderColor: '#1d4ed8',
        borderWidth: 1,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) {
              return '₹' + context.raw.toLocaleString('en-IN');
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return '₹' + value.toLocaleString('en-IN');
            }
          }
        }
      }
    }
  });
  
  // Payment Method Chart
  const payCtx = payChart.getContext('2d');
  payChartInstance = new Chart(payCtx, {
    type: 'doughnut',
    data: {
      labels: ['Online', 'Offline'],
      datasets: [{
        data: [on, off],
        backgroundColor: ['#10b981', '#f59e0b'],
        borderColor: ['#059669', '#d97706'],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 15
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const total = on + off;
              const percent = total > 0 ? ((context.raw / total) * 100).toFixed(1) : 0;
              return `${context.label}: ₹${context.raw.toLocaleString('en-IN')} (${percent}%)`;
            }
          }
        }
      }
    }
  });
}

// ========== RESET VALUES ==========
function resetAllValues() {
  mIncome.textContent = "₹0";
  mExpense.textContent = "₹0";
  mBalance.textContent = "₹0";
  mOnline.textContent = "₹0";
  mOffline.textContent = "₹0";
  mAvg.textContent = "₹0";
  mBorrow.textContent = "0";
  mLend.textContent = "0";
  maxDay.textContent = "-";
  topCategory.textContent = "-";
  spendLevel.textContent = "-";
  spendLevel.style.backgroundColor = "";
  spendLevel.style.color = "";
  pAmt.textContent = "0";
  oAmt.textContent = "0";
  expenseBar.style.width = "0%";
  expenseRatio.textContent = "0%";
  
  // Clear charts
  if (weekChartInstance) {
    weekChartInstance.destroy();
    weekChartInstance = null;
  }
  if (payChartInstance) {
    payChartInstance.destroy();
    payChartInstance = null;
  }
}

// ========== DOWNLOAD PDF ==========
function downloadPDF() {
  window.print();
}

// ========== EVENT LISTENERS ==========
monthPicker.addEventListener('change', loadMonth);
window.addEventListener('resize', function() {
  if (weekChartInstance) weekChartInstance.resize();
  if (payChartInstance) payChartInstance.resize();
});

// ========== INITIALIZE ==========
document.addEventListener('DOMContentLoaded', init);
