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

function setupEventListeners() {
  // Tab navigation
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // FAB
  document.getElementById('fab-add').addEventListener('click', () => {
    document.getElementById('exp-date').value = today();
    populateFilterDropdowns();
    // Reset custom fields
    document.getElementById('exp-new-category').style.display = 'none';
    document.getElementById('exp-new-card-fields').style.display = 'none';
    showModal('modal-expense');
  });

  // Expense modal - category change for custom add
  document.getElementById('exp-category').addEventListener('change', function() {
    const newField = document.getElementById('exp-new-category');
    if (this.value === '__new__') {
      newField.style.display = 'block';
      newField.focus();
    } else {
      newField.style.display = 'none';
      newField.value = '';
    }
  });

  // Expense modal - card change for custom add
  document.getElementById('exp-card').addEventListener('change', function() {
    const newFields = document.getElementById('exp-new-card-fields');
    if (this.value === '__new__') {
      newFields.style.display = 'flex';
      document.getElementById('exp-new-card-name').focus();
    } else {
      newFields.style.display = 'none';
      document.getElementById('exp-new-card-name').value = '';
      document.getElementById('exp-new-card-limit').value = '';
    }
  });

  // Save expense
  document.getElementById('btn-cancel-expense').addEventListener('click', () => hideModal('modal-expense'));
  document.getElementById('btn-save-expense').addEventListener('click', () => {
    const date = document.getElementById('exp-date').value;
    const amount = parseFloat(document.getElementById('exp-amount').value);
    const notes = document.getElementById('exp-desc').value.trim();

    // Handle category
    let category = document.getElementById('exp-category').value;
    if (category === '__new__') {
      category = document.getElementById('exp-new-category').value.trim();
      if (!category) { alert('Please enter a category name.'); return; }
      if (!CATEGORIES.includes(category)) {
        CATEGORIES.push(category);
        refreshCategoryDropdowns();
      }
    }

    // Handle card
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
    expenses.push({ id: gid(), date, card: matchedCard ? matchedCard.name : cardName, amount, category, notes: notes || category });
    saveExpenses();
    hideModal('modal-expense');
    // Reset form
    document.getElementById('exp-amount').value = '';
    document.getElementById('exp-desc').value = '';
    document.getElementById('exp-new-category').style.display = 'none';
    document.getElementById('exp-new-category').value = '';
    document.getElementById('exp-new-card-fields').style.display = 'none';
    document.getElementById('exp-new-card-name').value = '';
    document.getElementById('exp-new-card-limit').value = '';
    renderExpenses();
  });

  // Card modal
  document.getElementById('btn-add-card').addEventListener('click', () => showModal('modal-card'));
  document.getElementById('btn-cancel-card').addEventListener('click', () => hideModal('modal-card'));
  document.getElementById('btn-save-card').addEventListener('click', () => {
    const name = document.getElementById('card-name').value.trim();
    const limit = parseFloat(document.getElementById('card-limit').value);
    if (!name || !limit || limit <= 0) { alert('Please enter card name and limit.'); return; }
    cards.push({ id: gid(), name, limit });
    saveCards();
    hideModal('modal-card');
    document.getElementById('card-name').value = '';
    document.getElementById('card-limit').value = '';
    populateFilterDropdowns();
    renderSettings();
  });

  // Budget modal
  document.getElementById('btn-add-budget').addEventListener('click', () => showModal('modal-budget'));
  document.getElementById('btn-cancel-budget').addEventListener('click', () => hideModal('modal-budget'));
  document.getElementById('btn-save-budget').addEventListener('click', () => {
    const category = document.getElementById('budget-category').value;
    const limit = parseFloat(document.getElementById('budget-amount').value);
    if (!limit || limit <= 0) { alert('Please enter a budget amount.'); return; }
    const existing = budgets.find(b => b.category === category);
    if (existing) { existing.limit = limit; }
    else { budgets.push({ id: gid(), category, limit, threshold: 80 }); }
    saveBudgets();
    hideModal('modal-budget');
    document.getElementById('budget-amount').value = '';
    renderSettings();
  });

  // Close modals on overlay click
  document.querySelectorAll('.modal-overlay').forEach(m => {
    m.addEventListener('click', (e) => { if (e.target === m) hideModal(m.id); });
  });

  // Search & filters
  document.getElementById('search-input').addEventListener('input', renderExpenses);
  document.getElementById('filter-card').addEventListener('change', renderExpenses);
  document.getElementById('filter-category').addEventListener('change', renderExpenses);
  document.getElementById('filter-date-from').addEventListener('change', renderExpenses);
  document.getElementById('filter-date-to').addEventListener('change', renderExpenses);

  // Date toggle
  const dateRow = document.getElementById('date-range-row');
  dateRow.style.display = 'none';
  document.getElementById('date-toggle').addEventListener('click', () => {
    dateRow.style.display = dateRow.style.display === 'none' ? 'flex' : 'none';
    renderExpenses();
  });

  // Sort buttons
  document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', () => setSort(btn.dataset.sort));
  });

  // Bulk delete
  document.getElementById('select-all-cb').addEventListener('change', function() {
    toggleSelectAll(this.checked);
  });
  document.getElementById('btn-bulk-delete').addEventListener('click', bulkDelete);

  // File upload
  document.getElementById('btn-upload').addEventListener('click', () => {
    document.getElementById('file-upload').click();
  });
  document.getElementById('file-upload').addEventListener('change', function() {
    if (this.files.length > 0) {
      handleFileUpload(this.files[0]);
      this.value = ''; // Reset so same file can be re-uploaded
    }
  });

  // Monthly navigation
  document.getElementById('month-prev').addEventListener('click', () => {
    currentMonth--; if (currentMonth < 1) { currentMonth = 12; currentYear--; }
    renderMonthly();
  });
  document.getElementById('month-next').addEventListener('click', () => {
    currentMonth++; if (currentMonth > 12) { currentMonth = 1; currentYear++; }
    renderMonthly();
  });

  // Budget month navigation
  document.getElementById('budget-month-prev').addEventListener('click', () => {
    budgetMonth--; if (budgetMonth < 1) { budgetMonth = 12; budgetYear--; }
    renderBudget();
  });
  document.getElementById('budget-month-next').addEventListener('click', () => {
    budgetMonth++; if (budgetMonth > 12) { budgetMonth = 1; budgetYear++; }
    renderBudget();
  });

  // Export CSV
  document.getElementById('btn-export-csv').addEventListener('click', exportCSV);
}

function init() {
  loadData();
  populateFilterDropdowns();
  refreshCategoryDropdowns();
  setupEventListeners();
  renderExpenses();
}

document.addEventListener('DOMContentLoaded', init);
