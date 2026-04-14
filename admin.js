import { 
  auth, db, 
  onAuthStateChanged, signInWithEmailAndPassword, signOut,
  collection, doc, getDoc, onSnapshot, updateDoc
} from './firebase-config.js';

let isAdmin = false;

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists() && userDoc.data().role === "admin") {
      isAdmin = true;
      document.getElementById('admin-login-page').style.display = 'none';
      document.getElementById('admin-dashboard-page').style.display = 'block';
      listenToIdeas();
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
  const email = document.getElementById('admin-email').value;
  const pwd = document.getElementById('admin-pwd').value;
  const err = document.getElementById('admin-error');
  
  try {
    err.textContent = "";
    await signInWithEmailAndPassword(auth, email, pwd);
  } catch (e) {
    err.textContent = e.message;
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

window.showToast = function(msg,type){
  const t = document.getElementById('toast');
  t.textContent = msg; 
  t.className = 'toast ' + (type || ''); 
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),3200);
};
