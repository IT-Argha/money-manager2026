const firebaseConfig={
apiKey:"AIzaSyDPmg4PcpK5kceWFodPU-7gzzQJ0AWaf5A",
authDomain:"money-manager2026.firebaseapp.com",
projectId:"money-manager2026",
storageBucket:"money-manager2026.firebasestorage.app",
messagingSenderId:"375955583976",
appId:"1:375955583976:web:fa53cacc6d9f89057f6a5d"
};

firebase.initializeApp(firebaseConfig);
const db=firebase.firestore();

const user=sessionStorage.getItem("user");
if(!user) location.href="login.html";

monthPicker.value=new Date().toISOString().slice(0,7);

function loadMonth(){
const m=monthPicker.value;
let income=0,expense=0,rows="";

db.collection("transactions")
.where("user","==",user)
.get().then(s=>{
s.forEach(d=>{
const x=d.data();
if(x.date.startsWith(m)){
rows+=`
<tr>
<td>${x.date}</td>
<td>${x.transaction}</td>
<td>${x.category}</td>
<td>₹${x.amount}</td>
</tr>`;
x.transaction==="Income"?income+=x.amount:expense+=x.amount;
}
});
monthlyTable.innerHTML=rows;
mIncome.innerText="₹"+income;
mExpense.innerText="₹"+expense;
mBalance.innerText="₹"+(income-expense);
});
}

monthPicker.onchange=loadMonth;
loadMonth();
