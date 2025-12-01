import { db } from './config.js';
import { state } from './state.js';
import { toast, generateId } from './utils.js';
import { router, openModal, addListener, closeDetails } from './ui.js';

export const loadHome = (c) => {
    addListener(db.ref('tournaments'), snap => {
        const arr = []; snap.forEach(i => { let t = i.val(); t.id = i.key; arr.unshift(t); });
        c.innerHTML = `<div style="margin-bottom:20px"><h1 class="h1">Live <span style="color:var(--cyan)">Arena</span></h1></div>${arr.map(t => {
            const isOfficial = t.creatorRole === 'admin';
            const offTag = isOfficial ? `<div class="official-tag">OFFICIAL</div>` : '';
            return `<div class="t-card" onclick="window.logic.openMatch('${t.id}')">${offTag}<img src="${t.img || 'https://via.placeholder.com/500x200'}" class="t-img"><div class="t-body"><div class="flex-between"><h3 class="h2">${t.title}</h3><span class="status-badge st-${t.status}">${t.status}</span></div><p class="text-xs" style="margin-top:4px;">${t.game} • ${t.creator}</p><div class="flex-between" style="margin-top:12px; border-top:1px solid var(--border); padding-top:10px;"><div class="text-xs"><span style="color:var(--cyan)">PRIZE</span><br><span class="bold" style="font-size:16px; color:white;">${t.currency||'$'}${t.prize}</span></div><div class="text-xs" style="text-align:right">ENTRY<br><span class="bold" style="font-size:14px; color:white;">${t.currency||'$'}${t.fee}</span></div></div></div></div>`;
        }).join('')}`;
    });
};

export const loadWallet = (c) => {
    const cur = state.user.currency || '$';
    c.innerHTML = `
        <div class="card" style="text-align:center; border-color:var(--cyan); box-shadow:var(--glow-cyan);">
            <p class="text-xs" style="letter-spacing:1px; color:var(--cyan);">TOTAL BALANCE</p>
            <h1 style="font-size:42px; margin:10px 0;">${cur}${state.user.balance}</h1>
            ${state.user.kycStatus !== 'verified' ? `<div style="background:rgba(255,203,0,0.1); padding:10px; border-radius:8px; border:1px solid var(--yellow); margin-bottom:10px;"><p class="text-xs" style="color:var(--yellow)">⚠️ KYC Verification Pending</p></div><button class="btn btn-primary" onclick="window.ui.openModal('kyc')">COMPLETE KYC</button>` : `<div style="display:flex; gap:10px;"><button class="btn btn-outline" style="border-color:var(--cyan); color:var(--cyan)" onclick="window.ui.openModal('deposit')">ADD MONEY</button><button class="btn btn-outline" onclick="window.logic.withdraw()">WITHDRAW</button></div>`}
        </div>
        ${state.user.role === 'organizer' ? `<button class="btn btn-primary" style="margin:10px 0;" onclick="window.ui.openModal('organizerReward')">REWARD PLAYER</button>` : ''}
        <h3 class="h2" style="margin:20px 0 10px;">History</h3><div id="txn-list">Loading...</div>
    `;
    addListener(db.ref('transactions'), snap => {
        const arr = []; snap.forEach(i => { if(i.val().user === state.user.username) { let v=i.val(); v.id=i.key; arr.unshift(v); } });
        document.getElementById('txn-list').innerHTML = arr.length ? arr.map(t => `<div class="card flex-between" style="padding:12px;"><div><div class="bold text-sm" style="color:white;">${t.type.toUpperCase()}</div><div class="text-xs" style="font-family:monospace; color:var(--text-muted)">ID: ${t.id}</div></div><div style="text-align:right"><div class="bold text-sm">${cur}${t.amount}</div><div class="text-xs" style="color:${t.status==='success'?'var(--neon-green)':(t.status==='rejected'?'var(--pink)':'var(--yellow)')}">${t.status}</div></div></div>`).join('') : '<p class="text-sm">No transactions.</p>';
    });
};

export const loadProfile = (c) => {
     if(state.user.role === 'admin') {
         c.innerHTML = `<h2 class="h1" style="margin-bottom:20px;">Admin Profile</h2><div class="card"><p class="bold">Super Admin</p><p class="text-xs">System Access Level: 10</p></div><button class="btn btn-danger" onclick="window.auth.logout()">LOGOUT</button>`;
         return;
     }
     addListener(db.ref('users/' + state.user.username), snap => {
         if(!snap.exists()) return;
         state.user = snap.val();
         db.ref('tournaments').once('value').then(tsnap => {
             let joined = 0; tsnap.forEach(t => { if(t.val().participants && t.val().participants[state.user.username]) joined++; });
             c.innerHTML = `
                <h2 class="h1" style="margin-bottom:20px;">Profile</h2>
                <div class="card" style="border:1px solid var(--cyan); box-shadow:var(--glow-cyan); background:linear-gradient(135deg, #111 0%, #002 100%);">
                    <div style="display:flex; align-items:center; gap:15px; margin-bottom:15px;">
                        <div style="width:60px; height:60px; background:var(--cyan); border-radius:15px; color:black; display:grid; place-items:center; font-size:24px; font-weight:800;">${state.user.name[0]}</div>
                        <div><div class="h2" style="margin:0; color:white;">${state.user.name}</div><div class="text-xs">@${state.user.username}</div>${state.user.kycStatus==='verified' ? '<span style="color:var(--neon-green); font-size:10px; font-weight:700;">VERIFIED ✓</span>' : '<span style="color:var(--pink); font-size:10px;">UNVERIFIED</span>'}</div>
                    </div>
                    <div class="flex-between" style="background:#000; padding:10px; border-radius:8px;">
                        <div style="text-align:center;"><div class="bold text-sm">${joined}</div><div class="text-xs">Joined</div></div>
                        <div style="text-align:center;"><div class="bold text-sm">${state.user.currency}${state.user.balance}</div><div class="text-xs">Wallet</div></div>
                        <div style="text-align:center;"><div class="bold text-sm">${state.user.role}</div><div class="text-xs">Role</div></div>
                    </div>
                </div>
                <div class="settings-group">
                    <div class="menu-item" onclick="window.ui.openModal('editProfile')"><div class="menu-label"><span class="material-icons-round" style="color:var(--cyan)">edit</span> Edit Details</div><span class="material-icons-round" style="color:#666">chevron_right</span></div>
                    <div class="menu-item" onclick="window.ui.openModal('kyc')"><div class="menu-label"><span class="material-icons-round" style="color:var(--neon-green)">verified</span> KYC Verification</div><span class="material-icons-round" style="color:#666">chevron_right</span></div>
                    <div class="menu-item" onclick="window.ui.openModal('report')"><div class="menu-label"><span class="material-icons-round" style="color:var(--yellow)">report</span> Report Issue</div><span class="material-icons-round" style="color:#666">chevron_right</span></div>
                    <div class="menu-item" onclick="window.auth.resetPassword()"><div class="menu-label"><span class="material-icons-round" style="color:var(--text-muted)">lock</span> Reset Password</div><span class="material-icons-round" style="color:#666">chevron_right</span></div>
                    <div class="menu-item" style="color:var(--pink)" onclick="window.auth.logout()"><div class="menu-label"><span class="material-icons-round">logout</span> Logout</div></div>
                </div>
                <div class="p-tabs"><div class="p-tab active" onclick="window.logic.renderHistory('Live')">Live</div><div class="p-tab" onclick="window.logic.renderHistory('Upcoming')">Upcoming</div><div class="p-tab" onclick="window.logic.renderHistory('Completed')">Completed</div></div>
                <div id="hist-list">Loading...</div>
             `;
             renderHistory('Live');
         });
     });
};

export const renderHistory = (filter) => {
    document.querySelectorAll('.p-tab').forEach(e => { e.classList.toggle('active', e.innerText === filter) });
    db.ref('tournaments').once('value').then(tsnap => {
        const h = [];
        tsnap.forEach(t => { const v = t.val(); v.id = t.key; if(v.participants && v.participants[state.user.username] && v.status === filter) h.push(v); });
        document.getElementById('hist-list').innerHTML = h.length ? h.map(x => `<div class="card" onclick="window.logic.openMatch('${x.id}')"><div class="bold text-sm">${x.title}</div><div class="text-xs">Prize: ${x.currency||'$'}${x.prize}</div></div>`).join('') : '<p class="text-sm">No matches found.</p>';
    });
};

export const loadAdmin = (c, tab) => {
    if(state.user.role !== 'admin') return;
    const tabs = ['users', 'finance', 'kyc', 'reports'];
    const tabUI = tabs.map(t => `<div class="admin-tab ${t===tab?'active':''}" onclick="window.logic.loadAdmin(document.getElementById('main-content'), '${t}')">${t.toUpperCase()}</div>`).join('');
    
    c.innerHTML = `<h2 class="h1" style="margin-bottom:20px;">Admin</h2><button class="btn btn-primary" style="margin-bottom:15px;" onclick="window.ui.router('create_match')">HOST OFFICIAL MATCH</button><div class="admin-tabs">${tabUI}</div><div id="adm-content"><div class="loader"></div></div>`;
    const cont = document.getElementById('adm-content');
    
    if(tab === 'users') {
        addListener(db.ref('users'), snap => {
            let html = `<div class="card"><div style="display:flex; gap:10px;"><input id="adm-search" class="input-box" placeholder="Search Username" style="margin-bottom:0;"><button class="btn btn-primary" style="width:auto;" onclick="window.logic.adminSearchUser()">GO</button></div></div>`;
            snap.forEach(u => { 
                const v = u.val(); 
                if(v.username !== 'admin' && v.role !== 'admin' && v.username !== 'esportsplayground') {
                    html += `<div class="card flex-between"><div><div class="bold">${v.name}</div><div class="text-xs">@${v.username} | Bal: ${v.balance}</div></div><button class="btn btn-outline" style="padding:6px 12px; font-size:11px;" onclick='window.ui.openModal("adminUserDetail", ${JSON.stringify(v)})'>VIEW DATA</button></div>`;
                }
            });
            cont.innerHTML = html;
        });
    } else if (tab === 'finance') {
        addListener(db.ref('transactions').limitToLast(50), snap => {
            let html = '';
            snap.forEach(t => { const v = t.val(); v.id = t.key; if(v.status === 'pending') html += `<div class="card"><div class="flex-between"><span class="bold text-sm">${v.user}</span><span class="text-xs">${v.type}</span></div><div class="flex-between" style="margin:5px 0;"><span class="h2">Amt: ${v.amount}</span><span class="text-xs">ID:${v.id}</span></div><div style="display:flex; gap:10px;"><button class="btn btn-green" style="padding:8px; font-size:12px;" onclick="window.logic.adminTxn('${v.id}','approve','${v.user}',${v.amount},'${v.type}')">APPROVE</button><button class="btn btn-danger" style="padding:8px; font-size:12px;" onclick="window.logic.adminTxn('${v.id}','reject','${v.user}',${v.amount},'${v.type}')">REJECT</button></div></div>`; });
            cont.innerHTML = html || '<p>No pending finance.</p>';
        });
    } else if (tab === 'kyc') {
        addListener(db.ref('users').orderByChild('kycStatus').equalTo('pending'), snap => {
            let html = '';
            snap.forEach(u => { const v = u.val(); html += `<div class="card"><div class="bold text-sm">${v.name} (@${v.username})</div><div class="text-xs" style="margin:5px 0; color:var(--text-muted);">Method: ${v.kycData.method}</div><button class="btn btn-primary" style="padding:8px; font-size:12px;" onclick='window.ui.openModal("adminUserDetail", ${JSON.stringify(v)})'>REVIEW DATA</button></div>`; });
            cont.innerHTML = html || '<p>No pending KYC.</p>';
        });
    } else if (tab === 'reports') {
        addListener(db.ref('reports'), snap => {
            let html = '';
            snap.forEach(r => { const v = r.val(); v.id = r.key; html += `<div class="card"><div class="bold text-sm text-pink">Type: ${v.type}</div><div class="text-xs">Ref: ${v.refId}<br>By: ${v.by}<br>Desc: ${v.desc}</div><button class="btn btn-outline" style="margin-top:5px; padding:6px;" onclick="window.logic.delReport('${v.id}')">RESOLVE</button></div>`; });
            cont.innerHTML = html || '<p>No reports.</p>';
        });
    }
};

export const loadCreate = (c) => {
    const cur = state.user.currency || '$';
    c.innerHTML = `<h2 class="h1" style="margin-bottom:20px;">Host Match</h2><label>Banner URL</label><input id="c-img" class="input-box" placeholder="https://..."><label>Title</label><input id="c-title" class="input-box"><label>Game</label><input id="c-game" class="input-box"><label>Rules</label><input id="c-desc" class="input-box"><div style="display:flex; gap:10px;"><div style="flex:1"><label>Fee (${cur})</label><input type="number" id="c-fee" class="input-box"></div><div style="flex:1"><label>Prize (${cur})</label><input type="number" id="c-prize" class="input-box"></div></div><label>Max Players</label><input type="number" id="c-max" class="input-box" value="100"><label>Status</label><select id="c-status" class="input-box"><option>Upcoming</option><option>Live</option></select><button class="btn btn-primary" onclick="window.logic.createMatch()">PUBLISH</button>`;
};

// ... Actions and Logic functions ...
export const saveRoomInfo = (id) => {
    const rid = document.getElementById('r-id').value, rpass = document.getElementById('r-pass').value;
    db.ref('tournaments/' + id).update({ roomId: rid, roomPass: rpass });
    toast("Room Updated"); document.querySelector('.modal').remove(); openMatch(id);
};

export const submitReport = () => {
    const type = document.getElementById('rep-type').value, id = document.getElementById('rep-id').value, desc = document.getElementById('rep-desc').value;
    if(!id || !desc) return toast("Fill details");
    db.ref('reports').push({ type, refId: id, desc, by: state.user.username, date: new Date().toISOString() });
    toast("Report Sent"); document.querySelector('.modal').remove();
};

export const delReport = (id) => { db.ref('reports/' + id).remove(); };

export const updateProfile = () => {
    const updates = { name: document.getElementById('ep-name').value, phone: document.getElementById('ep-phone').value, email: document.getElementById('ep-email').value };
    db.ref('users/' + state.user.username).update(updates); state.user = { ...state.user, ...updates }; toast("Updated"); document.querySelector('.modal').remove();
};

export const adminUpdateUser = (u) => {
    const bal = parseFloat(document.getElementById('adm-bal').value);
    db.ref('users/' + u).update({ balance: bal });
    toast("Updated"); document.querySelector('.modal').remove();
};

export const submitKyc = () => {
    const m = document.getElementById('k-method').value;
    let data = { method: m };
    if (m === 'paypal') { data.email = document.getElementById('k-pp-email').value; data.user = document.getElementById('k-pp-user').value; data.mobile = document.getElementById('k-pp-mobile').value; }
    else if (m === 'upi') { data.upi = document.getElementById('k-upi-id').value; data.mobile = document.getElementById('k-upi-mobile').value; }
    else { data.bank = document.getElementById('k-bk-name').value; data.acc = document.getElementById('k-bk-acc').value; data.code = document.getElementById('k-bk-code').value; }
    data.linked = data.email || data.upi || data.acc;
    db.ref('users/' + state.user.username).update({ kycStatus: 'pending', kycData: data }); state.user.kycStatus = 'pending'; toast("KYC Submitted"); document.querySelector('.modal').remove(); router('wallet');
};

export const submitDeposit = () => {
    const amt = parseFloat(document.getElementById('d-amt').value), utr = document.getElementById('d-utr').value;
    if(!amt || !utr) return toast("Fill details");
    db.ref('transactions/' + utr).set({ user: state.user.username, type: 'deposit', amount: amt, utr: 'Auto-Gen', status: 'pending', date: new Date().toISOString() }); toast("Sent!"); document.querySelector('.modal').remove();
};

export const withdraw = () => {
    const amt = parseFloat(prompt("Amount:")); if(!amt || amt > state.user.balance) return toast("Invalid Amount");
    const newBal = state.user.balance - amt; db.ref('users/' + state.user.username).update({ balance: newBal }); state.user.balance = newBal;
    const txnId = generateId();
    db.ref('transactions/' + txnId).set({ user: state.user.username, type: 'withdraw', amount: amt, utr: 'Requested', status: 'pending', date: new Date().toISOString() }); router('wallet'); toast("Requested");
};

export const createMatch = () => {
    const cur = state.user.currency || '$';
    const m = { 
        title: document.getElementById('c-title').value, game: document.getElementById('c-game').value, 
        img: document.getElementById('c-img').value, desc: document.getElementById('c-desc').value, 
        fee: parseInt(document.getElementById('c-fee').value), prize: parseInt(document.getElementById('c-prize').value), 
        maxPlayers: parseInt(document.getElementById('c-max').value),
        status: document.getElementById('c-status').value, creator: state.user.username, creatorRole: state.user.role, 
        currency: cur, participants: {} 
    };
    const matchId = generateId();
    db.ref('tournaments/' + matchId).set(m); toast("Published"); router('home');
};

export const openMatch = (id) => {
    // ... (Match detail view logic from monolithic file) ...
    // Note: Due to size limits, I am abbreviating this part. Copy logic from previous response's openMatch function.
    // Ensure you use window.logic and window.ui when attaching onClick events in the HTML string.
    
    // Example:
    // onclick="window.logic.joinMatch('${id}', ...)"
};

export const joinMatch = (id, fee, joining, creatorId, max, current) => {
    // ... (Join match logic) ...
};

export const adminSearchUser = (usernameOverride) => {
    const u = usernameOverride || document.getElementById('adm-search').value.toLowerCase().trim();
    db.ref('users/' + u).once('value').then(s => { if(s.exists()) window.ui.openModal('adminUserDetail', s.val()); else toast("Not found"); });
};

export const adminBan = (u) => { if(confirm("Delete User?")) { db.ref('users/' + u).remove(); toast("Deleted"); document.querySelector('.modal').remove(); } };

export const adminTxn = (id, act, u, amt, type) => {
    db.ref('users/' + u).once('value').then(s => {
        const c = s.val().balance;
        if(act === 'approve' && type === 'deposit') db.ref('users/' + u).update({ balance: c + amt });
        if(act === 'reject' && type === 'withdraw') db.ref('users/' + u).update({ balance: c + amt });
        db.ref('transactions/' + id).update({ status: act === 'approve' ? 'success' : 'rejected' });
    });
};

export const adminKyc = (u) => { db.ref('users/'+u).update({kycStatus:'verified'}); };
export const updateMatchStatus = (id, s) => { db.ref('tournaments/' + id).update({ status: s }); closeDetails(); router('home'); };
export const deleteMatch = (id) => { if(confirm("Delete?")) { db.ref('tournaments/' + id).remove(); closeDetails(); router('home'); } };
export const giveReward = () => {
    const u = document.getElementById('rw-user').value.toLowerCase().trim(), amt = parseFloat(document.getElementById('rw-amt').value);
    if(!u || !amt) return toast("Invalid details");
    db.ref('users/' + u).once('value').then(s => { if(s.exists()) { db.ref('users/' + u).update({ balance: s.val().balance + amt }); toast("Sent!"); document.querySelector('.modal').remove(); } else toast("User not found"); });
};