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

// Persistence
function loadData() {
  if (!localStorage.getItem('et_seeded')) {
    cards = DEFAULT_CARDS.map(c => ({...c}));
    budgets = DEFAULT_BUDGETS.map(b => ({...b, id: gid()}));
    expenses = SAMPLE_EXPENSES.map(e => ({...e, id: gid()}));
    saveCards(); saveBudgets(); saveExpenses();
    localStorage.setItem('et_seeded', '1');
  } else {
    cards = JSON.parse(localStorage.getItem('et_cards') || '[]');
    expenses = JSON.parse(localStorage.getItem('et_expenses') || '[]');
    budgets = JSON.parse(localStorage.getItem('et_budgets') || '[]');
  }
  const now = new Date();
  currentMonth = now.getMonth() + 1; currentYear = now.getFullYear();
  budgetMonth = currentMonth; budgetYear = currentYear;
}

function saveCards() { localStorage.setItem('et_cards', JSON.stringify(cards)); }
function saveExpenses() { localStorage.setItem('et_expenses', JSON.stringify(expenses)); }
function saveBudgets() { localStorage.setItem('et_budgets', JSON.stringify(budgets)); }

// Analytics helpers
function getCardSpends(name) { return expenses.filter(e => e.card === name).reduce((s, e) => s + e.amount, 0); }
function getCardUtil(name) { const c = cards.find(x => x.name === name); return c && c.limit > 0 ? (getCardSpends(name) / c.limit) * 100 : 0; }
function getCategorySpends(cat, exps) { return (exps || expenses).filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0); }
function getExpensesForMonth(m, y) { return expenses.filter(e => { const d = new Date(e.date + 'T00:00:00'); return d.getMonth() + 1 === m && d.getFullYear() === y; }); }
function utilColor(pct) { return pct > 80 ? '#ea4335' : pct > 50 ? '#fa7b17' : pct > 20 ? '#fbbc04' : '#34a853'; }
function utilClass(pct) { return pct > 80 ? 'exceeded' : pct > 50 ? 'warning' : pct > 20 ? 'caution' : 'safe'; }
function utilLabel(pct) { return pct >= 100 ? 'Exceeded' : pct >= 80 ? 'Warning' : pct >= 50 ? 'Caution' : 'On Track'; }
