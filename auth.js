import { db } from './config.js';
import { state } from './state.js';
import { toast } from './utils.js';
import { toggleAuth, initApp } from './ui.js';

export const setRole = (r) => {
    state.role = r;
    const btnP = document.getElementById('role-player');
    const btnO = document.getElementById('role-organizer');
    if(r === 'player') { 
        btnP.style.borderColor = 'var(--cyan)'; btnP.style.color = 'var(--cyan)'; 
        btnO.style.borderColor = 'var(--border)'; btnO.style.color = 'var(--text-muted)'; 
    } else { 
        btnO.style.borderColor = 'var(--cyan)'; btnO.style.color = 'var(--cyan)'; 
        btnP.style.borderColor = 'var(--border)'; btnP.style.color = 'var(--text-muted)'; 
    }
};

export const signup = () => {
    const btn = document.getElementById('btn-signup-action'); 
    btn.innerHTML = '...';
    const name = document.getElementById('s-name').value;
    const user = document.getElementById('s-user').value.toLowerCase().trim();
    const pass = document.getElementById('s-pass').value;
    const country = document.getElementById('s-country').value;
    const curMap = { 'IN': '₹', 'US': '$', 'EU': '€', 'UK': '£', 'JP': '¥', 'GL': '$' };

    if(!name || !user || !pass) { 
        btn.innerHTML = 'REGISTER'; 
        return toast("Fill all fields"); 
    }

    db.ref('users/' + user).once('value').then((snap) => {
        if(snap.exists()) { 
            btn.innerHTML = 'REGISTER'; 
            return toast("Username taken!"); 
        }
        
        const newUser = { 
            name, username: user, 
            email: document.getElementById('s-email').value, 
            phone: document.getElementById('s-phone').value, 
            password: pass, 
            role: state.role, 
            balance: 0, 
            kycStatus: 'none', 
            country: country, 
            currency: curMap[country] || '$', 
            joinedDate: new Date().toISOString() 
        };
        
        db.ref('users/' + user).set(newUser).then(() => { 
            btn.innerHTML = 'REGISTER'; 
            toast("Created! Login."); 
            toggleAuth('login'); 
        });
    });
};

export const login = () => {
    const btn = document.getElementById('btn-login-action'); 
    btn.innerHTML = '...';
    const user = document.getElementById('l-user').value.toLowerCase().trim();
    const pass = document.getElementById('l-pass').value;

    if(user === 'esportsplayground' && pass === 'vcxz888acxz888eSPG') {
        state.user = { username: 'admin', name: 'Super Admin', role: 'admin', balance: 999999, currency: '$', email:'admin@esp.com', phone:'0000000000', kycStatus:'verified' };
        localStorage.setItem('esp_session', JSON.stringify(state.user)); 
        initApp(); 
        return;
    }

    db.ref('users/' + user).once('value').then((snap) => {
        if (snap.exists()) {
            const d = snap.val();
            if(d.password === pass) {
                if(d.isBanned) { 
                    btn.innerHTML = 'LOGIN'; 
                    return toast("Account Banned"); 
                }
                state.user = d; 
                localStorage.setItem('esp_session', JSON.stringify(d)); 
                initApp();
            } else { 
                btn.innerHTML = 'LOGIN'; 
                toast("Wrong Password"); 
            }
        } else { 
            btn.innerHTML = 'LOGIN'; 
            toast("User not found"); 
        }
    }).catch(e => { 
        btn.innerHTML = 'LOGIN'; 
        alert("Connection Error"); 
    });
};

export const checkSession = () => {
    const s = localStorage.getItem('esp_session');
    if(s) { 
        const u = JSON.parse(s); 
        if(u.role === 'admin') { 
            state.user = u; 
            initApp(); 
        } else { 
            db.ref('users/' + u.username).once('value').then(snap => { 
                if(snap.exists()) { 
                    state.user = snap.val(); 
                    initApp(); 
                } 
            }); 
        } 
    }
};

export const logout = () => { 
    localStorage.removeItem('esp_session'); 
    location.reload(); 
};

export const resetPassword = () => { 
    window.location.href = `mailto:esportsplayground@outlook.com?subject=Reset Password ${state.user.username}&body=Please reset my password.`; 
};