// ===== AUTHENTICATION =====
let currentUser = null;
let viewingUid = null;
let viewingPermission = 'owner';

function getDataUid() {
  return viewingUid || (currentUser ? currentUser.uid : null);
}

// Auth state listener
auth.onAuthStateChanged((user) => {
  document.getElementById('loading-screen').style.display = 'none';
  if (user) {
    currentUser = user;
    viewingUid = null;
    viewingPermission = 'owner';
    showApp();
    init();
  } else {
    currentUser = null;
    showLogin();
  }
});

// Login methods
function loginWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).then(result => {
    console.log('Google login success:', result.user.email);
  }).catch(err => {
    console.error('Google login error:', err);
    alert('Google login failed: ' + err.code + ' - ' + err.message);
  });
}

function loginWithEmail() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  if (!email || !password) { alert('Please enter email and password.'); return; }

  auth.signInWithEmailAndPassword(email, password).catch(err => {
    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
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
  document.getElementById('loading-screen').style.display = 'none';
  document.getElementById('app-content').style.display = 'block';
  const headerUser = document.getElementById('header-user');
  if (headerUser && currentUser) {
    headerUser.textContent = currentUser.displayName || currentUser.email.split('@')[0];
  }
}
