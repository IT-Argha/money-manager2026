// 🔥 Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyDPmg4PcpK5kceWFodPU-7gzzQJ0AWaf5A",
  authDomain: "money-manager2026.firebaseapp.com",
  projectId: "money-manager2026",
  storageBucket: "money-manager2026.firebasestorage.app",
  messagingSenderId: "375955583976",
  appId: "1:375955583976:web:fa53cacc6d9f89057f6a5d"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// 🔐 Login check
const user = sessionStorage.getItem("user");
if (!user) location.href = "login.html";

// Default month
monthPicker.value = new Date().toISOString().slice(0, 7);

/* ================= WEEKLY BAR CHART ================= */
function drawWeeklyChart(weeks) {
  const c = weekChart;
  const ctx = c.getContext("2d");
  ctx.clearRect(0, 0, c.width, c.height);

  const max = Math.max(...weeks, 1);
  const padding = 30;
  const barWidth = (c.width - padding * 2) / weeks.length;

  ctx.font = "12px system-ui";
  ctx.textAlign = "center";

  weeks.forEach((val, i) => {
    const x = padding + i * barWidth;
    const h = (val / max) * (c.height - 60);
    const y = c.height - h - 25;

    ctx.fillStyle = "#2563eb";
    ctx.fillRect(x + 10, y, barWidth - 20, h);

    ctx.fillStyle = "#111";
    ctx.fillText("₹" + val, x + barWidth / 2, y - 6);

    ctx.fillStyle = "#555";
    ctx.fillText("W" + (i + 1), x + barWidth / 2, c.height - 8);
  });
}

/* ================= ONLINE / OFFLINE PIE ================= */
function drawPayChart(online, offline) {
  const c = payChart;
  const ctx = c.getContext("2d");
  ctx.clearRect(0, 0, c.width, c.height);

  const total = online + offline || 1;
  const cx = 90, cy = 90, r = 70;
  const angle = (online / total) * Math.PI * 2;

  // Online
  ctx.fillStyle = "#22c55e";
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, r, 0, angle);
  ctx.fill();

  // Offline
  ctx.fillStyle = "#ef4444";
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, r, angle, Math.PI * 2);
  ctx.fill();

  // Legend
  ctx.font = "13px system-ui";
  ctx.fillStyle = "#22c55e";
  ctx.fillText("● Online : ₹" + online, 190, 70);
  ctx.fillStyle = "#ef4444";
  ctx.fillText("● Offline : ₹" + offline, 190, 95);
}

/* ================= LOAD MONTH ================= */
function loadMonth() {
  const m = monthPicker.value;

  let income = 0;
  let expense = 0;
  let borrow = 0;
  let lend = 0;
  let online = 0;
  let offline = 0;
  let weeks = [0, 0, 0, 0, 0];
  let rows = "";

  db.collection("transactions")
    .where("user", "==", user)
    .get()
    .then(snapshot => {
      snapshot.forEach(doc => {
        const x = doc.data();
        if (!x.date || !x.date.startsWith(m)) return;

        const day = Number(x.date.split("-")[2]);
        const w = Math.min(Math.floor((day - 1) / 7), 4);

        if (x.transaction === "Income") income += x.amount;

        if (x.transaction === "Expense") {
          expense += x.amount;
          weeks[w] += x.amount;
          x.payment === "Online" ? online += x.amount : offline += x.amount;
        }

        if (x.transaction === "Borrow") borrow += x.amount;
        if (x.transaction === "Lend") lend += x.amount;

        rows += `
          <tr>
            <td>${x.date}</td>
            <td>${x.transaction}</td>
            <td>${x.payment}</td>
            <td>${x.category}</td>
            <td>₹${x.amount}</td>
          </tr>`;
      });

      // ✅ SAFE DOM UPDATES
      document.getElementById("monthlyTable").innerHTML = rows;
      document.getElementById("mIncome").innerText = "₹" + income;
      document.getElementById("mExpense").innerText = "₹" + expense;
      document.getElementById("mBorrow").innerText = borrow;
      document.getElementById("mLend").innerText = lend;
      document.getElementById("mOnline").innerText = "₹" + online;
      document.getElementById("mOffline").innerText = "₹" + offline;
      document.getElementById("mAvg").innerText = "₹" + Math.round(expense / 30);

      // Balance logic
      document.getElementById("mBalance").innerText =
        "₹" + (income + lend - expense - borrow);

      drawWeeklyChart(weeks);
      drawPayChart(online, offline);
    });
}
// ================= PDF DOWNLOAD =================
function downloadPDF() {
  const originalTitle = document.title;
  document.title = "Monthly_Summary_" + monthPicker.value;
  window.print();
  document.title = originalTitle;
}


monthPicker.onchange = loadMonth;
loadMonth();
