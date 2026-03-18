// ========================
// CONFIG
// ========================
const API_BASE = '/backend/api';
let currentPlayer = null;
let selectedActions = [];
let _pendingDashboardRefresh = false;
let authToken       = localStorage.getItem('gs_token') || null;
let currentCareerId = parseInt(localStorage.getItem('gs_career') || '0') || null;
let selectedSkin      = '#C68642';
let selectedEye       = '#5C3317';
let selectedHairStyle = 'short';
let selectedHairColor = '#1a1a1a';

// ========================
// HAIR STYLES
// ========================
const HAIR_STYLE_DEFS = [
    { id: 'short',  label: 'Corto',  emoji: '💈' },
    { id: 'medium', label: 'Medio',  emoji: '💇' },
    { id: 'long',   label: 'Lungo',  emoji: '🧖' },
    { id: 'curly',  label: 'Ricci',  emoji: '🌀' },
    { id: 'afro',   label: 'Afro',   emoji: '✊' },
    { id: 'mohawk', label: 'Mohawk', emoji: '🤘' },
    { id: 'bun',    label: 'Coda',   emoji: '🎀' },
    { id: 'bald',   label: 'Rasato', emoji: '🧑‍🦲' },
];

const HAIR_PRESET_COLORS = [
    '#1a1a1a','#2d1a0e','#3d2b1f','#5c3317',
    '#8B4513','#A0522D','#C4893E','#D4A017',
    '#F5C842','#C0392B','#922B21','#7D3C98',
    '#808080','#b0b0b0','#d4d4d4','#ffffff',
];

const SKIN_COLORS = {
    light:'#FDDBB4', medium_light:'#E8B88A', medium:'#C68642',
    medium_dark:'#8D5524', dark:'#3B1A08'
};

const EYE_PRESETS = [
    '#5C3317','#3d1f0a','#1E90FF','#4169E1','#228B22','#2E8B57',
    '#8B6914','#D4A017','#708090','#536878','#8B0000','#800080',
    '#4B0082','#1a1a2e'
];

// ========================
// TRADUZIONI (IT / EN)
// ========================
const TRANSLATIONS = {
    it: {
        // Nav
        nav_dashboard: '🏠 Dashboard', nav_game: '⚽ Gioca', nav_career: '📊 Carriera',
        nav_transfer: '🔄 Trasferimento', nav_strutture: '🏗️ Strutture',
        nav_classifica: '🏟️ Classifica', nav_agente: '🤝 Agente',
        nav_notizie: '📰 Notizie', nav_skilltree: '🌟 Abilità',
        // Settings
        settings_title: 'Impostazioni',
        settings_language: '🌐 Lingua / Language',
        settings_navigate: '🗺️ Navigazione',
        settings_main_menu: 'Menu Principale',
        settings_main_menu_sub: 'Cambia carriera o creane una nuova',
        settings_feedback: 'Richiedi un Update',
        settings_feedback_sub: 'Invia suggerimenti agli sviluppatori',
        settings_account: '👤 Account',
        settings_logout: 'Logout Completo',
        settings_logout_sub: 'Disconnetti account e torna al login',
        // Auth
        auth_login: 'Accedi', auth_register: 'Registrati',
        auth_email: 'Email', auth_password: 'Password',
        auth_login_btn: 'Accedi', auth_register_btn: 'Registrati',
        // Game
        play_btn: '⚽ Seleziona almeno 1 azione',
        play_btn_ready: '⚽ Gioca Mese',
        // Dashboard
        dash_season: 'Stag.', dash_age: 'Età',
        dash_overall: 'Overall', dash_energia: 'Energia', dash_morale: 'Morale',
        dash_soldi: 'Budget',
        // Career
        career_new: '+ Nuova Carriera',
        career_select_title: 'Le tue Carriere',
        // Month names
        month_1: 'Gen', month_2: 'Feb', month_3: 'Mar', month_4: 'Apr',
        month_5: 'Mag', month_6: 'Giu', month_7: 'Lug', month_8: 'Ago',
        month_9: 'Set', month_10: 'Ott', month_11: 'Nov', month_12: 'Dic',
        // Misc
        loading: '⏳ Caricamento...',
        error_generic: 'Errore. Riprova.',
        champions_not_started: '🏆 La Champions Cup non è ancora iniziata. Le squadre si qualificano a settembre (top 4 di ogni Prima Divisione).',
        bracket_no_data: 'Nessun tabellone ancora disponibile.',
        // Create career
        create_career_title: 'Nuova Carriera',
        create_name_label: 'Nome Carriera',
        create_player_label: 'Nome Giocatore',
        // Transfer
        transfer_title: 'Trasferimento',
        transfer_once: 'Un solo trasferimento per stagione.',
        // Strutture
        strutture_title: 'Strutture',
    },
    en: {
        // Nav
        nav_dashboard: '🏠 Dashboard', nav_game: '⚽ Play', nav_career: '📊 Career',
        nav_transfer: '🔄 Transfer', nav_strutture: '🏗️ Facilities',
        nav_classifica: '🏟️ Standings', nav_agente: '🤝 Agent',
        nav_notizie: '📰 News', nav_skilltree: '🌟 Skills',
        // Settings
        settings_title: 'Settings',
        settings_language: '🌐 Language / Lingua',
        settings_navigate: '🗺️ Navigation',
        settings_main_menu: 'Main Menu',
        settings_main_menu_sub: 'Switch career or create a new one',
        settings_feedback: 'Request an Update',
        settings_feedback_sub: 'Send suggestions to the developers',
        settings_account: '👤 Account',
        settings_logout: 'Full Logout',
        settings_logout_sub: 'Disconnect account and return to login',
        // Auth
        auth_login: 'Login', auth_register: 'Sign Up',
        auth_email: 'Email', auth_password: 'Password',
        auth_login_btn: 'Login', auth_register_btn: 'Sign Up',
        // Game
        play_btn: '⚽ Select at least 1 action',
        play_btn_ready: '⚽ Play Month',
        // Dashboard
        dash_season: 'Season', dash_age: 'Age',
        dash_overall: 'Overall', dash_energia: 'Energy', dash_morale: 'Morale',
        dash_soldi: 'Budget',
        // Career
        career_new: '+ New Career',
        career_select_title: 'Your Careers',
        // Month names
        month_1: 'Jan', month_2: 'Feb', month_3: 'Mar', month_4: 'Apr',
        month_5: 'May', month_6: 'Jun', month_7: 'Jul', month_8: 'Aug',
        month_9: 'Sep', month_10: 'Oct', month_11: 'Nov', month_12: 'Dec',
        // Misc
        loading: '⏳ Loading...',
        error_generic: 'Error. Please try again.',
        champions_not_started: '🏆 Champions Cup has not started yet. Teams qualify in September (top 4 of each First Division).',
        bracket_no_data: 'No bracket data available yet.',
        // Create career
        create_career_title: 'New Career',
        create_name_label: 'Career Name',
        create_player_label: 'Player Name',
        // Transfer
        transfer_title: 'Transfer',
        transfer_once: 'One transfer per season only.',
        // Strutture
        strutture_title: 'Facilities',
    }
};

let currentLang = localStorage.getItem('gs_lang') || 'it';

function _t(key) {
    return TRANSLATIONS[currentLang]?.[key] ?? TRANSLATIONS['it']?.[key] ?? key;
}



function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('gs_lang', lang);
    // Update lang buttons
    document.getElementById('lang-btn-it')?.classList.toggle('active', lang === 'it');
    document.getElementById('lang-btn-en')?.classList.toggle('active', lang === 'en');
    // Apply all data-i18n elements
    _applyTranslations();
    // Update nav buttons
    _updateNavLabels();
    // Re-render current page text
    if (currentPlayer) {
        renderGame();
        renderDashboard();
    }
}

function _applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const txt = _t(key);
        if (txt) el.textContent = txt;
    });
}

function _updateNavLabels() {
    const map = {
        dashboard: _t('nav_dashboard'), game: _t('nav_game'), career: _t('nav_career'),
        transfer: _t('nav_transfer'), strutture: _t('nav_strutture'),
        classifica: _t('nav_classifica'), agente: _t('nav_agente'),
        notizie: _t('nav_notizie'), skilltree: _t('nav_skilltree'),
    };
    document.querySelectorAll('#main-nav button[data-page]').forEach(btn => {
        const page = btn.dataset.page;
        if (map[page]) btn.textContent = map[page];
    });
}

// Settings modal
function openSettings() {
    const modal = document.getElementById('settings-modal');
    if (!modal) return;
    // Sync lang buttons
    document.getElementById('lang-btn-it')?.classList.toggle('active', currentLang === 'it');
    document.getElementById('lang-btn-en')?.classList.toggle('active', currentLang === 'en');
    // Show/hide home button based on page
    const inGame = !!currentCareerId;
    const homeBtn = document.getElementById('settings-btn-home');
    if (homeBtn) homeBtn.style.display = inGame ? 'flex' : 'none';
    _applyTranslations();
    modal.classList.add('active');
}
function closeSettings() {
    document.getElementById('settings-modal')?.classList.remove('active');
}



// ========================
// SVG CAPELLI
// ========================
function buildHairSVG(style, hc, s) {
    // Proporzioni allineate alla nuova testa: cy=0.40, ry=0.24 → top=0.16, sides=0.16-0.64
    // I capelli coprono dall'alto fino alle tempie (circa s*0.30-0.38)
    const cx = s / 2;
    if (style === 'bald' || !hc) return '';
    switch (style) {
        case 'short':
            // Copertura top+tempie, niente che scende oltre le orecchie
            return `<path d="M${s*0.26} ${s*0.32}
                Q${s*0.24} ${s*0.14} ${cx} ${s*0.12}
                Q${s*0.76} ${s*0.14} ${s*0.74} ${s*0.32}
                Q${s*0.68} ${s*0.24} ${s*0.60} ${s*0.26}
                Q${cx} ${s*0.22} ${s*0.40} ${s*0.26}
                Q${s*0.32} ${s*0.24} ${s*0.26} ${s*0.32}Z"
                fill="${hc}"/>`;
        case 'medium':
            // Scende ai lati fino a circa s*0.50
            return `<path d="M${s*0.24} ${s*0.36}
                Q${s*0.22} ${s*0.16} ${s*0.28} ${s*0.12}
                Q${cx} ${s*0.08} ${s*0.72} ${s*0.12}
                Q${s*0.78} ${s*0.16} ${s*0.76} ${s*0.36}
                Q${s*0.70} ${s*0.28} ${s*0.62} ${s*0.30}
                Q${cx} ${s*0.26} ${s*0.38} ${s*0.30}
                Q${s*0.30} ${s*0.28} ${s*0.24} ${s*0.36}Z" fill="${hc}"/>
                <path d="M${s*0.22} ${s*0.34} Q${s*0.18} ${s*0.44} ${s*0.20} ${s*0.53} Q${s*0.24} ${s*0.55} ${s*0.26} ${s*0.46} Q${s*0.26} ${s*0.38} ${s*0.22} ${s*0.34}Z" fill="${hc}"/>
                <path d="M${s*0.78} ${s*0.34} Q${s*0.82} ${s*0.44} ${s*0.80} ${s*0.53} Q${s*0.76} ${s*0.55} ${s*0.74} ${s*0.46} Q${s*0.74} ${s*0.38} ${s*0.78} ${s*0.34}Z" fill="${hc}"/>`;
        case 'long':
            // Scende lungo i lati fino a s*0.82+
            return `<path d="M${s*0.26} ${s*0.34}
                Q${s*0.24} ${s*0.14} ${s*0.28} ${s*0.10}
                Q${cx} ${s*0.06} ${s*0.72} ${s*0.10}
                Q${s*0.76} ${s*0.14} ${s*0.74} ${s*0.34}
                Q${s*0.68} ${s*0.26} ${s*0.60} ${s*0.28}
                Q${cx} ${s*0.24} ${s*0.40} ${s*0.28}
                Q${s*0.32} ${s*0.26} ${s*0.26} ${s*0.34}Z" fill="${hc}"/>
                <path d="M${s*0.20} ${s*0.36} C${s*0.14} ${s*0.48} ${s*0.12} ${s*0.60} ${s*0.14} ${s*0.72} C${s*0.16} ${s*0.82} ${s*0.20} ${s*0.88} ${s*0.26} ${s*0.90} C${s*0.30} ${s*0.92} ${s*0.32} ${s*0.86} ${s*0.30} ${s*0.80} C${s*0.27} ${s*0.70} ${s*0.25} ${s*0.58} ${s*0.25} ${s*0.46} Q${s*0.24} ${s*0.40} ${s*0.20} ${s*0.36}Z" fill="${hc}"/>
                <path d="M${s*0.80} ${s*0.36} C${s*0.86} ${s*0.48} ${s*0.88} ${s*0.60} ${s*0.86} ${s*0.72} C${s*0.84} ${s*0.82} ${s*0.80} ${s*0.88} ${s*0.74} ${s*0.90} C${s*0.70} ${s*0.92} ${s*0.68} ${s*0.86} ${s*0.70} ${s*0.80} C${s*0.73} ${s*0.70} ${s*0.75} ${s*0.58} ${s*0.75} ${s*0.46} Q${s*0.76} ${s*0.40} ${s*0.80} ${s*0.36}Z" fill="${hc}"/>`;
        case 'curly':
            // Base + cerchi che simulano ricci naturali
            return `<path d="M${s*0.28} ${s*0.34}
                Q${s*0.22} ${s*0.22} ${s*0.28} ${s*0.14}
                Q${cx} ${s*0.06} ${s*0.72} ${s*0.14}
                Q${s*0.78} ${s*0.22} ${s*0.72} ${s*0.34}
                Q${s*0.66} ${s*0.26} ${cx} ${s*0.24}
                Q${s*0.34} ${s*0.26} ${s*0.28} ${s*0.34}Z" fill="${hc}"/>
                <circle cx="${s*0.22}" cy="${s*0.30}" r="${s*0.08}" fill="${hc}"/>
                <circle cx="${s*0.78}" cy="${s*0.30}" r="${s*0.08}" fill="${hc}"/>
                <circle cx="${s*0.32}" cy="${s*0.13}" r="${s*0.07}" fill="${hc}"/>
                <circle cx="${s*0.68}" cy="${s*0.13}" r="${s*0.07}" fill="${hc}"/>
                <circle cx="${cx}"     cy="${s*0.09}" r="${s*0.07}" fill="${hc}"/>
                <circle cx="${s*0.44}" cy="${s*0.11}" r="${s*0.055}" fill="${hc}"/>
                <circle cx="${s*0.56}" cy="${s*0.11}" r="${s*0.055}" fill="${hc}"/>`;
        case 'afro':
            // Grande massa rotonda
            return `<ellipse cx="${cx}"     cy="${s*0.20}" rx="${s*0.30}" ry="${s*0.18}" fill="${hc}"/>
                <ellipse cx="${s*0.20}" cy="${s*0.26}" rx="${s*0.10}" ry="${s*0.12}" fill="${hc}"/>
                <ellipse cx="${s*0.80}" cy="${s*0.26}" rx="${s*0.10}" ry="${s*0.12}" fill="${hc}"/>
                <ellipse cx="${s*0.26}" cy="${s*0.36}" rx="${s*0.07}" ry="${s*0.08}" fill="${hc}"/>
                <ellipse cx="${s*0.74}" cy="${s*0.36}" rx="${s*0.07}" ry="${s*0.08}" fill="${hc}"/>`;
        case 'mohawk':
            // Cresta centrale + raspatura sui lati
            return `<path d="M${s*0.42} ${s*0.34}
                C${s*0.40} ${s*0.24} ${s*0.42} ${s*0.08} ${cx} ${s*0.03}
                C${s*0.58} ${s*0.08} ${s*0.60} ${s*0.24} ${s*0.58} ${s*0.34}
                Q${cx} ${s*0.38} ${s*0.42} ${s*0.34}Z" fill="${hc}"/>`;
        case 'bun':
            // Base corta + pallino raccolto in cima
            return `<path d="M${s*0.26} ${s*0.32}
                Q${s*0.24} ${s*0.14} ${s*0.28} ${s*0.12}
                Q${cx} ${s*0.08} ${s*0.72} ${s*0.12}
                Q${s*0.76} ${s*0.14} ${s*0.74} ${s*0.32}
                Q${s*0.68} ${s*0.24} ${s*0.60} ${s*0.26}
                Q${cx} ${s*0.22} ${s*0.40} ${s*0.26}
                Q${s*0.32} ${s*0.24} ${s*0.26} ${s*0.32}Z" fill="${hc}"/>
                <circle cx="${cx}" cy="${s*0.07}" r="${s*0.10}" fill="${hc}"/>`;
        default:
            return '';
    }
}

function hairStyleSwatchSVG(styleId, size = 44) {
    const s = size, cx = s / 2;
    const skin = '#C68642';
    const hc = styleId === 'bald' ? null : '#3d2b1f';
    const hair = buildHairSVG(styleId, hc, s);
    return `<svg viewBox="0 0 ${s} ${s}" width="${s}" height="${s}" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="${cx}" cy="${s*0.56}" rx="${s*0.26}" ry="${s*0.28}" fill="${skin}"/>
        ${hair}
        <circle cx="${s*0.41}" cy="${s*0.52}" r="${s*0.035}" fill="#333"/>
        <circle cx="${s*0.59}" cy="${s*0.52}" r="${s*0.035}" fill="#333"/>
        <path d="M${s*0.42} ${s*0.65} Q${cx} ${s*0.68} ${s*0.58} ${s*0.65}" stroke="#c0706c" stroke-width="1.0" fill="none" stroke-linecap="round"/>
    </svg>`;
}

function renderAvatarSVG(skinVal, hairStyle, eyeColor, gender, size = 120, hairColor = null) {
    const skin = SKIN_COLORS[skinVal] || skinVal || '#C68642';
    const eye  = (typeof eyeColor === 'string' && eyeColor.startsWith('#')) ? eyeColor : '#5C3317';
    const hc   = hairColor || selectedHairColor || '#1a1a1a';
    const s    = size, cx = s / 2;
    const styleKey = hairStyle ? hairStyle.split('_')[0] : 'short';
    const hairSVG = buildHairSVG(styleKey, styleKey === 'bald' ? null : hc, s);

    // Tonalità pelle derivate
    const hexToRgb = h => { h=h.replace('#',''); return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]; };
    const shade = (h, d) => { const [r,g,b]=hexToRgb(h||'#C68642'); return '#'+[r+d,g+d,b+d].map(v=>'0'+Math.max(0,Math.min(255,v)).toString(16)).map(s=>s.slice(-2)).join(''); };
    const skinDark  = shade(skin, -35);
    const skinShirt = gender === 'female' ? '#c0397a' : '#1565c0';

    // Proporzioni: testa più compatta, niente rect-collo separato
    // Testa: cy=0.40, ry=0.24 → top=0.16, bottom=0.64 (niente spazio doppio mento)
    // Collo+spalle: path continuo dalla base della testa
    // Naso: piccolo hint triangolare
    const headCY = s*0.40, headRX = s*0.24, headRY = s*0.24;
    const eyeY   = s*0.38;
    const noseY  = s*0.49;
    const mouthY = s*0.56;  // bocca più vicina al centro → meno spazio sotto
    const chinY  = s*0.64;  // = bottom della testa

    return `<svg viewBox="0 0 ${s} ${s}" width="${s}" height="${s}" xmlns="http://www.w3.org/2000/svg">
        <!-- Spalle / maglietta -->
        <path d="M${s*0.10} ${s*1.00} L${s*0.10} ${s*0.80} Q${cx} ${s*0.70} ${s*0.90} ${s*0.80} L${s*0.90} ${s*1.00}Z" fill="${skinShirt}"/>
        <path d="M${s*0.10} ${s*0.80} Q${cx} ${s*0.70} ${s*0.90} ${s*0.80}" stroke="${skinShirt}" stroke-width="${s*0.01}" fill="none"/>
        <!-- Collo: path continuo senza stacco -->
        <path d="M${s*0.43} ${chinY} L${s*0.40} ${s*0.78} Q${cx} ${s*0.76} ${s*0.60} ${s*0.78} L${s*0.57} ${chinY}Z" fill="${skin}"/>
        <!-- Testa: forma ellittica con chin definito (nessun doppio mento) -->
        <ellipse cx="${cx}" cy="${headCY}" rx="${headRX}" ry="${headRY}" fill="${skin}"/>
        <!-- Leggera ombra laterale sul viso -->
        <ellipse cx="${s*0.74}" cy="${headCY}" rx="${s*0.07}" ry="${headRY*0.85}" fill="${skinDark}" opacity="0.15"/>
        <!-- Capelli (sopra la testa) -->
        ${hairSVG}
        <!-- Sopracciglia -->
        <path d="M${s*0.34} ${s*0.335} Q${s*0.41} ${s*0.305} ${s*0.47} ${s*0.335}" stroke="${hc||'#555'}" stroke-width="${s*0.017}" fill="none" stroke-linecap="round"/>
        <path d="M${s*0.53} ${s*0.335} Q${s*0.59} ${s*0.305} ${s*0.66} ${s*0.335}" stroke="${hc||'#555'}" stroke-width="${s*0.017}" fill="none" stroke-linecap="round"/>
        <!-- Occhi bianchi -->
        <ellipse cx="${s*0.40}" cy="${eyeY}" rx="${s*0.055}" ry="${s*0.055}" fill="white"/>
        <ellipse cx="${s*0.60}" cy="${eyeY}" rx="${s*0.055}" ry="${s*0.055}" fill="white"/>
        <!-- Iride + pupilla -->
        <circle cx="${s*0.40}" cy="${eyeY}" r="${s*0.032}" fill="${eye}"/>
        <circle cx="${s*0.60}" cy="${eyeY}" r="${s*0.032}" fill="${eye}"/>
        <circle cx="${s*0.40}" cy="${eyeY}" r="${s*0.016}" fill="#111"/>
        <circle cx="${s*0.60}" cy="${eyeY}" r="${s*0.016}" fill="#111"/>
        <!-- Riflessi occhi -->
        <circle cx="${s*0.413}" cy="${eyeY-s*0.012}" r="${s*0.007}" fill="white" opacity="0.9"/>
        <circle cx="${s*0.613}" cy="${eyeY-s*0.012}" r="${s*0.007}" fill="white" opacity="0.9"/>
        <!-- Naso: piccolo e discreto -->
        <path d="M${s*0.48} ${noseY-s*0.04} Q${cx} ${noseY} ${s*0.52} ${noseY-s*0.04}" stroke="${skinDark}" stroke-width="${s*0.012}" fill="none" stroke-linecap="round"/>
        <path d="M${s*0.455} ${noseY} Q${cx} ${noseY+s*0.015} ${s*0.545} ${noseY}" stroke="${skinDark}" stroke-width="${s*0.011}" fill="none" stroke-linecap="round"/>
        <!-- Bocca: sorriso naturale -->
        <path d="M${s*0.41} ${mouthY} Q${cx} ${mouthY+s*0.035} ${s*0.59} ${mouthY}" stroke="#c0706c" stroke-width="${s*0.013}" fill="none" stroke-linecap="round"/>
    </svg>`;
}

// ========================
// SKIN TONE PICKER
// ========================
const SKIN_TONES = [
    { hex: '#FDDBB4', label: 'Molto chiara' },
    { hex: '#F5C89A', label: 'Chiara' },
    { hex: '#EDB882', label: 'Chiara calda' },
    { hex: '#E8A96E', label: 'Chiara dorata' },
    { hex: '#C68642', label: 'Media' },
    { hex: '#B5722E', label: 'Media scura' },
    { hex: '#A0572A', label: 'Ambra' },
    { hex: '#8D5524', label: 'Marrone' },
    { hex: '#5C3317', label: 'Marrone scuro' },
    { hex: '#3B1A08', label: 'Molto scura' },
];

function buildSkinTonePicker() {
    const wrap = document.getElementById('skin-tone-picker');
    if (!wrap) return;
    wrap.innerHTML = SKIN_TONES.map(t => {
        const isActive = selectedSkin === t.hex;
        return `<div class="skin-tone-swatch ${isActive ? 'active' : ''}"
            title="${t.label}" style="background:${t.hex}"
            onclick="selectSkinTone('${t.hex}',this)"></div>`;
    }).join('');
}

function selectSkinTone(hex, el) {
    selectedSkin = hex;
    document.querySelectorAll('.skin-tone-swatch').forEach(s => s.classList.remove('active'));
    el.classList.add('active');
    updateAvatar();
}

// ========================
// HAIR PICKER
// ========================
function buildHairPicker() {
    const styleEl = document.getElementById('hair-style-picker');
    if (styleEl) {
        styleEl.innerHTML = HAIR_STYLE_DEFS.map(h => {
            const isActive = h.id === selectedHairStyle;
            return `<div class="hair-swatch ${isActive ? 'active' : ''}"
                data-val="${h.id}" title="${h.label}"
                onclick="selectHairStyle('${h.id}', this)">
                ${hairStyleSwatchSVG(h.id, 44)}
                <span class="hair-swatch-label">${h.label}</span>
            </div>`;
        }).join('');
    }
    buildHairColorPicker();
}

function buildHairColorPicker() {
    const colorEl = document.getElementById('hair-color-picker');
    if (!colorEl) return;
    colorEl.innerHTML = `
        <div style="position:relative;display:inline-block">
            <button class="cp-open-btn" id="cp-hair-btn"
                onclick="openColorPicker('hair')"
                style="background:${selectedHairColor}">
                <span class="cp-btn-ring"></span>
            </button>
            ${buildColorPickerHTML('hair', selectedHairColor, HAIR_PRESET_COLORS)}
        </div>
        <span class="cp-open-label">Scegli colore capelli</span>`;
    requestAnimationFrame(() => {
        const [h,s,v] = hexToHSV(selectedHairColor);
        drawGradientCanvas('cp-hair-grad', h);
        drawHueSlider('cp-hair-hue');
        updateGradCursor('hair', s, 100 - v);
        updateHueCursor('hair', (h / 360) * 100);
    });
}

function selectHairStyle(val, el) {
    selectedHairStyle = val;
    document.querySelectorAll('#hair-style-picker .hair-swatch').forEach(s => s.classList.remove('active'));
    el.classList.add('active');
    updateAvatar();
}

function updateAvatar() {
    const gender = document.getElementById('c-gender')?.value || 'male';
    const el = document.getElementById('avatar-preview');
    if (el) el.innerHTML = renderAvatarSVG(selectedSkin, selectedHairStyle, selectedEye, gender, 110, selectedHairColor);
}

// ========================
// EYE PICKER
// ========================
function buildEyePicker() {
    const el = document.getElementById('eye-picker-wrap');
    if (!el) return;
    el.innerHTML = `
        <div style="position:relative;display:inline-block">
            <button class="cp-open-btn" id="cp-eye-btn"
                onclick="openColorPicker('eye')"
                style="background:${selectedEye}">
                <span class="cp-btn-ring"></span>
            </button>
            ${buildColorPickerHTML('eye', selectedEye, EYE_PRESETS)}
        </div>
        <span class="cp-open-label">Scegli colore occhi</span>`;
    requestAnimationFrame(() => {
        const [h,s,v] = hexToHSV(selectedEye);
        drawGradientCanvas('cp-eye-grad', h);
        drawHueSlider('cp-eye-hue');
        updateGradCursor('eye', s, 100 - v);
        updateHueCursor('eye', (h / 360) * 100);
    });
}

// ========================
// CUSTOM COLOR PICKER (shared)
// ========================
let cpEyeOpen = false, cpHairOpen = false;
let cpEyeHue = 0, cpHairHue = 0;

function hexToHSV(hex) {
    let r = parseInt(hex.slice(1,3),16)/255;
    let g = parseInt(hex.slice(3,5),16)/255;
    let b = parseInt(hex.slice(5,7),16)/255;
    const max = Math.max(r,g,b), min = Math.min(r,g,b), d = max - min;
    let h = 0, s = max === 0 ? 0 : d/max, v = max;
    if (d !== 0) {
        if (max===r) h = ((g-b)/d % 6);
        else if (max===g) h = (b-r)/d + 2;
        else h = (r-g)/d + 4;
        h = Math.round(h*60); if (h<0) h+=360;
    }
    return [h, Math.round(s*100), Math.round(v*100)];
}

function hsvToHex(h, s, v) {
    s /= 100; v /= 100;
    const f = n => { const k=(n+h/60)%6; return v-v*s*Math.max(0,Math.min(k,4-k,1)); };
    return '#'+[f(5),f(3),f(1)].map(x=>Math.round(x*255).toString(16).padStart(2,'0')).join('');
}

function drawGradientCanvas(canvasId, hue) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.fillStyle = `hsl(${hue},100%,50%)`;
    ctx.fillRect(0,0,W,H);
    const wGrad = ctx.createLinearGradient(0,0,W,0);
    wGrad.addColorStop(0,'rgba(255,255,255,1)');
    wGrad.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle = wGrad; ctx.fillRect(0,0,W,H);
    const bGrad = ctx.createLinearGradient(0,0,0,H);
    bGrad.addColorStop(0,'rgba(0,0,0,0)');
    bGrad.addColorStop(1,'rgba(0,0,0,1)');
    ctx.fillStyle = bGrad; ctx.fillRect(0,0,W,H);
}

function drawHueSlider(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0,0,canvas.width,0);
    const stops = [0,'#ff0000',1/6,'#ffff00',2/6,'#00ff00',3/6,'#00ffff',4/6,'#0000ff',5/6,'#ff00ff',1,'#ff0000'];
    for (let i=0;i<stops.length;i+=2) grad.addColorStop(stops[i], stops[i+1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,canvas.width,canvas.height);
}

function openColorPicker(type) {
    const isEye = type === 'eye';
    const otherId = isEye ? 'hair' : 'eye';
    const otherPopup = document.getElementById(`cp-${otherId}-popup`);
    if (otherPopup) otherPopup.style.display = 'none';
    if (isEye) cpHairOpen=false; else cpEyeOpen=false;

    const popup = document.getElementById(`cp-${type}-popup`);
    if (!popup) return;
    const isOpen = isEye ? cpEyeOpen : cpHairOpen;
    if (isOpen) {
        popup.style.display = 'none';
        if (isEye) cpEyeOpen=false; else cpHairOpen=false;
        return;
    }
    popup.style.display = 'block';
    if (isEye) cpEyeOpen=true; else cpHairOpen=true;

    const hex = isEye ? selectedEye : selectedHairColor;
    const [h,s,v] = hexToHSV(hex);
    if (isEye) cpEyeHue=h; else cpHairHue=h;
    initColorPickerCanvas(type, h, s, v, hex);

    setTimeout(() => {
        document.addEventListener('click', (e) => closePickerOutside(e, type), {once:true, capture:true});
    }, 50);
}

function closePickerOutside(e, type) {
    const popup = document.getElementById(`cp-${type}-popup`);
    const btn = document.getElementById(`cp-${type}-btn`);
    if (popup && !popup.contains(e.target) && e.target !== btn && !btn?.contains(e.target)) {
        popup.style.display = 'none';
        if (type==='eye') cpEyeOpen=false; else cpHairOpen=false;
    }
}

function initColorPickerCanvas(type, h, s, v, hex) {
    const gradId = `cp-${type}-grad`;
    const hueId  = `cp-${type}-hue`;
    drawGradientCanvas(gradId, h);
    drawHueSlider(hueId);

    const gradCanvas = document.getElementById(gradId);
    if (gradCanvas) {
        updateGradCursor(type, s, 100 - v);   // usa % direttamente
        gradCanvas.onmousedown = (e) => {
            const move = (ev) => {
                const rect = gradCanvas.getBoundingClientRect();
                const xPct = Math.max(0, Math.min((ev.clientX - rect.left) / rect.width * 100, 100));
                const yPct = Math.max(0, Math.min((ev.clientY - rect.top)  / rect.height * 100, 100));
                const ns = Math.round(xPct);
                const nv = Math.round(100 - yPct);
                updateGradCursor(type, xPct, yPct);
                applyPickerColor(type, hsvToHex(type==='eye'?cpEyeHue:cpHairHue, ns, nv), false);
            };
            const up=()=>{document.removeEventListener('mousemove',move);document.removeEventListener('mouseup',up);};
            document.addEventListener('mousemove',move);
            document.addEventListener('mouseup',up);
            move(e);
        };
    }

    const hueCanvas = document.getElementById(hueId);
    if (hueCanvas) {
        updateHueCursor(type, (h/360)*100);   // usa % direttamente
        hueCanvas.onmousedown = (e) => {
            const move = (ev) => {
                const rect = hueCanvas.getBoundingClientRect();
                const xPct = Math.max(0, Math.min((ev.clientX - rect.left) / rect.width * 100, 100));
                const newH = Math.round((xPct / 100) * 360);
                if (type==='eye') cpEyeHue=newH; else cpHairHue=newH;
                updateHueCursor(type, xPct);
                drawGradientCanvas(gradId, newH);
                const cur = document.getElementById(`cp-${type}-grad-cursor`);
                if (cur && gradCanvas) {
                    const cx2 = parseFloat(cur.dataset.xpct || '50');
                    const cy2 = parseFloat(cur.dataset.ypct || '50');
                    const ns = Math.round(cx2);
                    const nv = Math.round(100 - cy2);
                    applyPickerColor(type, hsvToHex(newH, ns, nv), false);
                }
            };
            const up=()=>{document.removeEventListener('mousemove',move);document.removeEventListener('mouseup',up);};
            document.addEventListener('mousemove',move);
            document.addEventListener('mouseup',up);
            move(e);
        };
    }

    const hexInp = document.getElementById(`cp-${type}-hex`);
    if (hexInp) hexInp.value = hex.replace('#','').toUpperCase();
    const preview = document.getElementById(`cp-${type}-preview`);
    if (preview) preview.style.background = hex;
}

function updateGradCursor(type, xPct, yPct) {
    const cur = document.getElementById(`cp-${type}-grad-cursor`);
    if (!cur) return;
    cur.style.left = xPct + '%';
    cur.style.top  = yPct + '%';
    cur.dataset.xpct = xPct;
    cur.dataset.ypct = yPct;
}

function updateHueCursor(type, xPct) {
    const cur = document.getElementById(`cp-${type}-hue-cursor`);
    if (!cur) return;
    cur.style.left = xPct + '%';
}

function applyPickerColor(type, hex, updateCursor=true) {
    if (type === 'eye') selectedEye = hex;
    else selectedHairColor = hex;
    const preview = document.getElementById(`cp-${type}-preview`);
    if (preview) preview.style.background = hex;
    const hexInp = document.getElementById(`cp-${type}-hex`);
    if (hexInp) hexInp.value = hex.replace('#','').toUpperCase();
    const btn = document.getElementById(`cp-${type}-btn`);
    if (btn) btn.style.background = hex;
    updateAvatar();
}

function onPickerHexInput(type, val) {
    val = val.replace(/[^0-9a-fA-F]/g,'').slice(0,6);
    document.getElementById(`cp-${type}-hex`).value = val;
    if (val.length === 6) {
        const hex = '#' + val;
        const [h,s,v] = hexToHSV(hex);
        if (type==='eye') cpEyeHue=h; else cpHairHue=h;
        drawGradientCanvas(`cp-${type}-grad`, h);
        drawHueSlider(`cp-${type}-hue`);
        updateGradCursor(type, s, 100 - v);
        updateHueCursor(type, (h/360)*100);
        applyPickerColor(type, hex, false);
    }
}

function buildColorPickerHTML(type, currentHex, presets) {
    const presetsHtml = presets.map(c =>
        `<div class="cp-swatch" style="background:${c}" title="${c}"
            onclick="applyPickerColor('${type}','${c}',true);buildPickerAfterSwatchClick('${type}')"></div>`
    ).join('');
    return `
    <div class="cp-popup" id="cp-${type}-popup" style="display:none">
        <div class="cp-gradient-wrap">
            <canvas id="cp-${type}-grad" width="220" height="130" class="cp-grad-canvas"></canvas>
            <div class="cp-cursor" id="cp-${type}-grad-cursor"></div>
        </div>
        <div class="cp-sliders">
            <div class="cp-slider-row">
                <div class="cp-preview" id="cp-${type}-preview" style="background:${currentHex}"></div>
                <div class="cp-slider-col">
                    <div class="cp-hue-wrap">
                        <canvas id="cp-${type}-hue" width="160" height="12" class="cp-hue-canvas"></canvas>
                        <div class="cp-hue-cursor" id="cp-${type}-hue-cursor"></div>
                    </div>
                </div>
            </div>
            <div class="cp-hex-row">
                <span class="cp-hash">#</span>
                <input class="cp-hex-input" id="cp-${type}-hex" maxlength="6"
                    value="${currentHex.replace('#','').toUpperCase()}"
                    oninput="onPickerHexInput('${type}',this.value)">
            </div>
        </div>
        <div class="cp-presets">${presetsHtml}</div>
    </div>`;
}

function buildPickerAfterSwatchClick(type) {
    if (type === 'eye') {
        buildEyePicker();
        const popup = document.getElementById('cp-eye-popup');
        if (popup) { popup.style.display='block'; const [h,s,v]=hexToHSV(selectedEye); cpEyeHue=h; initColorPickerCanvas('eye',h,s,v,selectedEye); }
    } else {
        buildHairColorPicker();
        const popup = document.getElementById('cp-hair-popup');
        if (popup) { popup.style.display='block'; const [h,s,v]=hexToHSV(selectedHairColor); cpHairHue=h; initColorPickerCanvas('hair',h,s,v,selectedHairColor); }
    }
}

// ========================
// EXIT DROPDOWN
// ========================


function goToCareerSelect() {
    document.getElementById('exit-dropdown')?.classList.remove('open');
    currentCareerId = null;
    localStorage.removeItem('gs_career');
    api('auth.php', { action: 'careers' }, 'GET').then(res => {
        if (res.error) { doLogout(); return; }
        const emailStored = localStorage.getItem('gs_email') || '';
        showCareerSelect(res, emailStored);
    });
}

// ========================
// RICHIEDI UPDATE
// ========================
function openUpdateRequest() {
    document.getElementById('exit-dropdown')?.classList.remove('open');
    const modal = document.getElementById('update-request-modal');
    const txt = document.getElementById('update-request-text');
    const err = document.getElementById('update-request-error');
    const ok  = document.getElementById('update-request-ok');
    if (txt) txt.value = '';
    if (err) err.textContent = '';
    if (ok)  ok.style.display = 'none';
    if (modal) modal.classList.add('active');
}

function closeUpdateRequest() {
    document.getElementById('update-request-modal')?.classList.remove('active');
}

async function sendUpdateRequest() {
    const txt = document.getElementById('update-request-text')?.value.trim();
    const err = document.getElementById('update-request-error');
    const ok  = document.getElementById('update-request-ok');
    if (err) err.textContent = '';
    if (!txt || txt.length < 10) {
        if (err) err.textContent = 'Scrivi almeno 10 caratteri!';
        return;
    }
    const res = await api('auth.php', { action: 'send_update_request', message: txt }, 'POST');
    if (res.error) { if (err) err.textContent = res.error; return; }
    if (ok) ok.style.display = 'block';
    setTimeout(closeUpdateRequest, 2500);
}

// ========================
// INIT
// ========================
document.addEventListener('DOMContentLoaded', async () => {
    // Language init
    _applyTranslations();
    _updateNavLabels();
    document.getElementById('lang-btn-it')?.classList.toggle('active', currentLang === 'it');
    document.getElementById('lang-btn-en')?.classList.toggle('active', currentLang === 'en');

    // AI avatar prompt
    document.getElementById('ai-avatar-prompt')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); generateAIAvatar(); }
    });

    document.querySelectorAll('.auth-tab').forEach(btn => {
        btn.addEventListener('click', () => showAuthTab(btn.dataset.tab));
    });
    document.addEventListener('keydown', e => {
        if (e.key !== 'Enter') return;
        const active = document.querySelector('.auth-tab.active');
        if (!active) return;
        if (active.dataset.tab === 'login') doLogin();
        else if (active.dataset.tab === 'register') doRegister();
    });

    if (authToken) {
        const res = await api('auth.php', { action: 'check' }, 'GET');
        if (res.logged) {
            if (currentCareerId && res.careers?.find(c => c.id == currentCareerId)) {
                await loadPlayer();
                showPage('dashboard');
                return;
            } else {
                showCareerSelect(res.careers, res.email || localStorage.getItem('gs_email') || '');
                return;
            }
        } else {
            authToken = null; currentCareerId = null;
            localStorage.removeItem('gs_token');
            localStorage.removeItem('gs_career');
        }
    }
    showPage('auth');
    buildSkinTonePicker();
    buildHairPicker();
    updateAvatar();
});

// ========================
// API HELPER
// ========================
async function api(endpoint, data = {}, method = 'POST') {
    try {
        let url = `${API_BASE}/${endpoint}`;
        const opts = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'X-Auth-Token': authToken || ''
            }
        };
        if (method === 'GET') {
            data.token = authToken || '';
            if (currentCareerId) data.career_id = currentCareerId;
            data._t = Date.now();
            url += '?' + new URLSearchParams(data);
        } else {
            data.token = authToken || '';
            if (currentCareerId && !data.career_id) data.career_id = currentCareerId;
            opts.body = JSON.stringify(data);
        }
        const res = await fetch(url, opts);
        const text = await res.text();
        try {
            return JSON.parse(text);
        } catch(e) {
            console.error('Risposta non JSON:', text);
            return { error: 'Risposta del server non valida: ' + text.substring(0, 200) };
        }
    } catch (e) {
        console.error('Fetch error:', e);
        return { error: 'Errore di connessione al server. Assicurati che il server PHP sia attivo (bash start.sh)' };
    }
}

// ========================
// NAVIGATION
// ========================
function showPage(page) {
    const targetPage = document.getElementById(`${page}-page`);
    if (!targetPage) { console.error(`Pagina non trovata: ${page}-page`); return; }
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    targetPage.classList.add('active');
    document.querySelectorAll('nav button[data-page]').forEach(b => {
        b.classList.toggle('active', b.dataset.page === page);
    });
    document.getElementById('main-nav').style.display = (page !== 'auth') ? 'flex' : 'none';

    const exitWrap    = document.getElementById('exit-dropdown-wrap');
    const exitOptHome = document.getElementById('exit-opt-home');
    const exitDivHome = document.getElementById('exit-divider-home');
    const isInGame    = (page !== 'auth');
    if (exitWrap) exitWrap.style.display = isInGame ? 'flex' : 'none';
    const inCareer = isInGame && page !== 'career-select';
    if (exitOptHome) exitOptHome.style.display = inCareer ? 'flex' : 'none';
    if (exitDivHome) exitDivHome.style.display = inCareer ? 'block' : 'none';

    if (page === 'dashboard') renderDashboard();
    if (page === 'game')      renderGame();
    if (page === 'career')    loadCareer();
    if (page === 'transfer')  loadTransfer();
    if (page === 'strutture') loadStrutture();
    if (page === 'classifica') loadClassifica();
    if (page === 'agente')     loadAgente();
    if (page === 'notizie')    loadNotizie();
    if (page === 'skilltree')  loadSkillTree();
}

document.querySelectorAll('nav button[data-page]').forEach(btn => {
    btn.addEventListener('click', () => showPage(btn.dataset.page));
});

// ========================
// AUTH
// ========================
function showAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(b => b.classList.remove('active'));
    document.querySelector(`.auth-tab[data-tab="${tab}"]`)?.classList.add('active');
    document.getElementById('login-form').style.display    = tab === 'login'    ? 'block' : 'none';
    document.getElementById('register-form').style.display = tab === 'register' ? 'block' : 'none';
    document.getElementById('forgot-form').style.display   = 'none';
}

function showForgot() {
    ['login-form','register-form'].forEach(id => { const el=document.getElementById(id); if(el) el.style.display='none'; });
    document.getElementById('forgot-form').style.display = 'block';
    document.querySelectorAll('.auth-tab').forEach(b => b.classList.remove('active'));
}

async function doLogin() {
    const email    = document.getElementById('l-email')?.value.trim();
    const password = document.getElementById('l-password')?.value;
    const errEl    = document.getElementById('login-error');
    if (errEl) errEl.textContent = '';
    const res = await api('auth.php', { action:'login', email, password }, 'POST');
    if (res.error) { if (errEl) errEl.textContent = res.error; return; }
    authToken = res.token;
    localStorage.setItem('gs_token', authToken);
    localStorage.setItem('gs_email', email);
    currentCareerId = null; localStorage.removeItem('gs_career');
    showCareerSelect(res.careers || [], res.email || email);
}

async function doRegister() {
    const username = document.getElementById('r-username')?.value.trim();
    const email    = document.getElementById('r-email')?.value.trim();
    const password = document.getElementById('r-password')?.value;
    const pass2    = document.getElementById('r-password2')?.value;
    const errEl    = document.getElementById('register-error');
    if (errEl) errEl.textContent = '';
    if (!username) { if(errEl) errEl.textContent='Inserisci un username'; return; }
    if (password !== pass2) { if(errEl) errEl.textContent='Le password non coincidono'; return; }
    const res = await api('auth.php', { action:'register', email, username, password }, 'POST');
    if (res.error) { if(errEl) errEl.textContent = res.error; return; }
    authToken = res.token;
    localStorage.setItem('gs_token', authToken);
    localStorage.setItem('gs_email', email);
    if (res.username) localStorage.setItem('gs_username', res.username);
    currentCareerId = null;
    showCareerSelect([], email);
}

async function doForgot() {
    const email = document.getElementById('f-email')?.value.trim();
    const errEl = document.getElementById('forgot-error');
    if (errEl) errEl.textContent = '';
    const res = await api('auth.php', { action:'request_reset', email }, 'POST');
    if (res.error) { if(errEl) errEl.textContent = res.error; return; }
    if (errEl) { errEl.style.color='#4caf50'; errEl.textContent = res.msg || 'Istruzioni inviate!'; }
    if (res.debug_link) console.log('RESET LINK (dev):', res.debug_link);
}

async function doLogout() {
    document.getElementById('exit-dropdown')?.classList.remove('open');
    await api('auth.php', { action:'logout' }, 'POST');
    authToken = null; currentPlayer = null; currentCareerId = null;
    localStorage.removeItem('gs_token');
    localStorage.removeItem('gs_career');
    document.getElementById('auth-box-main').style.display  = 'block';
    document.getElementById('career-select-box').style.display = 'none';
    document.getElementById('create-career-box').style.display = 'none';
    showPage('auth'); showAuthTab('login');
}

// ========================
// CARRIERE
// ========================
function showCareerSelect(careers, email) {
    showPage('auth');
    document.getElementById('auth-box-main').style.display     = 'none';
    document.getElementById('career-select-box').style.display = 'block';
    document.getElementById('create-career-box').style.display = 'none';
    const emailEl = document.getElementById('career-account-email');
    if (emailEl) emailEl.textContent = email || '';
    renderCareerList(careers);
    const exitWrap    = document.getElementById('exit-dropdown-wrap');
    const exitOptHome = document.getElementById('exit-opt-home');
    const exitDivHome = document.getElementById('exit-divider-home');
    if (exitWrap) exitWrap.style.display = 'flex';
    if (exitOptHome) exitOptHome.style.display = 'none';
    if (exitDivHome) exitDivHome.style.display = 'none';
}

function renderCareerList(careers) {
    const el       = document.getElementById('careers-list');
    const btnNew   = document.getElementById('btn-new-career');
    const limitMsg = document.getElementById('careers-limit-msg');
    if (!el) return;
    if (!careers || careers.length === 0) {
        el.innerHTML = `<div style="text-align:center;padding:24px;color:var(--text-dim)"><div style="font-size:2.5rem;margin-bottom:12px">⚽</div><p>Nessuna carriera ancora.<br>Creane una per iniziare!</p></div>`;
        if (btnNew) btnNew.style.display = 'block';
        if (limitMsg) limitMsg.style.display = 'none';
        return;
    }
    const gIcon = g => g === 'female' ? '👩' : '👦';
    el.innerHTML = careers.map(c => `
        <div class="career-card" onclick="selectCareer(${c.id})">
            <div class="career-avatar">${
                c.ai_prompt
                    ? `<img src="https://image.pollinations.ai/prompt/${encodeURIComponent('cartoon portrait of a football player, '+c.ai_prompt+', flat illustration style, dark background, gold accents, sporting look, no text')}?width=52&height=52&nologo=true" style="width:52px;height:52px;object-fit:cover;border-radius:50%" alt="AI avatar" loading="lazy">`
                    : c.ai_avatar
                    ? `<img src="${c.ai_avatar}" style="width:52px;height:52px;object-fit:cover;border-radius:50%" alt="avatar">`
                    : renderAvatarSVG(c.skin_color||'medium',c.skin_hair||'short_black',c.eye_color||'brown',c.gender||'male',52,c.hair_color||'#1a1a1a')
            }</div>
            <div class="career-info">
                <div class="career-title">${gIcon(c.gender)} ${c.career_name}</div>
                <div class="career-sub">${c.player_name} · OVR ${c.overall} · Anno ${c.anno_corrente}</div>
                <div class="career-sub" style="color:var(--text-dim)">${c.team_nome||''} ${c.lega_nome?'— '+c.lega_nome:''}</div>
                <div class="career-stats">
                    <span>⚽ ${c.gol_carriera} gol</span>
                    <span>🏆 ${c.trofei} trofei</span>
                    <span>🌟 ${c.palloni_doro} Palloni d'Oro</span>
                </div>
            </div>
            <div class="career-actions" onclick="event.stopPropagation()">
                <button onclick="renameCareer(${c.id},'${(c.career_name||'').replace(/'/g,"\\'")}')" title="Rinomina">✏️</button>
                <button onclick="confirmDeleteCareer(${c.id},'${(c.career_name||'').replace(/'/g,"\\'")}')" title="Elimina" style="color:#ff6b6b">🗑️</button>
            </div>
        </div>`).join('');
    if (careers.length >= 5) { if(btnNew) btnNew.style.display='none'; if(limitMsg) limitMsg.style.display='block'; }
    else { if(btnNew) btnNew.style.display='block'; if(limitMsg) limitMsg.style.display='none'; }
}

async function selectCareer(id) {
    currentCareerId = id; localStorage.setItem('gs_career', id);
    await loadPlayer(); showPage('dashboard');
}

function showCreateCareer() {
    document.getElementById('career-select-box').style.display = 'none';
    document.getElementById('create-career-box').style.display = 'block';
    selectedSkin = '#C68642'; selectedEye = '#5C3317';
    selectedHairStyle = 'short'; selectedHairColor = '#1a1a1a';
    // Reset to default mode every time we open
    _aiAvatarUrl   = null;
    _aiPromptSaved = null;
    setAvatarMode('default');
    buildSkinTonePicker();
    buildHairPicker();
    buildEyePicker();
    updateAvatar();
}

// ── AI Avatar mode ────────────────────────────────────────────────────────
let _aiAvatarUrl = null;  // URL o data URL dell'immagine AI generata

function setAvatarMode(mode) {
    const isAI = mode === 'ai';
    // Toggle tabs
    document.getElementById('btn-mode-default')?.classList.toggle('active', !isAI);
    document.getElementById('btn-mode-ai')?.classList.toggle('active', isAI);
    // Toggle panels
    const defPanel = document.getElementById('avatar-default-panel');
    const aiPanel  = document.getElementById('avatar-ai-panel');
    if (defPanel) defPanel.style.display = isAI ? 'none' : 'block';
    if (aiPanel)  aiPanel.style.display  = isAI ? 'block' : 'none';
    // Sesso: nascosto in AI (non rilevante per immagine generata)
    const genderRow = document.getElementById('gender-row');
    if (genderRow) genderRow.style.display = isAI ? 'none' : '';
    // Preview: torna all'SVG se si torna a default
    if (!isAI) {
        _aiAvatarUrl = null;
        const prev = document.getElementById('avatar-preview');
        if (prev) prev.innerHTML = '';  // verrà ricostruito da updateAvatar()
        updateAvatar();
    } else if (_aiAvatarUrl) {
        _showAIPreview(_aiAvatarUrl);
    } else {
        const prev = document.getElementById('avatar-preview');
        if (prev) {
            prev.innerHTML = `<div style="color:var(--text-dim);font-size:0.75rem;text-align:center;padding:16px;line-height:1.5">Scrivi una descrizione<br>e premi Genera</div>`;
        }
    }
}

// Prompt salvato per passarlo al DB al momento della creazione carriera
let _aiPromptSaved = null;  // prompt AI per Pollinations, resettato ad ogni nuova carriera

async function generateAIAvatar() {
    const promptEl  = document.getElementById('ai-avatar-prompt');
    const statusEl  = document.getElementById('ai-status');
    const btn       = document.getElementById('ai-generate-btn');
    const userPrompt = promptEl?.value.trim();
    if (!userPrompt) {
        if (statusEl) statusEl.textContent = '⚠️ Scrivi una descrizione!';
        promptEl?.focus();
        return;
    }
    if (statusEl) statusEl.textContent = '⏳ Generazione in corso (5-15s)...';
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Generando...'; }

    const prev = document.getElementById('avatar-preview');
    if (prev) prev.innerHTML = `<div class="ai-spinner"></div>`;

    try {
        // Ottieni l'URL Pollinations dal PHP (sanitizza il prompt)
        const res = await api('ai_avatar.php', { prompt: userPrompt }, 'POST');
        if (res.error) throw new Error(res.error);

        _aiPromptSaved = res.prompt;   // prompt pulito da salvare nel DB
        _aiAvatarUrl   = res.url;      // URL Pollinations per il preview

        _showAIPreview(res.url, statusEl, btn);
    } catch(e) {
        if (statusEl) statusEl.textContent = `❌ ${e.message || 'Errore. Riprova.'}`;
        if (btn) { btn.disabled = false; btn.textContent = '🎨 Genera Immagine'; }
        if (prev) prev.innerHTML = `<div style="color:var(--text-dim);font-size:0.75rem;text-align:center;padding:16px;line-height:1.5">Nessuna<br>anteprima</div>`;
    }
}

function _showAIPreview(url, statusEl, btn) {
    const prev = document.getElementById('avatar-preview');
    if (!prev) return;
    // Mostra loader finché l'immagine non è caricata
    prev.innerHTML = `<div class="ai-spinner"></div>`;
    const img = new Image();
    img.onload = () => {
        prev.innerHTML = '';
        img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:50%';
        prev.appendChild(img);
        if (statusEl) statusEl.textContent = '✅ Pronto!';
        if (btn) { btn.disabled = false; btn.textContent = '🔄 Rigenera'; }
    };
    img.onerror = () => {
        prev.innerHTML = `<div style="color:var(--text-dim);font-size:0.72rem;text-align:center;padding:12px;line-height:1.5">Immagine<br>non disponibile</div>`;
        if (statusEl) statusEl.textContent = '⚠️ Riprova o modifica la descrizione';
        if (btn) { btn.disabled = false; btn.textContent = '🎨 Genera Immagine'; }
    };
    img.src = url;
    img.alt = 'AI Avatar';
}

// Intercetta Enter nel textarea AI per generare
// i18n init and AI prompt keydown are integrated into main DOMContentLoaded above

function showCareerSelectBack() {
    document.getElementById('career-select-box').style.display = 'block';
    document.getElementById('create-career-box').style.display = 'none';
}

async function doCreateCareer() {
    const career_name     = document.getElementById('c-career-name')?.value.trim() || 'Nuova Carriera';
    const player_name     = document.getElementById('c-name')?.value.trim();
    const gender          = document.getElementById('c-gender')?.value || 'male';
    const age             = document.getElementById('c-age')?.value || '17';
    const nationality     = document.getElementById('c-nationality')?.value || 'Italy';
    const piede_preferito = document.getElementById('c-piede-preferito')?.value || 'dx';
    const piede_forte_lato  = piede_preferito;
    const piede_debole_lato = piede_preferito === 'dx' ? 'sx' : 'dx';
    const errEl = document.getElementById('create-error');
    if (errEl) errEl.textContent = '';

    // Modalità AI: l'avatar è un'immagine generata
    const isAIMode = document.getElementById('btn-mode-ai')?.classList.contains('active');
    if (isAIMode && !_aiPromptSaved) {
        if (errEl) errEl.textContent = 'Prima genera un\'immagine AI, oppure torna alla modalità Default.';
        return;
    }

    const res = await api('auth.php', {
        action:'create_career', career_name, player_name, gender, age, nationality,
        skin_hair: isAIMode ? 'ai' : selectedHairStyle,
        skin_color: isAIMode ? 'ai' : selectedSkin,
        eye_color:  isAIMode ? 'ai' : selectedEye,
        hair_color: isAIMode ? 'ai' : selectedHairColor,
        ai_prompt:  isAIMode ? _aiPromptSaved : null,
        ai_avatar:  null,  // non più usato per Pollinations (si rigenera dall'URL)
        piede_forte: 3, piede_debole: 2, piede_forte_lato, piede_debole_lato
    }, 'POST');
    if (res.error) { if(errEl) errEl.textContent = res.error; return; }
    currentCareerId = res.career_id; localStorage.setItem('gs_career', currentCareerId);
    await loadPlayer(); showPage('dashboard');
    toast('Benvenuto! La tua carriera inizia ora! ⚽', 'gold');
}

async function renameCareer(id, currentName) {
    const name = prompt('Nuovo nome carriera:', currentName);
    if (!name || name.trim() === currentName) return;
    const res = await api('auth.php', { action:'rename_career', career_id:id, name:name.trim() }, 'POST');
    if (res.error) { toast(res.error,'error'); return; }
    renderCareerList(res.careers);
}

async function confirmDeleteCareer(id, name) {
    if (!confirm(`Eliminare la carriera "${name}"?\nQuesta azione è irreversibile!`)) return;
    const res = await api('auth.php', { action:'delete_career', career_id:id }, 'POST');
    if (res.error) { toast(res.error,'error'); return; }
    renderCareerList(res.careers); toast('Carriera eliminata','info');
}

// ========================
// LOAD PLAYER
// ========================
async function loadPlayer() {
    if (!currentCareerId) return;
    const [res, agRes] = await Promise.all([
        api('player.php', { action:'get', career_id:currentCareerId }, 'GET'),
        api('agente.php', { action:'get', career_id:currentCareerId }, 'GET')
    ]);
    if (res && !res.error) {
        const agSconti = {1:2.5, 2:5.0, 3:7.5, 4:10.0, 5:15.0};
        res.agent_ovr_sconto = agSconti[agRes?.livello] || 0;
        currentPlayer = res;
    }
}

// ========================
// DASHBOARD
// ========================
function renderDashboard() {
    if (!currentPlayer) return;
    const p = currentPlayer;

    document.getElementById('player-name-display').textContent = p.player_name;
    document.getElementById('player-subtitle').textContent = `${p.nationality} · ${p.age} anni · Anno ${p.anno_corrente}`;

    const avatarWrap = document.querySelector('.player-avatar');
    if (avatarWrap) {
        if (p.ai_prompt) {
            const pollUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent('cartoon portrait of a football player, '+p.ai_prompt+', flat illustration style, dark background, gold accents, sporting look, no text')}?width=128&height=128&nologo=true`;
            avatarWrap.innerHTML = `<img src="${pollUrl}" style="width:72px;height:72px;object-fit:cover;border-radius:50%" alt="AI avatar" loading="lazy">`;
        } else if (p.ai_avatar) {
            avatarWrap.innerHTML = `<img src="${p.ai_avatar}" style="width:72px;height:72px;object-fit:cover;border-radius:50%" alt="avatar">`;
        } else {
            avatarWrap.innerHTML = renderAvatarSVG(p.skin_color||'medium', p.skin_hair||'short_black', p.eye_color||'brown', p.gender||'male', 72, p.hair_color||'#1a1a1a');
        }
        avatarWrap.style.background = 'transparent';
        avatarWrap.style.border = '3px solid var(--gold)';
    }

    const stars = '⭐'.repeat(parseInt(p.team_stelle || 1));
    const legaInfo = p.lega_nome ? ` · ${p.nazione_bandiera || ''} ${p.lega_nome}` : '';
    document.getElementById('player-team').textContent = `${stars} ${p.team_nome || 'Senza squadra'}${legaInfo}`;

    // OVR circle — anima da 0% → valore reale via rAF (cross-browser)
    const ov = parseInt(p.overall);
    const targetPct = Math.min(100, (ov / 125) * 100);
    const circle = document.getElementById('overall-circle');
    const ovValEl = document.getElementById('overall-value');
    circle.style.setProperty('--pct', '0%');
    ovValEl.textContent = '0';
    requestAnimationFrame(() => requestAnimationFrame(() => {
        _animateCounter(ovValEl, 0, ov, 950);
        _animateOvrCircle(circle, 0, targetPct, 950);
    }));

    ['tiro','velocita','dribbling','fisico','mentalita'].forEach(s => {
        const val = parseInt(p[s]);
        const row = document.querySelector(`[data-stat="${s}"]`);
        if (row) {
            const pct   = Math.min(100,(val/125)*100);
            const bar   = row.querySelector('.stat-bar');
            const valEl = row.querySelector('.stat-value');
            if (val >= 100) { bar.classList.add('stat-bar-super'); valEl.classList.add('legendary'); }
            else { bar.classList.remove('stat-bar-super'); valEl.classList.remove('legendary'); }
            bar.style.width = '0%';
            valEl.textContent = '0';
            requestAnimationFrame(() => requestAnimationFrame(() => {
                bar.style.width = pct + '%';
                _animateCounter(valEl, 0, val, 900);
            }));
        }
    });

    renderSpecialBar('energia',    parseInt(p.energia),    'bar-green');
    renderSpecialBar('morale',     parseInt(p.morale),     'bar-blue');
    renderSpecialBar('popolarita', parseInt(p.popolarita), 'bar-purple');

    // Soldi — anima dal valore precedente al nuovo
    const soldiEl = document.getElementById('info-soldi');
    const prevSoldi = parseFloat(soldiEl.dataset.raw ?? p.soldi);
    const newSoldi  = parseFloat(p.soldi);
    soldiEl.dataset.raw = newSoldi;
    if (prevSoldi !== newSoldi) {
        _animateMoneyCounter(soldiEl, prevSoldi, newSoldi, 900);
    } else {
        soldiEl.textContent = formatMoney(newSoldi);
    }

    document.getElementById('info-struttura').textContent = getStrutturaName(p.struttura_livello);
    // Mostra "Stagione X — NomeMese" per chiarire che l'anno è l'anno della stagione
    const _meseNome = getMeseName(p.mese_corrente);
    document.getElementById('info-mese').textContent = `Stag. ${p.anno_corrente} — ${_meseNome}`;

    _loadSeasonStats(p.anno_corrente);

    const pf = parseInt(p.piede_forte || 3);
    const pd = parseInt(p.piede_debole || 2);
    const ls = parseInt(p.livello_skill || 2);
    const pfLato = p.piede_forte_lato === 'sx' ? 'Sinistro' : 'Destro';
    const pdLato = p.piede_debole_lato === 'sx' ? 'Sinistro' : 'Destro';
    const pfEl = document.getElementById('info-piede-forte');
    const pdEl = document.getElementById('info-piede-debole');
    const lsEl = document.getElementById('info-livello-skill');
    if (pfEl) pfEl.innerHTML = `${'⭐'.repeat(pf)}${'☆'.repeat(5-pf)} <small style="color:var(--text-dim)">${pfLato}</small>`;
    if (pdEl) pdEl.innerHTML = `${'⭐'.repeat(pd)}${'☆'.repeat(5-pd)} <small style="color:var(--text-dim)">${pdLato}</small>`;
    if (lsEl) lsEl.textContent = '⭐'.repeat(ls) + '☆'.repeat(5-ls) + ` (${ls}/5)`;

    loadDashboardObiettivi();
    loadDashboardNotizie();
}

async function _loadSeasonStats(anno) {
    const golEl    = document.getElementById('info-gol');
    const assistEl = document.getElementById('info-assist');
    if (!golEl || !assistEl) return;
    const res = await api('player.php', { action: 'season_detail', anno }, 'GET');
    if (res && !res.error) {
        golEl.textContent    = res.gol ?? 0;
        assistEl.textContent = res.assist ?? 0;
    } else {
        golEl.textContent    = 0;
        assistEl.textContent = 0;
    }
}

function renderSpecialBar(id, val, cls) {
    const el = document.querySelector(`[data-special="${id}"]`);
    if (!el) return;
    const bar   = el.querySelector('.stat-bar');
    const valEl = el.querySelector('.stat-value');
    // Rimuovi eventuali classi colore precedenti prima di aggiungere
    el.classList.remove('bar-green', 'bar-blue', 'bar-purple');
    el.classList.add(cls);
    bar.style.width = '0%';
    valEl.textContent = '0';
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            bar.style.width = val + '%';
            _animateCounter(valEl, 0, val, 700);
        });
    });
}

// Contatore numerico animato: scorre da `from` a `to` in `duration`ms
function _animateCounter(el, from, to, duration) {
    if (!window.requestAnimationFrame) { el.textContent = to; return; }
    const start = performance.now();
    const diff  = to - from;
    function step(now) {
        const elapsed  = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased    = 1 - Math.pow(1 - progress, 4); // easeOutQuart
        el.textContent = Math.round(from + diff * eased);
        if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

// Anima il conic-gradient dell'overall circle da fromPct% → toPct%
function _animateOvrCircle(el, fromPct, toPct, duration) {
    if (!window.requestAnimationFrame) { el.style.setProperty('--pct', toPct + '%'); return; }
    const start = performance.now();
    const diff  = toPct - fromPct;
    function step(now) {
        const elapsed  = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased    = 1 - Math.pow(1 - progress, 4); // easeOutQuart
        el.style.setProperty('--pct', (fromPct + diff * eased).toFixed(2) + '%');
        if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

// Contatore soldi animato: scorre da `from` a `to` formattando come denaro
function _animateMoneyCounter(el, from, to, duration) {
    if (!window.requestAnimationFrame) { el.textContent = formatMoney(to); return; }
    const start = performance.now();
    const diff  = to - from;
    function step(now) {
        const elapsed  = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased    = 1 - Math.pow(1 - progress, 4);
        el.textContent = formatMoney(from + diff * eased);
        if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}
function renderGame() {
    if (!currentPlayer) return;
    const p = currentPlayer;
    const dotsEl = document.getElementById('month-dots');
    dotsEl.innerHTML = '';
    // La stagione va da Settembre(9) a Giugno(6): 9,10,11,12,1,2,3,4,5,6
    const SEASON_MONTHS = [9, 10, 11, 12, 1, 2, 3, 4, 5, 6];
    const MONTH_ABBR    = ['','Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];
    const currentIdx = SEASON_MONTHS.indexOf(p.mese_corrente);

    SEASON_MONTHS.forEach((m, idx) => {
        const dot = document.createElement('div');
        const isDone    = currentIdx > -1 && idx < currentIdx;
        const isCurrent = m === p.mese_corrente;
        dot.className = 'month-dot' + (isDone ? ' done' : isCurrent ? ' current' : '');
        dot.title = MONTH_ABBR[m];
        dotsEl.appendChild(dot);
    });

    // Calcola l'anno di inizio stagione: la stagione inizia a settembre
    // → Set-Dic appartengono all'anno corrente, Gen-Giu all'anno corrente (stesso anno di stagione)
    // Ma per chiarezza mostriamo "Stagione X" che va da set(anno) a giu(anno)
    const meseCorrente = parseInt(p.mese_corrente);
    // Anno di inizio stagione: se siamo in Set-Dic è p.anno_corrente, se in Gen-Giu è p.anno_corrente
    // L'anno della stagione è sempre p.anno_corrente (che avanza solo dopo giugno)
    const annoStagione = parseInt(p.anno_corrente);
    document.getElementById('current-month-text').textContent =
        `${MONTH_ABBR[meseCorrente]} · Stagione ${annoStagione} · Età ${p.age}`;
    document.getElementById('g-overall').textContent = p.overall;
    document.getElementById('g-energia').textContent = p.energia;
    document.getElementById('g-morale').textContent  = p.morale;
    document.getElementById('g-soldi').textContent   = formatMoney(p.soldi);
    selectedActions = [];

    const infortuni = parseInt(p.infortuni_mesi ?? 0);
    const energia   = parseInt(p.energia ?? 0);

    // Azioni fisiche — bloccate se infortunato O se energia = 0
    const AZIONI_FISICHE = ['allenamento_tiro','allenamento_velocita','dribbling',
                            'allenamento_fisico','allenamento_speciale'];
    document.querySelectorAll('.action-btn').forEach(b => {
        b.classList.remove('selected', 'action-blocked', 'action-warn');
        const id = b.dataset.action;
        const isFisica = AZIONI_FISICHE.includes(id);
        if (isFisica && (infortuni > 0 || energia === 0)) {
            b.classList.add('action-blocked');
            b.disabled = true;
        } else {
            b.disabled = false;
            // Warning giallo se energia bassa (1-25) per azioni fisiche
            if (isFisica && energia > 0 && energia <= 25) b.classList.add('action-warn');
        }
    });

    // Banner stato sopra la griglia
    const actionsPanel = document.querySelector('.actions-panel');
    const existingBanner = actionsPanel?.querySelector('.game-state-banner');
    if (existingBanner) existingBanner.remove();
    if (actionsPanel) {
        let bannerHTML = '';
        if (infortuni > 0) {
            bannerHTML = `🩹 Sei infortunato — <strong>${infortuni} mes${infortuni === 1 ? 'e' : 'i'} rimanenti</strong>. Puoi solo riposare, allenarti mentalmente o fare attività social.`;
        } else if (energia === 0) {
            bannerHTML = `⚡ Energia esaurita — non puoi allenarti fisicamente. Riposati prima!`;
        } else if (energia <= 25) {
            bannerHTML = `⚠️ Energia bassa (${energia}) — rischio infortuni elevato negli allenamenti fisici!`;
        }
        if (bannerHTML) {
            const banner = document.createElement('div');
            banner.className = `game-state-banner ${infortuni > 0 ? 'banner-infortuni' : energia === 0 ? 'banner-no-energia' : 'banner-warn-energia'}`;
            banner.innerHTML = bannerHTML;
            actionsPanel.insertBefore(banner, actionsPanel.querySelector('.actions-grid'));
        }
    }

    updatePlayBtn();
    loadRecentLog();
}

const ACTIONS = [
    { id: 'allenamento_tiro',     icon: '🎯', name: 'Allena Tiro',         desc: 'Migliora la precisione in porta' },
    { id: 'allenamento_velocita', icon: '⚡', name: 'Allena Velocità',      desc: 'Aumenta la velocità di corsa' },
    { id: 'dribbling',            icon: '🏃', name: 'Allena Dribbling',     desc: 'Migliora il controllo palla' },
    { id: 'allenamento_fisico',   icon: '💪', name: 'Allena Fisico',        desc: 'Costruisci massa muscolare' },
    { id: 'allenamento_mentalita', icon: '🧠', name: 'Allena Mentalità',      desc: 'Migliora focus e resistenza mentale' },
    { id: 'riposo',               icon: '😴', name: 'Riposo',               desc: 'Recupera energia e morale' },
    { id: 'social',               icon: '📱', name: 'Attività Social',      desc: 'Aumenta la popolarità' },
    { id: 'allenamento_speciale', icon: '🔥', name: 'Allenamento Speciale', desc: 'Alto rischio, alto guadagno' },
];

document.getElementById('actions-grid').innerHTML = ACTIONS.map(a => `
    <button class="action-btn" data-action="${a.id}" onclick="toggleAction('${a.id}', this)">
        <span class="action-icon">${a.icon}</span>
        <div class="action-name">${a.name}</div>
        <div class="action-desc">${a.desc}</div>
    </button>
`).join('');

function toggleAction(id, el) {
    if (el.classList.contains('action-blocked')) {
        const infortuni = parseInt(currentPlayer?.infortuni_mesi ?? 0);
        const energia   = parseInt(currentPlayer?.energia ?? 0);
        if (infortuni > 0) toast('Sei infortunato, non puoi allenarti fisicamente!', 'error');
        else if (energia === 0) toast('Energia a zero! Riposati prima di allenarti.', 'error');
        return;
    }
    if (selectedActions.includes(id)) {
        selectedActions = selectedActions.filter(a => a !== id);
        el.classList.remove('selected');
    } else if (selectedActions.length < 3) {
        selectedActions.push(id);
        el.classList.add('selected');
    } else {
        toast('Puoi scegliere massimo 3 azioni!', 'error');
    }
    updatePlayBtn();
}

function updatePlayBtn() {
    const btn = document.getElementById('play-month-btn');
    btn.disabled = selectedActions.length === 0;
    btn.textContent = selectedActions.length > 0
        ? `⚽ Gioca Mese (${selectedActions.length} azioni selezionate)`
        : '⚽ Seleziona almeno 1 azione';
}

document.getElementById('play-month-btn').addEventListener('click', async () => {
    if (selectedActions.length === 0) return;
    const btn = document.getElementById('play-month-btn');
    btn.disabled = true;
    btn.textContent = '⏳ Simulazione in corso...';
    const res = await api('game.php', { action: 'play_month', azioni: selectedActions });
    if (res.error) {
        toast(res.error, 'error');
        btn.disabled = false;
        updatePlayBtn();
        return;
    }
    await loadPlayer();
    if (res.pallone_doro?.pos === 1) {
        await _showPalloneDoro(res.pallone_doro.msg);
    }
    showResults(res);
    renderGame();
    // Aggiorna dashboard solo se non è già la pagina attiva —
    // se lo è, renderDashboard parte al close del modal tramite _pendingDashboardRefresh
    const dashActive = document.getElementById('dashboard-page')?.classList.contains('active');
    if (dashActive) {
        _pendingDashboardRefresh = true;
    } else {
        renderDashboard();
    }
});

function showResults(res) {
    const modal = document.getElementById('results-modal');
    const list  = document.getElementById('results-list');
    const allenamento = [], infortuni = [], altri = [], champions = [];

    (res.risultati || []).forEach(r => {
        if (r.includes('INFORTUN') || r.includes('infortun') || r.startsWith('🚨')) infortuni.push(r);
        else if (r.startsWith('🎯')||r.startsWith('⚡')||r.startsWith('💪')||
                 r.startsWith('🏃')||r.startsWith('😴')||r.startsWith('📱')||
                 r.startsWith('🔥')||r.startsWith('🧠')) allenamento.push(r);
        else if (r.startsWith('⚽ ')) { /* skip */ }
        else if (r.startsWith('🏆')||r.startsWith('💔 Champions')) champions.push(r);
        else altri.push(r);
    });

    const legaMsgs = res.lega_msgs || [];
    let html = '';

    if (res.pallone_doro?.pos > 0)
        html += `<div class="res-banner">🏆 ${res.pallone_doro.msg}</div>`;
    if (res.fine_carriera)
        html += `<div class="res-banner">🏁 FINE CARRIERA!</div>`;
    if (res.promozione) {
        const tipo = res.promozione.includes('PROMOZIONE') ? 'promozione' : 'retrocessione';
        html += `<div class="res-banner ${tipo}-banner">${res.promozione}</div>`;
    }
    if (allenamento.length) {
        html += `<div class="res-section"><div class="res-section-title">🏋️ Allenamento</div>
            <div class="res-row-wrap">${allenamento.map(r=>`<div class="res-chip">${r}</div>`).join('')}</div></div>`;
    }
    if (infortuni.length) {
        html += `<div class="res-section infortuni-section"><div class="res-section-title">🚑 Infortuni</div>
            ${infortuni.map(r=>`<div class="res-chip danger">${r}</div>`).join('')}</div>`;
    }
    if (legaMsgs.length) {
        const esitoColor = { V:'#4ade80', P:'#facc15', S:'#f87171' };
        const esitoLabel = { V:'VITTORIA', P:'PAREGGIO', S:'SCONFITTA' };
        html += `<div class="res-section"><div class="res-section-title">⚽ Partite del mese</div><div class="res-matches">`;
        legaMsgs.forEach(m => {
            let esito = (m.esito || '').toString().trim().toUpperCase();
            if (esito !== 'V' && esito !== 'P' && esito !== 'S') esito = 'S';
            if (parseInt(m.gf) === parseInt(m.gs)) esito = 'P';
            const color = esitoColor[esito] || '#aaa';
            const label = esitoLabel[esito] || esito;
            const punti = esito === 'V' ? 3 : esito === 'P' ? 1 : 0;
            html += `<div class="res-match-card" style="border-top:3px solid ${color}" data-gol="${m.player_gol ?? 0}" data-esito="${esito}">
                <div class="res-match-header">
                    <span class="res-match-giornata">G${m.giornata}</span>
                    <span class="res-match-esito" style="color:${color}">${label}</span>
                    <span class="res-match-casa">${m.isHome ? '🏠 Casa' : '✈️ Trasferta'}</span>
                </div>
                <div class="res-match-score">${m.gf} – ${m.gs}</div>
                <div class="res-match-vs">vs <strong>${m.avv}</strong></div>
                <div class="res-match-pts">+${punti} pt</div>
                <div class="res-match-stats">
                    <span>⚽ ${m.player_gol ?? '-'} gol</span>
                    <span>🎯 ${m.player_assist ?? '-'} assist</span>
                    <span>📊 ${m.player_voto ?? '-'}</span>
                </div>
            </div>`;
        });
        html += `</div></div>`;
    }
    if (champions.length) {
        html += `<div class="res-section"><div class="res-section-title">🏆 Champions Cup</div>
            ${champions.map(r=>`<div class="res-chip">${r}</div>`).join('')}</div>`;
    }
    if (altri.length) {
        html += `<div class="res-section"><div class="res-section-title">📋 Altro</div>
            <div class="res-row-wrap">${altri.map(r=>`<div class="res-chip">${r}</div>`).join('')}</div></div>`;
    }

    list.innerHTML = html;
    _animateResultsModal(modal, res);
}

function _animateResultsModal(modal, res) {
    // 1. Mostra overlay — forza reflow prima di aggiungere modal-fade-in
    // così la transizione background parte sempre, anche su Safari
    modal.classList.add('active');
    void modal.offsetHeight; // forza reflow
    requestAnimationFrame(() => modal.classList.add('modal-fade-in'));

    // 2. Titolo entra dall'alto
    const title = modal.querySelector('h3');
    if (title) setTimeout(() => title.classList.add('anim-in'), 120);

    // 3. Sezioni e banner con stagger progressivo
    const sections = modal.querySelectorAll('.res-section, .res-banner');
    sections.forEach((el, i) => {
        setTimeout(() => el.classList.add('anim-in'), 250 + i * 130);
    });

    // 4. Card partite: flip sequenziale
    // Le card partono dopo che la sezione "Partite" ha finito la sua transizione (delay + 400ms durata)
    const cards = modal.querySelectorAll('.res-match-card');
    const lastSectionDelay = sections.length > 0 ? 250 + (sections.length - 1) * 130 : 250;
    const cardStart = lastSectionDelay + 400; // attendi fine transizione dell'ultima sezione
    cards.forEach((card, i) => {
        setTimeout(() => {
            card.classList.add('flipped');
            if (parseInt(card.dataset.gol) >= 3) {
                setTimeout(() => _burstBalls(card), 200);
            }
        }, cardStart + i * 120);
    });

    // 5. Confetti se campionato vinto
    const hasCampionato = (res.risultati || []).some(r => r.includes('CAMPIONI') || r.includes('campionato'));
    if (hasCampionato) {
        setTimeout(() => _launchConfetti(), cardStart + cards.length * 120 + 100);
    }
}

function _launchConfetti() {
    const container = document.createElement('div');
    container.className = 'confetti-container';
    document.body.appendChild(container);

    const colors = ['#FFD700','#FFC200','#fff','#FFE566','#ff9f00','#fffacd','#ffdd44'];
    const count = 120;

    for (let i = 0; i < count; i++) {
        const c = document.createElement('div');
        c.className = 'confetto';
        const size = 7 + Math.random() * 8;
        const duration = 2.2 + Math.random() * 2;
        const delay = Math.random() * 1.2;
        c.style.cssText = `
            left: ${Math.random() * 100}%;
            width: ${size}px; height: ${size}px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
            animation-duration: ${duration}s;
            animation-delay: ${delay}s;
        `;
        container.appendChild(c);
    }

    // Rimuovi dopo la fine
    setTimeout(() => container.remove(), 5000);
}

function _burstBalls(card) {
    // Web Animations API non supportata su browser molto vecchi — skip silenzioso
    if (typeof card.animate !== 'function') return;

    const container = document.createElement('div');
    container.className = 'ball-burst-container';
    document.body.appendChild(container);

    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    // Su mobile schermo piccolo riduci numero palloni e distanza
    const isMobile = window.innerWidth < 600;
    const count = isMobile ? 6 : 10;
    const baseDist = isMobile ? 50 : 80;

    for (let i = 0; i < count; i++) {
        const b = document.createElement('div');
        b.className = 'burst-ball';
        b.textContent = '⚽';
        const angle = (360 / count) * i;
        const dist = baseDist + Math.random() * (isMobile ? 40 : 80);
        const rad = (angle * Math.PI) / 180;
        const tx = Math.cos(rad) * dist;
        const ty = Math.sin(rad) * dist;
        const duration = 0.7 + Math.random() * 0.4;
        b.style.cssText = `left: ${cx}px; top: ${cy}px;`;
        b.animate([
            { transform: 'translate(-50%,-50%) scale(0.2) rotate(0deg)', opacity: 1 },
            { transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(1.1) rotate(${angle}deg)`, opacity: 1, offset: 0.6 },
            { transform: `translate(calc(-50% + ${tx * 1.3}px), calc(-50% + ${ty * 1.3}px)) scale(0.6) rotate(${angle * 2}deg)`, opacity: 0 }
        ], { duration: duration * 1000, easing: 'cubic-bezier(0.22,1,0.36,1)', fill: 'forwards' });
        container.appendChild(b);
    }

    setTimeout(() => container.remove(), 1500);
}

// ── PALLONE D'ORO FULLSCREEN ──────────────────────────────────────────────
function _showPalloneDoro(msg) {
    return new Promise(resolve => {
        _launchPdStars();

        const overlay = document.createElement('div');
        overlay.className = 'pallone-doro-overlay';
        overlay.innerHTML = `
            <div class="pallone-doro-title">
                <span class="pallone-doro-trophy">🏆</span>
                <div class="pallone-doro-text">PALLONE D'ORO!</div>
                <div class="pallone-doro-sub">${msg || ''}</div>
            </div>`;
        document.body.appendChild(overlay);

        let dismissed = false;
        const dismiss = () => {
            if (dismissed) return;
            dismissed = true;
            overlay.style.transition = 'opacity 0.5s ease';
            overlay.style.opacity = '0';
            setTimeout(() => { overlay.remove(); resolve(); }, 500);
        };

        // Click per skip anticipato
        overlay.addEventListener('click', dismiss);

        void overlay.offsetHeight;
        requestAnimationFrame(() => overlay.classList.add('show'));

        // Auto-dismiss dopo 2.8s
        setTimeout(dismiss, 2800);
    });
}

function _launchPdStars() {
    const container = document.createElement('div');
    container.className = 'pd-star-container';
    document.body.appendChild(container);

    const symbols = ['⭐','🌟','✨','💫','🏆'];
    const count   = 30;
    for (let i = 0; i < count; i++) {
        const s = document.createElement('div');
        s.className = 'pd-star';
        s.textContent = symbols[Math.floor(Math.random() * symbols.length)];
        const duration = 1.8 + Math.random() * 1.8;
        const delay    = Math.random() * 1.5;
        s.style.cssText = `
            left: ${Math.random() * 100}%;
            font-size: ${0.9 + Math.random() * 1.2}rem;
            animation-duration: ${duration}s;
            animation-delay: ${delay}s;
        `;
        container.appendChild(s);
    }
    setTimeout(() => container.remove(), 4000);
}

// ── SKILL TREE PARTICELLE ─────────────────────────────────────────────────
function _skillParticleBurst(btnEl, color, preRect) {
    // Fallback se Web Animations API non è disponibile
    if (typeof Element.prototype.animate !== 'function') return;

    const container = document.createElement('div');
    container.className = 'skill-particle-container';
    document.body.appendChild(container);

    const rect  = preRect || btnEl.getBoundingClientRect();
    const cx    = rect.left + rect.width / 2;
    const cy    = rect.top  + rect.height / 2;
    const count = window.innerWidth < 600 ? 8 : 14;

    for (let i = 0; i < count; i++) {
        const p       = document.createElement('div');
        p.className   = 'skill-particle';
        // Alterna cerchio e quadrato per varietà
        p.style.cssText = `
            left: ${cx}px; top: ${cy}px;
            background: ${color};
            border-radius: ${i % 3 === 0 ? '2px' : '50%'};
            width: ${5 + Math.random() * 6}px;
            height: ${5 + Math.random() * 6}px;
            box-shadow: 0 0 6px ${color};
        `;
        const angle    = (360 / count) * i + (Math.random() * 20 - 10);
        const dist     = 45 + Math.random() * 55;
        const rad      = (angle * Math.PI) / 180;
        const tx       = Math.cos(rad) * dist;
        const ty       = Math.sin(rad) * dist;
        const duration = 500 + Math.random() * 300;

        p.animate([
            { transform: 'translate(-50%,-50%) scale(0)',   opacity: 1 },
            { transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(1.2)`, opacity: 1, offset: 0.5 },
            { transform: `translate(calc(-50% + ${tx*1.4}px), calc(-50% + ${ty*1.4}px)) scale(0)`, opacity: 0 }
        ], { duration, easing: 'cubic-bezier(0.22,1,0.36,1)', fill: 'forwards' });

        container.appendChild(p);
    }
    setTimeout(() => container.remove(), 900);
}

document.getElementById('close-results').addEventListener('click', () => {
    const modal = document.getElementById('results-modal');
    modal.classList.remove('active', 'modal-fade-in');
    modal.querySelectorAll('.anim-in').forEach(el => el.classList.remove('anim-in'));
    modal.querySelectorAll('.flipped').forEach(el => el.classList.remove('flipped'));
    // Aggiorna dashboard ora che è visibile — le barre animano correttamente
    if (_pendingDashboardRefresh) {
        _pendingDashboardRefresh = false;
        renderDashboard();
    }
});

async function loadRecentLog() {
    const res = await api('player.php', { action: 'log' }, 'GET');
    const logEl = document.getElementById('recent-log');
    if (!res || res.error || !res.length) {
        logEl.innerHTML = '<li class="log-item" style="color:var(--text-dim)">Nessuna attività ancora</li>';
        return;
    }
    logEl.innerHTML = res.slice(0, 6).map(l => `
        <li class="log-item">
            <div class="log-date">${getMeseName(l.mese)} Anno ${l.anno}${l.avv ? ` · vs ${l.avv}` : ''}</div>
            <div class="log-text">${l.gol}⚽ ${l.assist}🎯 Voto: ${l.voto}</div>
            ${l.evento_speciale ? `<div style="color:var(--gold);font-size:0.75rem">🎲 ${l.evento_speciale}</div>` : ''}
        </li>
    `).join('');
}

// ========================
// CAREER
// ========================
async function loadCareer() {
    const container = document.getElementById('career-seasons-list');
    container.innerHTML = '<p class="loading">Caricamento</p>';

    const [seasons, p] = await Promise.all([
        api('player.php', { action: 'season' }, 'GET'),
        api('player.php', { action: 'get', career_id: currentCareerId }, 'GET')
    ]);
    const annoCorrente = p?.anno_corrente ?? 0;

    // Anno corrente in cima (se ha già giocato almeno 1 mese in questa stagione)
    const tuttiAnni = [...(seasons || [])];
    const anniNellaStagione = tuttiAnni.map(s => s.anno);
    const haAnnoCorrente = anniNellaStagione.includes(annoCorrente);

    // Aggiungi anno corrente (in corso) se non già nella lista stagioni completate
    let rows = [];
    if (!haAnnoCorrente && annoCorrente > 0) {
        rows.push({ anno: annoCorrente, inCorso: true, gol: '-', assist: '-', partite: '-', media_voto: '-', lega_nome: p?.lega_nome || '', team_nome: p?.team_nome || '' });
    }
    rows = rows.concat((seasons || []).map(s => ({ ...s, inCorso: false })));

    if (!rows.length) {
        container.innerHTML = '<p style="color:var(--text-dim);text-align:center;padding:40px">Nessuna stagione giocata ancora.</p>';
        return;
    }

    container.innerHTML = rows.map(s => {
        const inCorso = s.inCorso || s.anno === annoCorrente;
        const tag = inCorso ? '<span class="career-year-tag">in corso</span>' : '';
        return `
        <div class="career-year-row ${inCorso ? 'in-corso' : ''}" id="career-row-${s.anno}">
            <div class="career-year-header" onclick="toggleCareerYear(${s.anno})">
                <span class="career-year-title">Anno ${s.anno}</span>
                ${tag}
                <span class="career-year-stats">
                    <span>⚽ <strong>${s.gol ?? '-'}</strong> gol</span>
                    <span>🎯 <strong>${s.assist ?? '-'}</strong> assist</span>
                    <span>🏟️ <strong>${s.partite ?? '-'}</strong> partite</span>
                    <span>⭐ <strong>${s.media_voto ?? '-'}</strong> voto</span>
                    ${s.lega_nome ? `<span style="color:var(--text-dim)">${s.lega_nome}</span>` : ''}
                </span>
                <span class="career-year-chevron">▼</span>
            </div>
            <div class="career-year-detail" id="career-detail-${s.anno}">
                <p style="color:var(--text-dim);font-size:0.85rem;padding:12px 0">Caricamento dettagli...</p>
            </div>
        </div>`;
    }).join('');
}

async function toggleCareerYear(anno) {
    const row    = document.getElementById(`career-row-${anno}`);
    const detail = document.getElementById(`career-detail-${anno}`);
    if (!row || !detail) return;

    const isOpen = row.classList.contains('open');
    if (isOpen) {
        row.classList.remove('open');
        return;
    }

    row.classList.add('open');

    // Per l'anno in corso non cachare mai (i dati cambiano ogni mese)
    const isCurrentYear = row.classList.contains('in-corso');
    if (detail.dataset.loaded && !isCurrentYear) return;
    detail.dataset.loaded = '1';

    const res = await api('player.php', { action: 'season_detail', anno }, 'GET');
    if (!res || res.error) {
        detail.innerHTML = '<p style="color:var(--text-dim);padding:8px 0">Nessun dato disponibile per questa stagione.</p>';
        return;
    }

    const getMeseNome = (m) => ['','Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'][m] || `M${m}`;

    // Trofei
    let trofeiHTML = '';
    const trofei = [];
    if (res.campionato_vinto) {
        const lv = parseInt(res.campionato_vinto.livello ?? 1);
        const nome = res.campionato_vinto.lega_nome || (lv === 1 ? 'Prima Divisione' : 'Seconda Serie');
        trofei.push(`<span class="career-trofeo-badge ${lv === 1 ? 'trofeo-campionato-1' : 'trofeo-campionato-2'}">🏆 ${nome}</span>`);
    }
    if (res.champions_win) {
        trofei.push(`<span class="career-trofeo-badge trofeo-champions">🌟 Champions Cup</span>`);
    }
    if (res.pallone_doro_pos === 1) {
        trofei.push(`<span class="career-trofeo-badge trofeo-pallone">🥇 Pallone d'Oro</span>`);
    } else if (res.pallone_doro_pos > 0 && res.pallone_doro_pos <= 3) {
        trofei.push(`<span class="career-trofeo-badge" style="background:rgba(148,163,184,0.12);border-color:var(--text-dim);color:var(--text-dim)">🥈 Pallone d'Oro Top ${res.pallone_doro_pos}</span>`);
    }
    if (trofei.length) {
        trofeiHTML = `<div style="margin-top:16px"><div style="font-size:0.75rem;color:var(--text-dim);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">🏅 Trofei e Riconoscimenti</div><div class="career-trofei">${trofei.join('')}</div></div>`;
    }

    // Card best performances
    const fmtLog = (log, tipo) => {
        if (!log) return `<div class="career-detail-card"><div class="career-detail-label">${tipo}</div><div class="career-detail-sub">Nessun dato</div></div>`;
        const mese = getMeseNome(parseInt(log.mese));
        const logAnno = log.anno || anno;
        const avvStr = log.avversario ? ` · vs ${log.avversario}` : '';
        const dataStr = `${mese} Anno ${logAnno}${avvStr}`;
        if (tipo.includes('Gol'))
            return `<div class="career-detail-card">
                <div class="career-detail-label">⚽ ${tipo}</div>
                <div class="career-detail-val">${log.gol} gol</div>
                <div class="career-detail-sub">${dataStr}</div>
                <div class="career-detail-sub">${log.assist} assist · voto ${log.voto}</div>
            </div>`;
        if (tipo.includes('Assist'))
            return `<div class="career-detail-card">
                <div class="career-detail-label">🎯 ${tipo}</div>
                <div class="career-detail-val">${log.assist} assist</div>
                <div class="career-detail-sub">${dataStr}</div>
                <div class="career-detail-sub">${log.gol} gol · voto ${log.voto}</div>
            </div>`;
        return `<div class="career-detail-card">
            <div class="career-detail-label">⭐ ${tipo}</div>
            <div class="career-detail-val">Voto ${log.voto}</div>
            <div class="career-detail-sub">${dataStr}</div>
            <div class="career-detail-sub">${log.gol} gol · ${log.assist} assist</div>
        </div>`;
    };

    detail.innerHTML = `
        <div class="career-detail-grid">
            ${fmtLog(res.best_gol,    'Miglior partita per Gol')}
            ${fmtLog(res.best_assist, 'Miglior partita per Assist')}
            ${fmtLog(res.best_voto,   'Miglior Valutazione')}
        </div>
        ${trofeiHTML}
    `;
}

// ========================
// TRANSFER (BUG CORRETTO — funzione completata)
// ========================
let _trNaz = null, _trLiv = null;

async function loadTransfer() {
    const el = document.getElementById('teams-grid');
    el.innerHTML = '<div style="text-align:center;padding:48px;color:var(--text-dim)">Caricamento...</div>';

    const [teams, p, leghe] = await Promise.all([
        api('player.php', { action: 'teams' }, 'GET'),
        api('player.php', { action: 'get', career_id: currentCareerId }, 'GET'),
        api('player.php', { action: 'leghe' }, 'GET')
    ]);

    if (!p || p.error || !Array.isArray(teams) || !Array.isArray(leghe)) {
        el.innerHTML = '<div style="text-align:center;padding:48px;color:#f87171">Errore caricamento squadre.</div>';
        return;
    }
    currentPlayer = p;

    if (!_trNaz) {
        const ml = leghe.find(l => l.id == p.lega_id);
        _trNaz = ml ? ml.nazione_id : leghe[0]?.nazione_id;
        _trLiv = ml ? ml.livello    : 1;
    }

    renderTransferUI(teams, p, leghe);
}

function renderTransferUI(teams, p, leghe) {
    const el = document.getElementById('teams-grid');

    // Ragruppa leghe per nazione
    const nazioniMap = {};
    leghe.forEach(l => {
        if (!nazioniMap[l.nazione_id]) nazioniMap[l.nazione_id] = { nome: l.nazione_nome, bandiera: l.bandiera, leghe: [] };
        nazioniMap[l.nazione_id].leghe.push(l);
    });

    // Filtro nazione tabs
    let nazHtml = '';
    Object.entries(nazioniMap).forEach(([nid, naz]) => {
        const isActive  = nid == _trNaz;
        const isCurrent = naz.leghe.some(l => l.id == p.lega_id);
        nazHtml += `<button class="nazione-tab ${isActive?'active':''} ${isCurrent?'current-naz':''}"
            onclick="selectTrNaz('${nid}')">
            ${naz.bandiera} ${naz.nome}${isCurrent?' ★':''}
        </button>`;
    });

    // Filtro lega subtabs per la nazione selezionata
    const nazioneSelezionata = nazioniMap[_trNaz];
    let legaHtml = '';
    if (nazioneSelezionata) {
        nazioneSelezionata.leghe.forEach(l => {
            const isActive  = l.livello == _trLiv && l.nazione_id == _trNaz;
            const isCurrent = l.id == p.lega_id;
            legaHtml += `<button class="lega-subtab ${isActive?'active':''} ${isCurrent?'current-lega':''}"
                onclick="selectTrLiv(${l.livello})">
                ${l.nome} ${isCurrent?'★':''}
            </button>`;
        });
    }

    // Filtra le squadre per la lega selezionata
    const legaCorrente = leghe.find(l => l.nazione_id == _trNaz && l.livello == _trLiv);
    const teamsFiltrati = legaCorrente ? teams.filter(t => t.lega_id == legaCorrente.id) : [];

    // Card squadre
    const ovr = parseInt(p.overall);
    // agScontoOvr è una percentuale (es. 5.0 = 5%) — stessa logica del backend
    const agScontoPerc = p.agent_ovr_sconto || 0;
    // Mappa stelle → OVR minimo, identica al backend (changeTeam)
    const STELLE_OVR_MAP = {1: 55, 2: 75, 3: 90, 4: 105, 5: 120};

    let cardsHtml = '';
    if (teamsFiltrati.length === 0) {
        cardsHtml = '<div style="text-align:center;padding:32px;color:var(--text-dim)">Nessuna squadra in questa lega.</div>';
    } else {
        const sorted = [...teamsFiltrati].sort((a,b) => parseInt(b.stelle)-parseInt(a.stelle) || parseInt(b.popolarita)-parseInt(a.popolarita));
        cardsHtml = '<div class="teams-grid-inner">';
        sorted.forEach(t => {
            const isCurrent = t.id == p.team_id;
            const stelle = '⭐'.repeat(parseInt(t.stelle));
            const teamOvr = parseInt(t.ovr || 50);
            // Requisito OVR basato sulle stelle, con sconto % agente — uguale al backend
            const minOvr = STELLE_OVR_MAP[parseInt(t.stelle)] ?? 55;
            const minOvrScontato = parseInt(t.stelle) > 1
                ? Math.max(55, Math.floor(minOvr * (1 - agScontoPerc / 100)))
                : minOvr;
            const canTransfer = !isCurrent && ovr >= minOvrScontato;
            const stelleNum = parseInt(t.stelle) || 1;
            const salaryMultMap = {1:'1×', 2:'1.5×', 3:'2×', 4:'3×', 5:'5×'};
            const salaryLabelMap = {1:'base', 2:'buono', 3:'ottimo', 4:'alto', 5:'top'};
            const salaryMult = salaryMultMap[stelleNum] || '1×';
            const salaryLabel = salaryLabelMap[stelleNum] || 'base';
            cardsHtml += `<div class="team-card ${isCurrent?'current':''}">
                <div class="team-stars">${stelle}</div>
                <div class="team-name">${t.nome}</div>
                <div class="team-stats">
                    <div class="team-stat"><div class="ts-label">⚽ OVR Squadra</div><div class="ts-val">${teamOvr}</div></div>
                    <div class="team-stat"><div class="ts-label">💰 Stipendio</div><div class="ts-val ts-salary">${salaryMult} <span class="salary-label">${salaryLabel}</span></div></div>
                    <div class="team-stat"><div class="ts-label">🏟️ Popolarità</div><div class="ts-val">${t.popolarita}</div></div>
                    <div class="team-stat"><div class="ts-label">🎯 OVR richiesto</div><div class="ts-val">${minOvrScontato}${agScontoPerc>0?` <small style="color:var(--green)">(-${agScontoPerc}%)</small>`:''}</div></div>
                </div>
                ${isCurrent
                    ? '<div style="text-align:center;color:var(--green);font-weight:700;padding:10px">✅ Squadra Attuale</div>'
                    : `<button class="btn-transfer" ${canTransfer?'':'disabled'}
                        onclick="doTransfer(${t.id},'${t.nome.replace(/'/g,"\\'")}')">
                        ${canTransfer ? '✈️ Trasferisciti' : `🔒 OVR ${minOvrScontato} richiesto`}
                      </button>`
                }
            </div>`;
        });
        cardsHtml += '</div>';
    }

    el.innerHTML = `
        <div style="padding:0 0 16px 0">
            <div class="nazione-tabs">${nazHtml}</div>
            <div class="lega-subtabs">${legaHtml}</div>
        </div>
        ${agScontoPerc > 0 ? `<div style="background:rgba(0,200,100,0.1);border:1px solid var(--green);border-radius:8px;padding:8px 14px;margin-bottom:14px;font-size:0.82rem;color:var(--green)">🤝 Agente attivo: -${agScontoPerc}% OVR richiesto per il trasferimento</div>` : ''}
        ${cardsHtml}`;
}

async function selectTrNaz(nazId) {
    _trNaz = nazId;
    _trLiv = 1;
    const [teams, p, leghe] = await Promise.all([
        api('player.php', { action: 'teams' }, 'GET'),
        api('player.php', { action: 'get', career_id: currentCareerId }, 'GET'),
        api('player.php', { action: 'leghe' }, 'GET')
    ]);
    if (!p.error && Array.isArray(teams) && Array.isArray(leghe)) {
        currentPlayer = p;
        renderTransferUI(teams, p, leghe);
    }
}

async function selectTrLiv(liv) {
    _trLiv = liv;
    const [teams, p, leghe] = await Promise.all([
        api('player.php', { action: 'teams' }, 'GET'),
        api('player.php', { action: 'get', career_id: currentCareerId }, 'GET'),
        api('player.php', { action: 'leghe' }, 'GET')
    ]);
    if (!p.error && Array.isArray(teams) && Array.isArray(leghe)) {
        currentPlayer = p;
        renderTransferUI(teams, p, leghe);
    }
}

async function doTransfer(teamId, teamName) {
    if (!confirm(`Trasferirsi a ${teamName}?`)) return;
    const res = await api('game.php', { action: 'change_team', team_id: teamId }, 'POST');
    if (res.error) { toast(res.error, 'error'); return; }
    toast(`✈️ Trasferito a ${teamName}!`, 'gold');
    _trNaz = null; _trLiv = null;
    await loadPlayer();
    loadTransfer();
    renderDashboard();
}

// ========================
// STRUTTURE
// ========================
async function loadStrutture() {
    const [strutture, player] = await Promise.all([
        api('player.php', { action: 'strutture' }, 'GET'),
        api('player.php', { action: 'get', career_id: currentCareerId }, 'GET')
    ]);
    currentPlayer = player;
    const el = document.getElementById('strutture-container');
    el.innerHTML = `
        <div class="info-cards" style="margin-bottom:20px">
            <div class="info-card"><div class="val">${formatMoney(player.soldi)}</div><div class="lbl">Soldi Disponibili</div></div>
            <div class="info-card"><div class="val">${getStrutturaName(player.struttura_livello)}</div><div class="lbl">Struttura Attuale</div></div>
        </div>`;
    strutture.forEach(s => {
        const owned     = player.struttura_livello >= s.livello;
        const isNext    = player.struttura_livello == s.livello - 1;
        const canAfford = player.soldi >= s.costo;
        const div = document.createElement('div');
        div.className = `struttura-card ${owned ? 'owned' : isNext ? 'next' : ''}`;
        div.innerHTML = `
            <div class="struttura-level">${s.livello}</div>
            <div>
                <div class="struttura-name">${s.nome}</div>
                <div class="struttura-desc">${s.descrizione}</div>
                <div class="struttura-bonuses">
                    ${s.bonus_allenamento   ? `<span class="struttura-bonus">+${s.bonus_allenamento} Allenamento</span>` : ''}
                    ${s.bonus_crescita      ? `<span class="struttura-bonus">+${s.bonus_crescita}% Crescita</span>` : ''}
                    ${s.riduzione_infortuni ? `<span class="struttura-bonus">-${s.riduzione_infortuni}% Infortuni</span>` : ''}
                </div>
            </div>
            <div class="struttura-cost">
                <div class="cost-val">${formatMoney(s.costo)}</div>
                <div class="cost-lbl">Costo</div>
                ${owned
                    ? '<div class="owned-badge" style="margin-top:8px">✅ Posseduto</div>'
                    : `<button class="btn-buy" ${(!isNext||!canAfford)?'disabled':''} onclick="buyStruttura(${s.livello})">
                        ${!isNext ? '🔒 Sequenziale' : !canAfford ? '💸 Fondi insuff.' : '🏗️ Acquista'}
                      </button>`
                }
            </div>`;
        el.appendChild(div);
    });
}

async function buyStruttura(livello) {
    const res = await api('game.php', { action: 'buy_struttura', livello });
    if (res.error) { toast(res.error, 'error'); return; }
    toast(res.msg, 'gold');
    await loadPlayer();
    loadStrutture();
}

// ========================
// OBIETTIVI
// ========================
async function loadDashboardObiettivi() {
    const res = await api('extra.php', { action: 'obiettivi' }, 'GET');
    const el  = document.getElementById('dashboard-obiettivi');
    if (!el || !res || res.error || !res.length) return;
    const tot = res.length, completati = res.filter(o => o.completato == 1).length;
    let html = `<div class="obiettivi-box">
        <div class="obiettivi-header"><span>🎯 Obiettivi Stagionali</span><span class="ob-counter">${completati}/${tot} completati</span></div>
        <div class="obiettivi-list">`;
    res.forEach(ob => {
        const pct  = Math.min(100, Math.round((ob.progresso / ob.target) * 100));
        const done = ob.completato == 1;
        html += `<div class="obiettivo-row ${done ? 'ob-done' : ''}">
            <div class="ob-info">
                <span class="ob-desc">${done ? '✅' : '🎯'} ${ob.descrizione}</span>
                <span class="ob-premio">+€${parseInt(ob.premio_soldi).toLocaleString()} · +${ob.premio_morale} morale</span>
            </div>
            <div class="ob-progress-wrap">
                <div class="ob-progress-bar" style="width:${pct}%"></div>
                <span class="ob-pct">${ob.progresso}/${ob.target}</span>
            </div>
        </div>`;
    });
    html += '</div></div>';
    el.innerHTML = html;
}

// ========================
// NOTIZIE DASHBOARD
// ========================
async function loadDashboardNotizie() {
    const res = await api('extra.php', { action: 'notizie' }, 'GET');
    if (!res || res.error) return;
    const unread = res.unread || 0;
    const badge  = document.getElementById('dash-news-unread');
    if (badge) {
        badge.textContent = unread > 0 ? unread : '';
        badge.style.display = unread > 0 ? 'inline' : 'none';
    }
    const el = document.getElementById('dash-notizie-lista');
    if (!el) return;
    if (!res.notizie || !res.notizie.length) {
        el.innerHTML = '<p style="color:var(--text-dim);font-size:0.82rem;padding:8px 0">Gioca il primo mese per ricevere notizie!</p>';
        return;
    }
    const tipoIcon = { positivo:'🟢', negativo:'🔴', mercato:'💼', agente:'🤝', obiettivo:'🎯', info:'📋' };
    el.innerHTML = res.notizie.slice(0, 5).map(n => `
        <div class="dash-news-item ${n.letto == 0 ? 'dash-news-unread' : ''} news-${n.tipo}">
            <div class="dash-news-top">
                <span>${tipoIcon[n.tipo]||'📋'} <strong>${n.titolo}</strong></span>
                <span class="dash-news-data">${getMeseName(n.mese)} A${n.anno}</span>
            </div>
            <div class="dash-news-testo">${n.testo}</div>
        </div>`).join('');
    api('extra.php', { action: 'leggi' }, 'GET');
}

// ========================
// NOTIZIE PAGE
// ========================
async function loadNotizie() {
    const res = await api('extra.php', { action: 'notizie' }, 'GET');
    const el  = document.getElementById('notizie-lista');
    api('extra.php', { action: 'leggi' }, 'GET');
    const btn = document.getElementById('nav-notizie');
    if (btn) btn.innerHTML = '📰 Notizie';
    if (!res || res.error || !res.notizie?.length) {
        el.innerHTML = '<p style="color:var(--text-dim);padding:20px">Nessuna notizia ancora. Gioca qualche mese!</p>';
        return;
    }
    const tipoIcon = { positivo:'🟢', negativo:'🔴', mercato:'💼', agente:'🤝', obiettivo:'🎯', info:'📋' };
    el.innerHTML = res.notizie.map(n => `
        <div class="news-card ${n.letto == 0 ? 'news-unread' : ''} news-${n.tipo}">
            <div class="news-header">
                <span class="news-icon">${tipoIcon[n.tipo]||'📋'}</span>
                <span class="news-titolo">${n.titolo}</span>
                <span class="news-data">${getMeseName(n.mese)} Anno ${n.anno}</span>
            </div>
            <div class="news-testo">${n.testo}</div>
        </div>`).join('');
}

// ========================
// AGENTE
// ========================
async function loadAgente() {
    let res, player;
    try {
        [res, player] = await Promise.all([
            api('agente.php', { action: 'get' }, 'GET'),
            api('player.php', { action: 'get', career_id: currentCareerId }, 'GET')
        ]);
    } catch(e) { console.error('Errore caricamento agente:', e); return; }

    const cur = document.getElementById('agente-current');
    const lst = document.getElementById('agente-lista');
    if (!cur || !lst) return;
    if (!res || res.error) {
        lst.innerHTML = `<p style="color:#ff6b6b">Errore: ${res?.error || 'Risposta non valida'}</p>`;
        return;
    }

    const livello = parseInt(res.livello) || 0;
    const agenti  = res.agenti || {};
    const entries = Object.entries(agenti);
    if (!entries.length) { lst.innerHTML = '<p style="color:var(--text-dim)">Nessun agente disponibile.</p>'; return; }

    const myPop      = parseInt(player?.popolarita)           || 0;
    const mySoldi    = parseFloat(player?.soldi)               || 0;
    const myOverall  = parseInt(player?.overall)               || 60;
    const myMoltStip = parseFloat(player?.moltiplicatore_stipendio) || 1.0;

    if (livello > 0 && agenti[livello]) {
        const info = agenti[livello];
        cur.innerHTML = `
            <div class="agente-attuale">
                <div class="agente-avatar">🤝</div>
                <div>
                    <div class="agente-nome">${res.nome || info.nome}</div>
                    <div class="agente-livello">Livello ${livello}/5</div>
                    <div class="agente-bonus">
                        <span class="ag-bonus-item">💰 +${Math.round(parseFloat(info.bonus_stipendio)*100)}% stipendio</span>
                        <span class="ag-bonus-item">📉 -${info.bonus_ovr_sconto}% OVR trasferimento</span>
                    </div>
                    <div class="agente-bonus-mensile">
                        📊 Bonus mensile stimato: <strong>+€${formatMoney(Math.round((player?.overall||60) * (player?.moltiplicatore_stipendio||100) * 100 * parseFloat(info.bonus_stipendio)))}</strong>
                        <span style="color:var(--text-dim);font-size:0.75rem"> (basato sul tuo OVR attuale)</span>
                    </div>
                    <div class="agente-descr">${info.descr}</div>
                </div>
            </div>`;
    } else {
        cur.innerHTML = `<div class="agente-vuoto">👤 Non hai ancora un agente. Assumine uno per massimizzare i guadagni e facilitare i trasferimenti!</div>`;
    }

    let html = '<h3 style="margin-bottom:16px;color:var(--gold)">Scegli il tuo agente</h3><div class="agenti-grid">';
    entries.forEach(([lvStr, info]) => {
        const lv = parseInt(lvStr);
        const isOwned = livello >= lv;
        const isNext  = livello === lv - 1;
        const popOk   = myPop >= parseInt(info.pop_richiesta || 0);
        let costoReale = parseInt(info.costo);
        if (isNext && livello > 0 && agenti[livello]) {
            costoReale = parseInt(agenti[livello].costo_up) || parseInt(info.costo);
        }
        const soldiOk = mySoldi >= costoReale;
        const canHire = isNext && popOk && soldiOk;
        let lockMsg = '';
        if (!isOwned && !isNext) lockMsg = `🔒 Richiede prima Lv.${lv-1}`;
        else if (!popOk)         lockMsg = `👥 Serve pop. ${info.pop_richiesta} (hai ${myPop})`;
        else if (!soldiOk)       lockMsg = `💸 Mancano €${(costoReale-mySoldi).toLocaleString('it')}`;
        const btnLabel = livello > 0 && isNext
            ? `⬆️ Upgrade — €${costoReale.toLocaleString('it')}`
            : `🤝 Assumi — €${costoReale.toLocaleString('it')}`;
        html += `
        <div class="agente-card ${isOwned?'owned':''} ${isNext&&popOk&&!isOwned?'next':''}">
            <div class="agente-card-header">
                <span class="ag-livello-badge">Lv.${lv}</span>
                <span class="ag-nome">${info.nome}</span>
                ${isOwned ? '<span class="ag-owned">✅ Attivo</span>' : ''}
            </div>
            <div class="ag-descr">${info.descr}</div>
            <div class="ag-stats">
                <span>💰 +${Math.round(parseFloat(info.bonus_stipendio)*100)}% stipendio</span>
                <span>📉 -${info.bonus_ovr_sconto}% OVR</span>
            </div>
            <div class="ag-bonus-est" style="font-size:0.78rem;color:var(--text-dim);margin-top:4px">
                📊 ~+€${formatMoney(Math.round((myOverall) * (myMoltStip) * 100 * parseFloat(info.bonus_stipendio)))} /mese
            </div>
            <div class="ag-requisiti">
                <span class="${popOk?'req-ok':'req-no'}">👥 ${parseInt(info.pop_richiesta)>0?'Pop. '+info.pop_richiesta:'Libero'}</span>
                <span class="${soldiOk||isOwned?'req-ok':'req-no'}">💰 €${costoReale.toLocaleString('it')}</span>
            </div>
            ${isOwned
                ? '<div class="ag-badge-ok">✅ Agente attivo</div>'
                : canHire
                    ? `<button class="btn-primary ag-hire-btn" onclick="assumiAgente(${lv})">${btnLabel}</button>`
                    : `<button class="btn-primary ag-hire-btn" disabled style="opacity:0.45;cursor:not-allowed">${lockMsg}</button>`
            }
        </div>`;
    });
    html += '</div>';
    lst.innerHTML = html;
}

async function assumiAgente(livello) {
    const res = await api('agente.php', { action: 'assumi', livello }, 'POST');
    if (res.error) { toast(res.error, 'error'); return; }
    toast(res.msg, 'gold');
    await loadPlayer();
    loadAgente();
    renderDashboard();
}

// ========================
// CLASSIFICA
// ========================
let selectedClassLegaId = null;
let currentClassTab = 'lega';

async function loadClassifica() {
    const [leghe, player] = await Promise.all([
        api('player.php', { action: 'leghe' }, 'GET'),
        api('player.php', { action: 'get', career_id: currentCareerId }, 'GET')
    ]);
    if (!selectedClassLegaId && player.lega_id) selectedClassLegaId = player.lega_id;
    const filterEl = document.getElementById('classifica-lega-filters');
    const nazioniMap = {};
    leghe.forEach(l => {
        if (!nazioniMap[l.nazione_id]) nazioniMap[l.nazione_id] = { nome: l.nazione_nome, bandiera: l.bandiera, leghe: [] };
        nazioniMap[l.nazione_id].leghe.push(l);
    });
    let filterHtml = '';
    Object.values(nazioniMap).forEach(n => {
        n.leghe.forEach(l => {
            const isActive  = selectedClassLegaId == l.id;
            const isCurrent = player.lega_id == l.id;
            filterHtml += `<button class="lega-filter-btn ${isActive?'active':''} ${isCurrent?'current-lega':''}" onclick="selectClassLega(${l.id})">${n.bandiera} ${l.nome}${isCurrent?' ★':''}</button>`;
        });
    });
    filterEl.innerHTML = filterHtml;
    if (selectedClassLegaId) await renderClassificaTable(selectedClassLegaId, player);
    if (currentClassTab === 'champions') await renderChampions(player);
}

async function selectClassLega(legaId) { selectedClassLegaId = legaId; await loadClassifica(); }

async function renderClassificaTable(legaId, player) {
    const wrap = document.getElementById('classifica-table-wrap');
    wrap.innerHTML = '<p class="loading">⏳ Caricamento...</p>';
    const data = await api('classifica.php', { action: 'get', lega_id: legaId, anno: player.anno_corrente }, 'GET');
    if (!data || data.error || !data.length) {
        wrap.innerHTML = '<p style="color:var(--text-dim);padding:20px">Nessuna partita giocata ancora in questa lega.</p>';
        return;
    }
    let html = `<table class="season-table classifica-table">
        <thead><tr>
            <th>#</th><th style="text-align:left">Squadra</th><th title="Overall">OVR</th>
            <th title="Partite Giocate">PG</th><th title="Vittorie">V</th>
            <th title="Pareggi">P</th><th title="Sconfitte">S</th>
            <th title="Gol Fatti">GF</th><th title="Gol Subiti">GS</th>
            <th title="Differenza Reti">DR</th><th title="Punti">Pts</th>
        </tr></thead><tbody>`;
    data.forEach((row, i) => {
        const isMyTeam = row.team_id == player.team_id;
        const pos = i + 1;
        let posClass = '';
        if (pos === 1) posClass = 'class-pos-1';
        else if (pos <= 3) posClass = 'class-pos-top3';
        else if (pos <= 4) posClass = 'class-pos-top4';
        else if (pos >= data.length - 2) posClass = 'class-pos-retro';
        const dr = row.gol_fatti - row.gol_subiti;
        const drStr = dr > 0 ? '+' + dr : dr;
        html += `<tr class="${isMyTeam?'my-team-row':''} ${posClass}">
            <td class="pos-cell"><span class="pos-badge ${posClass}">${pos}</span></td>
            <td class="team-name-cell"><span class="team-name-cl">${row.team_nome}</span><span class="team-stars-sm">${'⭐'.repeat(parseInt(row.stelle))}</span>${isMyTeam?'<span class="my-team-badge">TU</span>':''}</td>
            <td><span class="ovr-badge">${row.ovr}</span></td>
            <td>${row.partite_giocate}</td><td>${row.vittorie}</td><td>${row.pareggi}</td><td>${row.sconfitte}</td>
            <td>${row.gol_fatti}</td><td>${row.gol_subiti}</td><td>${drStr}</td>
            <td><strong>${row.punti}</strong></td>
        </tr>`;
    });
    html += `</tbody></table>
        <div class="classifica-legenda">
            <span class="leg-item class-pos-1">🥇 Campione</span>
            <span class="leg-item class-pos-top3">🥉 Podio</span>
            <span class="leg-item class-pos-top4">⭐ Champions Cup</span>
            <span class="leg-item class-pos-retro">📉 Zona retrocessione</span>
        </div>`;
    wrap.innerHTML = html;
}

async function renderChampions(player) {
    const wrap = document.getElementById('champions-wrap');
    wrap.innerHTML = '<p class="loading">⏳ Caricamento...</p>';
    const data = await api('classifica.php', { action: 'champions', anno: player.anno_corrente }, 'GET');
    if (!data || data.error || (!Object.keys(data.gironi || {}).length && !data.bracket?.length)) {
        wrap.innerHTML = '<p style="color:var(--text-dim);padding:20px">🏆 La Champions Cup non è ancora iniziata. Le squadre si qualificano a settembre (top 4 di ogni Prima Divisione).</p>';
        return;
    }

    let html = '';
    const gironi = data.gironi || {};
    const gruppiKeys = Object.keys(gironi).sort();

    // ── MENU GRUPPI ──
    if (gruppiKeys.length) {
        html += `<div class="champ-group-nav">`;
        html += `<button class="champ-group-nav-btn active" onclick="_champShowAll(this)">Tutti i Gruppi</button>`;
        gruppiKeys.forEach(g => {
            html += `<button class="champ-group-nav-btn" onclick="_champShowGroup(this,'${g}')">Gruppo ${g}</button>`;
        });
        html += `</div>`;
    }

    // ── GIRONI ──
    if (gruppiKeys.length) {
        html += `<div class="champ-section-title">📋 Fase a Gironi</div>`;
        html += `<div class="champ-groups-grid" id="champ-groups-grid">`;
        gruppiKeys.forEach((g) => {
            const teams = gironi[g];
            html += `<div class="champ-group-card" data-gruppo="${g}">
                <div class="champ-group-header">Gruppo ${g}</div>
                <table class="champ-group-table">
                    <thead><tr>
                        <th style="text-align:left">Squadra</th>
                        <th>PG</th><th>V</th><th>P</th><th>S</th>
                        <th>GF</th><th>GS</th><th>DR</th><th>Pt</th>
                    </tr></thead><tbody>`;
            teams.forEach((t, i) => {
                const isMe = t.team_id == player.team_id;
                // Usa posizione_gruppo dal DB se disponibile (più affidabile dell'indice array)
                const pos = parseInt(t.posizione_gruppo) || (i + 1);
                const qualClass = pos === 1 ? 'champ-g-primo' : pos === 2 ? 'champ-g-secondo' : pos === 3 ? 'champ-g-terzo' : t.eliminato ? 'champ-g-elim' : '';
                const flag = _buildFlag(t.nazione_nome || '');
                const dr = (t.gol_fatti_gruppo || 0) - (t.gol_subiti_gruppo || 0);
                const drStr = dr > 0 ? `+${dr}` : `${dr}`;
                html += `<tr class="${qualClass} ${isMe ? 'champ-g-me' : ''}">
                    <td><span class="champ-team-name">${flag ? flag + '\u00a0' : ''}${t.team_nome}</span>${isMe ? ' <span class="my-team-badge">TU</span>' : ''}</td>
                    <td>${t.partite_gruppo ?? 0}</td>
                    <td>${t.vittorie_gruppo ?? 0}</td><td>${t.pareggi_gruppo ?? 0}</td><td>${t.sconfitte_gruppo ?? 0}</td>
                    <td>${t.gol_fatti_gruppo ?? 0}</td><td>${t.gol_subiti_gruppo ?? 0}</td>
                    <td class="champ-dr ${dr > 0 ? 'dr-pos' : dr < 0 ? 'dr-neg' : ''}">${drStr}</td>
                    <td><strong>${t.punti_gruppo ?? 0}</strong></td>
                </tr>`;
            });
            html += `</tbody></table>
                <div class="champ-group-legend">
                    <span class="champ-leg champ-g-primo">→ Ottavi</span>
                    <span class="champ-leg champ-g-secondo">→ Playoff (2ª)</span>
                    <span class="champ-leg champ-g-terzo">→ Playoff (3ª)</span>
                </div></div>`;
        });
        html += `</div>`;
    }

    // ── BRACKET VISIVO ──
    const bracket = data.bracket || [];
    if (bracket.length) {
        html += `<div class="champ-section-title" style="margin-top:28px">🏆 Fase ad Eliminazione</div>`;
        html += _renderBracket(bracket, player);
    }

    wrap.innerHTML = html;

    // Stagger entry animation per le righe dei gironi
    requestAnimationFrame(() => {
        let delay = 40;
        wrap.querySelectorAll('.champ-group-table tbody tr').forEach(tr => {
            setTimeout(() => tr.classList.add('champ-row-visible'), delay);
            delay += 45;
        });

        // Animazione bracket: colonne entrano da sinistra con stagger
        wrap.querySelectorAll('.bk-col').forEach((col, i) => {
            col.style.opacity = '0';
            col.style.transform = 'translateX(-20px)';
            setTimeout(() => {
                col.style.transition = 'opacity 0.35s ease, transform 0.35s cubic-bezier(0.22,1,0.36,1)';
                col.style.opacity = '1';
                col.style.transform = 'translateX(0)';
            }, 300 + i * 120);
        });

        // Animazione connettori
        wrap.querySelectorAll('.bk-connector').forEach((c, i) => {
            c.style.opacity = '0';
            setTimeout(() => {
                c.style.transition = 'opacity 0.3s ease';
                c.style.opacity = '1';
            }, 420 + i * 120);
        });

        // Animazione speciale per il box campione (entra per ultimo con glow)
        const champBox = wrap.querySelector('.bk-champion');
        if (champBox) {
            champBox.style.opacity = '0';
            champBox.style.transform = 'scale(0.8)';
            const delay = 300 + wrap.querySelectorAll('.bk-col').length * 120 + 200;
            setTimeout(() => {
                champBox.style.transition = 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.22,1,0.36,1), box-shadow 0.6s ease';
                champBox.style.opacity = '1';
                champBox.style.transform = 'scale(1)';
                champBox.style.boxShadow = '0 0 40px rgba(255,215,0,0.4), 0 0 80px rgba(255,215,0,0.15)';
                // Flash dorato sul nome
                const nameEl = champBox.querySelector('.bk-champion-name');
                if (nameEl) {
                    setTimeout(() => nameEl.classList.add('bk-champ-flash'), 400);
                }
            }, delay);
        }
    });
}

function _champShowAll(btn) {
    document.querySelectorAll('.champ-group-nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.champ-group-card').forEach(c => c.style.display = '');
    const grid = document.getElementById('champ-groups-grid');
    if (grid) grid.style.gridTemplateColumns = 'repeat(2,1fr)';
}

function _champShowGroup(btn, gruppo) {
    document.querySelectorAll('.champ-group-nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.champ-group-card').forEach(c => {
        c.style.display = c.dataset.gruppo === gruppo ? '' : 'none';
    });
    const grid = document.getElementById('champ-groups-grid');
    if (grid) grid.style.gridTemplateColumns = '1fr';
}

function _renderBracket(bracket, player) {
    if (!bracket || !bracket.length) {
        return `<p style="color:var(--text-dim);padding:20px;text-align:center">Nessun tabellone ancora disponibile.</p>`;
    }

    // ─── Rango di ogni fase ───────────────────────────────────────────────
    // Le squadre avanzano spostando il loro campo 'fase' alla fase successiva.
    // Una squadra *eliminata* mantiene la fase in cui è uscita (eliminato=1).
    // Una squadra *avanzata* ha una fase successiva (eliminato=0).
    // Per ogni colonna vogliamo TUTTE le squadre che vi hanno partecipato,
    // sia vincitori che eliminati — non solo chi è ancora lì.
    const RANK = { playoff:0, playoff_3:0, ottavi:1, quarti:2, semifinale:3, finale:4, vincitore:5 };

    const phaseRank = t => RANK[t.fase] ?? -1;
    const isElim    = t => t && (t.eliminato == 1 || t.eliminato === '1');
    const isWon     = t => t && t.fase === 'vincitore' && !isElim(t);

    // Tutte le squadre che hanno *partecipato* a una fase con rango >= targetRank
    // e che sono arrivate almeno lì (eliminati proprio a quel rango, o avanzati oltre).
    // Una squadra ha "partecipato" a una fase se il suo rank finale è >= targetRank.
    // Se rank == targetRank ed è eliminata → ha perso qui.
    // Se rank > targetRank → ha vinto qui (e magari perso dopo).
    const allWhoReached = (targetRank) =>
        bracket.filter(t => phaseRank(t) >= targetRank);

    const myId = player.team_id;
    const flag = t => _buildFlag(t?.nazione_nome || '');

    // ─── Riga squadra ────────────────────────────────────────────────────
    const teamRow = (t, winner) => {
        if (!t) return `<div class="bk-team bk-tbd"><span class="bk-flag"></span><span class="bk-name">Da definire</span></div>`;
        const me    = t.team_id == myId;
        const out   = isElim(t);
        const champ = isWon(t);
        let cls = 'bk-team';
        if (champ)          cls += ' bk-champ-team';
        else if (me)        cls += ' bk-me';
        else if (out)       cls += ' bk-out';
        if (winner && !out) cls += ' bk-winner';
        return `<div class="${cls}">
            <span class="bk-flag">${flag(t)}</span>
            <span class="bk-name">${t.team_nome}${me ? '<span class="bk-you-badge">TU</span>' : ''}</span>
            <span class="bk-right">
                <span class="bk-ovr">${t.ovr}</span>
                ${out   ? '<span class="bk-elim-x">✕</span>' : ''}
                ${champ ? '<span class="bk-trophy-ico">🏆</span>' : ''}
                ${winner && !out && !champ ? '<span class="bk-adv">›</span>' : ''}
            </span>
        </div>`;
    };

    // ─── Match card con rank della fase di appartenenza ─────────────────
    // CHIAVE: "ha vinto questo match" = il suo rank è MAGGIORE del rank della fase del match.
    // Questo è robusto anche se la squadra viene eliminata in una fase SUCCESSIVA
    // (es. Manchester vince il playoff rank=0 → rank=1, poi eliminata agli ottavi rank=1, eliminato=1
    //  → nel playoff column: rankA=1 > matchRank=0 → aWon=true → mostra ›  ✓
    //  → nella colonna ottavi: rankA=1 === matchRank=1 e aElim=true → aLost=true → mostra ✕  ✓)
    //
    // teamRowMatch: come teamRow ma la visualizzazione "out" riguarda solo chi ha PERSO IN QUESTA FASE
    const teamRowMatch = (t, winner, lostHere) => {
        if (!t) return `<div class="bk-team bk-tbd"><span class="bk-flag"></span><span class="bk-name">Da definire</span></div>`;
        // Sanità: lostHere e winner non possono essere entrambi true.
        // Se lo fossero per qualsiasi bug, lostHere (eliminazione) ha priorità.
        const safeWinner = winner && !lostHere;
        const me    = t.team_id == myId;
        const champ = isWon(t);
        let cls = 'bk-team';
        if (champ)          cls += ' bk-champ-team';
        else if (me)        cls += ' bk-me';
        else if (lostHere)  cls += ' bk-out';
        if (safeWinner)     cls += ' bk-winner';
        return `<div class="${cls}">
            <span class="bk-flag">${flag(t)}</span>
            <span class="bk-name">${t.team_nome}${me ? '<span class="bk-you-badge">TU</span>' : ''}</span>
            <span class="bk-right">
                <span class="bk-ovr">${t.ovr}</span>
                ${lostHere          ? '<span class="bk-elim-x">✕</span>' : ''}
                ${champ             ? '<span class="bk-trophy-ico">🏆</span>' : ''}
                ${safeWinner && !champ ? '<span class="bk-adv">›</span>' : ''}
            </span>
        </div>`;
    };

    const matchCard = (a, b, matchPhaseRank) => {
        const rankA = a ? phaseRank(a) : -1;
        const rankB = b ? phaseRank(b) : -1;
        const aElim = !!(a && isElim(a));
        const bElim = !!(b && isElim(b));

        // Determina il vincitore del match.
        // GARANZIA: aWon e bWon non possono essere entrambi true.
        let aWon = false, bWon = false;
        if      (rankA > rankB)        { aWon = true; }         // A avanzato oltre
        else if (rankB > rankA)        { bWon = true; }         // B avanzato oltre
        else if (aElim && !bElim)      { bWon = true; }         // A eliminato, B no
        else if (bElim && !aElim)      { aWon = true; }         // B eliminato, A no
        else if (aElim && bElim) {
            // OVR tiebreaker SOLO se entrambi eliminati esattamente a questa fase (rank == mr).
            // Se rank > mr, sono squadre di match diversi (wrong pairing) → ⏳.
            if (rankA === matchPhaseRank && rankB === matchPhaseRank) {
                const ovrA = parseInt(a?.ovr || 0);
                const ovrB = parseInt(b?.ovr || 0);
                if      (ovrA > ovrB) { aWon = true; }  // A più forte → A ha vinto questa fase
                else if (ovrB > ovrA) { bWon = true; }  // B più forte → B ha vinto questa fase
            }
        }

        // Sanità finale (impossibile logicamente, ma difensivo):
        // se per qualsiasi motivo entrambi win → mantieni solo A
        if (aWon && bWon) { bWon = false; }

        // ❌ solo se l'avversario ha vinto E il team è eliminato IN QUESTA fase o prima.
        // Se rank > mr → ha vinto questa fase e non mostra ❌ qui.
        const aLost = aElim && bWon && rankA <= matchPhaseRank;
        const bLost = bElim && aWon && rankB <= matchPhaseRank;

        // Sanità: entrambi ❌ non può accadere (aWon e bWon sono mutuamente esclusivi)
        // ma per sicurezza extra se succedesse → mostra entrambi ⏳

        return `<div class="bk-match">
            ${teamRowMatch(a, aWon, aLost)}
            <div class="bk-div"></div>
            ${teamRowMatch(b, bWon, bLost)}
        </div>`;
    };

    const pairUp = arr => {
        const p = [];
        for (let i = 0; i < arr.length; i += 2) p.push([arr[i], arr[i+1] || null]);
        return p;
    };
    const byGrp = (arr, g) => arr.find(t => t.gruppo === g) || null;

    // ─── Raccogli partecipanti per fase ──────────────────────────────────
    // PLAYOFF: squadre classificate 2° o 3° nel girone (entrano tutte al playoff)
    const po2all = bracket.filter(t => parseInt(t.posizione_gruppo) === 2);
    const po3all = bracket.filter(t => parseInt(t.posizione_gruppo) === 3);

    // OTTAVI: 1° classificati di ogni girone + chi ha superato il playoff
    // primiAll prende direttamente dal bracket completo (pos=1, qualunque fase)
    // così non si perde se per qualche motivo la loro fase è anomala
    const primiAll = {};
    bracket.filter(t => parseInt(t.posizione_gruppo) === 1)
           .forEach(t => { primiAll[t.gruppo] = t; });
    // Vincitori del playoff: pos 2 o 3 che hanno rank >= ottavi (superato il playoff)
    const ottAll = allWhoReached(RANK.ottavi);
    const po_winners = ottAll.filter(t => {
        const pos = parseInt(t.posizione_gruppo);
        return pos === 2 || pos === 3;
    });

    // QUARTI / SEMIFINALE / FINALE
    const quaAll = allWhoReached(RANK.quarti);
    const semAll = allWhoReached(RANK.semifinale);
    const finAll = allWhoReached(RANK.finale);
    const vicAll = bracket.filter(t => t.fase === 'vincitore' && !isElim(t));

    // ─── Costruisci fasi ─────────────────────────────────────────────────
    const phases = [];

    const poPairs = [
        [byGrp(po2all,'A'), byGrp(po3all,'C')],
        [byGrp(po2all,'B'), byGrp(po3all,'D')],
        [byGrp(po2all,'C'), byGrp(po3all,'A')],
        [byGrp(po2all,'D'), byGrp(po3all,'B')]
    ].filter(([a,b]) => a || b);
    if (poPairs.length)
        phases.push({ icon:'⚡', label:'Playoff', sub:`${poPairs.length} match`, pairs: poPairs, rank: 0 });

    // Per ogni ottavo cerchiamo il vincitore del playoff SPECIFICO:
    // A1 vs winner(B2-D3), B1 vs winner(A2-C3), C1 vs winner(D2-B3), D1 vs winner(C2-A3)
    const findPoWinner = (g2, pos2, g3, pos3) =>
        po_winners.find(t => t.gruppo === g2 && parseInt(t.posizione_gruppo) === pos2) ||
        po_winners.find(t => t.gruppo === g3 && parseInt(t.posizione_gruppo) === pos3) || null;

    // ottPairs: SEMPRE 4 slot fissi, senza .filter().
    // Se usassimo .filter(), gli indici shifterebbero: [1] filtrato fa diventare
    // ottPairs[1] quello che era [2], rompendo quaPairs = [w[0]vsw[2], w[1]vsw[3]].
    // Per il display usiamo ottPairsDisplay (filtrato), per il bracket ottPairs (fisso).
    const ottPairs = [
        [primiAll['A'], findPoWinner('B',2,'D',3)],
        [primiAll['B'], findPoWinner('A',2,'C',3)],
        [primiAll['C'], findPoWinner('D',2,'B',3)],
        [primiAll['D'], findPoWinner('C',2,'A',3)],
    ];
    const ottPairsDisplay = ottPairs.filter(([a,b]) => a || b);
    if (ottPairsDisplay.length)
        phases.push({ icon:'🔵', label:'Ottavi', sub:`${ottPairsDisplay.length} match`, pairs: ottPairsDisplay, rank: 1 });

    // winnerOf(a,b): restituisce chi ha vinto il match comune tra a e b.
    const winnerOf = (a, b) => {
        if (!a) return b; if (!b) return a;
        const rA = phaseRank(a), rB = phaseRank(b);
        if (rA > rB) return a;
        if (rB > rA) return b;
        const eA = isElim(a), eB = isElim(b);
        if (eA && !eB) return b;
        if (eB && !eA) return a;
        return null;
    };

    // w[0..3] derivati dagli slot FISSI (indici 0-3 sempre coerenti con il bracket)
    const w = ottPairs.map(([a,b]) => winnerOf(a, b));

    const quaPairs = [
        [w[0] || null, w[2] || null],
        [w[1] || null, w[3] || null],
    ].filter(([a,b]) => a || b);

    const semPairs = [
        [winnerOf(quaPairs[0]?.[0], quaPairs[0]?.[1]), winnerOf(quaPairs[1]?.[0], quaPairs[1]?.[1])]
    ].filter(([a,b]) => a || b);

    const finPairsBuilt = [
        [winnerOf(semPairs[0]?.[0], semPairs[0]?.[1]), null]
    ].filter(([a,b]) => a || b);

    // Fallback su pairUp se gli ottavi non sono ancora disputati (dati mancanti)
    const quaFinal   = quaPairs.length   ? quaPairs   : pairUp(quaAll);
    const semFinal   = semPairs.length   ? semPairs   : pairUp(semAll);
    const finFinal   = finPairsBuilt.length ? finPairsBuilt : pairUp(finAll);

    if (quaFinal.length)  phases.push({ icon:'⚔️', label:'Quarti',  sub:'Quarti di finale', pairs: quaFinal,  rank: 2 });
    // Nel torneo (20 squadre): dopo i Quarti rimangono 2 squadre → la 'Semifinale' PHP è la FINALE
    if (semFinal.length || vicAll.length)
        phases.push({ icon:'🏆', label:'Finale', sub:'La Grande Finale', pairs: semFinal, vincitore: vicAll[0] || null, rank: 3 });
    if (!phases.length)
        return `<p style="color:var(--text-dim);padding:20px;text-align:center">Nessun tabellone ancora disponibile.</p>`;

    // ─── Render ──────────────────────────────────────────────────────────
    const html = phases.map((phase, phIdx) => {
        const isLast  = phIdx === phases.length - 1;
        const matches = phase.pairs.map(([a,b]) => matchCard(a, b, phase.rank ?? 0)).join('');

        let champ = '';
        if (phase.vincitore) {
            const v  = phase.vincitore;
            const me = v.team_id == myId;
            champ = `<div class="bk-champion">
                <div class="bk-champion-crown">🏆</div>
                <div class="bk-champion-label">CAMPIONE UCL</div>
                <div class="bk-champion-name ${me ? 'bk-champ-me' : ''}">
                    ${flag(v)} ${v.team_nome}${me ? ' <span class="bk-you-badge">TU</span>' : ''}
                </div>
                <div class="bk-champion-ovr">OVR ${v.ovr}</div>
            </div>`;
        }

        const connector = !isLast
            ? `<div class="bk-connector"><div class="bk-connector-arrow">›</div></div>`
            : '';

        return `<div class="bk-col ${isLast ? 'bk-col-last' : ''}">
            <div class="bk-col-head">
                <span class="bk-col-icon">${phase.icon}</span>
                <div>
                    <div class="bk-col-label">${phase.label}</div>
                    <div class="bk-col-sublabel">${phase.sub}</div>
                </div>
            </div>
            <div class="bk-col-body">${matches}${champ}</div>
        </div>${connector}`;
    }).join('');

    return `<div class="bk-bracket bk-bracket-anim">${html}</div>`;
}


function switchClassTab(tab) {
    currentClassTab = tab;
    document.querySelectorAll('.class-tab').forEach(b => b.classList.toggle('active', b.onclick?.toString().includes(tab)));
    document.getElementById('class-tab-lega').style.display      = tab === 'lega'      ? 'block' : 'none';
    document.getElementById('class-tab-champions').style.display = tab === 'champions' ? 'block' : 'none';
    if (tab === 'champions') {
        api('player.php', { action:'get', career_id:currentCareerId }, 'GET').then(p => renderChampions(p));
    }
}

// Mappa nazione → codice ISO per costruire flag emoji via Regional Indicator characters
// (più affidabili delle emoji dirette su Windows)
const _nazioneFlag = {
    'Italia': 'IT', 'Francia': 'FR', 'Inghilterra': 'GB',
    'Spagna': 'ES', 'Germania': 'DE'
};
function _buildFlag(nomeNazione) {
    const code = _nazioneFlag[nomeNazione] || null;
    if (!code) return '';
    // Regional Indicator A = 0x1F1E6, offset by char code - 65
    return String.fromCodePoint(0x1F1E6 + (code.charCodeAt(0) - 65)) +
           String.fromCodePoint(0x1F1E6 + (code.charCodeAt(1) - 65));
}
function formatMoney(n) {
    n = parseFloat(n);
    if (n >= 1000000) return '€' + (n/1000000).toFixed(1) + 'M';
    if (n >= 1000)    return '€' + (n/1000).toFixed(0) + 'K';
    return '€' + Math.floor(n);
}

function getMeseName(m) {
    const mesi = ['','Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno',
                  'Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
    return mesi[parseInt(m)] || 'Mese ' + m;
}

function getStrutturaName(lvl) {
    const nomi = ['Nessuna','Campetto Base','Spogliatoio Attrezzato','Palestra e Campo','Centro Sportivo','Centro High-Tech','Centro d\'Elite','Academy Personale'];
    return nomi[parseInt(lvl)] || 'Nessuna';
}

function toast(msg, type = '') {
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3500);
}

// ========================
// SKILL TREE
// ========================
const ST_MILESTONES = [40,50,60,70,75,80,85,90,95,100,105,110,115,120,125];

const SKILL_TREES = {
    dribbling: {
        label:'Dribbling', icon:'🏃', color:'#f39c12',
        skills: [
            { id:'elastico',       name:'Elastico',          icon:'🌀', tier:1, cost:1, maxLv:3, boostStat:'dribbling', boostPerLv:[2,4,7],   desc:'Aumenta il dribbling base. Lv3: sblocca doppio passo.', requires:null },
            { id:'dribbler',       name:'Dribbler Nato',     icon:'⚡', tier:2, cost:2, maxLv:3, boostStat:'dribbling', boostPerLv:[4,7,12],  desc:'Bonus dribbling in 1v1.', requires:'elastico' },
            { id:'finta_speciale', name:'Finta Speciale',    icon:'🎩', tier:3, cost:3, maxLv:2, boostStat:'dribbling', boostPerLv:[8,15],    desc:'Finta imprevedibile.', requires:'dribbler' },
            { id:'visione',        name:'Visione di Gioco',  icon:'👁️', tier:2, cost:2, maxLv:3, boostStat:'mentalita', boostPerLv:[3,5,8],   desc:'Migliora la mentalità.', requires:'elastico' },
            { id:'controllo_palla',name:'Controllo Palla',   icon:'⚽', tier:3, cost:3, maxLv:2, boostStat:'dribbling', boostPerLv:[6,11],    desc:'Massimo controllo sotto pressione.', requires:'visione' },
        ]
    },
    tiro: {
        label:'Tiro', icon:'🎯', color:'#e74c3c',
        skills: [
            { id:'precisione',   name:'Precisione',         icon:'🎯', tier:1, cost:1, maxLv:3, boostStat:'tiro',      boostPerLv:[2,4,7],   desc:'Migliora la precisione dei tiri.', requires:null },
            { id:'tiro_potente', name:'Tiro Potente',       icon:'💥', tier:2, cost:2, maxLv:3, boostStat:'tiro',      boostPerLv:[4,8,13],  desc:'Aumenta la potenza del tiro.', requires:'precisione' },
            { id:'tiro_giro',    name:'Tiro a Giro',        icon:'🌪️', tier:3, cost:3, maxLv:2, boostStat:'tiro',      boostPerLv:[7,14],    desc:'Padroneggi la curva del pallone.', requires:'tiro_potente' },
            { id:'freddezza',    name:'Freddezza',          icon:'🧊', tier:2, cost:2, maxLv:3, boostStat:'mentalita', boostPerLv:[3,6,9],   desc:'Sotto pressione non sbagli.', requires:'precisione' },
            { id:'gol_rabona',   name:'Gol di Rabona',      icon:'🦅', tier:3, cost:3, maxLv:1, boostStat:'tiro',      boostPerLv:[12],      desc:'Abilità leggendaria.', requires:'freddezza' },
        ]
    },
    velocita: {
        label:'Velocità', icon:'⚡', color:'#3498db',
        skills: [
            { id:'scatto',           name:'Scatto',            icon:'💨', tier:1, cost:1, maxLv:3, boostStat:'velocita',  boostPerLv:[2,4,7],   desc:'Migliora l\'accelerazione.', requires:null },
            { id:'velocista',        name:'Velocista',         icon:'🏅', tier:2, cost:2, maxLv:3, boostStat:'velocita',  boostPerLv:[4,7,12],  desc:'Velocità di punta incrementata.', requires:'scatto' },
            { id:'turbo',            name:'Turbo',             icon:'🚀', tier:3, cost:3, maxLv:2, boostStat:'velocita',  boostPerLv:[8,16],    desc:'Burst di velocità sovrumano.', requires:'velocista' },
            { id:'resistenza',       name:'Resistenza',        icon:'🔋', tier:2, cost:2, maxLv:3, boostStat:'fisico',    boostPerLv:[3,5,8],   desc:'Mantieni la velocità per tutta la partita.', requires:'scatto' },
            { id:'dribbling_veloce', name:'Dribbling Veloce',  icon:'🌩️', tier:3, cost:3, maxLv:2, boostStat:'dribbling', boostPerLv:[5,10],    desc:'Combina velocità e dribbling.', requires:'resistenza' },
        ]
    },
    fisico: {
        label:'Fisico', icon:'💪', color:'#27ae60',
        skills: [
            { id:'forza',       name:'Forza',          icon:'🏋️', tier:1, cost:1, maxLv:3, boostStat:'fisico', boostPerLv:[2,4,7],   desc:'Aumenta la forza fisica.', requires:null },
            { id:'colpo_testa', name:'Colpo di Testa', icon:'⚽', tier:2, cost:2, maxLv:3, boostStat:'fisico', boostPerLv:[4,7,12],  desc:'Dominante sui cross.', requires:'forza' },
            { id:'muro',        name:'Muro',           icon:'🧱', tier:3, cost:3, maxLv:2, boostStat:'fisico', boostPerLv:[8,15],    desc:'Impossibile spostarlo.', requires:'colpo_testa' },
            { id:'recupero',    name:'Recupero Rapido',icon:'❤️', tier:2, cost:2, maxLv:3, boostStat:'fisico', boostPerLv:[3,5,8],   desc:'Recuperi più in fretta.', requires:'forza' },
            { id:'stamina',     name:'Stamina',        icon:'🔥', tier:3, cost:3, maxLv:2, boostStat:'fisico', boostPerLv:[6,12],    desc:'Sei ancora al 100% al 90°.', requires:'recupero' },
        ]
    },
    mentalita: {
        label:'Mentalità', icon:'🧠', color:'#9b59b6',
        skills: [
            { id:'concentrazione', name:'Concentrazione',       icon:'🎯', tier:1, cost:1, maxLv:3, boostStat:'mentalita', boostPerLv:[2,4,7],   desc:'Mantieni il focus.', requires:null },
            { id:'leadership',     name:'Leadership',           icon:'👑', tier:2, cost:2, maxLv:3, boostStat:'mentalita', boostPerLv:[4,7,12],  desc:'Trascini la squadra.', requires:'concentrazione' },
            { id:'campione',       name:'Mentalità Campione',   icon:'🏆', tier:3, cost:3, maxLv:2, boostStat:'mentalita', boostPerLv:[8,16],    desc:'Nei momenti decisivi sei il migliore.', requires:'leadership' },
            { id:'carisma',        name:'Carisma',              icon:'🌟', tier:2, cost:2, maxLv:3, boostStat:'mentalita', boostPerLv:[3,5,8],   desc:'La tua personalità convince tutti.', requires:'concentrazione' },
            { id:'istinto',        name:'Istinto del Goleador', icon:'👁️', tier:3, cost:3, maxLv:2, boostStat:'tiro',      boostPerLv:[5,10],    desc:'Sei sempre nel posto giusto.', requires:'carisma' },
        ]
    }
};

let stState = { points: 0, unlocked: {} };

function stGetSaveKey() { return `gs_skilltree_${currentCareerId}`; }

function stLoad() {
    const raw = localStorage.getItem(stGetSaveKey());
    if (raw) {
        try {
            const parsed = JSON.parse(raw);
            const migrated = {};
            Object.entries(parsed.unlocked || {}).forEach(([id, val]) => {
                migrated[id] = typeof val === 'number' ? { level: val, applied: 0 } : val;
            });
            stState = { points: parsed.points || 0, unlocked: migrated };
        } catch(e) { stState = { points: 0, unlocked: {} }; }
    } else {
        stState = { points: 0, unlocked: {} };
    }
}

function stSave() { localStorage.setItem(stGetSaveKey(), JSON.stringify(stState)); }

async function stSyncBoosts() {
    for (const [skillId, entry] of Object.entries(stState.unlocked)) {
        const curLv     = typeof entry === 'number' ? entry : (entry.level   || 0);
        const appliedLv = typeof entry === 'number' ? 0     : (entry.applied || 0);
        // Salta se già sincronizzato con il server a questo livello
        if (curLv <= 0 || appliedLv >= curLv) continue;
        let sk = null;
        for (const tree of Object.values(SKILL_TREES)) {
            sk = tree.skills.find(s => s.id === skillId);
            if (sk) break;
        }
        if (!sk) continue;
        const totalBoost = sk.boostPerLv[curLv - 1] || 0;
        if (totalBoost <= 0) continue;
        try {
            const res = await api('game.php', {
                action: 'apply_skill_boost', skill_id: skillId,
                stat: sk.boostStat, total_boost: totalBoost, level: curLv
            }, 'POST');
            if (res && res.success && currentPlayer) {
                currentPlayer[sk.boostStat] = res.new_val;
                currentPlayer.overall       = res.new_overall;
                if (res.piede_forte)   currentPlayer.piede_forte   = res.piede_forte;
                if (res.piede_debole)  currentPlayer.piede_debole  = res.piede_debole;
                if (res.livello_skill) currentPlayer.livello_skill = res.livello_skill;
                stState.unlocked[skillId] = { level: curLv, applied: curLv };
                stSave();
            }
        } catch(e) { console.warn('stSyncBoosts error', skillId, e); }
    }
}

function stComputeEarnedPoints(player) {
    let earned = 0;
    ['dribbling','tiro','velocita','fisico','mentalita'].forEach(s => {
        const val = parseInt(player[s]) || 0;
        ST_MILESTONES.forEach(m => { if (val >= m) earned++; });
    });
    return earned;
}

function stComputeSpentPoints() {
    let spent = 0;
    Object.entries(stState.unlocked).forEach(([id, entry]) => {
        const lv = typeof entry === 'number' ? entry : (entry?.level || 0);
        for (const tree of Object.values(SKILL_TREES)) {
            const sk = tree.skills.find(s => s.id === id);
            if (sk) { for (let i=0;i<lv;i++) spent += sk.cost; break; }
        }
    });
    return spent;
}

let stActiveTab = 'dribbling';

async function loadSkillTree() {
    if (!currentPlayer) {
        const p = await api('player.php',{action:'get',career_id:currentCareerId},'GET');
        currentPlayer = p;
    }
    stLoad();

    // Riconcilia lo stato locale con il DB: segna come già applicati i boost già presenti sul server
    const dbBoosts = await api('game.php', { action: 'get_skill_boosts' }, 'GET');
    if (dbBoosts && dbBoosts.boosts) {
        Object.entries(dbBoosts.boosts).forEach(([skillId, info]) => {
            const localEntry = stState.unlocked[skillId];
            const localLv = localEntry ? (typeof localEntry === 'number' ? localEntry : localEntry.level || 0) : 0;
            const dbLv = info.level || 0;
            // Se il DB ha un livello >= quello locale, considera applicato
            if (dbLv >= localLv && localLv > 0) {
                stState.unlocked[skillId] = { level: localLv, applied: localLv };
            }
        });
        stSave();
    }

    await stSyncBoosts();

    const earned = stComputeEarnedPoints(currentPlayer);
    const spent  = stComputeSpentPoints();
    stState.points = earned - spent;

    const banner = document.getElementById('st-points-banner');
    const label  = document.getElementById('st-points-label');
    if (label) {
        label.textContent = `${stState.points} punt${stState.points===1?'o':'i'} abilità disponibil${stState.points===1?'e':'i'}`;
        if (banner) banner.className = 'st-points-banner' + (stState.points > 0 ? ' has-points' : '');
    }

    const pf = parseInt(currentPlayer.piede_forte || 3);
    const pd = parseInt(currentPlayer.piede_debole || 2);
    const ls = parseInt(currentPlayer.livello_skill || 2);
    const pfLato = currentPlayer.piede_forte_lato  === 'sx' ? 'Sinistro' : 'Destro';
    const pdLato = currentPlayer.piede_debole_lato === 'sx' ? 'Sinistro' : 'Destro';
    const pfV = document.getElementById('st-piede-forte-val');
    const pdV = document.getElementById('st-piede-debole-val');
    const lsV = document.getElementById('st-livello-skill-val');
    if (pfV) pfV.innerHTML = `${'⭐'.repeat(pf)}${'☆'.repeat(5-pf)} <span style="color:var(--text-dim);font-size:0.8rem">${pfLato}</span>`;
    if (pdV) pdV.innerHTML = `${'⭐'.repeat(pd)}${'☆'.repeat(5-pd)} <span style="color:var(--text-dim);font-size:0.8rem">${pdLato}</span>`;
    if (lsV) lsV.textContent = '⭐'.repeat(ls) + '☆'.repeat(5-ls) + ` (${ls}/5)`;

    const tabsEl = document.getElementById('st-tabs');
    if (tabsEl) {
        tabsEl.innerHTML = Object.entries(SKILL_TREES).map(([key, tree]) => {
            const statVal = parseInt(currentPlayer[key]) || 0;
            return `<button class="st-tab ${stActiveTab===key?'active':''}"
                onclick="stSwitchTab('${key}')" style="--tree-color:${tree.color}">
                <span class="st-tab-icon">${tree.icon}</span>
                <span class="st-tab-name">${tree.label}</span>
                <span class="st-tab-val">${statVal}</span>
            </button>`;
        }).join('');
    }
    stRenderTree(stActiveTab);
}

function stSwitchTab(key) {
    stActiveTab = key;
    document.querySelectorAll('.st-tab').forEach(t =>
        t.classList.toggle('active', t.querySelector('.st-tab-name')?.textContent === SKILL_TREES[key].label)
    );
    stRenderTree(key);
}

function stRenderTree(key) {
    const tree    = SKILL_TREES[key];
    const statVal = parseInt(currentPlayer[key]) || 0;
    const content = document.getElementById('st-content');
    if (!content) return;

    const milestoneHtml = `
    <div class="st-milestone-wrap">
        <div class="st-milestone-header">
            <span style="color:${tree.color}">${tree.icon} ${tree.label}</span>
            <span class="st-stat-value">${statVal} / 125</span>
        </div>
        <div class="st-milestone-bar-bg">
            <div class="st-milestone-bar-fill" style="width:${Math.min(100,(statVal/125)*100).toFixed(1)}%;background:${tree.color}"></div>
            ${ST_MILESTONES.map(m => {
                const pct = (m/125)*100;
                const reached = statVal >= m;
                return `<div class="st-milestone-marker ${reached?'reached':''}" style="left:${pct.toFixed(1)}%">
                    <div class="st-milestone-dot" style="${reached?`background:${tree.color}`:''}"></div>
                    <div class="st-milestone-label">${m}</div>
                </div>`;
            }).join('')}
        </div>
        <div class="st-milestone-hint">15 milestone (40→125) · ogni soglia = 1 punto abilità</div>
    </div>`;

    const tiers = {};
    tree.skills.forEach(sk => { if (!tiers[sk.tier]) tiers[sk.tier]=[]; tiers[sk.tier].push(sk); });
    const tierNames = { 1:'Livello Base', 2:'Specialista', 3:'Elite' };

    const skillsHtml = Object.entries(tiers).map(([tier, skills]) => {
        const skHtml = skills.map(sk => {
            const entryData  = stState.unlocked[sk.id];
            const unlockedLv = typeof entryData==='number' ? entryData : (entryData?.level||0);
            const isMaxed    = unlockedLv >= sk.maxLv;
            const reqEntry   = sk.requires ? stState.unlocked[sk.requires] : null;
            const reqLv      = sk.requires ? (typeof reqEntry==='number' ? reqEntry : (reqEntry?.level||0)) : 1;
            const canUnlock  = reqLv > 0 && !isMaxed && stState.points >= sk.cost;
            const isLocked   = reqLv === 0;
            const boostNow   = unlockedLv > 0 ? sk.boostPerLv[unlockedLv-1] : 0;
            const boostNext  = !isMaxed ? sk.boostPerLv[unlockedLv] : null;
            const statLabel  = { tiro:'Tiro',velocita:'Velocità',dribbling:'Dribbling',fisico:'Fisico',mentalita:'Mentalità' }[sk.boostStat]||sk.boostStat;
            const pips = Array.from({length:sk.maxLv},(_,i)=>
                `<div class="st-pip ${i<unlockedLv?'filled':''}" style="${i<unlockedLv?`background:${tree.color}`:''}"></div>`
            ).join('');
            return `<div class="st-node ${isLocked?'locked':''} ${isMaxed?'maxed':''} ${unlockedLv>0&&!isMaxed?'partial':''}" style="--tree-color:${tree.color}">
                <div class="st-node-icon">${sk.icon}</div>
                <div class="st-node-body">
                    <div class="st-node-name">${sk.name}</div>
                    <div class="st-node-desc">${sk.desc}</div>
                    <div class="st-node-boost">
                        ${unlockedLv>0?`<span class="st-boost-active">+${boostNow} ${statLabel}</span>`:''}
                        ${boostNext!==null?`<span class="st-boost-next">${unlockedLv>0?'→':''} +${boostNext} ${statLabel} al prossimo lv</span>`:''}
                    </div>
                    <div class="st-node-pips">${pips}</div>
                </div>
                <div class="st-node-actions">
                    ${isLocked
                        ? `<div class="st-lock-badge">🔒 Richiede: ${tree.skills.find(s=>s.id===sk.requires)?.name||sk.requires}</div>`
                        : isMaxed
                            ? `<div class="st-maxed-badge">✨ MAX</div>`
                            : `<button class="st-upgrade-btn ${canUnlock?'':'disabled'}" onclick="stUpgrade('${key}','${sk.id}')" ${canUnlock?'':'disabled'}>
                                <span class="st-cost">💎 ${sk.cost}</span>
                                ${unlockedLv===0?'Sblocca':'Potenzia'}
                               </button>`
                    }
                </div>
            </div>`;
        }).join('');
        return `<div class="st-tier">
            <div class="st-tier-label">
                <span class="st-tier-badge" style="background:${tree.color}22;color:${tree.color};border-color:${tree.color}44">Tier ${tier} — ${tierNames[tier]}</span>
            </div>
            <div class="st-tier-nodes">${skHtml}</div>
        </div>`;
    }).join('');

    content.innerHTML = milestoneHtml + `<div class="st-skills-wrap">${skillsHtml}</div>`;
}

async function stUpgrade(treeKey, skillId) {
    if (!currentPlayer) return;
    const tree = SKILL_TREES[treeKey];
    const sk   = tree.skills.find(s => s.id === skillId);
    if (!sk) return;

    const entry  = stState.unlocked[skillId];
    const curLv  = typeof entry==='number' ? entry : (entry?.level||0);
    const reqEntry = sk.requires ? stState.unlocked[sk.requires] : null;
    const reqLv  = sk.requires ? (typeof reqEntry==='number' ? reqEntry : (reqEntry?.level||0)) : 1;
    const available = stComputeEarnedPoints(currentPlayer) - stComputeSpentPoints();

    if (reqLv === 0)         { toast('Sblocca prima il prerequisito!', 'error'); return; }
    if (curLv >= sk.maxLv)   { toast('Abilità già al massimo!', ''); return; }
    if (available < sk.cost) { toast(`Servono ${sk.cost} punti (hai ${available})`, 'error'); return; }

    const newLv      = curLv + 1;
    const totalBoost = sk.boostPerLv[newLv-1] || 0;
    const statLabels = { tiro:'Tiro',velocita:'Velocita',dribbling:'Dribbling',fisico:'Fisico',mentalita:'Mentalita' };

    stState.unlocked[skillId] = { level: newLv, applied: newLv };
    stSave();

    try {
        const res = await api('game.php', {
            action: 'apply_skill_boost', skill_id: skillId,
            stat: sk.boostStat, total_boost: totalBoost, level: newLv
        }, 'POST');
        if (res && res.success) {
            if (currentPlayer) {
                currentPlayer[sk.boostStat] = res.new_val;
                currentPlayer.overall       = res.new_overall;
                if (res.piede_forte)   currentPlayer.piede_forte   = res.piede_forte;
                if (res.piede_debole)  currentPlayer.piede_debole  = res.piede_debole;
                if (res.livello_skill) currentPlayer.livello_skill = res.livello_skill;
            }
            const delta = res.delta || 0;
            toast(`✨ ${sk.name} Lv${newLv}! ${delta>0?`+${delta} ${statLabels[sk.boostStat]} aggiunto!`:'Già applicato.'}`, 'success');
            // Leggi posizione bottone PRIMA che loadSkillTree() ricostruisca il DOM
            const btn = document.querySelector(`button[onclick="stUpgrade('${treeKey}','${skillId}')"]`);
            const btnColor = tree.color;
            if (btn) {
                // getBoundingClientRect ora, mentre il nodo esiste ancora
                const rect = btn.getBoundingClientRect();
                _skillParticleBurst(btn, btnColor, rect);
            }
        } else {
            toast('Errore: ' + (res?.error || 'Errore sconosciuto'), 'error');
            stState.unlocked[skillId] = { level: curLv, applied: curLv };
            stSave();
        }
    } catch(e) {
        toast('Errore di connessione', 'error');
        stState.unlocked[skillId] = { level: curLv, applied: curLv };
        stSave();
    }
    loadSkillTree();
}
