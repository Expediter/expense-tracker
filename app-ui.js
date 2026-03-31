// ===== TAB NAVIGATION =====
function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
  document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
  if (tabId === 'tab-expenses') renderExpenses();
  else if (tabId === 'tab-cards') renderCards();
  else if (tabId === 'tab-monthly') renderMonthly();
  else if (tabId === 'tab-charts') renderCharts();
  else if (tabId === 'tab-budget') renderBudget();
  else if (tabId === 'tab-insights') renderInsights();
  else if (tabId === 'tab-settings') renderSettings();
}

// ===== MODALS =====
function showModal(id) { document.getElementById(id).classList.add('active'); }
function hideModal(id) { document.getElementById(id).classList.remove('active'); }

// ===== SORTING STATE =====
let sortField = 'date';
let sortDir = 'desc';
let selectedIds = new Set();

function setSort(field) {
  if (sortField === field) {
    sortDir = sortDir === 'asc' ? 'desc' : 'asc';
  } else {
    sortField = field;
    sortDir = (field === 'date' || field === 'amount') ? 'desc' : 'asc';
  }
  // Update sort button UI
  document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.sort === field) {
      btn.classList.add('active');
      const arrow = sortDir === 'asc' ? '↑' : '↓';
      btn.textContent = btn.dataset.sort.charAt(0).toUpperCase() + btn.dataset.sort.slice(1) + ' ' + arrow;
    } else {
      btn.textContent = btn.dataset.sort.charAt(0).toUpperCase() + btn.dataset.sort.slice(1);
    }
  });
  renderExpenses();
}

function sortExpenses(list) {
  return list.sort((a, b) => {
    let cmp = 0;
    if (sortField === 'date') cmp = a.date.localeCompare(b.date);
    else if (sortField === 'amount') cmp = a.amount - b.amount;
    else if (sortField === 'card') cmp = a.card.localeCompare(b.card);
    else if (sortField === 'category') cmp = a.category.localeCompare(b.category);
    return sortDir === 'desc' ? -cmp : cmp;
  });
}

// ===== EXPENSES TAB =====
function renderExpenses() {
  let filtered = [...expenses];
  const q = (document.getElementById('search-input').value || '').toLowerCase();
  const fc = document.getElementById('filter-card').value;
  const fcat = document.getElementById('filter-category').value;
  const df = document.getElementById('filter-date-from').value;
  const dt = document.getElementById('filter-date-to').value;
  const dateOn = document.getElementById('date-range-row').style.display !== 'none';

  if (q) filtered = filtered.filter(e => e.notes.toLowerCase().includes(q) || e.card.toLowerCase().includes(q) || e.category.toLowerCase().includes(q));
  if (fc) filtered = filtered.filter(e => e.card === fc);
  if (fcat) filtered = filtered.filter(e => e.category === fcat);
  if (dateOn && df) filtered = filtered.filter(e => e.date >= df);
  if (dateOn && dt) filtered = filtered.filter(e => e.date <= dt);

  filtered = sortExpenses(filtered);

  const total = filtered.reduce((s, e) => s + e.amount, 0);
  document.getElementById('total-spend').textContent = fmt(total);
  document.getElementById('txn-count').textContent = filtered.length + ' transactions';

  // Show/hide bulk bar
  const bulkBar = document.getElementById('bulk-bar');
  bulkBar.style.display = filtered.length > 0 ? 'flex' : 'none';
  updateBulkCount();

  const container = document.getElementById('expense-list');
  if (filtered.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">🔍</div><div class="empty-text">No expenses found</div></div>';
    return;
  }

  // Group by date for display
  const grouped = {};
  filtered.forEach(e => { (grouped[e.date] = grouped[e.date] || []).push(e); });

  let html = '';
  const dateKeys = Object.keys(grouped);
  if (sortField === 'date') {
    dateKeys.sort((a, b) => sortDir === 'desc' ? b.localeCompare(a) : a.localeCompare(b));
  }

  dateKeys.forEach(date => {
    const dayTotal = grouped[date].reduce((s, e) => s + e.amount, 0);
    html += `<div class="section-header" style="display:flex;justify-content:space-between;"><span>${fmtDate(date)}</span><span style="color:var(--text-secondary);font-weight:400;">${fmt(dayTotal)}</span></div>`;
    grouped[date].forEach(e => {
      const color = CAT_COLORS[e.category] || '#9e9e9e';
      const checked = selectedIds.has(e.id) ? 'checked' : '';
      html += `<div class="expense-item">
        <input type="checkbox" class="expense-cb" data-id="${e.id}" ${checked} onchange="toggleSelect('${e.id}', this.checked)">
        <div class="left" style="flex:1;min-width:0;">
          <div class="desc">${escHtml(e.notes)}</div>
          <div class="meta">💳 <span style="color:var(--primary)">${escHtml(e.card)}</span> · <span style="background:${color}22;color:${color};padding:1px 8px;border-radius:10px;font-size:0.72rem;">${e.category}</span></div>
        </div>
        <div class="right">
          <div class="amount">${fmt(e.amount)}</div>
        </div>
      </div>`;
    });
  });
  container.innerHTML = html;
}

function escHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

function toggleSelect(id, checked) {
  if (checked) selectedIds.add(id); else selectedIds.delete(id);
  updateBulkCount();
}

function toggleSelectAll(checked) {
  const cbs = document.querySelectorAll('.expense-cb');
  cbs.forEach(cb => { cb.checked = checked; const id = cb.dataset.id; if (checked) selectedIds.add(id); else selectedIds.delete(id); });
  updateBulkCount();
}

function updateBulkCount() {
  const el = document.getElementById('selected-count');
  if (el) el.textContent = selectedIds.size + ' selected';
}

async function bulkDelete() {
  if (selectedIds.size === 0) { alert('No expenses selected.'); return; }
  if (!confirm(`Delete ${selectedIds.size} expense(s)?`)) return;
  const idsToDelete = [...selectedIds];
  expenses = expenses.filter(e => !selectedIds.has(e.id));
  selectedIds.clear();
  await deleteExpenseDocs(idsToDelete);
  document.getElementById('select-all-cb').checked = false;
  renderExpenses();
}

async function deleteExpense(id) {
  expenses = expenses.filter(e => e.id !== id);
  selectedIds.delete(id);
  await deleteExpenseDoc(id);
  renderExpenses();
}

// ===== CARDS TAB =====
function renderCards() {
  const totalLimit = cards.reduce((s, c) => s + c.limit, 0);
  const totalSpends = cards.reduce((s, c) => s + getCardSpends(c.name), 0);
  const overallUtil = totalLimit > 0 ? (totalSpends / totalLimit) * 100 : 0;

  document.getElementById('cards-total-limit').textContent = fmt(totalLimit);
  document.getElementById('cards-total-spends').textContent = fmt(totalSpends);
  document.getElementById('cards-overall-util').textContent = overallUtil.toFixed(1) + '%';

  let html = '<table><thead><tr><th style="text-align:left">Card</th><th style="text-align:right">Limit</th><th style="text-align:right">Spends</th><th style="text-align:right">Util %</th></tr></thead><tbody>';
  cards.forEach(c => {
    const spends = getCardSpends(c.name);
    const util = c.limit > 0 ? (spends / c.limit) * 100 : 0;
    html += `<tr><td>${escHtml(c.name)}</td><td style="text-align:right">${fmt(c.limit)}</td><td style="text-align:right">${fmt(spends)}</td><td style="text-align:right;color:${utilColor(util)};font-weight:600;">${util.toFixed(1)}%</td></tr>`;
  });
  html += '</tbody></table>';
  document.getElementById('cards-table-container').innerHTML = html;

  let barsHtml = '<div class="section-header">Utilisation Overview</div>';
  cards.forEach(c => {
    const util = getCardUtil(c.name);
    const color = utilColor(util);
    barsHtml += `<div class="card-bar-item"><div class="bar-label"><span>${escHtml(c.name)}</span><span style="color:${color};font-weight:600;">${util.toFixed(1)}%</span></div><div class="progress-bar"><div class="progress-fill" style="width:${Math.min(util, 100)}%;background:${color};"></div></div></div>`;
  });
  document.getElementById('cards-visual-bars').innerHTML = barsHtml;
}

// ===== MONTHLY TAB =====
function renderMonthly() {
  document.getElementById('month-label').textContent = fmtMonthYear(currentMonth, currentYear);
  const exps = getExpensesForMonth(currentMonth, currentYear);
  const total = exps.reduce((s, e) => s + e.amount, 0);
  const days = new Set(exps.map(e => e.date)).size;
  const avg = days > 0 ? total / days : 0;

  document.getElementById('monthly-total').textContent = fmt(total);
  document.getElementById('monthly-txn').textContent = exps.length;
  document.getElementById('monthly-avg').textContent = fmt(avg);
  document.getElementById('monthly-days').textContent = days;

  // Get all unique categories from expenses (not just defaults)
  const allCats = [...new Set([...CATEGORIES, ...expenses.map(e => e.category)])];

  let catHtml = '';
  allCats.forEach(cat => {
    const amt = getCategorySpends(cat, exps);
    if (amt > 0) {
      const pct = total > 0 ? (amt / total * 100).toFixed(0) : 0;
      catHtml += `<div style="display:flex;justify-content:space-between;padding:8px 16px;border-bottom:1px solid rgba(0,0,0,0.05);"><span>${CAT_EMOJI[cat] || '📦'} ${escHtml(cat)}</span><span><strong>${fmt(amt)}</strong> <span style="color:var(--text-secondary);font-size:0.8rem;">(${pct}%)</span></span></div>`;
    }
  });
  document.getElementById('monthly-category-breakdown').innerHTML = catHtml || '<div class="empty-state"><div class="empty-text">No data</div></div>';

  let cardHtml = '';
  cards.forEach(c => {
    const amt = exps.filter(e => e.card === c.name).reduce((s, e) => s + e.amount, 0);
    if (amt > 0) cardHtml += `<div style="display:flex;justify-content:space-between;padding:8px 16px;border-bottom:1px solid rgba(0,0,0,0.05);"><span>💳 ${escHtml(c.name)}</span><strong>${fmt(amt)}</strong></div>`;
  });
  document.getElementById('monthly-card-breakdown').innerHTML = cardHtml || '<div class="empty-state"><div class="empty-text">No data</div></div>';

  renderMonthlyDailyChart(exps);
}

function renderMonthlyDailyChart(exps) {
  if (chartInstances.monthlyDaily) chartInstances.monthlyDaily.destroy();
  const dailyMap = {};
  exps.forEach(e => { dailyMap[e.date] = (dailyMap[e.date] || 0) + e.amount; });
  const dates = Object.keys(dailyMap).sort();
  const ctx = document.getElementById('monthlyDailyChart').getContext('2d');
  chartInstances.monthlyDaily = new Chart(ctx, {
    type: 'bar',
    data: { labels: dates.map(d => d.split('-')[2]), datasets: [{ label: 'Spend', data: dates.map(d => dailyMap[d]), backgroundColor: '#1a73e880', borderRadius: 4 }] },
    options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { callback: v => '₹' + v } } } }
  });
}

// ===== BUDGET TAB =====
function renderBudget() {
  document.getElementById('budget-month-label').textContent = fmtMonthYear(budgetMonth, budgetYear);
  const exps = getExpensesForMonth(budgetMonth, budgetYear);
  const totalBudget = budgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent = budgets.reduce((s, b) => s + getCategorySpends(b.category, exps), 0);
  const pct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  document.getElementById('health-pct').textContent = pct.toFixed(1) + '%';
  document.getElementById('health-pct').style.color = utilColor(pct);
  const bar = document.getElementById('health-bar');
  bar.style.width = Math.min(pct, 100) + '%';
  bar.style.background = utilColor(pct);

  let critHtml = '';
  budgets.forEach(b => {
    const spent = getCategorySpends(b.category, exps);
    const p = b.limit > 0 ? (spent / b.limit) * 100 : 0;
    if (p >= 80) {
      const cls = p >= 100 ? '' : 'warn';
      critHtml += `<div class="alert-card ${cls}">⚠️ <strong>${escHtml(b.category)}</strong>: ${p.toFixed(0)}% used (${fmt(spent)} of ${fmt(b.limit)})</div>`;
    }
  });
  cards.forEach(c => {
    const u = getCardUtil(c.name);
    if (u >= 50) critHtml += `<div class="alert-card ${u >= 80 ? '' : 'warn'}">💳 <strong>${escHtml(c.name)}</strong>: ${u.toFixed(1)}% utilisation</div>`;
  });
  document.getElementById('critical-alerts').innerHTML = critHtml || '<p style="color:var(--text-secondary);padding:8px 0;font-size:0.88rem;">All budgets healthy ✅</p>';

  let listHtml = '';
  budgets.forEach(b => {
    const spent = getCategorySpends(b.category, exps);
    const p = b.limit > 0 ? (spent / b.limit) * 100 : 0;
    const remaining = Math.max(0, b.limit - spent);
    const color = utilColor(p);
    listHtml += `<div class="budget-item">
      <div class="budget-header"><span class="budget-category">${CAT_EMOJI[b.category] || '📦'} ${escHtml(b.category)}</span><span class="badge ${utilClass(p)}">${utilLabel(p)}</span></div>
      <div class="budget-amounts">${fmt(spent)} of ${fmt(b.limit)} · ${fmt(remaining)} left</div>
      <div class="progress-bar" style="margin-top:6px;"><div class="progress-fill" style="width:${Math.min(p, 100)}%;background:${color};"></div></div>
    </div>`;
  });
  document.getElementById('budget-list').innerHTML = listHtml;
}

// ===== FILE IMPORT (CSV / Numbers) =====
function handleFileUpload(file) {
  if (!file) return;
  const name = file.name.toLowerCase();

  if (name.endsWith('.csv')) {
    const reader = new FileReader();
    reader.onload = (e) => parseCSV(e.target.result);
    reader.readAsText(file);
  } else {
    alert('Please upload a .csv file.\n\nFor .numbers files, use the converter script:\npython3 convert-numbers.py "file.numbers"');
  }
}

async function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) { alert('CSV file appears empty.'); return; }

  // Detect header
  const header = lines[0].toLowerCase();
  const hasHeader = header.includes('date') || header.includes('amount') || header.includes('card');
  const startIdx = hasHeader ? 1 : 0;

  let imported = 0;
  let skipped = 0;

  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parse CSV respecting quotes
    const cols = parseCSVLine(line);
    if (cols.length < 3) { skipped++; continue; }

    // Try to detect column mapping from header
    let date, card, amount, category, notes;

    if (hasHeader) {
      const headerCols = parseCSVLine(lines[0]);
      const map = {};
      headerCols.forEach((h, idx) => {
        const hl = h.toLowerCase().trim();
        if (hl.includes('date')) map.date = idx;
        else if (hl.includes('card')) map.card = idx;
        else if (hl.includes('amount') || hl.includes('₹') || hl.includes('$')) map.amount = idx;
        else if (hl.includes('category') || hl.includes('cat')) map.category = idx;
        else if (hl.includes('note') || hl.includes('desc') || hl.includes('description')) map.notes = idx;
      });
      date = cols[map.date !== undefined ? map.date : 0];
      card = cols[map.card !== undefined ? map.card : 1];
      amount = cols[map.amount !== undefined ? map.amount : 2];
      category = cols[map.category !== undefined ? map.category : 3];
      notes = cols[map.notes !== undefined ? map.notes : 4] || '';
    } else {
      // Assume: Date, Card, Amount, Category, Notes
      date = cols[0]; card = cols[1]; amount = cols[2]; category = cols[3] || 'Other'; notes = cols[4] || '';
    }

    // Parse date
    const parsedDate = parseFlexibleDate(date);
    if (!parsedDate) { skipped++; continue; }

    // Parse amount
    const parsedAmt = parseFloat(String(amount).replace(/[₹$,\s]/g, ''));
    if (isNaN(parsedAmt) || parsedAmt <= 0) { skipped++; continue; }

    // Card - auto add if missing
    const cardName = (card || '').trim();
    if (cardName && !cards.find(c => c.name.toLowerCase() === cardName.toLowerCase())) {
      cards.push({ id: gid(), name: cardName, limit: 0 });
    }
    const matchedCard = cards.find(c => c.name.toLowerCase() === cardName.toLowerCase());

    // Category - auto add if missing
    const catName = (category || 'Other').trim();
    if (catName && !CATEGORIES.includes(catName)) {
      CATEGORIES.push(catName);
    }

    expenses.push({
      id: gid(),
      date: parsedDate,
      card: matchedCard ? matchedCard.name : cardName,
      amount: parsedAmt,
      category: catName,
      notes: (notes || '').trim()
    });
    imported++;
  }

  // Batch save new cards and expenses to Firestore
  const newCards = cards.filter(c => !DEFAULT_CARDS.find(d => d.id === c.id));
  if (newCards.length > 0) await saveCardsBatch(newCards);
  const newExps = expenses.slice(expenses.length - imported);
  if (newExps.length > 0) await saveExpensesBatch(newExps);
  refreshCategoryDropdowns();
  populateFilterDropdowns();
  renderExpenses();
  showImportStatus(`Imported ${imported} expense(s)${skipped > 0 ? `, ${skipped} skipped` : ''}.`);
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; }
    else if (ch === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
    else { current += ch; }
  }
  result.push(current.trim());
  return result;
}

function parseFlexibleDate(str) {
  if (!str) return null;
  str = str.trim();
  // Try ISO: 2026-03-01
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  // Try DD/MM/YYYY or DD-MM-YYYY
  let m = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
  // Try "1 Mar 2026" or "01 March 2026"
  const months = {jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12,
    january:1,february:2,march:3,april:4,june:6,july:7,august:8,september:9,october:10,november:11,december:12};
  m = str.match(/^(\d{1,2})\s+(\w+)\s+(\d{4})$/i);
  if (m && months[m[2].toLowerCase()]) {
    return `${m[3]}-${String(months[m[2].toLowerCase()]).padStart(2,'0')}-${m[1].padStart(2,'0')}`;
  }
  // Try MM/DD/YYYY
  m = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) return `${m[3]}-${m[1].padStart(2,'0')}-${m[2].padStart(2,'0')}`;
  // Try Date.parse as last resort
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  }
  return null;
}


function showImportStatus(msg) {
  // Show status temporarily above expense list
  const el = document.createElement('div');
  el.className = 'import-status';
  el.textContent = '✅ ' + msg;
  const list = document.getElementById('expense-list');
  list.parentNode.insertBefore(el, list);
  setTimeout(() => el.remove(), 4000);
}

function refreshCategoryDropdowns() {
  // Update all category dropdowns with any new custom categories
  const allCats = [...new Set([...CATEGORIES])];
  ['exp-category', 'filter-category', 'budget-category'].forEach(selId => {
    const sel = document.getElementById(selId);
    if (!sel) return;
    const currentVal = sel.value;
    const isFilter = selId === 'filter-category';
    const isExpense = selId === 'exp-category';
    let html = isFilter ? '<option value="">All Categories</option>' : '';
    allCats.forEach(cat => { html += `<option value="${cat}">${cat}</option>`; });
    if (isExpense) html += '<option value="__new__">+ Add New Category...</option>';
    sel.innerHTML = html;
    sel.value = currentVal;
  });
}
