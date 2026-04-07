const K = 'pay-budget-lite-v1';

let data = JSON.parse(localStorage.getItem(K) || '{"pays":[],"templates":[]}');

if (!data.templates) data.templates = [];
if (!data.pays) data.pays = [];

data.pays.forEach(p => {
  if (typeof p.archived === 'undefined') p.archived = false;
  if (!p.expenses) p.expenses = [];
  p.expenses.forEach(e => {
    if (typeof e.paid === 'undefined') e.paid = false;
    if (typeof e.date === 'undefined') e.date = '';
  });
});

data.pays.forEach(p => {
  if (typeof p.collapsed === 'undefined') p.collapsed = false;
});

let currentTab = 'cards';

function save() {
  localStorage.setItem(K, JSON.stringify(data));
}

function money(n) {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD'
  }).format(n || 0);
}

function dateFmt(d) {
  if (!d) return 'No date';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

function totals(pay) {
  const exp = (pay.expenses || []).reduce((s, e) => s + Number(e.amount || 0), 0);
  return { exp, rem: Number(pay.pay || 0) - exp };
}

function stat(rem) {
  if (rem < 0) return ['r', 'Red'];
  if (rem < 200) return ['y', 'Tight'];
  return ['g', 'OK'];
}

function addPay() {
  const d = document.getElementById('payDate').value;
  const p = Number(document.getElementById('payAmt').value || 0);
  const n = document.getElementById('payNote').value.trim();

  if (!d || !p) {
    alert('Add a date and pay amount');
    return;
  }

  data.pays.unshift({
    id: Date.now().toString(),
    date: d,
    pay: p,
    note: n,
    expenses: [],
    archived: false
  });

  save();

  document.getElementById('payDate').value = '';
  document.getElementById('payAmt').value = '';
  document.getElementById('payNote').value = '';

  render();
}

function editPay(id) {
  const pay = data.pays.find(x => x.id === id);
  if (!pay) return;

  const newDate = prompt('Pay date?', pay.date || '');
  if (!newDate) return;

  const newAmount = Number(prompt('Expected pay?', pay.pay || 0) || 0);
  if (!newAmount) return;

  const newNote = prompt('Notes?', pay.note || '');
  if (newNote === null) return;

  pay.date = newDate;
  pay.pay = newAmount;
  pay.note = newNote;

  save();
  render();
}

function delPay(id) {
  if (!confirm('Delete this pay period?')) return;
  data.pays = data.pays.filter(x => x.id !== id);
  save();
  render();
}

function closePay(id) {
  const pay = data.pays.find(x => x.id === id);
  if (!pay) return;
  pay.archived = true;
  save();
  render();
}

function reopenPay(id) {
  const pay = data.pays.find(x => x.id === id);
  if (!pay) return;
  pay.archived = false;
  save();
  render();
}

function addExp(id) {
  const pay = data.pays.find(x => x.id === id);
  if (!pay) return;

  pay.showExpenseForm = true;
  if (typeof pay.newExpenseName === 'undefined') pay.newExpenseName = '';
  if (typeof pay.newExpenseAmount === 'undefined') pay.newExpenseAmount = '';
  if (typeof pay.newExpenseCat === 'undefined') pay.newExpenseCat = 'Fixed';

  save();
  render();
}

function cancelAddExp(id){
  const pay = data.pays.find(x => x.id === id);
  if (!pay) return;
  pay.showExpenseForm = false;
  pay.newExpenseName = '';
  pay.newExpenseAmount = '';
  pay.newExpenseCat = 'Fixed';
  pay.newExpenseDate = '';
  pay.selectedTemplateId = '';
  save();
  render();
}

function updateExpenseDraft(id, field, value){
  const pay = data.pays.find(x => x.id === id);
  if (!pay) return;
  pay[field] = value;
  save();
}


function applyExpenseTemplate(id, templateId){
  const pay = data.pays.find(x => x.id === id);
  if (!pay) return;

  pay.selectedTemplateId = templateId;

  const tpl = data.templates.find(t => t.id === templateId);
  if (tpl){
    pay.newExpenseName = tpl.name || '';
    pay.newExpenseAmount = tpl.amount || '';
    pay.newExpenseCat = tpl.cat || 'Fixed';
    pay.newExpenseDate = tpl.date || '';
  }

  save();
  render();
}

function saveExpenseTemplate(id){
  const pay = data.pays.find(x => x.id === id);
  if (!pay) return;

  const name = String(pay.newExpenseName || '').trim();
  const amount = Number(pay.newExpenseAmount || 0);
  const cat = String(pay.newExpenseCat || 'Fixed');

  if (!name){
    alert('Add an expense name first');
    return;
  }
  if (!amount){
    alert('Add an amount first');
    return;
  }

  let tpl = null;
  if (pay.selectedTemplateId){
    tpl = data.templates.find(t => t.id === pay.selectedTemplateId);
  }

  if (tpl){
    tpl.name = name;
    tpl.amount = amount;
    tpl.cat = cat;
  } else {
    tpl = {
      id: 't' + Date.now().toString(),
      name,
      amount,
      cat
    };
    data.templates.push(tpl);
    pay.selectedTemplateId = tpl.id;
  }

  save();
  render();
  alert('Saved to templates');
}

function saveInlineExp(id){
  const pay = data.pays.find(x => x.id === id);
  if (!pay) return;

  const name = String(pay.newExpenseName || '').trim();
  const amount = Number(pay.newExpenseAmount || 0);
  const cat = String(pay.newExpenseCat || 'Fixed');

  if (!name) {
    alert('Add an expense name');
    return;
  }
  if (!amount) {
    alert('Add an amount');
    return;
  }

  pay.expenses.push({
    id: Date.now().toString(),
    name,
    amount,
    cat,
    date: pay.newExpenseDate || '',
    paid: false
  });

  pay.showExpenseForm = false;
  pay.newExpenseName = '';
  pay.newExpenseAmount = '';
  pay.newExpenseCat = 'Fixed';
  pay.newExpenseDate = '';
  pay.selectedTemplateId = '';

  save();
  render();
}

function delExp(payId, expId) {
  const pay = data.pays.find(x => x.id === payId);
  if (!pay) return;
  pay.expenses = pay.expenses.filter(x => x.id !== expId);
  save();
  render();
}

function togglePaid(payId, expId) {
  const pay = data.pays.find(x => x.id === payId);
  if (!pay) return;

  const exp = pay.expenses.find(x => x.id === expId);
  if (!exp) return;

  exp.paid = !exp.paid;
  save();
  render();
}


function showTab(tab) {
  currentTab = tab;
  document.getElementById('cardsTab').style.display = tab === 'cards' ? 'block' : 'none';
  document.getElementById('dashboardTab').style.display = tab === 'dashboard' ? 'block' : 'none';
  if (tab === 'dashboard') drawMonthlyChart();
}

function renderSummary() {
  const activePays = data.pays.filter(p => !p.archived);
  const pay = activePays.reduce((s, p) => s + Number(p.pay || 0), 0);
  const exp = activePays.reduce((s, p) => s + totals(p).exp, 0);
  const rem = pay - exp;

  document.getElementById('summary').innerHTML =
    '<div class="stat-card">' +
      '<div class="stat-label">Expected Pay</div>' +
      '<div class="stat-value">' + money(pay) + '</div>' +
    '</div>' +
    '<div class="stat-card">' +
      '<div class="stat-label">Expenses</div>' +
      '<div class="stat-value">' + money(exp) + '</div>' +
    '</div>' +
    '<div class="stat-card">' +
      '<div class="stat-label">Net Remaining</div>' +
      '<div class="stat-value">' + money(rem) + '</div>' +
    '</div>' +
    '<div class="stat-card">' +
      '<div class="stat-label">Active Pays</div>' +
      '<div class="stat-value">' + activePays.length + '</div>' +
    '</div>';
}

function renderDashboard() {
  const box = document.getElementById('dashboard');
  const activePays = data.pays
    .filter(p => !p.archived)
    .slice()
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (!activePays.length) {
    box.innerHTML = '<h3>Dashboard</h3><div class="small">No pay periods yet.</div>';
    return;
  }

  const monthly = {};
  activePays.forEach(p => {
    const key = (p.date || '').slice(0, 7);
    if (!key) return;
    if (!monthly[key]) monthly[key] = { income: 0, expenses: 0 };
    monthly[key].income += Number(p.pay || 0);
    monthly[key].expenses += totals(p).exp;
  });

  const monthCards = Object.keys(monthly).sort().map(key => {
    const income = monthly[key].income;
    const expenses = monthly[key].expenses;
    const remaining = income - expenses;
    const remClass = remaining < 0 ? 'rem-red' : remaining < 200 ? 'rem-tight' : 'rem-ok';

    const monthTitle = new Date(key + '-01T00:00:00').toLocaleDateString('en-AU', {
      month: 'short',
      year: 'numeric'
    });

    return `
      <div class="dashboard-month-card">
        <div class="dashboard-month-field">
          <div class="dashboard-month-label">Month</div>
          <div class="dashboard-month-value">${monthTitle}</div>
        </div>
        <div class="dashboard-month-field">
          <div class="dashboard-month-label">Income</div>
          <div class="dashboard-month-value">${money(income)}</div>
        </div>
        <div class="dashboard-month-field">
          <div class="dashboard-month-label">Expenses</div>
          <div class="dashboard-month-value">${money(expenses)}</div>
        </div>
        <div class="dashboard-month-field">
          <div class="dashboard-month-label">Remaining</div>
          <div class="dashboard-month-value ${remClass}">${money(remaining)}</div>
        </div>
      </div>
    `;
  }).join('');

  box.innerHTML = `
    <h3>Dashboard</h3>
    <div class="small" style="margin-bottom:12px;">Monthly view of your planned pays</div>
    <div class="dashboard-month-grid">${monthCards}</div>
    <div style="margin-top:16px;">
      <h4 style="margin:0 0 10px;">Monthly Outlook</h4>
      <canvas id="monthlyChart" height="260" style="width:100%;background:#181818;border:1px solid #333;border-radius:12px;"></canvas>
    </div>
  `;

  drawMonthlyChart();
}

function drawMonthlyChart() {
  const canvas = document.getElementById('monthlyChart');
  if (!canvas) return;

  const activePays = data.pays.filter(p => !p.archived);
  if (!activePays.length) return;

  const dpr = window.devicePixelRatio || 1;
  const cssWidth = canvas.clientWidth || 600;
  const cssHeight = 260;

  canvas.width = cssWidth * dpr;
  canvas.height = cssHeight * dpr;

  const ctx = canvas.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, cssWidth, cssHeight);

  const pad = { top: 20, right: 20, bottom: 40, left: 50 };
  const w = cssWidth - pad.left - pad.right;
  const h = cssHeight - pad.top - pad.bottom;

  const monthly = {};

  activePays.forEach(p => {
    const key = (p.date || '').slice(0, 7);
    if (!key) return;
    if (!monthly[key]) monthly[key] = { income: 0, expenses: 0 };
    monthly[key].income += Number(p.pay || 0);
    monthly[key].expenses += totals(p).exp;
  });

  const months = Object.keys(monthly).sort();
  if (!months.length) return;

  const points = months.map(m => {
    const income = monthly[m].income;
    const expenses = monthly[m].expenses;
    return { month: m, income, expenses, remaining: income - expenses };
  });

  const maxY = 10000;
  const steps = 10;
  const stepValue = maxY / steps;

  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1;
  ctx.font = '11px Arial';
  ctx.fillStyle = '#aaa';

  for (let i = 0; i <= steps; i++) {
    const y = pad.top + h - (i / steps) * h;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + w, y);
    ctx.stroke();
    ctx.fillText('$' + (i * stepValue / 1000).toFixed(0) + 'k', 8, y + 4);
  }

  ctx.strokeStyle = '#555';
  ctx.beginPath();
  ctx.moveTo(pad.left, pad.top);
  ctx.lineTo(pad.left, pad.top + h);
  ctx.lineTo(pad.left + w, pad.top + h);
  ctx.stroke();

  const groupWidth = w / months.length;
  const barWidth = Math.min(22, groupWidth * 0.22);

  function yPos(val) {
    const capped = Math.max(0, Math.min(maxY, val));
    return pad.top + h - (capped / maxY) * h;
  }

  points.forEach((p, i) => {
    const cx = pad.left + groupWidth * i + groupWidth / 2;
    const incomeX = cx - barWidth - 4;
    const expenseX = cx + 4;
    const incomeY = yPos(p.income);
    const expenseY = yPos(p.expenses);

    ctx.fillStyle = '#2d6cdf';
    ctx.fillRect(incomeX, incomeY, barWidth, pad.top + h - incomeY);

    ctx.fillStyle = '#b33a3a';
    ctx.fillRect(expenseX, expenseY, barWidth, pad.top + h - expenseY);

    const label = formatMonthLabel(p.month);
    ctx.fillStyle = '#aaa';
    ctx.textAlign = 'center';
    ctx.fillText(label, cx, pad.top + h + 18);
  });

  ctx.beginPath();
  points.forEach((p, i) => {
    const cx = pad.left + groupWidth * i + groupWidth / 2;
    const y = yPos(p.remaining);
    if (i === 0) ctx.moveTo(cx, y);
    else ctx.lineTo(cx, y);
  });
  ctx.strokeStyle = '#f1c40f';
  ctx.lineWidth = 2;
  ctx.stroke();

  points.forEach((p, i) => {
    const cx = pad.left + groupWidth * i + groupWidth / 2;
    const y = yPos(p.remaining);
    ctx.beginPath();
    ctx.arc(cx, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#f1c40f';
    ctx.fill();
  });

  ctx.textAlign = 'left';
}

function formatMonthLabel(ym) {
  const [y, m] = ym.split('-');
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString('en-AU', { month: 'short' });
}

window.addEventListener('resize', () => {
  if (currentTab === 'dashboard') drawMonthlyChart();
});


let openMenuPayId = null;

function togglePayMenu(id){
  openMenuPayId = openMenuPayId === id ? null : id;
  render();
}

function closePayMenu(){
  openMenuPayId = null;
  render();
}
function toggleCollapse(id){
  const pay = data.pays.find(x => x.id === id);
  if (!pay) return;
  pay.collapsed = !pay.collapsed;
  save();
  render();
}

function render() {
  renderSummary();
  renderDashboard();

  const box = document.getElementById('list');
  const activePays = data.pays
    .filter(p => !p.archived)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (!activePays.length) {
    box.innerHTML = '<div class="card">No pay periods yet.</div>';
    return;
  }

  box.innerHTML = activePays.map(p => {
    const t = totals(p);
    const s = stat(t.rem);

    return `
      <div class="pay-card ${p.collapsed ? 'collapsed' : ''}">
        <div class="pay-stripe ${s[0] === 'g' ? 'ok' : s[0] === 'y' ? 'tight' : 'red'}"></div>
        <div class="pay-content">
          <div class="pay-head">
            <div style="min-width:0;">
              <div class="pay-date">${dateFmt(p.date)}</div>
              <div class="pay-note">${escapeHtml(p.note || 'No notes')}</div>
            </div>
            <div class="pay-head-right">
              <div class="badge ${s[0] === 'g' ? 'ok' : s[0] === 'y' ? 'tight' : 'red'}">${s[1]}</div>
              <button class="btn btn-secondary pay-toggle" onclick="toggleCollapse('${p.id}')" title="${p.collapsed ? 'Expand' : 'Collapse'}">
                ${p.collapsed ? '＋' : '－'}
              </button>
            </div>
          </div>

          <div class="money-grid">
            <div class="money-box">
              <div class="money-label">--> $</div>
              <span class="money-value">${money(p.pay)}</span>
            </div>
            <div class="money-box">
              <div class="money-label">$ --></div>
              <span class="money-value">${money(t.exp)}</span>
            </div>
            <div class="money-box">
              <div class="money-label">Remaining</div>
              <span class="money-value">${money(t.rem)}</span>
            </div>
          </div>

          <div class="card-actions">
            <button class="btn btn-primary" onclick="addExp('${p.id}')">+ Expense</button>
            <button class="btn btn-secondary" onclick="closePay('${p.id}')">Close</button>
            <div class="menu-wrap">
              <button class="btn btn-secondary menu-btn" onclick="togglePayMenu('${p.id}')" title="More">⋯</button>
              ${openMenuPayId === p.id ? `
                <div class="menu-panel">
                  <button class="btn btn-secondary" onclick="editPay('${p.id}')">✏ Edit</button>
                  <button class="btn btn-danger" onclick="delPay('${p.id}')">✕ Delete</button>
                </div>
              ` : ''}
            </div>
          </div>

          ${p.showExpenseForm ? `
            <div class="inline-expense-form">
              ${data.templates.length ? `
                <div class="inline-expense-template-row">
                  <select onchange="applyExpenseTemplate('${p.id}', this.value)">
                    <option value="">Choose saved expense</option>
                    ${data.templates.map(t => `
                      <option value="${t.id}" ${p.selectedTemplateId === t.id ? 'selected' : ''}>
                        ${escapeHtml(t.name)} (${money(t.amount)})
                      </option>
                    `).join('')}
                  </select>
<input
  type="date"
  value="${escapeHtml(p.newExpenseDate || '')}"
  oninput="updateExpenseDraft('${p.id}','newExpenseDate', this.value)"
>
                </div>
              ` : ''}

              <div class="inline-expense-grid with-date">
                <input
                  type="text"
                  placeholder="Expense name"
                  value="${escapeHtml(p.newExpenseName || '')}"
                  oninput="updateExpenseDraft('${p.id}','newExpenseName', this.value)"
                >
                <input
                  type="number"
                  step="0.01"
                  placeholder="Amount"
                  value="${escapeHtml(p.newExpenseAmount || '')}"
                  oninput="updateExpenseDraft('${p.id}','newExpenseAmount', this.value)"
                >
                <select onchange="updateExpenseDraft('${p.id}','newExpenseCat', this.value)">
                  <option value="Fixed" ${(p.newExpenseCat || 'Fixed') === 'Fixed' ? 'selected' : ''}>Fixed</option>
                  <option value="Variable" ${(p.newExpenseCat || '') === 'Variable' ? 'selected' : ''}>Variable</option>
                  <option value="Optional" ${(p.newExpenseCat || '') === 'Optional' ? 'selected' : ''}>Optional</option>
                  <option value="Buffer" ${(p.newExpenseCat || '') === 'Buffer' ? 'selected' : ''}>Buffer</option>
                </select>
              </div>
              <div class="inline-expense-actions">
                <button class="btn btn-primary" onclick="saveInlineExp('${p.id}')">Add Expense</button>
                <button class="btn btn-secondary save-template-btn" onclick="saveExpenseTemplate('${p.id}')" title="Save template">💾</button>
                <button class="btn btn-secondary" onclick="cancelAddExp('${p.id}')">Cancel</button>
              </div>
            </div>
          ` : ''}

          <div class="expenses-wrap">
            ${(p.expenses || []).length ? `
              <div class="expense-list">
                ${(p.expenses || []).map(e => `
                  <div class="expense-row ${e.paid ? 'paid' : ''}">
                    <div class="expense-left">
                      <div class="expense-name" title="${escapeHtml(e.name)}">${escapeHtml(e.name)}</div>
                      <div class="expense-cat">${escapeHtml(e.cat || '')}</div>
${e.date ? `<div class="expense-meta">${new Date(e.date).toLocaleDateString('en-AU')}</div>` : ''}
                    </div>

                    <div class="expense-right">
                      <div class="expense-amount">${money(e.amount)}</div>
                      <div class="expense-buttons">
                        <button class="btn tick ${e.paid ? 'paid' : 'btn-secondary'}" onclick="togglePaid('${p.id}','${e.id}')">${e.paid ? '✓' : '□'}</button>
                        <button class="btn btn-danger" onclick="delExp('${p.id}','${e.id}')">X</button>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            ` : '<div class="empty-state">No expenses yet</div>'}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


function exportData() {
  const payload = {
    exportedAt: new Date().toISOString(),
    storageKey: K,
    data
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `budget-backup-${date}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function importData(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const parsed = JSON.parse(e.target.result);
      const imported = parsed && parsed.data ? parsed.data : parsed;

      if (!imported || typeof imported !== 'object') {
        alert('That file does not look like a valid budget backup.');
        return;
      }

      if (!Array.isArray(imported.pays)) imported.pays = [];
      if (!Array.isArray(imported.templates)) imported.templates = [];

      imported.pays.forEach(p => {
        if (typeof p.archived === 'undefined') p.archived = false;
        if (!Array.isArray(p.expenses)) p.expenses = [];
        p.expenses.forEach(exp => {
          if (typeof exp.paid === 'undefined') exp.paid = false;
        });
      });

      if (!confirm('Importing will replace the current data in this browser. Continue?')) {
        return;
      }

      data = imported;
      save();
      render();
      alert('Import complete.');
    } catch (err) {
      alert('Could not read that file as valid JSON.');
    } finally {
      event.target.value = '';
    }
  };
  reader.readAsText(file);
}

render();




let globalMenuOpen = false;

function toggleGlobalMenu(){
  globalMenuOpen = !globalMenuOpen;
  const el = document.getElementById('globalMenu');
  if (el) {
    el.style.display = globalMenuOpen ? 'grid' : 'none';
  }
}

document.addEventListener('click', function(event){
  const insideBottomMenu = event.target.closest('.bottom-bar .menu-wrap');
  if (insideBottomMenu) return;
  const el = document.getElementById('globalMenu');
  if (el && globalMenuOpen){
    globalMenuOpen = false;
    el.style.display = 'none';
  }
});
