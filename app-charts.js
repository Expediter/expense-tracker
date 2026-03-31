// ===== CHARTS TAB =====
function renderCharts() {
  renderCategoryChart();
  renderCardChart();
  renderUtilisationChart();
  renderDailyChart();
}

function renderCategoryChart() {
  if (chartInstances.category) chartInstances.category.destroy();
  const data = {};
  expenses.forEach(e => { data[e.category] = (data[e.category] || 0) + e.amount; });
  const labels = Object.keys(data).sort((a, b) => data[b] - data[a]);
  const values = labels.map(l => data[l]);
  const colors = labels.map(l => CAT_COLORS[l] || '#9e9e9e');
  const ctx = document.getElementById('categoryChart').getContext('2d');
  chartInstances.category = new Chart(ctx, {
    type: 'doughnut',
    data: { labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 2, borderColor: '#fff' }] },
    options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, padding: 8, font: { size: 11 } } } } }
  });
}

function renderCardChart() {
  if (chartInstances.card) chartInstances.card.destroy();
  const data = [];
  cards.forEach(c => { const s = getCardSpends(c.name); if (s > 0) data.push({ name: c.name, spend: s }); });
  data.sort((a, b) => b.spend - a.spend);
  const ctx = document.getElementById('cardChart').getContext('2d');
  chartInstances.card = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map(d => d.name),
      datasets: [{ label: 'Spends', data: data.map(d => d.spend), backgroundColor: '#1a73e8cc', borderRadius: 6 }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { callback: v => '₹' + v } } }
    }
  });
}

function renderUtilisationChart() {
  if (chartInstances.util) chartInstances.util.destroy();
  const data = cards.filter(c => getCardSpends(c.name) > 0).map(c => ({ name: c.name, util: getCardUtil(c.name) }));
  const ctx = document.getElementById('utilisationChart').getContext('2d');
  chartInstances.util = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map(d => d.name),
      datasets: [{ label: 'Util %', data: data.map(d => Math.min(d.util, 100)), backgroundColor: data.map(d => utilColor(d.util)), borderRadius: 6 }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => data[ctx.dataIndex].util.toFixed(1) + '%' } }
      },
      scales: { y: { beginAtZero: true, max: 100, ticks: { callback: v => v + '%' } } }
    }
  });
}

function renderDailyChart() {
  if (chartInstances.daily) chartInstances.daily.destroy();
  const dailyMap = {};
  expenses.forEach(e => { dailyMap[e.date] = (dailyMap[e.date] || 0) + e.amount; });
  const dates = Object.keys(dailyMap).sort();
  const ctx = document.getElementById('dailyChart').getContext('2d');
  chartInstances.daily = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dates.map(d => fmtDate(d).replace(/\s\d{4}$/, '')),
      datasets: [{
        label: 'Daily Spend',
        data: dates.map(d => dailyMap[d]),
        borderColor: '#1a73e8',
        backgroundColor: '#1a73e820',
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointBackgroundColor: '#1a73e8'
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { callback: v => '₹' + v } } }
    }
  });
}

// ===== INSIGHTS TAB =====
function renderInsights() {
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const uniqueDays = new Set(expenses.map(e => e.date)).size;
  const activeCards = new Set(expenses.map(e => e.card)).size;
  const activeCats = new Set(expenses.map(e => e.category)).size;

  document.getElementById('quick-stats-row').innerHTML =
    `<div class="quick-stat"><div class="qs-value">${fmt(total)}</div><div class="qs-label">Total</div></div>` +
    `<div class="quick-stat"><div class="qs-value">${expenses.length}</div><div class="qs-label">Txns</div></div>` +
    `<div class="quick-stat"><div class="qs-value">${activeCards}</div><div class="qs-label">Cards</div></div>` +
    `<div class="quick-stat"><div class="qs-value">${activeCats}</div><div class="qs-label">Categories</div></div>`;

  const insights = [];
  if (expenses.length === 0) {
    document.getElementById('insights-list').innerHTML = '<div class="empty-state"><div class="empty-icon">💡</div><div class="empty-text">Add expenses to see insights</div></div>';
    return;
  }

  // Avg daily
  const avgDaily = uniqueDays > 0 ? total / uniqueDays : 0;
  insights.push({ icon: '📈', title: 'Average Daily Spend', detail: `${fmt(avgDaily)} per active day across ${uniqueDays} days`, type: 'info' });

  // Biggest expense
  const biggest = expenses.reduce((max, e) => e.amount > max.amount ? e : max, expenses[0]);
  insights.push({ icon: '⬆️', title: 'Biggest Expense', detail: `${fmt(biggest.amount)} on ${biggest.notes} (${fmtDate(biggest.date)})`, type: biggest.amount > avgDaily * 3 ? 'warn' : 'info' });

  // Top category
  const catTotals = {};
  expenses.forEach(e => { catTotals[e.category] = (catTotals[e.category] || 0) + e.amount; });
  const topCat = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0];
  if (topCat) {
    const pct = (topCat[1] / total * 100).toFixed(0);
    insights.push({ icon: '🏷️', title: `Top Category: ${topCat[0]}`, detail: `${fmt(topCat[1])} (${pct}% of total)`, type: pct > 40 ? 'warn' : 'info' });
  }

  // Most used card
  const cardTotals = {};
  expenses.forEach(e => { cardTotals[e.card] = (cardTotals[e.card] || 0) + e.amount; });
  const topCard = Object.entries(cardTotals).sort((a, b) => b[1] - a[1])[0];
  if (topCard) insights.push({ icon: '💳', title: `Most Used Card: ${topCard[0]}`, detail: `${fmt(topCard[1])} across multiple transactions`, type: 'info' });

  // Highest spending day
  const dailyTotals = {};
  expenses.forEach(e => { dailyTotals[e.date] = (dailyTotals[e.date] || 0) + e.amount; });
  const highDay = Object.entries(dailyTotals).sort((a, b) => b[1] - a[1])[0];
  if (highDay) insights.push({ icon: '🔥', title: 'Highest Spending Day', detail: `${fmt(highDay[1])} on ${fmtDate(highDay[0])}`, type: highDay[1] > avgDaily * 2 ? 'warn' : 'info' });

  // Most frugal day
  const lowDay = Object.entries(dailyTotals).sort((a, b) => a[1] - b[1])[0];
  if (lowDay) insights.push({ icon: '🌿', title: 'Most Frugal Day', detail: `${fmt(lowDay[1])} on ${fmtDate(lowDay[0])}`, type: 'good' });

  // Recurring
  const noteFreq = {};
  expenses.forEach(e => { const k = e.notes.toLowerCase().trim(); noteFreq[k] = (noteFreq[k] || 0) + 1; });
  Object.entries(noteFreq).filter(([, c]) => c >= 3).sort((a, b) => b[1] - a[1]).slice(0, 3).forEach(([note, count]) => {
    const t = expenses.filter(e => e.notes.toLowerCase().trim() === note).reduce((s, e) => s + e.amount, 0);
    insights.push({ icon: '🔄', title: `Recurring: ${note.charAt(0).toUpperCase() + note.slice(1)}`, detail: `${count} times, total ${fmt(t)}`, type: 'info' });
  });

  // Weekend vs weekday
  const weekday = expenses.filter(e => { const d = new Date(e.date + 'T00:00:00').getDay(); return d > 0 && d < 6; });
  const weekend = expenses.filter(e => { const d = new Date(e.date + 'T00:00:00').getDay(); return d === 0 || d === 6; });
  const wdDays = Math.max(1, new Set(weekday.map(e => e.date)).size);
  const weDays = Math.max(1, new Set(weekend.map(e => e.date)).size);
  const avgWd = weekday.reduce((s, e) => s + e.amount, 0) / wdDays;
  const avgWe = weekend.reduce((s, e) => s + e.amount, 0) / weDays;
  insights.push({ icon: '📅', title: 'Weekday vs Weekend', detail: `Avg ${fmt(avgWd)}/weekday vs ${fmt(avgWe)}/weekend`, type: avgWe > avgWd * 1.5 ? 'warn' : 'info' });

  // Highest card utilisation
  const highUtil = cards.filter(c => getCardSpends(c.name) > 0).sort((a, b) => getCardUtil(b.name) - getCardUtil(a.name))[0];
  if (highUtil) {
    const u = getCardUtil(highUtil.name);
    insights.push({ icon: '⚠️', title: 'Highest Card Utilisation', detail: `${highUtil.name} at ${u.toFixed(1)}% of ${fmt(highUtil.limit)} limit`, type: u > 80 ? 'warn' : 'info' });
  }

  // Projected monthly
  if (expenses.length > 1) {
    const sorted = [...expenses].sort((a, b) => a.date.localeCompare(b.date));
    const first = new Date(sorted[0].date + 'T00:00:00');
    const last = new Date(sorted[sorted.length - 1].date + 'T00:00:00');
    const daysBetween = Math.max(1, Math.round((last - first) / 86400000));
    const rate = total / daysBetween;
    insights.push({ icon: '📊', title: 'Projected Monthly Spend', detail: `${fmt(rate * 30)} at current pace (${fmt(rate)}/day)`, type: rate * 30 > 50000 ? 'warn' : 'info' });
  }

  const typeColor = { info: 'var(--primary)', good: 'var(--success)', warn: 'var(--orange)' };
  let html = '';
  insights.forEach(i => {
    html += `<div class="insight-item" style="border-left:3px solid ${typeColor[i.type] || typeColor.info};">
      <span class="insight-icon">${i.icon}</span>
      <div class="insight-text"><strong>${i.title}</strong><br><span style="color:var(--text-secondary);font-size:0.82rem;">${i.detail}</span></div>
    </div>`;
  });
  document.getElementById('insights-list').innerHTML = html;
}

// ===== SETTINGS TAB =====
function renderSettings() {
  // Cards list
  let cardsHtml = '';
  cards.forEach(c => {
    cardsHtml += `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid rgba(0,0,0,0.05);"><div><strong>${c.name}</strong><br><span style="font-size:0.82rem;color:var(--text-secondary);">Limit: ${fmt(c.limit)}</span></div><button class="delete-btn" onclick="deleteCard('${c.id}')">🗑️</button></div>`;
  });
  document.getElementById('settings-cards-list').innerHTML = cardsHtml;

  // Budgets list
  let budHtml = '';
  budgets.forEach(b => {
    budHtml += `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid rgba(0,0,0,0.05);"><div><strong>${b.category}</strong><br><span style="font-size:0.82rem;color:var(--text-secondary);">${fmt(b.limit)}/month · Alert at ${b.threshold}%</span></div><button class="delete-btn" onclick="deleteBudget('${b.id}')">🗑️</button></div>`;
  });
  document.getElementById('settings-budgets-list').innerHTML = budHtml;

  // Data summary
  document.getElementById('data-summary').innerHTML =
    `<div style="font-size:0.88rem;line-height:1.8;">Total Expenses: <strong>${expenses.length}</strong><br>Total Cards: <strong>${cards.length}</strong><br>Categories Tracked: <strong>${new Set(expenses.map(e => e.category)).size}</strong><br>Date Range: <strong>${expenses.length > 0 ? fmtDate(expenses.reduce((m, e) => e.date < m ? e.date : m, expenses[0].date)) + ' - ' + fmtDate(expenses.reduce((m, e) => e.date > m ? e.date : m, expenses[0].date)) : 'N/A'}</strong></div>`;
}

function deleteCard(id) { cards = cards.filter(c => c.id !== id); saveCards(); renderSettings(); }
function deleteBudget(id) { budgets = budgets.filter(b => b.id !== id); saveBudgets(); renderSettings(); }

// ===== CSV EXPORT =====
function exportCSV() {
  const sorted = [...expenses].sort((a, b) => a.date.localeCompare(b.date));
  let csv = 'Date,Card,Amount,Category,Notes\n';
  sorted.forEach(e => { csv += `${fmtDate(e.date)},${e.card},${e.amount},${e.category},"${e.notes}"\n`; });
  csv += '\n\nCard Summary\nCard,Limit,Spends,Utilisation %\n';
  cards.forEach(c => { csv += `${c.name},${c.limit},${getCardSpends(c.name)},${getCardUtil(c.name).toFixed(2)}\n`; });
  csv += '\n\nCategory Summary\nCategory,Total Spend\n';
  CATEGORIES.forEach(cat => { const t = getCategorySpends(cat); if (t > 0) csv += `${cat},${t}\n`; });

  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `Expenses_${today()}.csv`;
  a.click();
}
