// ===== FIREBASE CONFIG =====
const firebaseConfig = {
  apiKey: "AIzaSyDqCuPk6yrYOs4OS0CD1ebzw_4GiJiwkf4",
  authDomain: "expense-tracker-app-sd.web.app",
  projectId: "expense-tracker-app-sd",
  storageBucket: "expense-tracker-app-sd.firebasestorage.app",
  messagingSenderId: "515948146790",
  appId: "1:515948146790:web:3a222cea9e9cb175143da7"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Enable offline persistence
db.enablePersistence({ synchronizeTabs: true }).catch(err => {
  if (err.code === 'failed-precondition') {
    console.warn('Firestore persistence failed: multiple tabs open');
  } else if (err.code === 'unimplemented') {
    console.warn('Firestore persistence not available in this browser');
  }
});
