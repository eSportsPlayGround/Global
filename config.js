export const firebaseConfig = {
    apiKey: "AIzaSyBCkWyoKZXAP_TOaqQWdAhM_z_gr7d6H8k",
    authDomain: "esports-playground.firebaseapp.com",
    databaseURL: "https://esports-playground-default-rtdb.firebaseio.com",
    projectId: "esports-playground",
    storageBucket: "esports-playground.firebasestorage.app",
    messagingSenderId: "387918136520",
    appId: "1:387918136520:web:7aaabca5623cadd0a551fd",
    measurementId: "G-JQRJVL49V9"
};

let dbInstance;
try {
    firebase.initializeApp(firebaseConfig);
    dbInstance = firebase.database();
} catch (e) {
    console.error("Firebase Error:", e);
    alert("Connection Error: " + e.message);
}

export const db = dbInstance;