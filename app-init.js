// ===== INITIALIZATION =====
function populateFilterDropdowns() {
  const cardSel = document.getElementById('filter-card');
  const expCardSel = document.getElementById('exp-card');
  cardSel.innerHTML = '<option value="">All Cards</option>';
  let expCardHtml = '';
  cards.forEach(c => {
    cardSel.innerHTML += `<option value="${c.name}">${c.name}</option>`;
    expCardHtml += `<option value="${c.name}">${c.name}</option>`;
  });
  expCardHtml += '<option value="__new__">+ Add New Card...</option>';
  expCardSel.innerHTML = expCardHtml;
}

// ===== MODAL SAVE HANDLERS =====
function handleSaveExpense() {
  try {
    const date = document.getElementById('exp-date').value;
    const amount = parseFloat(document.getElementById('exp-amount').value);
    const notes = document.getElementById('exp-desc').value.trim();

    let category = document.getElementById('exp-category').value;
    if (category === '__new__') {
      category = document.getElementById('exp-new-category').value.trim();
      if (!category) { alert('Please enter a category name.'); return; }
      if (!CATEGORIES.includes(category)) {
        CATEGORIES.push(category);
        refreshCategoryDropdowns();
      }
    }

    let cardName = document.getElementById('exp-card').value;
    if (cardName === '__new__') {
      cardName = document.getElementById('exp-new-card-name').value.trim();
      const cardLimit = parseFloat(document.getElementById('exp-new-card-limit').value) || 0;
      if (!cardName) { alert('Please enter a card name.'); return; }
      if (!cards.find(c => c.name.toLowerCase() === cardName.toLowerCase())) {
        cards.push({ id: gid(), name: cardName, limit: cardLimit });
        saveCards();
        populateFilterDropdowns();
      }
    }

    if (!date || !amount || amount <= 0 || !cardName) { alert('Please fill in date, amount, and card.'); return; }

    const matchedCard = cards.find(c => c.name.toLowerCase() === cardName.toLowerCase());
    const expense = { id: gid(), date, card: matchedCard ? matchedCard.name : cardName, amount, category, notes: notes || category };
    expenses.push(expense);
    saveExpenses();
    hideModal('modal-expense');
    clearExpenseForm();
    renderExpenses();
  } catch (err) {
    alert('Error saving expense: ' + err.message);
  }
}

function clearExpenseForm() {
  document.getElementById('exp-date').value = '';
  document.getElementById('exp-amount').value = '';
  document.getElementById('exp-desc').value = '';
  document.getElementById('exp-category').value = 'Food';
  document.getElementById('exp-new-category').style.display = 'none';
  document.getElementById('exp-new-category').value = '';
  document.getElementById('exp-new-card-fields').style.display = 'none';
  document.getElementById('exp-new-card-name').value = '';
  document.getElementById('exp-new-card-limit').value = '';
  const cardSel = document.getElementById('exp-card');
  if (cardSel.options.length > 0) cardSel.selectedIndex = 0;
}

function handleSaveCard() {
  try {
    const name = document.getElementById('card-name').value.trim();
    const limit = parseFloat(document.getElementById('card-limit').value);
    if (!name || !limit || limit <= 0) { alert('Please enter card name and limit.'); return; }
    const card = { id: gid(), name, limit };
    cards.push(card);
    saveCards();
    hideModal('modal-card');
    document.getElementById('card-name').value = '';
    document.getElementById('card-limit').value = '';
    populateFilterDropdowns();
    renderSettings();
  } catch (err) {
    alert('Error saving card: ' + err.message);
  }
}

function handleSaveBudget() {
  try {
    const category = document.getElementById('budget-category').value;
    const limit = parseFloat(document.getElementById('budget-amount').value);
    if (!limit || limit <= 0) { alert('Please enter a budget amount.'); return; }
    const existing = budgets.find(b => b.category === category);
    if (existing) {
      existing.limit = limit;
    } else {
      budgets.push({ id: gid(), category, limit, threshold: 80 });
    }
    saveBudgets();
    hideModal('modal-budget');
    document.getElementById('budget-amount').value = '';
    renderSettings();
  } catch (err) {
    alert('Error saving budget: ' + err.message);
  }
}

// Custom dropdown handlers
function onCategoryChange(sel) {
  const newField = document.getElementById('exp-new-category');
  if (sel.value === '__new__') {
    newField.style.display = 'block';
    newField.focus();
  } else {
    newField.style.display = 'none';
    newField.value = '';
  }
}

function onCardChange(sel) {
  const newFields = document.getElementById('exp-new-card-fields');
  if (sel.value === '__new__') {
    newFields.style.display = 'flex';
    document.getElementById('exp-new-card-name').focus();
  } else {
    newFields.style.display = 'none';
    document.getElementById('exp-new-card-name').value = '';
    document.getElementById('exp-new-card-limit').value = '';
  }
}

// ===== INIT =====
let initDone = false;

function init() {
  loadData();
  populateFilterDropdowns();
  refreshCategoryDropdowns();
  renderExpenses();
  if (!initDone) {
    initDone = true;
    try { acceptPendingShares(); } catch(e) {}
    try { renderSharingUI(); } catch(e) {}
  }
}
