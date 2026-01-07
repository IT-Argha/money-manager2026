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

const user = sessionStorage.getItem("user");
if(!user) location.href="login.html";

let editId=null;
date.valueAsDate=new Date();

addBtn.onclick=async()=>{
const data={
user,
date:date.value,
type:type.value,
transaction:transaction.value,
payment:payment.value,
category:category.value,
amount:Number(amount.value),
notes:notes.value||""
};

if(!data.amount) return alert("Amount required");

if(editId){
await db.collection("transactions").doc(editId).update(data);
editId=null;
}else{
await db.collection("transactions").add(data);
}
amount.value="";notes.value="";
};

function logout(){
sessionStorage.clear();
location.href="login.html";
}

db.collection("transactions")
.where("user","==",user)
.onSnapshot(snap=>{
let rows="",income=0,expense=0,today=0,yest=0;
const t=new Date().toISOString().slice(0,10);
const y=new Date(Date.now()-86400000).toISOString().slice(0,10);

snap.forEach(d=>{
const x=d.data();
rows+=`
<tr>
<td>${x.date}</td><td>${x.type}</td><td>${x.transaction}</td>
<td>${x.category}</td><td>${x.payment}</td>
<td>₹${x.amount}</td><td>${x.notes}</td>
<td>
<button onclick="editEntry('${d.id}')">✏</button>
<button onclick="deleteEntry('${d.id}')">🗑</button>
</td>
</tr>`;

x.transaction==="Income"?income+=x.amount:expense+=x.amount;
if(x.transaction==="Expense"&&x.date===t)today+=x.amount;
if(x.transaction==="Expense"&&x.date===y)yest+=x.amount;
});

tableBody.innerHTML=rows;
todayExpense.innerText="₹"+today;
yesterdayExpense.innerText="₹"+yest;
balance.innerText="₹"+(income-expense);
});

window.editEntry=async id=>{
const d=await db.collection("transactions").doc(id).get();
const x=d.data();
date.value=x.date;
type.value=x.type;
transaction.value=x.transaction;
payment.value=x.payment;
category.value=x.category;
amount.value=x.amount;
notes.value=x.notes;
editId=id;
};

window.deleteEntry=async id=>{
if(confirm("Delete entry?"))
await db.collection("transactions").doc(id).delete();
};

downloadCSV.onclick=()=>{
db.collection("transactions").where("user","==",user).get().then(s=>{
let csv="Date,Type,Txn,Category,Mode,Amount,Notes\n";
s.forEach(d=>{
const x=d.data();
csv+=`${x.date},${x.type},${x.transaction},${x.category},${x.payment},${x.amount},${x.notes}\n`;
});
const a=document.createElement("a");
a.href=URL.createObjectURL(new Blob([csv]));
a.download="money.csv";
a.click();
});
};
