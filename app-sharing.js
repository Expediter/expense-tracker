// ===== FAMILY SHARING =====

async function loadShares() {
  if (!currentUser) return [];
  // Shares where I'm the owner
  const ownedSnap = await db.collection('shares').where('ownerUid', '==', currentUser.uid).get();
  const owned = ownedSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  // Shares where I'm the recipient
  const sharedSnap = await db.collection('shares').where('sharedWithUid', '==', currentUser.uid).where('status', '==', 'accepted').get();
  const shared = sharedSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  return { owned, shared };
}

async function inviteFamily(email, permission) {
  if (!currentUser) return;
  email = email.trim().toLowerCase();
  if (email === currentUser.email.toLowerCase()) { alert('Cannot share with yourself.'); return; }

  // Check if already shared
  const existing = await db.collection('shares')
    .where('ownerUid', '==', currentUser.uid)
    .where('sharedWithEmail', '==', email)
    .get();
  if (!existing.empty) { alert('Already shared with this email.'); return; }

  // Find user by email
  let sharedWithUid = '';
  const userSnap = await db.collection('users').where('email', '==', email).get();
  if (!userSnap.empty) {
    sharedWithUid = userSnap.docs[0].id;
  }

  await db.collection('shares').add({
    ownerUid: currentUser.uid,
    ownerEmail: currentUser.email,
    ownerName: currentUser.displayName || currentUser.email.split('@')[0],
    sharedWithEmail: email,
    sharedWithUid: sharedWithUid,
    permission: permission,
    status: sharedWithUid ? 'accepted' : 'pending',
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  alert(`Shared with ${email} (${permission} access)`);
  renderSharingUI();
}

async function revokeShare(shareId) {
  if (!confirm('Revoke this share?')) return;
  await db.collection('shares').doc(shareId).delete();
  renderSharingUI();
}

async function switchView(uid, name, permission) {
  if (!uid) {
    // Switch back to own data
    viewingUid = null;
    viewingPermission = 'owner';
    document.getElementById('viewing-banner').style.display = 'none';
  } else {
    viewingUid = uid;
    viewingPermission = permission;
    document.getElementById('viewing-banner').style.display = 'flex';
    document.getElementById('viewing-name').textContent = name;
  }
  // Reload data for the new view
  await loadData();
  populateFilterDropdowns();
  refreshCategoryDropdowns();
  renderExpenses();
  updateReadOnlyMode();
}

function updateReadOnlyMode() {
  const isReadOnly = viewingPermission === 'read';
  const fab = document.getElementById('fab-add');
  const bulkDelete = document.getElementById('btn-bulk-delete');
  const uploadBtn = document.getElementById('btn-upload');

  if (fab) fab.style.display = isReadOnly ? 'none' : 'flex';
  if (bulkDelete) bulkDelete.style.display = isReadOnly ? 'none' : '';
  if (uploadBtn) uploadBtn.style.display = isReadOnly ? 'none' : '';
}

async function renderSharingUI() {
  const container = document.getElementById('sharing-section');
  if (!container || !currentUser) return;

  const { owned, shared } = await loadShares();

  let html = '<h3>Family Sharing</h3>';

  // Invite form
  html += `<div style="display:flex;gap:8px;margin-bottom:12px;">
    <input type="email" id="share-email" placeholder="Family member's email" style="flex:1;padding:10px;border-radius:8px;border:1px solid #ddd;background:var(--bg);color:var(--text);font-size:0.9rem;">
    <select id="share-permission" style="padding:10px;border-radius:8px;border:1px solid #ddd;background:var(--bg);color:var(--text);font-size:0.85rem;">
      <option value="read">View Only</option>
      <option value="readwrite">Can Edit</option>
    </select>
  </div>
  <button class="settings-btn" onclick="inviteFamily(document.getElementById('share-email').value, document.getElementById('share-permission').value)" style="margin-top:0;margin-bottom:16px;">Share My Data</button>`;

  // My shares (people I've shared with)
  if (owned.length > 0) {
    html += '<div style="font-size:0.85rem;font-weight:600;margin-bottom:8px;">Shared With:</div>';
    owned.forEach(s => {
      html += `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.05);">
        <div><strong>${escHtml(s.sharedWithEmail)}</strong><br>
        <span style="font-size:0.78rem;color:var(--text-secondary);">${s.permission === 'readwrite' ? 'Can Edit' : 'View Only'} · ${s.status}</span></div>
        <button class="delete-btn" onclick="revokeShare('${s.id}')">Revoke</button>
      </div>`;
    });
  }

  // Shared with me
  if (shared.length > 0) {
    html += '<div style="font-size:0.85rem;font-weight:600;margin:16px 0 8px;">Shared With Me:</div>';
    shared.forEach(s => {
      html += `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.05);">
        <div><strong>${escHtml(s.ownerName || s.ownerEmail)}</strong><br>
        <span style="font-size:0.78rem;color:var(--text-secondary);">${s.permission === 'readwrite' ? 'Can Edit' : 'View Only'}</span></div>
        <button class="settings-btn" style="width:auto;margin:0;padding:6px 14px;font-size:0.8rem;" onclick="switchView('${s.ownerUid}', '${escHtml(s.ownerName || s.ownerEmail)}', '${s.permission}')">View</button>
      </div>`;
    });
  }

  container.innerHTML = html;
}

// Accept pending shares on login (match by email)
async function acceptPendingShares() {
  if (!currentUser) return;
  const pending = await db.collection('shares')
    .where('sharedWithEmail', '==', currentUser.email.toLowerCase())
    .where('status', '==', 'pending')
    .get();

  const batch = db.batch();
  pending.docs.forEach(doc => {
    batch.update(doc.ref, { sharedWithUid: currentUser.uid, status: 'accepted' });
  });
  if (!pending.empty) await batch.commit();
}
