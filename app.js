const K='budgetData';
let data=JSON.parse(localStorage.getItem(K)||'{"pays":[]}');

function save(){localStorage.setItem(K,JSON.stringify(data))}

function addPay(){
const d=document.getElementById('payDate').value;
const a=Number(document.getElementById('payAmt').value);
const n=document.getElementById('payNote').value;

if(!d||!a)return alert('Missing info');

data.pays.unshift({id:Date.now(),date:d,pay:a,note:n,expenses:[]});
save();render();
}

function exportData(){
const blob=new Blob([JSON.stringify(data)],{type:'application/json'});
const a=document.createElement('a');
a.href=URL.createObjectURL(blob);
a.download='budget.json';
a.click();
}

function importData(e){
const file=e.target.files[0];
const r=new FileReader();
r.onload=()=>{data=JSON.parse(r.result);save();render()};
r.readAsText(file);
}

function render(){
document.getElementById('list').innerHTML=data.pays.map(p=>`
<div class="panel">
<strong>${p.date}</strong><br>
$${p.pay}
</div>
`).join('');
}

render();
