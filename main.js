import * as auth from './auth.js';
import * as ui from './ui.js';
import * as logic from './logic.js';

// Attach modules to window for inline HTML access
window.auth = auth;
window.ui = ui;
window.logic = logic;

// Start App
window.onload = auth.checkSession;