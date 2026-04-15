import { 
  auth, db, 
  onAuthStateChanged, signInWithEmailAndPassword, signOut,
  collection, doc, getDoc, onSnapshot, updateDoc, runTransaction, addDoc, serverTimestamp, query, where
} from './.gitignore/firebase-config.js';

let isAdmin = false;

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists() && userDoc.data().role === "admin") {
      isAdmin = true;
      document.getElementById('admin-login-page').style.display = 'none';
      document.getElementById('admin-dashboard-page').style.display = 'block';
      listenToIdeas();
      listenToRequests();
    } else {
      showToast("Access Denied: You are not an admin.", "error");
      await signOut(auth);
      isAdmin = false;
      document.getElementById('admin-login-page').style.display = 'block';
      document.getElementById('admin-dashboard-page').style.display = 'none';
    }
  } else {
    isAdmin = false;
    document.getElementById('admin-login-page').style.display = 'block';
    document.getElementById('admin-dashboard-page').style.display = 'none';
  }
});

let _unsubscribe = null;
function listenToIdeas() {
  if (_unsubscribe) _unsubscribe();
  
  _unsubscribe = onSnapshot(collection(db, "ideas"), (snapshot) => {
    const ideas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderTable(ideas);
  });
}

function renderTable(ideas) {
  const tbody = document.getElementById('ideas-body');
  if (!ideas.length) {
    tbody.innerHTML = '<tr><td colspan="6">No ideas found. Please run seed.js first.</td></tr>';
    return;
  }
  
  // Sort by domain then id
  ideas.sort((a,b) => a.domain.localeCompare(b.domain) || a.id.localeCompare(b.id));

  tbody.innerHTML = ideas.map(ps => {
    const highestBid = ps.highestBid !== undefined ? ps.highestBid : ps.basePrice;
    return `
      <tr>
        <td><strong>${ps.id}</strong></td>
        <td>${ps.domain} <span style="font-size:10px">${ps.premium?'⭐':''}</span></td>
        <td>${ps.title.slice(0,30)}...</td>
        <td>₹${ps.basePrice}</td>
        <td>
          <input type="number" id="bid-${ps.id}" value="${highestBid}" class="price-input" />
        </td>
        <td>
          <button class="btn-update" onclick="updateBid('${ps.id}')">Update</button>
        </td>
      </tr>
    `;
  }).join('');
}

window.handleAdminLogin = async function() {
  const email = document.getElementById('admin-email').value.trim();
  const pwd = document.getElementById('admin-pwd').value.trim();
  const err = document.getElementById('admin-error');
  
  const errorMessages = {
    'auth/invalid-email':      '📧 Please enter a valid email address.',
    'auth/user-not-found':     '🔍 No admin account found with this email.',
    'auth/wrong-password':     '🔑 Incorrect password. Please try again.',
    'auth/invalid-credential': '🔑 Invalid email or password.',
    'auth/too-many-requests':  '⏳ Too many attempts. Please wait and try again.',
  };

  try {
    err.textContent = "";
    await signInWithEmailAndPassword(auth, email, pwd);
  } catch (e) {
    err.textContent = errorMessages[e.code] || '⚠️ Login failed: ' + e.message;
  }
};

window.handleAdminLogout = async function() {
  await signOut(auth);
};

window.updateBid = async function(ideaId) {
  const newVal = document.getElementById('bid-'+ideaId).value;
  if (!newVal || isNaN(newVal)) return;

  try {
    const valObj = parseInt(newVal);
    await updateDoc(doc(db, "ideas", ideaId), {
      highestBid: valObj
    });
    showToast("Updated " + ideaId + " highest bid to ₹" + valObj, "success");
  } catch (err) {
    showToast("Error updating document: " + err.message, "error");
  }
};

/* ── INVESTMENT REQUESTS LISTENER ─────────────────────────── */
let _reqUnsub = null;
function listenToRequests() {
  if (_reqUnsub) _reqUnsub();
  const q = query(collection(db, "investmentRequests"), where("status", "==", "pending"));
  _reqUnsub = onSnapshot(q, (snapshot) => {
    const requests = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    renderRequestsTable(requests);
  });
}

function renderRequestsTable(requests) {
  const tbody = document.getElementById('requests-body');
  if (!requests.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="color:var(--text-dim);text-align:center;padding:20px">✅ No pending investment requests</td></tr>';
    return;
  }
  requests.sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0));
  tbody.innerHTML = requests.map(req => `
    <tr id="req-row-${req.id}">
      <td><strong>${req.userName}</strong></td>
      <td>${req.psTitle ? req.psTitle.slice(0, 28) + '...' : req.psId}</td>
      <td style="color:var(--accent);font-weight:700">₹${Number(req.amount).toLocaleString('en-IN')}</td>
      <td><span class="status-badge pending">⏳ Pending</span></td>
      <td style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn-approve" onclick="approveRequest('${req.id}', '${req.userId}', '${req.psId}', ${req.amount})">✅ Approve</button>
        <button class="btn-reject"  onclick="rejectRequest('${req.id}', '${req.userId}')">❌ Reject</button>
      </td>
    </tr>
  `).join('');
}

window.approveRequest = async function(requestId, userId, psId, amount) {
  if (!isAdmin) return;
  const appBtn = document.querySelector(`#req-row-${requestId} .btn-approve`);
  const rejBtn = document.querySelector(`#req-row-${requestId} .btn-reject`);
  if (appBtn) { appBtn.textContent = 'Approving...'; appBtn.disabled = true; }
  if (rejBtn) { rejBtn.disabled = true; }

  try {
    const userRef = doc(db, "users", userId);
    const requestRef = doc(db, "investmentRequests", requestId);

    await runTransaction(db, async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists()) throw new Error("User not found in database!");

      const currentWallet = userDoc.data().wallet;
      if (currentWallet < amount) throw new Error(`Insufficient funds (₹${currentWallet} < ₹${amount})`);

      const newWallet = currentWallet - amount;
      const newInvestedPS = [...(userDoc.data().investedPS || []), psId];

      transaction.update(userRef, { wallet: newWallet, investedPS: newInvestedPS });
      transaction.update(requestRef, { status: 'approved' });
    });

    showToast(`✅ Approved! ₹${Number(amount).toLocaleString('en-IN')} deducted from ${userId.slice(0,6)}...`, 'success');
  } catch (err) {
    console.error("Approval failed:", err);
    showToast('❌ Approval failed: ' + err.message, 'error');
    if (appBtn) { appBtn.textContent = '✅ Approve'; appBtn.disabled = false; }
    if (rejBtn) { rejBtn.disabled = false; }
  }
};

window.rejectRequest = async function(requestId, userId) {
  if (!isAdmin) return;
  const rejBtn = document.querySelector(`#req-row-${requestId} .btn-reject`);
  const appBtn = document.querySelector(`#req-row-${requestId} .btn-approve`);
  if (rejBtn) { rejBtn.textContent = 'Rejecting...'; rejBtn.disabled = true; }
  if (appBtn) { appBtn.disabled = true; }

  try {
    await updateDoc(doc(db, "investmentRequests", requestId), { status: 'rejected' });
    showToast(`🚫 Request rejected for user ${userId.slice(0,6)}...`, 'error');
  } catch (err) {
    console.error("Rejection failed:", err);
    showToast('❌ Rejection failed: ' + err.message, 'error');
    if (rejBtn) { rejBtn.textContent = '❌ Reject'; rejBtn.disabled = false; }
    if (appBtn) { appBtn.disabled = false; }
  }
};

window.showToast = function(msg, type) {
  const t = document.getElementById('toast');
  t.textContent = msg; 
  t.className = 'toast ' + (type || ''); 
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3200);
};
