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

// 📅 Default date
date.valueAsDate = new Date();
let editId = null;

/* ================= CATEGORY MAP ================= */
const categoryMap = {
  Expense: ["Food 🍛","Grocery 🛒","Travel 🚆","Fuel ⛽","Rent 🏠","Electricity 💡","Medical 🏥","Shopping 🛍️"],
  Income: ["Salary 💼","Freelance 💻","Business 🏢","Bonus 🎉","Interest 💰"],
  Borrow: ["Friend 🤝","Family 👪","Loan 🏦","EMI 📄"],
  Lend: ["Friend 🤝","Family 👪"]
};

function loadCategories(txn) {
  category.innerHTML = "";

  categoryMap[txn].forEach(c => {
    const opt = document.createElement("option");
    opt.textContent = c;
    category.appendChild(opt);
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

/* ================= ADD / UPDATE ================= */
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
    notes: notes.value || ""
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

function logout() {
  sessionStorage.clear();
  location.href = "login.html";
}

/* ================= FETCH & CALCULATE ================= */
db.collection("transactions")
  .where("user", "==", user)
  .onSnapshot(snapshot => {

    let rows = "";
    let income = 0, expense = 0, borrow = 0, lend = 0;

    snapshot.forEach(doc => {
      const x = doc.data();

      if (x.transaction === "Income") income += x.amount;
      if (x.transaction === "Expense") expense += x.amount;
      if (x.transaction === "Borrow") borrow += x.amount;
      if (x.transaction === "Lend") lend += x.amount;

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
          <button onclick="editEntry('${doc.id}')">✏</button>
          <button onclick="deleteEntry('${doc.id}')">🗑</button>
        </td>
      </tr>`;
    });

    tableBody.innerHTML = rows;

    // ✅ SAFE DOM UPDATE
    document.getElementById("balance").innerText =
      "₹" + (income + lend - expense - borrow);

    document.getElementById("totalBorrow").innerText = borrow;
    document.getElementById("totalLend").innerText = lend;
});

/* ================= EDIT / DELETE ================= */
window.editEntry = async id => {
  const d = await db.collection("transactions").doc(id).get();
  const x = d.data();

  date.value = x.date;
  type.value = x.type;
  payment.value = x.payment;
  transaction.value = x.transaction;
  loadCategories(x.transaction);
  category.value = x.category;
  amount.value = x.amount;
  notes.value = x.notes;
  editId = id;
};

window.deleteEntry = async id => {
  if (confirm("Delete entry?")) {
    await db.collection("transactions").doc(id).delete();
  }
};

/* ================= CSV EXPORT ================= */
downloadCSV.onclick = async () => {
  const snap = await db.collection("transactions")
    .where("user", "==", user)
    .get();

  if (snap.empty) return alert("No data");

  let csv = "Date,Type,Payment,Transaction,Category,Amount,Notes\n";

  snap.forEach(doc => {
    const x = doc.data();
    csv += `"${x.date}","${x.type}","${x.payment}","${x.transaction}","${x.category}","${x.amount}","${x.notes || ""}"\n`;
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "money-manager.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
