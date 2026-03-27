const KEY = 'pay-budget-v1';

let data = JSON.parse(localStorage.getItem(KEY) || '[]');

function save() {
  localStorage.setItem(KEY, JSON.stringify(data));
  render();
}

function money(n) {
  return '$' + Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function addPay() {
  const date = document.getElementById('payDate').value;
  const pay = parseFloat(document.getElementById('payAmount').value || 0);
  const notes = document.getElementById('payNotes').value;

  if (!date || !pay) return;

  data.unshift({
    id: Date.now().toString(),
    date,
    pay,
    notes,
    closed: false,
    expenses: []
  });

  document.getElementById('payDate').value = '';
  document.getElementById('payAmount').value = '';
  document.getElementById('payNotes').value = '';

  save();
}

function addExpense(payId) {
  const name = prompt('Expense name');
  if (!name) return;

  const amount = parseFloat(prompt('Amount') || 0);
  const cat = prompt('Category (Fixed / Optional)', 'Fixed') || 'Fixed';

  const pay = data.find(p => p.id === payId);

  pay.expenses.push({
    id: Date.now().toString(),
    name,
    amount,
    cat,
    paid: false
  });

  save();
}

function delExp(payId, expId) {
  const pay = data.find(p => p.id === payId);
  pay.expenses = pay.expenses.filter(e => e.id !== expId);
  save();
}

function togglePaid(payId, expId) {
  const pay = data.find(p => p.id === payId);
  const exp = pay.expenses.find(e => e.id === expId);
  exp.paid = !exp.paid;
  save();
}

function deletePay(payId) {
  data = data.filter(p => p.id !== payId);
  save();
}

function toggleClose(payId) {
  const pay = data.find(p => p.id === payId);
  pay.closed = !pay.closed;
  save();
}

function totals(p) {
  const expenses = p.expenses.reduce((a, b) => a + (b.amount || 0), 0);
  const remaining = p.pay - expenses;
  return { expenses, remaining };
}

function render() {
  const app = document.getElementById('app');
  app.innerHTML = '';

  data.forEach(p => {
    const t = totals(p);

    const card = document.createElement('div');
    card.className = 'card';

    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div>
          <div style="font-size:18px;font-weight:600;">${formatDate(p.date)}</div>
          <div class="small">${p.notes || ''}</div>
        </div>
        <div style="color:${p.closed ? '#1f7a3f' : '#888'};">
          ${p.closed ? 'OK' : ''}
        </div>
      </div>

      <div style="margin-top:10px;">
        <div>Expected Pay<br><b>${money(p.pay)}</b></div>
        <div>Expenses<br><b>${money(t.expenses)}</b></div>
        <div>Remaining<br><b>${money(t.remaining)}</b></div>
      </div>

      <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;">
        <button onclick="addExpense('${p.id}')">Add Expense</button>
        <button onclick="toggleClose('${p.id}')">Close Pay</button>
        <button class="del" onclick="deletePay('${p.id}')">Delete</button>
      </div>

      <div style="margin-top:10px;">
        ${p.expenses.map(e => expenseRow(p, e)).join('')}
      </div>
    `;

    app.appendChild(card);
  });
}

function expenseRow(p, e) {
  return `
    <div class="item" style="${e.paid ? 'opacity:0.5;' : ''}">
      
      <div class="expense-left">
        <div class="expense-name" title="${e.name}">
          ${e.name}
        </div>
        <div class="small">${e.cat}</div>
      </div>

      <div class="expense-right">
        <div>${money(e.amount)}</div>

        <div style="display:flex;gap:6px;justify-content:flex-end;margin-top:6px;">
          <button 
            onclick="togglePaid('${p.id}','${e.id}')"
            style="padding:6px 10px;background:${e.paid ? '#1f7a3f' : '#444'}">
            ${e.paid ? '✓' : '□'}
          </button>

          <button 
            class="del" 
            style="padding:6px 10px"
            onclick="delExp('${p.id}','${e.id}')">
            X
          </button>
        </div>
      </div>

    </div>
  `;
}

function formatDate(d) {
  const date = new Date(d);
  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

// Initial render
render();
