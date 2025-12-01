export const generateId = () => Math.floor(10000000000000 + Math.random() * 90000000000000).toString();

export const toast = (msg) => {
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerText = msg;
    document.getElementById('toast-area').appendChild(t);
    setTimeout(() => t.remove(), 3000);
};

export const copyText = (t) => {
    navigator.clipboard.writeText(t);
    toast("Copied!");
};