import { 
  auth, db, 
  onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut,
  collection, doc, getDoc, setDoc, onSnapshot, runTransaction, addDoc, serverTimestamp, query, where
} from './.gitignore/firebase-config.js';

const WALLET_START = 100000;

const DOMAINS = [
  { id:'design',   icon:'👗', name:'Design & Fashion',  desc:'Sustainable fashion, customisation platforms, designer marketplaces' },
  { id:'fintech',  icon:'💳', name:'Fintech',           desc:'Smart contracts, savings, insurance, fraud protection & micro-finance' },
  { id:'sustech',  icon:'♻️', name:'Sustainable Tech',  desc:'Upcycling, fabric recycling, clothing exchange & green energy' },
  { id:'health',   icon:'🏥', name:'Healthtech',        desc:'AI mental health, medicine reminders & portable health kiosks' },
  { id:'travel',   icon:'✈️', name:'Travel & Tourism',  desc:'Local experiences, tourist ride-sharing & unified transport apps' },
  { id:'edtech',   icon:'🎓', name:'Edtech',            desc:'Career exploration, study abroad guidance & adaptive learning' },
];

/* STATE */
let state = { 
  user: null, 
  wallet: 0, 
  invested: 0, 
  selectedDomain: null, 
  investedPS: new Set(), 
  pendingPS: null,
  ideas: [],
  // Tracks whether the user explicitly triggered a login/signup this session.
  // Prevents Firebase's persisted session from auto-redirecting on page load.
  intentionalLogin: false
};

let userUnsubscribe = null;
let ideasUnsubscribe = null;

/* Clear any persisted Firebase session on fresh page load so the user
   always starts at the login screen rather than being auto-redirected. */
signOut(auth).catch(() => {});

/* FIREBASE AUTH LISTENER */
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // Only proceed if the user explicitly logged in or signed up this session
    if (!state.intentionalLogin) return;

    if (userUnsubscribe) userUnsubscribe();
    let initialized = false;

    userUnsubscribe = onSnapshot(doc(db, "users", user.uid), (userDoc) => {
      if (userDoc.exists()) {
        const data = userDoc.data();
        state.user = { uid: user.uid, ...data };
        state.wallet = data.wallet !== undefined ? data.wallet : WALLET_START;
        state.investedPS = new Set(data.investedPS || []);
        state.invested = WALLET_START - state.wallet;

        if (!initialized) {
          initialized = true;
          showPage('success');
          document.getElementById('success-team-name').textContent = data.name;
          updateWalletDisplay();
        } else {
          updateWalletDisplay();
          if (document.getElementById('page-ps').classList.contains('active')) {
            buildPSGrid();
          }
          if (document.getElementById('page-success').classList.contains('active')) {
            document.getElementById('success-team-name').textContent = data.name;
          }
        }

      } else {
        console.error("User doc not found!");
        showToast('Error: User data not found.', 'error');
        auth.signOut();
      }
    });
  } else {
    if (userUnsubscribe) { userUnsubscribe(); userUnsubscribe = null; }
    state.user = null;
    // Don't redirect to login on the initial signOut(auth) that clears persisted sessions
    if (!state.intentionalLogin) return;
    showPage('login');
  }
});

/* NAV */
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const pg = document.getElementById('page-' + id);
  if (pg) {
    pg.classList.add('active');
    pg.style.animation = 'none'; pg.offsetHeight; pg.style.animation = '';
  }
  window.scrollTo(0, 0);
}

/* AUTHENTICATION FLOW */
window.toggleAuthForm = function(type) {
  document.getElementById('login-form').style.display  = type === 'login'  ? 'block' : 'none';
  document.getElementById('signup-form').style.display = type === 'signup' ? 'block' : 'none';
  document.getElementById('auth-title').textContent    = type === 'login'  ? 'Log In' : 'Sign Up';
};

/* FRIENDLY FIREBASE ERROR MESSAGES */
function getFirebaseErrorMessage(code) {
  const messages = {
    'auth/invalid-email':          '📧 Please enter a valid email address.',
    'auth/user-disabled':          '⛔ This account has been disabled. Contact the event admin.',
    'auth/user-not-found':         '🔍 No account found with this email. Please sign up first.',
    'auth/wrong-password':         '🔑 Incorrect password. Please try again.',
    'auth/invalid-credential':     '🔑 Invalid email or password. Please check and try again.',
    'auth/email-already-in-use':   '📨 This email is already registered. Try logging in instead.',
    'auth/weak-password':          '🔒 Password must be at least 6 characters.',
    'auth/network-request-failed': '🌐 Network error. Please check your internet connection.',
    'auth/too-many-requests':      '⏳ Too many attempts. Please wait a moment and try again.',
    'auth/popup-closed-by-user':   '❌ Sign-in popup was closed. Please try again.',
  };
  return messages[code] || '⚠️ Something went wrong. Please try again.';
}

window.handleLogin = async function() {
  const email = document.getElementById('login-email').value.trim();
  const pwd   = document.getElementById('login-pwd').value.trim();
  const err   = document.getElementById('login-error');

  if (!email || !pwd) {
    err.textContent = '📝 Please fill in all fields.';
    err.classList.add('show');
    return;
  }
  err.classList.remove('show');

  // FIX: Use getElementById with a stable id — querySelector('.btn-primary') inside
  // a form div was returning null in some DOM states, crashing the function silently
  const btn = document.getElementById('login-btn');
  try {
    btn.textContent = 'Logging in...'; btn.disabled = true;
    state.intentionalLogin = true;
    await signInWithEmailAndPassword(auth, email, pwd);
    // onAuthStateChanged handles redirect
  } catch (error) {
    state.intentionalLogin = false;
    btn.textContent = 'Log In →'; btn.disabled = false;
    err.textContent = getFirebaseErrorMessage(error.code);
    err.classList.add('show');
  }
};

window.handleSignup = async function() {
  const name   = document.getElementById('signup-name').value.trim();
  const email  = document.getElementById('signup-email').value.trim();
  const pwd    = document.getElementById('signup-pwd').value.trim();
  const isTeam = document.getElementById('signup-isteam').checked;
  const err    = document.getElementById('signup-error');

  if (!name || !email || !pwd) {
    err.textContent = '📝 Please fill in all fields.';
    err.classList.add('show');
    return;
  }
  err.classList.remove('show');

  // FIX: Use getElementById with a stable id instead of querySelector
  // The original '#signup-form .btn-primary' selector fails because the button
  // is rendered inside #auth-card, not as a direct/scoped child of #signup-form
  const btn = document.getElementById('signup-btn');
  try {
    btn.textContent = 'Signing up...'; btn.disabled = true;
    state.intentionalLogin = true;
    const userCred = await createUserWithEmailAndPassword(auth, email, pwd);
    await setDoc(doc(db, "users", userCred.user.uid), {
      name, email, isTeam,
      role: 'user',
      wallet: WALLET_START,
      investedPS: []
    });
    // onAuthStateChanged handles redirect
    btn.textContent = 'Sign Up →'; btn.disabled = false;
  } catch (error) {
    state.intentionalLogin = false;
    btn.textContent = 'Sign Up →'; btn.disabled = false;
    err.textContent = getFirebaseErrorMessage(error.code);
    err.classList.add('show');
  }
};

window.handleLogout = async function() {
  state.intentionalLogin = false;
  await signOut(auth);
};

/* DOMAIN */
window.goToDomain = function() {
  document.getElementById('topbar').style.display = 'flex';
  const init = state.user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  document.getElementById('topbar-initials').textContent = init;
  document.getElementById('topbar-team').textContent = state.user.name;

  document.getElementById('domain-grid').innerHTML = DOMAINS.map(d => `
    <div class="domain-card" id="dc-${d.id}" onclick="selectDomain('${d.id}')">
      <div class="check-mark">✓</div>
      <span class="domain-icon">${d.icon}</span>
      <h3>${d.name}</h3><p>${d.desc}</p>
    </div>`).join('');
  showPage('domain');
};

window.selectDomain = function(id) {
  document.querySelectorAll('.domain-card').forEach(c => c.classList.remove('selected'));
  document.getElementById('dc-' + id).classList.add('selected');
  state.selectedDomain = id;
  document.getElementById('btn-confirm-domain').classList.add('ready');
};

window.confirmDomain = function() {
  if (!state.selectedDomain) return;
  const d = DOMAINS.find(x => x.id === state.selectedDomain);
  document.getElementById('ps-domain-title').textContent  = d.icon + ' ' + d.name;
  document.getElementById('ps-domain-sub').textContent    = 'Invest your virtual budget into a startup idea';
  document.getElementById('topbar-wallet').style.display  = 'flex';
  updateWalletDisplay();
  document.querySelectorAll('.filter-btn').forEach((b, i) => { b.classList.toggle('active', i === 0); });

  showPage('ps');

  const grid = document.getElementById('ps-grid');
  grid.innerHTML = '<div class="empty-state">⏳ Loading ideas from database...</div>';

  if (ideasUnsubscribe) {
    ideasUnsubscribe();
  }

  const q = query(collection(db, "ideas"), where("domain", "==", state.selectedDomain));
  ideasUnsubscribe = onSnapshot(q, (snapshot) => {
    state.ideas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    if (document.getElementById('page-ps').classList.contains('active')) {
      buildPSGrid('all');
    }
  });
};

window.goBackToDomains = function() {
  showPage('domain');
};

/* PS GRID */
let currentFilter = 'all';
window.buildPSGrid = function(filter) {
  if (filter) currentFilter = filter;
  let list = state.ideas;
  if (currentFilter === 'normal')  list = list.filter(ps => !ps.premium);
  if (currentFilter === 'premium') list = list.filter(ps =>  ps.premium);

  const grid = document.getElementById('ps-grid');
  if (!list.length) {
    const hasAnyIdeas = state.ideas.length > 0;
    grid.innerHTML = `<div class="empty-state">${
      hasAnyIdeas
        ? '🔍 No problem statements found for this domain.'
        : '⏳ Loading ideas from database...'
    }</div>`;
    return;
  }

  grid.innerHTML = list.map(ps => {
    const inv        = state.investedPS.has(ps.id);
    const highestBid = ps.highestBid !== undefined ? ps.highestBid : ps.basePrice;
    const boughtByOther = ps.isBought && !inv;

    return `<div class="startup-card${ps.premium ? ' premium' : ''}${inv ? ' invested' : ''}${boughtByOther ? ' bought-out' : ''}" id="card-${ps.id}">
      <div class="invested-ribbon">Invested</div>
      <div class="card-top">
        <span class="ps-id">${ps.id}</span>
        <span class="badge ${ps.premium ? 'badge-premium' : 'badge-normal'}">${ps.premium ? '⭐ Premium' : 'Normal'}</span>
      </div>
      <div class="card-title">${ps.title}</div>
      <div class="card-desc">${ps.desc}</div>
      <div class="card-details">
        <div class="detail-row"><span class="detail-icon">⚠️</span><div class="detail-content"><div class="detail-label">Constraint</div><div class="detail-text">${ps.constraint}</div></div></div>
        <div class="detail-row"><span class="detail-icon">✅</span><div class="detail-content"><div class="detail-label">Advantage</div><div class="detail-text">${ps.advantage}</div></div></div>
        <div class="detail-row"><span class="detail-icon">❌</span><div class="detail-content"><div class="detail-label">Disadvantage</div><div class="detail-text">${ps.disadvantage}</div></div></div>
      </div>
      <div class="card-footer">
        <div class="price-block">
          <span class="price-label" style="color:var(--accent)">Highest Bid</span>
          <span class="price-value${ps.premium ? ' premium-price' : ''}">₹${highestBid.toLocaleString('en-IN')}</span>
          <div style="font-size:10px;color:var(--text-dim)">Base: ₹${ps.basePrice.toLocaleString('en-IN')}</div>
        </div>
        <div class="card-actions">
          <button class="btn-expand" onclick="toggleExpand('${ps.id}',this)">Details</button>
          ${inv
            ? '<span style="font-size:12px;color:var(--success);font-weight:600">✓ Invested</span>'
            : boughtByOther
            ? `<span style="font-size:12px;color:var(--danger);font-weight:600">Sold out</span>`
            : `<button class="btn-invest${ps.premium ? ' premium-btn' : ''}" onclick="openModal('${ps.id}')">Invest →</button>`}
        </div>
      </div>
    </div>`;
  }).join('');
};

window.toggleExpand = function(id, btn) {
  const c = document.getElementById('card-' + id);
  c.classList.toggle('expanded');
  btn.textContent = c.classList.contains('expanded') ? 'Hide' : 'Details';
};

window.filterPS = function(type, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  window.buildPSGrid(type);
};

/* MODAL */
window.openModal = function(psId) {
  const ps = state.ideas.find(p => p.id === psId);
  if (!ps) return;
  const highestBid = ps.highestBid !== undefined ? ps.highestBid : ps.basePrice;

  if (state.wallet < highestBid) { showToast('Insufficient virtual wallet balance!', 'error'); return; }

  state.pendingPS = psId;
  document.getElementById('modal-title').textContent    = ps.title;
  document.getElementById('modal-sub').textContent      = ps.id + ' · ' + (ps.premium ? '⭐ Premium' : 'Normal');
  document.getElementById('modal-ps-id').textContent    = ps.id;
  document.getElementById('modal-price').textContent    = '₹' + highestBid.toLocaleString('en-IN');
  document.getElementById('modal-balance').textContent  = '₹' + state.wallet.toLocaleString('en-IN');
  document.getElementById('modal-after').textContent    = '₹' + (state.wallet - highestBid).toLocaleString('en-IN');
  document.getElementById('modal-desc').textContent     = ps.desc;
  document.getElementById('modal-invest-btn').className = 'btn-confirm-invest' + (ps.premium ? ' pi' : '');
  document.getElementById('invest-modal').classList.add('show');
};

window.closeModal = function() {
  document.getElementById('invest-modal').classList.remove('show');
  state.pendingPS = null;
};

window.confirmInvest = async function() {
  const ps = state.ideas.find(p => p.id === state.pendingPS);
  if (!ps || !state.user) return;

  const highestBid = ps.highestBid !== undefined ? ps.highestBid : ps.basePrice;
  const btn = document.getElementById('modal-invest-btn');
  btn.textContent = 'Sending Request...';
  btn.disabled = true;

  try {
    await addDoc(collection(db, "investmentRequests"), {
      userId:    state.user.uid,
      userName:  state.user.name,
      psId:      ps.id,
      psTitle:   ps.title,
      amount:    highestBid,
      status:    "pending",
      timestamp: serverTimestamp()
    });
    closeModal();
    showToast('Investment request sent for "' + ps.title + '"', 'success');
  } catch (err) {
    console.error("Investment request failed: ", err);
    showToast("Investment request failed: " + err.message, "error");
  } finally {
    btn.textContent = 'Confirm Invest';
    btn.disabled = false;
  }
};

function updateWalletDisplay() {
  const f = n => '₹' + n.toLocaleString('en-IN');
  document.getElementById('topbar-balance').textContent = f(state.wallet);
  if (document.getElementById('wallet-display')) {
    document.getElementById('wallet-display').textContent    = f(WALLET_START);
    document.getElementById('invested-display').textContent  = f(state.invested);
    document.getElementById('remaining-display').textContent = f(state.wallet);
  }
}

/* TOAST */
window.showToast = function(msg, type) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = 'toast ' + (type || ''); t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3200);
};

document.getElementById('invest-modal').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});
