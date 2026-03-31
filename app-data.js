// ===== DATA LAYER =====
const CATEGORIES = ['Food','Grocery','Utilities','Travel','Entertainment','Sports','Shopping','Health','Education','Other'];
const CAT_COLORS = {Food:'#ff9800',Grocery:'#4caf50',Utilities:'#9c27b0',Travel:'#2196f3',Entertainment:'#e91e63',Sports:'#009688',Shopping:'#f44336',Health:'#00bcd4',Education:'#ff5722',Other:'#9e9e9e'};
const CAT_EMOJI = {Food:'🍔',Grocery:'🥬',Utilities:'🔧',Travel:'✈️',Entertainment:'🎬',Sports:'⚽',Shopping:'🛍️',Health:'💊',Education:'📚',Other:'📦'};

const DEFAULT_CARDS = [
  {id:'c1',name:'AU',limit:800000},{id:'c2',name:'AXIS',limit:337000},{id:'c3',name:'HDFC',limit:375000},
  {id:'c4',name:'ICICI',limit:1270000},{id:'c5',name:'Pluxee',limit:2200},{id:'c6',name:'Icici Savings',limit:10000},
  {id:'c7',name:'Axis Saving',limit:20000},{id:'c8',name:'Anku',limit:5000},{id:'c9',name:'HSBC',limit:500000}
];

const DEFAULT_BUDGETS = [
  {category:'Food',limit:15000,threshold:80},{category:'Grocery',limit:5000,threshold:80},
  {category:'Utilities',limit:10000,threshold:80},{category:'Travel',limit:8000,threshold:80},
  {category:'Entertainment',limit:3000,threshold:80},{category:'Sports',limit:2000,threshold:80},
  {category:'Shopping',limit:10000,threshold:80},{category:'Health',limit:5000,threshold:80},
  {category:'Education',limit:5000,threshold:80},{category:'Other',limit:3000,threshold:80}
];

const SAMPLE_EXPENSES = [
  {date:'2026-03-01',card:'Icici Savings',amount:50,category:'Food',notes:'Breakfast'},
  {date:'2026-03-01',card:'Icici Savings',amount:27,category:'Grocery',notes:'Milk'},
  {date:'2026-03-01',card:'Icici Savings',amount:400,category:'Utilities',notes:'Maid'},
  {date:'2026-03-01',card:'ICICI',amount:228,category:'Food',notes:'Dinner'},
  {date:'2026-03-02',card:'Icici Savings',amount:122,category:'Food',notes:'Breakfast'},
  {date:'2026-03-02',card:'Pluxee',amount:110,category:'Grocery',notes:'Vegetables, fruits'},
  {date:'2026-03-02',card:'HSBC',amount:6319,category:'Travel',notes:'Kte-blr'},
  {date:'2026-03-03',card:'Icici Savings',amount:40,category:'Utilities',notes:'Water'},
  {date:'2026-03-03',card:'ICICI',amount:860,category:'Food',notes:'Dinner'},
  {date:'2026-03-04',card:'Icici Savings',amount:80,category:'Sports',notes:'Badminton'},
  {date:'2026-03-04',card:'Icici Savings',amount:65,category:'Food',notes:'Breakfast'},
  {date:'2026-03-04',card:'ICICI',amount:27,category:'Grocery',notes:'Milk'},
  {date:'2026-03-04',card:'ICICI',amount:260,category:'Entertainment',notes:'Movie'},
  {date:'2026-03-04',card:'ICICI',amount:40,category:'Travel',notes:'Parking'},
  {date:'2026-03-04',card:'Icici Savings',amount:2400,category:'Utilities',notes:'Physiotherapist'},
  {date:'2026-03-05',card:'ICICI',amount:2000,category:'Utilities',notes:'Physiotherapist'},
  {date:'2026-03-05',card:'ICICI',amount:396,category:'Food',notes:'Dinner'},
  {date:'2026-03-06',card:'Icici Savings',amount:105,category:'Food',notes:'Breakfast'},
  {date:'2026-03-06',card:'Icici Savings',amount:27,category:'Grocery',notes:'Milk'},
  {date:'2026-03-06',card:'Icici Savings',amount:1600,category:'Utilities',notes:'Physiotherapist'},
  {date:'2026-03-06',card:'Pluxee',amount:468,category:'Food',notes:'Dinner'},
  {date:'2026-03-07',card:'Icici Savings',amount:137,category:'Food',notes:'Breakfast'},
  {date:'2026-03-07',card:'ICICI',amount:364,category:'Utilities',notes:'Petrol'},
  {date:'2026-03-07',card:'Icici Savings',amount:65,category:'Grocery',notes:'Coconut water'},
  {date:'2026-03-07',card:'HSBC',amount:154,category:'Grocery',notes:'Milk, fruits'},
  {date:'2026-03-07',card:'Pluxee',amount:154,category:'Grocery',notes:'Vegetables'},
  {date:'2026-03-08',card:'Icici Savings',amount:100,category:'Travel',notes:'Ola'},
  {date:'2026-03-08',card:'ICICI',amount:196,category:'Food',notes:'Dinner'},
  {date:'2026-03-09',card:'Icici Savings',amount:130,category:'Travel',notes:'Ola'},
  {date:'2026-03-09',card:'Icici Savings',amount:160,category:'Food',notes:'Lunch'},
  {date:'2026-03-09',card:'Pluxee',amount:151,category:'Grocery',notes:'Milk, fruits'},
  {date:'2026-03-09',card:'Icici Savings',amount:50,category:'Food',notes:'Coconut water'},
  {date:'2026-03-09',card:'HSBC',amount:261,category:'Utilities',notes:'Medicines'},
  {date:'2026-03-09',card:'Pluxee',amount:238,category:'Food',notes:'Dinner'},
  {date:'2026-03-10',card:'Icici Savings',amount:50,category:'Food',notes:'Coconut water'},
  {date:'2026-03-10',card:'Pluxee',amount:221,category:'Grocery',notes:'Milk, fruits'}
];

// State
let cards = [], expenses = [], budgets = [];
let currentMonth, currentYear, budgetMonth, budgetYear;
let chartInstances = {};

// Helpers
function gid() { return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5); }

function fmt(n) {
  if (n === undefined || n === null) return '₹0';
  n = Math.round(n);
  let s = Math.abs(n).toString();
  let result = '';
  let len = s.length;
  if (len <= 3) { result = s; }
  else {
    result = s.substring(len - 3);
    s = s.substring(0, len - 3);
    while (s.length > 2) {
      result = s.substring(s.length - 2) + ',' + result;
      s = s.substring(0, s.length - 2);
    }
    if (s.length > 0) result = s + ',' + result;
  }
  return (n < 0 ? '-' : '') + '₹' + result;
}

function fmtDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
}

function fmtMonthYear(m, y) {
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return months[m - 1] + ' ' + y;
}

function today() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

// ===== FIRESTORE PERSISTENCE =====
function getUserRef() {
  const uid = getDataUid();
  if (!uid) return null;
  return db.collection('users').doc(uid);
}

async function loadData() {
  const userRef = getUserRef();
  if (!userRef) return;

  // Load cards
  const cardsSnap = await userRef.collection('cards').get();
  if (cardsSnap.empty) {
    // Seed default data
    await seedDefaults(userRef);
  } else {
    cards = cardsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  // Load expenses
  const expSnap = await userRef.collection('expenses').get();
  expenses = expSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  // Load budgets
  const budSnap = await userRef.collection('budgets').get();
  budgets = budSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  // Discover custom categories from expenses
  expenses.forEach(e => {
    if (e.category && !CATEGORIES.includes(e.category)) {
      CATEGORIES.push(e.category);
    }
  });

  const now = new Date();
  currentMonth = now.getMonth() + 1; currentYear = now.getFullYear();
  budgetMonth = currentMonth; budgetYear = currentYear;
}

async function seedDefaults(userRef) {
  const batch = db.batch();

  DEFAULT_CARDS.forEach(c => {
    const ref = userRef.collection('cards').doc(c.id);
    batch.set(ref, { name: c.name, limit: c.limit });
  });

  DEFAULT_BUDGETS.forEach(b => {
    const id = gid();
    const ref = userRef.collection('budgets').doc(id);
    batch.set(ref, { category: b.category, limit: b.limit, threshold: b.threshold });
  });

  SAMPLE_EXPENSES.forEach(e => {
    const id = gid();
    const ref = userRef.collection('expenses').doc(id);
    batch.set(ref, { date: e.date, card: e.card, amount: e.amount, category: e.category, notes: e.notes });
  });

  await batch.commit();

  // Reload after seeding
  cards = DEFAULT_CARDS.map(c => ({ ...c }));
  budgets = DEFAULT_BUDGETS.map(b => ({ ...b, id: gid() }));
  expenses = SAMPLE_EXPENSES.map(e => ({ ...e, id: gid() }));
}

// Individual save functions (write to Firestore)
async function saveCard(card) {
  const userRef = getUserRef();
  if (!userRef) return;
  await userRef.collection('cards').doc(card.id).set({ name: card.name, limit: card.limit });
}

async function deleteCardDoc(cardId) {
  const userRef = getUserRef();
  if (!userRef) return;
  await userRef.collection('cards').doc(cardId).delete();
}

async function saveExpense(expense) {
  const userRef = getUserRef();
  if (!userRef) return;
  await userRef.collection('expenses').doc(expense.id).set({
    date: expense.date, card: expense.card, amount: expense.amount,
    category: expense.category, notes: expense.notes || ''
  });
}

async function deleteExpenseDoc(expenseId) {
  const userRef = getUserRef();
  if (!userRef) return;
  await userRef.collection('expenses').doc(expenseId).delete();
}

async function deleteExpenseDocs(ids) {
  const userRef = getUserRef();
  if (!userRef) return;
  // Batch delete in chunks of 400
  for (let i = 0; i < ids.length; i += 400) {
    const batch = db.batch();
    ids.slice(i, i + 400).forEach(id => {
      batch.delete(userRef.collection('expenses').doc(id));
    });
    await batch.commit();
  }
}

async function saveBudget(budget) {
  const userRef = getUserRef();
  if (!userRef) return;
  await userRef.collection('budgets').doc(budget.id).set({
    category: budget.category, limit: budget.limit, threshold: budget.threshold || 80
  });
}

async function deleteBudgetDoc(budgetId) {
  const userRef = getUserRef();
  if (!userRef) return;
  await userRef.collection('budgets').doc(budgetId).delete();
}

async function saveExpensesBatch(newExpenses) {
  const userRef = getUserRef();
  if (!userRef) return;
  for (let i = 0; i < newExpenses.length; i += 400) {
    const batch = db.batch();
    newExpenses.slice(i, i + 400).forEach(e => {
      const ref = userRef.collection('expenses').doc(e.id);
      batch.set(ref, { date: e.date, card: e.card, amount: e.amount, category: e.category, notes: e.notes || '' });
    });
    await batch.commit();
  }
}

async function saveCardsBatch(newCards) {
  const userRef = getUserRef();
  if (!userRef) return;
  const batch = db.batch();
  newCards.forEach(c => {
    batch.set(userRef.collection('cards').doc(c.id), { name: c.name, limit: c.limit });
  });
  await batch.commit();
}

// Legacy compatibility wrappers (still update local arrays + Firestore)
function saveCards() { /* cards are saved individually now */ }
function saveExpenses() { /* expenses are saved individually now */ }
function saveBudgets() { /* budgets are saved individually now */ }

// Analytics helpers
function getCardSpends(name) { return expenses.filter(e => e.card === name).reduce((s, e) => s + e.amount, 0); }
function getCardUtil(name) { const c = cards.find(x => x.name === name); return c && c.limit > 0 ? (getCardSpends(name) / c.limit) * 100 : 0; }
function getCategorySpends(cat, exps) { return (exps || expenses).filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0); }
function getExpensesForMonth(m, y) { return expenses.filter(e => { const d = new Date(e.date + 'T00:00:00'); return d.getMonth() + 1 === m && d.getFullYear() === y; }); }
function utilColor(pct) { return pct > 80 ? '#ea4335' : pct > 50 ? '#fa7b17' : pct > 20 ? '#fbbc04' : '#34a853'; }
function utilClass(pct) { return pct > 80 ? 'exceeded' : pct > 50 ? 'warning' : pct > 20 ? 'caution' : 'safe'; }
function utilLabel(pct) { return pct >= 100 ? 'Exceeded' : pct >= 80 ? 'Warning' : pct >= 50 ? 'Caution' : 'On Track'; }
