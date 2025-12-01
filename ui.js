import { db } from './config.js';
import { state, activeListeners } from './state.js';
import { toast, copyText, generateId } from './utils.js';
import * as logic from './logic.js';
import * as auth from './auth.js';

export const toggleAuth = (mode) => {
    document.getElementById('form-login').classList.toggle('hidden', mode !== 'login');
    document.getElementById('form-signup').classList.toggle('hidden', mode !== 'signup');
};

export const clearListeners = () => {
    activeListeners.forEach(l => l.ref.off('value', l.cb));
    activeListeners.length = 0;
};

export const addListener = (ref, callback) => {
    ref.on('value', callback);
    activeListeners.push({ ref: ref, cb: callback });
};

export const initApp = () => {
    document.getElementById('view-auth').classList.add('hidden');
    document.getElementById('view-app').classList.remove('hidden');
    
    if(state.user.role !== 'admin') {
        db.ref('users/' + state.user.username).on('value', snap => {
            if(snap.exists()) {
                state.user = snap.val();
                document.getElementById('nav-user').innerText = state.user.name.split(' ')[0];
                document.getElementById('nav-av').innerText = state.user.name[0];
                document.getElementById('nav-bal').innerText = `${state.user.currency || '$'}${state.user.balance}`;
            }
        });
    } else {
        document.getElementById('nav-user').innerText = "Admin";
        document.getElementById('nav-av').innerText = "A";
        document.getElementById('nav-bal').innerText = "ADM";
    }

    document.getElementById('nav-role').innerText = state.user.role.toUpperCase();
    if(state.user.role === 'organizer' || state.user.role === 'admin') document.getElementById('fab').classList.remove('hidden');
    if(state.user.role === 'admin') document.getElementById('menu-admin').classList.remove('hidden');
    router('home');
};

export const router = (route, navEl = null) => {
    clearListeners();
    if(navEl) { 
        document.querySelectorAll('.nav-item').forEach(e => e.classList.remove('active')); 
        navEl.classList.add('active'); 
    }
    const c = document.getElementById('main-content'); 
    c.innerHTML = '<div class="loader" style="margin-top:50px;"></div>';

    if(route === 'home') logic.loadHome(c);
    if(route === 'wallet') logic.loadWallet(c);
    if(route === 'admin') logic.loadAdmin(c, 'users');
    if(route === 'profile') logic.loadProfile(c);
    if(route === 'create_match') logic.loadCreate(c);
};

export const toggleKycFields = () => {
    const m = document.getElementById('k-method').value;
    document.getElementById('sec-paypal').classList.toggle('hidden', m !== 'paypal');
    document.getElementById('sec-upi').classList.toggle('hidden', m !== 'upi');
    document.getElementById('sec-bank').classList.toggle('hidden', m !== 'bank');
};

export const toggleProfileEdit = () => {
    const inputs = document.querySelectorAll('.prof-in');
    const isDis = inputs[0].disabled;
    inputs.forEach(i => { if(i.id !== 'p-user') i.disabled = !isDis; });
    document.getElementById('btn-save-prof').classList.toggle('hidden', !isDis);
};

export const closeDetails = () => document.getElementById('view-details').classList.add('hidden');

// Modal generation
export const openModal = (type, data = null) => {
    const mc = document.getElementById('modal-container');
    let content = '';
    
    // ... (All modal HTML templates from previous monolithic code go here) ...
    // Using simple switch or if/else for modularity is fine.
    
    if(type === 'kyc') {
        content = `<h2 class="h2">Global KYC</h2><p class="text-xs" style="margin-bottom:15px;">Verify identity.</p><label>Legal Name</label><input id="k-name" class="input-box"><label>Payment</label><select id="k-method" class="input-box" onchange="window.ui.toggleKycFields()"><option value="paypal">PayPal</option><option value="upi">UPI</option><option value="bank">Bank Transfer</option></select><div id="sec-paypal"><label>Email</label><input id="k-pp-email" class="input-box"><label>Username</label><input id="k-pp-user" class="input-box"><label>Mobile</label><input id="k-pp-mobile" class="input-box"></div><div id="sec-upi" class="hidden"><label>UPI ID</label><input id="k-upi-id" class="input-box"><label>Mobile</label><input id="k-upi-mobile" class="input-box"></div><div id="sec-bank" class="hidden"><label>Bank Name</label><input id="k-bk-name" class="input-box"><label>Acc No</label><input id="k-bk-acc" class="input-box"><label>IFSC/SWIFT</label><input id="k-bk-code" class="input-box"></div><button class="btn btn-primary" onclick="window.logic.submitKyc()">SUBMIT</button><button class="btn btn-outline" style="margin-top:10px;" onclick="document.querySelector('.modal').remove()">CANCEL</button>`;
    } else if (type === 'deposit') {
        const autoId = generateId(); 
        content = `<h2 class="h2" style="text-align:center;">Scan & Pay</h2><div style="text-align:center; margin:20px 0;"><img src="https://i.postimg.cc/sXtr7zzk/e-Sports-Play-Ground.png" style="width:180px; border-radius:10px; border:2px solid var(--cyan);"><div style="background:#1f1f22; padding:10px; border-radius:8px; margin-top:10px; display:flex; justify-content:space-between; align-items:center;"><span class="text-xs" style="font-family:monospace">tusharkantidasofficial@oksbi</span><span class="bold text-xs" style="color:var(--cyan); cursor:pointer;" onclick="window.ui.copyText('tusharkantidasofficial@oksbi')">COPY</span></div></div><label>Amount (${state.user.currency})</label><input type="number" id="d-amt" class="input-box"><label>System Transaction ID (Auto)</label><input type="text" id="d-utr" class="input-box" value="${autoId}" disabled style="opacity:0.7; cursor:not-allowed;"><button class="btn btn-primary" onclick="window.logic.submitDeposit()">VERIFY</button><button class="btn btn-outline" style="margin-top:10px;" onclick="document.querySelector('.modal').remove()">CLOSE</button>`;
    } else if (type === 'organizerReward') {
        content = `<h2 class="h2">Reward Player</h2><label>Username</label><input id="rw-user" class="input-box"><label>Amount</label><input type="number" id="rw-amt" class="input-box"><button class="btn btn-primary" onclick="window.logic.giveReward()">SEND</button><button class="btn btn-outline" style="margin-top:10px;" onclick="document.querySelector('.modal').remove()">CANCEL</button>`;
    } else if (type === 'roomInfo') {
        content = `<h2 class="h2">Room Settings</h2><p class="text-xs" style="margin-bottom:15px;">Visible only to joined players when LIVE.</p><label>Room ID</label><input id="r-id" class="input-box" value="${data.roomId || ''}"><label>Password</label><input id="r-pass" class="input-box" value="${data.roomPass || ''}"><button class="btn btn-primary" onclick="window.logic.saveRoomInfo('${data.id}')">SAVE & UPDATE</button><button class="btn btn-outline" style="margin-top:10px;" onclick="document.querySelector('.modal').remove()">CANCEL</button>`;
    } else if (type === 'report') {
        content = `<h2 class="h2">Report Issue</h2><p class="text-xs" style="margin-bottom:15px;">Paste Match ID or Transaction ID</p><label>Issue Type</label><select id="rep-type" class="input-box"><option value="match">Match / Organizer Scam</option><option value="payment">Payment Failure</option></select><label>Reference ID</label><input id="rep-id" class="input-box"><label>Description</label><input id="rep-desc" class="input-box"><button class="btn btn-primary" onclick="window.logic.submitReport()">SUBMIT REPORT</button><button class="btn btn-outline" style="margin-top:10px;" onclick="document.querySelector('.modal').remove()">CANCEL</button>`;
    } else if (type === 'adminUserDetail') {
        const kyc = data.kycData || { method: 'None', linked: 'N/A' };
        let kycHtml = `Method: ${kyc.method}<br>Link: ${kyc.linked}<br>`;
        if(kyc.method === 'paypal') kycHtml += `Email: ${kyc.email}<br>User: ${kyc.user}`;
        if(kyc.method === 'bank') kycHtml += `Bank: ${kyc.bank}<br>Acc: ${kyc.acc}<br>Code: ${kyc.code}`;
        
        content = `
            <h2 class="h2">User Data: ${data.username}</h2>
            <div style="height:350px; overflow-y:auto; margin-bottom:15px;">
                <div class="detail-item"><div class="detail-label">Full Name</div><div class="detail-val">${data.name}</div></div>
                <div class="detail-item"><div class="detail-label">Contact</div><div class="detail-val">${data.email}<br>${data.phone}</div></div>
                <div class="detail-item"><div class="detail-label">Location</div><div class="detail-val">${data.country || 'N/A'} (${data.currency})</div></div>
                <div class="detail-item"><div class="detail-label">Financial</div><div class="detail-val">${kycHtml}</div></div>
                <label>Manage Balance</label><input type="number" id="adm-bal" class="input-box" value="${data.balance}">
                <button class="btn btn-primary" onclick="window.logic.adminUpdateUser('${data.username}')">UPDATE BALANCE/ROLE</button>
                <button class="btn btn-danger" style="margin-top:10px;" onclick="window.logic.adminBan('${data.username}')">DELETE USER</button>
            </div>
            <button class="btn btn-outline" style="margin-top:10px;" onclick="document.querySelector('.modal').remove()">CLOSE</button>`;
    } else if (type === 'editProfile') {
        content = `
            <h2 class="h2">Edit Profile</h2>
            <label>Full Name</label><input id="ep-name" class="input-box" value="${state.user.name}">
            <label>Mobile</label><input id="ep-phone" class="input-box" value="${state.user.phone}">
            <label>Email</label><input id="ep-email" class="input-box" value="${state.user.email}">
            <button class="btn btn-primary" onclick="window.logic.updateProfile()">SAVE CHANGES</button>
            <button class="btn btn-outline" style="margin-top:10px;" onclick="document.querySelector('.modal').remove()">CANCEL</button>
        `;
    }

    mc.innerHTML = `<div class="modal"><div class="modal-content">${content}</div></div>`;
};

// Also expose copyText to window for inline calls
window.ui = { toggleAuth, router, openModal, toggleKycFields, toggleProfileEdit, closeDetails, copyText };