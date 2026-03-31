// ===== AUTHENTICATION =====
let currentUser = null;
let viewingUid = null; // whose data we're viewing (for sharing)
let viewingPermission = 'owner'; // 'owner', 'readwrite', 'read'

function getDataUid() {
  return viewingUid || (currentUser ? currentUser.uid : null);
}

// Auth state listener
auth.onAuthStateChanged(async (user) => {
  if (user) {
    currentUser = user;
    viewingUid = null;
    viewingPermission = 'owner';

    // Create/update user doc
    const userRef = db.collection('users').doc(user.uid);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      await userRef.set({
        displayName: user.displayName || user.email.split('@')[0],
        email: user.email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      // Migrate localStorage data for first-time users
      await migrateLocalData(user.uid);
    }

    showApp();
    init();
  } else {
    currentUser = null;
    showLogin();
  }
});

async function migrateLocalData(uid) {
  const localCards = JSON.parse(localStorage.getItem('et_cards') || '[]');
  const localExpenses = JSON.parse(localStorage.getItem('et_expenses') || '[]');
  const localBudgets = JSON.parse(localStorage.getItem('et_budgets') || '[]');

  if (localCards.length === 0 && localExpenses.length === 0) return;

  const batch = db.batch();
  const userRef = db.collection('users').doc(uid);

  localCards.forEach(c => {
    const ref = userRef.collection('cards').doc(c.id || gid());
    batch.set(ref, { name: c.name, limit: c.limit });
  });

  localBudgets.forEach(b => {
    const ref = userRef.collection('budgets').doc(b.id || gid());
    batch.set(ref, { category: b.category, limit: b.limit, threshold: b.threshold || 80 });
  });

  // Batch expenses in chunks of 400 (Firestore limit is 500 per batch)
  const expChunks = [];
  for (let i = 0; i < localExpenses.length; i += 400) {
    expChunks.push(localExpenses.slice(i, i + 400));
  }

  // First batch: cards + budgets + first chunk of expenses
  const firstChunk = expChunks.shift() || [];
  firstChunk.forEach(e => {
    const ref = userRef.collection('expenses').doc(e.id || gid());
    batch.set(ref, { date: e.date, card: e.card, amount: e.amount, category: e.category, notes: e.notes || '' });
  });

  await batch.commit();

  // Remaining expense chunks
  for (const chunk of expChunks) {
    const b = db.batch();
    chunk.forEach(e => {
      const ref = userRef.collection('expenses').doc(e.id || gid());
      b.set(ref, { date: e.date, card: e.card, amount: e.amount, category: e.category, notes: e.notes || '' });
    });
    await b.commit();
  }

  console.log(`Migrated ${localCards.length} cards, ${localBudgets.length} budgets, ${localExpenses.length} expenses to Firestore`);
}

// Login methods
function loginWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).catch(err => {
    alert('Google login failed: ' + err.message);
  });
}

function loginWithEmail() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  if (!email || !password) { alert('Please enter email and password.'); return; }

  auth.signInWithEmailAndPassword(email, password).catch(err => {
    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
      // Try creating account
      if (confirm('Account not found. Create a new account?')) {
        auth.createUserWithEmailAndPassword(email, password).catch(e => {
          alert('Signup failed: ' + e.message);
        });
      }
    } else {
      alert('Login failed: ' + err.message);
    }
  });
}

function logout() {
  auth.signOut();
}

function showLogin() {
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('app-content').style.display = 'none';
}

function showApp() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app-content').style.display = 'block';
  // Update header with user info
  const headerUser = document.getElementById('header-user');
  if (headerUser && currentUser) {
    headerUser.textContent = currentUser.displayName || currentUser.email.split('@')[0];
  }
}
