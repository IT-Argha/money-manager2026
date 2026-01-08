// ================= FIREBASE CONFIGURATION =================
const firebaseConfig = {
  apiKey: "AIzaSyDPmg4PcpK5kceWFodPU-7gzzQJ0AWaf5A",
  authDomain: "money-manager2026.firebaseapp.com",
  projectId: "money-manager2026",
  storageBucket: "money-manager2026.firebasestorage.app",
  messagingSenderId: "375955583976",
  appId: "1:375955583976:web:fa53cacc6d9f89057f6a5d"
};

// Initialize Firebase
try {
  firebase.initializeApp(firebaseConfig);
} catch (error) {
  console.error("Firebase initialization error:", error);
}
const db = firebase.firestore();

// ================= AUTHENTICATION CHECK =================
const user = sessionStorage.getItem("user");
if (!user) {
  location.href = "login.html";
}

// ================= GLOBAL VARIABLES =================
let editId = null;
let countForDaily = true;

// ================= DOM ELEMENT REFERENCES =================
const dateInput = document.getElementById("date");
const typeSelect = document.getElementById("type");
const paymentSelect = document.getElementById("payment");
const transactionSelect = document.getElementById("transaction");
const categorySelect = document.getElementById("category");
const customCategoryInput = document.getElementById("customCategory");
const amountInput = document.getElementById("amount");
const notesInput = document.getElementById("notes");
const countToggle = document.getElementById("countToggle");
const addBtn = document.getElementById("addBtn");
const tableBody = document.getElementById("tableBody");
const todayExpense = document.getElementById("todayExpense");
const yesterdayExpense = document.getElementById("yesterdayExpense");
const balance = document.getElementById("balance");
const totalBorrow = document.getElementById("totalBorrow");
const totalLend = document.getElementById("totalLend");
const downloadCSV = document.getElementById("downloadCSV");

// ================= INITIALIZATION =================
dateInput.valueAsDate = new Date();

// ================= CATEGORY MANAGEMENT =================
const categoryMap = {
  Expense: [
    "Food 🍔", "Grocery 🛒", "Travel 🚗", "Fuel ⛽", "Rent 🏠",
    "Utilities 💡", "Electricity ⚡", "Water 🚿", "Internet 🌐", "Mobile 📱",
    "Healthcare 🏥", "Medicines 💊", "Doctor 👨‍⚕️", "Hospital 🏨",
    "Entertainment 🎬", "Movies 🎥", "Streaming 📺", "Games 🎮", "Concerts 🎵",
    "Shopping 🛍️", "Clothing 👕", "Electronics 📱", "Furniture 🛋️", "Beauty 💄",
    "Education 📚", "Tuition 👨‍🏫", "Books 📖", "Courses 🎓", "Subscription 📱",
    "Transport 🚌", "Taxi 🚕", "Bus 🚎", "Train 🚆", "Flight ✈️",
    "Dining Out 🍽️", "Restaurant 🍴", "Cafe ☕", "Fast Food 🍟", "Gifts 🎁",
    "Birthday 🎂", "Anniversary 💑", "Wedding 💒", "Home Maintenance 🛠️",
    "Repairs 🔧", "Cleaning 🧹", "Gardening 🌱", "Insurance 🏦", "Car Insurance 🚗",
    "Health Insurance 🏥", "Life Insurance 👨‍👩‍👧‍👦", "Fitness 🏋️", "Gym 💪", "Sports ⚽",
    "Yoga 🧘", "Pets 🐾", "Pet Food 🦴", "Vet 🐕", "Grooming ✂️",
    "Charity 🤝", "Donation 💑", "Tips 💸", "Taxes 💰", "Income Tax 🏛️",
    "Property Tax 🏠", "GST 🏢"
  ],
  Income: [
    "Salary 💼", "Bonus 🎉", "Interest 💰", "Bank Interest 🏦", "FD Interest 💳",
    "Freelance 💻", "Consulting 👨‍💼", "Design 🎨", "Development 💻", "Investment 💹",
    "Stocks 📈", "Mutual Funds 💹", "Crypto ₿", "Rental Income 🏘️", "House Rent 🏠",
    "Shop Rent 🏪", "Refund 💸", "Tax Refund 🏛️", "Product Return 📦", "Dividends 📈",
    "Commission 🤝", "Sales Commission 💹", "Referral 🤝", "Side Business 🏪",
    "Online Store 🛒", "Tuition 👨‍🏫", "Pension 👴", "Allowance 💵", "Scholarship 🎓",
    "Gift Money 🎁", "Inheritance 👨‍👩‍👧‍👦", "Lottery 🎰", "Rewards 🏆", "Cashback 💳"
  ],
  Borrow: [
    "Friend 🤝", "Loan 🏦", "Personal Loan 👤", "Home Loan 🏠", "Car Loan 🚗",
    "Family 👨‍👩‍👧‍👦", "Parents 👨‍👩‍👧", "Siblings 👨‍👧", "Credit Card 💳", "Cash Advance 💰",
    "EMI 📅", "Emergency 🚨", "Medical Emergency 🏥", "Urgent Repair 🔧",
    "Business Capital 💼", "Education Loan 📚", "Payday Loan 💵", "Gold Loan 💰",
    "Online Loan 🌐"
  ],
  Lend: [
    "Friend 🤝", "Family 👨‍👩‍👧‍👦", "Parents 👨‍👩‍👧", "Children 👶", "Colleague 👥",
    "Business Partner 🤝", "Investment 💹", "Peer-to-Peer 🤝", "Student 👨‍🎓",
    "Relative 👨‍👩‍👧‍👦", "Neighbor 🏘️", "Emergency Help ❤️", "Short Term 📅",
    "Long Term 📅", "Interest Free 💝", "With Interest 💹"
  ]
};

// ================= FUNCTION DECLARATIONS =================

/**
 * Load categories based on selected transaction type
 * @param {string} transactionType - The type of transaction
 */
function loadCategories(transactionType) {
  categorySelect.innerHTML = "";
  
  if (categoryMap[transactionType]) {
    categoryMap[transactionType].forEach(category => {
      const option = document.createElement("option");
      option.textContent = category;
      option.value = category;
      categorySelect.appendChild(option);
    });
  }
  
  // Add "Others" option
  const othersOption = document.createElement("option");
  othersOption.value = "Others";
  othersOption.textContent = "Others";
  categorySelect.appendChild(othersOption);
  
  customCategoryInput.style.display = "none";
}

/**
 * Toggle countForDaily setting
 */
function toggleCountForDaily() {
  countForDaily = !countForDaily;
  countToggle.innerText = countForDaily ? "YES" : "NO";
  countToggle.classList.toggle("active", countForDaily);
}

/**
 * Handle category selection change
 */
function handleCategoryChange() {
  customCategoryInput.style.display = categorySelect.value === "Others" ? "block" : "none";
  if (categorySelect.value !== "Others") {
    customCategoryInput.value = "";
  }
}

/**
 * Validate form inputs
 * @returns {boolean} - True if valid, false otherwise
 */
function validateForm() {
  const category = categorySelect.value === "Others" 
    ? customCategoryInput.value.trim() 
    : categorySelect.value;
  
  if (!amountInput.value || Number(amountInput.value) <= 0) {
    alert("Please enter a valid amount greater than 0");
    return false;
  }
  
  if (!category) {
    alert("Please select or enter a category");
    return false;
  }
  
  return true;
}

/**
 * Reset form to default state
 */
function resetForm() {
  amountInput.value = "";
  notesInput.value = "";
  customCategoryInput.value = "";
  countForDaily = true;
  countToggle.innerText = "YES";
  countToggle.classList.add("active");
  editId = null;
  addBtn.textContent = "＋";
}

/**
 * Add or update transaction
 */
async function addOrUpdateTransaction() {
  if (!validateForm()) return;
  
  const category = categorySelect.value === "Others" 
    ? customCategoryInput.value.trim() 
    : categorySelect.value;
  
  const transactionData = {
    user,
    date: dateInput.value,
    type: typeSelect.value,
    payment: paymentSelect.value,
    transaction: transactionSelect.value,
    category,
    amount: Number(amountInput.value),
    notes: notesInput.value.trim(),
    countForDaily: transactionSelect.value === "Expense" ? countForDaily : false,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  
  try {
    if (editId) {
      await db.collection("transactions").doc(editId).update(transactionData);
    } else {
      await db.collection("transactions").add(transactionData);
    }
    resetForm();
  } catch (error) {
    console.error("Error saving transaction:", error);
    alert("Failed to save transaction. Please try again.");
  }
}

/**
 * Calculate today and yesterday dates
 * @returns {Object} - Contains today and yesterday as YYYY-MM-DD strings
 */
function getDateStrings() {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  return {
    today: today.toISOString().slice(0, 10),
    yesterday: yesterday.toISOString().slice(0, 10)
  };
}

/**
 * Format currency with Indian Rupee symbol
 * @param {number} amount - Amount to format
 * @returns {string} - Formatted currency string
 */
function formatCurrency(amount) {
  return `₹${amount.toLocaleString('en-IN')}`;
}

/**
 * Render table rows from transaction data
 * @param {Array} transactions - Array of transaction objects
 * @returns {Object} - Contains HTML rows and calculated totals
 */
function renderTableData(transactions) {
  let rows = "";
  let income = 0, expense = 0, borrow = 0, lend = 0;
  let todayExpenseAmount = 0, yesterdayExpenseAmount = 0;
  
  const { today, yesterday } = getDateStrings();
  
  transactions.forEach(transaction => {
    // Calculate totals
    switch (transaction.transaction) {
      case "Income": income += transaction.amount; break;
      case "Expense": expense += transaction.amount; break;
      case "Borrow": borrow += transaction.amount; break;
      case "Lend": lend += transaction.amount; break;
    }
    
    // Calculate daily expenses
    if (transaction.transaction === "Expense" && transaction.countForDaily) {
      if (transaction.date === today) todayExpenseAmount += transaction.amount;
      if (transaction.date === yesterday) yesterdayExpenseAmount += transaction.amount;
    }
    
    // Create table row
    rows += `
    <tr data-id="${transaction.id}">
      <td>${transaction.date}</td>
      <td>${transaction.type}</td>
      <td>${transaction.payment}</td>
      <td>${transaction.transaction}</td>
      <td>${transaction.category}</td>
      <td>${formatCurrency(transaction.amount)}</td>
      <td>${transaction.notes || "-"}</td>
      <td class="action-buttons">
        <button onclick="editEntry('${transaction.id}')" class="edit-btn" title="Edit">✏️</button>
        <button onclick="deleteEntry('${transaction.id}')" class="delete-btn" title="Delete">🗑️</button>
      </td>
    </tr>`;
  });
  
  return {
    rows,
    totals: { income, expense, borrow, lend, todayExpenseAmount, yesterdayExpenseAmount }
  };
}

/**
 * Update dashboard with calculated values
 * @param {Object} totals - Object containing all calculated totals
 */
function updateDashboard(totals) {
  const { income, expense, borrow, lend, todayExpenseAmount, yesterdayExpenseAmount } = totals;
  
  todayExpense.innerText = formatCurrency(todayExpenseAmount);
  yesterdayExpense.innerText = formatCurrency(yesterdayExpenseAmount);
  balance.innerText = formatCurrency(income + lend - expense - borrow);
  totalBorrow.innerText = borrow.toLocaleString('en-IN');
  totalLend.innerText = lend.toLocaleString('en-IN');
}

/**
 * Edit a transaction entry
 * @param {string} id - Document ID of the transaction to edit
 */
async function editEntry(id) {
  try {
    const doc = await db.collection("transactions").doc(id).get();
    if (!doc.exists) {
      alert("Transaction not found");
      return;
    }
    
    const transaction = doc.data();
    
    // Populate form fields
    dateInput.value = transaction.date;
    typeSelect.value = transaction.type;
    paymentSelect.value = transaction.payment;
    transactionSelect.value = transaction.transaction;
    loadCategories(transaction.transaction);
    
    // Handle category (check if it's in the list or custom)
    if (categoryMap[transaction.transaction]?.includes(transaction.category)) {
      categorySelect.value = transaction.category;
    } else {
      categorySelect.value = "Others";
      customCategoryInput.value = transaction.category;
      customCategoryInput.style.display = "block";
    }
    
    amountInput.value = transaction.amount;
    notesInput.value = transaction.notes || "";
    countForDaily = transaction.countForDaily || false;
    countToggle.innerText = countForDaily ? "YES" : "NO";
    countToggle.classList.toggle("active", countForDaily);
    
    editId = id;
    addBtn.textContent = "🔄";
    
    // Scroll to form
    document.querySelector('.entry-box').scrollIntoView({ behavior: 'smooth' });
  } catch (error) {
    console.error("Error loading transaction for editing:", error);
    alert("Failed to load transaction for editing");
  }
}

/**
 * Delete a transaction entry
 * @param {string} id - Document ID of the transaction to delete
 */
async function deleteEntry(id) {
  if (confirm("Are you sure you want to delete this transaction?")) {
    try {
      await db.collection("transactions").doc(id).delete();
    } catch (error) {
      console.error("Error deleting transaction:", error);
      alert("Failed to delete transaction");
    }
  }
}

/**
 * Export transactions to CSV
 */
async function exportToCSV() {
  try {
    const snapshot = await db.collection("transactions").where("user", "==", user).get();
    
    // Create CSV header
    let csv = "Date,Type,Payment,Transaction,Category,Amount,Notes,Count For Daily\n";
    
    // Add data rows
    snapshot.forEach(doc => {
      const data = doc.data();
      csv += `"${data.date}","${data.type}","${data.payment}","${data.transaction}","${data.category}","${data.amount}","${data.notes || ""}","${data.countForDaily}"\n`;
    });
    
    // Create and trigger download
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `money-manager-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error exporting CSV:", error);
    alert("Failed to export data. Please try again.");
  }
}

/**
 * Logout user and clear session
 */
function logout() {
  if (confirm("Are you sure you want to logout?")) {
    sessionStorage.clear();
    location.href = "login.html";
  }
}

/**
 * Setup real-time listener for transactions
 */
function setupRealtimeListener() {
  db.collection("transactions")
    .where("user", "==", user)
    .onSnapshot(snapshot => {
      const transactions = [];
      snapshot.forEach(doc => {
        transactions.push({ id: doc.id, ...doc.data() });
      });
      
      // Sort by date (newest first) and then by creation time
      transactions.sort((a, b) => {
        const dateCompare = b.date.localeCompare(a.date);
        if (dateCompare !== 0) return dateCompare;
        
        if (a.createdAt && b.createdAt) {
          return b.createdAt.seconds - a.createdAt.seconds;
        }
        return 0;
      });
      
      // Render data
      const { rows, totals } = renderTableData(transactions);
      tableBody.innerHTML = rows;
      updateDashboard(totals);
    }, error => {
      console.error("Error in real-time listener:", error);
    });
}

// ================= EVENT LISTENERS SETUP =================

// Set up event listeners
countToggle.addEventListener("click", toggleCountForDaily);
transactionSelect.addEventListener("change", () => loadCategories(transactionSelect.value));
categorySelect.addEventListener("change", handleCategoryChange);
addBtn.addEventListener("click", addOrUpdateTransaction);
downloadCSV.addEventListener("click", exportToCSV);

// Add Enter key support for form submission
amountInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") addOrUpdateTransaction();
});
notesInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") addOrUpdateTransaction();
});

// ================= INITIAL SETUP =================

// Load initial categories
loadCategories(transactionSelect.value);

// Setup real-time data listener
setupRealtimeListener();

// Make functions available globally
window.editEntry = editEntry;
window.deleteEntry = deleteEntry;
window.logout = logout;

// ================= PERFORMANCE OPTIMIZATIONS =================

// Debounce function for potential future use
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Add loading indicator
document.addEventListener('DOMContentLoaded', () => {
  tableBody.innerHTML = '<tr><td colspan="8" class="loading">Loading transactions...</td></tr>';
});
