// 🔥 Firebase
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

date.valueAsDate = new Date();
let editId = null;

// ================= EXPANDED CATEGORY MAP =================
const categoryMap = {
  Expense: [
    "Food 🍛", 
    "Grocery 🛒", 
    "Travel 🚆", 
    "Fuel ⛽", 
    "Rent 🏠",
    "Utilities 💡",
    "Healthcare 🏥",
    "Entertainment 🎬",
    "Shopping 🛍️",
    "Education 📚",
    "Subscription 📱",
    "Transport 🚗",
    "Dining Out 🍽️",
    "Gifts 🎁",
    "Home Maintenance 🔨"
  ],
  Income: [
    "Salary 💼", 
    "Bonus 🎉", 
    "Interest 💰",
    "Freelance 💻",
    "Investment 📈",
    "Rental Income 🏘️",
    "Refund 💸",
    "Dividends 📊",
    "Commission 🤝",
    "Side Business 🏪"
  ],
  Borrow: [
    "Friend 🤝", 
    "Loan 🏦",
    "Family 👨‍👩‍👧‍👦",
    "Credit Card 💳",
    "Emergency 🚨"
  ],
  Lend: [
    "Friend 🤝",
    "Family 👨‍👩‍👧‍👦",
    "Colleague 👔",
    "Business Partner 🤝"
  ]
};

function loadCategories(type) {
  category.innerHTML = "";
  categoryMap[type].forEach(c => {
    const o = document.createElement("option");
    o.textContent = c;
    category.appendChild(o);
  });
  const other = document.createElement("option");
  other.value = "Others";
  other.textContent = "Others (Custom)";
  category.appendChild(other);
  customCategory.style.display = "none";
}

transaction.onchange = () => loadCategories(transaction.value);
loadCategories(transaction.value);

category.onchange = () => {
  customCategory.style.display = category.value === "Others" ? "block" : "none";
};

// ================= ADD / UPDATE =================
addBtn.onclick = async () => {
  const cat = category.value === "Others" ? customCategory.value : category.value;
  if (!amount.value || !cat) return alert("Fill required fields");

  const data = {
    user,
    date: date.value,
    type: type.value,
    payment: payment.value,
    transaction: transaction.value,
    category: cat,
    amount: Number(amount.value),
    notes: notes.value || "",
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  if (editId) {
    await db.collection("transactions").doc(editId).update(data);
    editId = null;
  } else {
    await db.collection("transactions").add(data);
  }

  amount.value = "";
  notes.value = "";
  customCategory.value = "";
};

// ================= REALTIME FETCH - NEWEST FIRST =================
db.collection("transactions")
  .where("user", "==", user)
  .onSnapshot(snapshot => {

    let docs = [];
    snapshot.forEach(doc => docs.push({ id: doc.id, ...doc.data() }));

    // 🔑 SORT: Newest first (by createdAt or date)
    docs.sort((a, b) => {
      // First try to sort by createdAt (server timestamp)
      if (a.createdAt && b.createdAt) {
        return b.createdAt.seconds - a.createdAt.seconds; // Newest first
      }
      // Fallback: sort by date (newest first)
      return b.date.localeCompare(a.date);
    });

    let rows = "";
    let income = 0, expense = 0, borrow = 0, lend = 0;
    let todayExpense = 0, yesterdayExpense = 0;

    const today = new Date().toISOString().slice(0, 10);
    const yd = new Date();
    yd.setDate(yd.getDate() - 1);
    const yesterday = yd.toISOString().slice(0, 10);

    docs.forEach(x => {

      if (x.transaction === "Income") income += x.amount;
      if (x.transaction === "Expense") expense += x.amount;
      if (x.transaction === "Borrow") borrow += x.amount;
      if (x.transaction === "Lend") lend += x.amount;

      if (x.transaction === "Expense") {
        if (x.date === today) todayExpense += x.amount;
        if (x.date === yesterday) yesterdayExpense += x.amount;
      }

      rows += `
      <tr>
        <td>${x.date}</td>
        <td>${x.type}</td>
        <td>${x.payment}</td>
        <td>${x.transaction}</td>
        <td>${x.category}</td>
        <td>₹${x.amount}</td>
        <td>${x.notes || ""}</td>
        <td>
          <button onclick="editEntry('${x.id}')">✏</button>
          <button onclick="deleteEntry('${x.id}')">🗑</button>
        </td>
      </tr>`;
    });

    tableBody.innerHTML = rows;
    
    // Update dashboard elements
    document.getElementById("todayExpense").innerText = "₹" + todayExpense;
    document.getElementById("yesterdayExpense").innerText = "₹" + yesterdayExpense;
    document.getElementById("balance").innerText = "₹" + (income + lend - expense - borrow);
    document.getElementById("totalBorrow").innerText = borrow;
    document.getElementById("totalLend").innerText = lend;
  });

// ================= EDIT =================
window.editEntry = async id => {
  const d = await db.collection("transactions").doc(id).get();
  const x = d.data();
  date.value = x.date;
  type.value = x.type;
  payment.value = x.payment;
  transaction.value = x.transaction;
  loadCategories(x.transaction);
  
  // Check if category exists in our map or is custom
  const catList = categoryMap[x.transaction] || [];
  if (catList.includes(x.category)) {
    category.value = x.category;
    customCategory.style.display = "none";
  } else {
    category.value = "Others";
    customCategory.value = x.category;
    customCategory.style.display = "block";
  }
  
  amount.value = x.amount;
  notes.value = x.notes;
  editId = id;
};

// ================= DELETE =================
window.deleteEntry = async id => {
  if (confirm("Delete entry?")) {
    await db.collection("transactions").doc(id).delete();
  }
};

// ================= CSV =================
downloadCSV.onclick = async () => {
  const snap = await db.collection("transactions")
    .where("user", "==", user)
    .get();

  let csv = "Date,Type,Payment,Transaction,Category,Amount,Notes\n";
  snap.forEach(d => {
    const x = d.data();
    csv += `"${x.date}","${x.type}","${x.payment}","${x.transaction}","${x.category}","${x.amount}","${x.notes || ""}"\n`;
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "money-manager.csv";
  a.click();
};

// ================= LOGOUT =================
function logout() {
  sessionStorage.clear();
  location.href = "login.html";
}
