// ========================
// CONFIG
// ========================
const API_BASE = '/backend/api';
let currentPlayer = null;
let selectedActions = [];
let authToken  = localStorage.getItem('gs_token')    || null;
let currentCareerId = parseInt(localStorage.getItem('gs_career') || '0') || null;
let selectedSkin     = 'medium';
let selectedEye      = '#5C3317';   // ora è un hex libero
let selectedHairStyle = 'short';    // solo lo stile (senza colore)
let selectedHairColor = '#1a1a1a'; // colore separato

// ========================
// HAIR STYLES (solo forma, senza colore)
// ========================
const HAIR_STYLE_DEFS = [
    { id: 'short',   label: 'Corto',    emoji: '💈' },
    { id: 'medium',  label: 'Medio',    emoji: '💇' },
    { id: 'long',    label: 'Lungo',    emoji: '🧖' },
    { id: 'curly',   label: 'Ricci',    emoji: '🌀' },
    { id: 'afro',    label: 'Afro',     emoji: '✊' },
    { id: 'mohawk',  label: 'Mohawk',   emoji: '🤘' },
    { id: 'bun',     label: 'Coda',     emoji: '🎀' },
    { id: 'bald',    label: 'Rasato',   emoji: '🧑‍🦲' },
];

const HAIR_PRESET_COLORS = [
    '#1a1a1a', '#3d2b1f', '#5c3317', '#8B4513',
    '#D4A017', '#C0392B', '#808080', '#d4d4d4',
];

const SKIN_COLORS = {
    light:'#FDDBB4', medium_light:'#E8B88A', medium:'#C68642',
    medium_dark:'#8D5524', dark:'#3B1A08'
};

// Occhi: preset + custom
const EYE_PRESETS = ['#5C3317','#1E90FF','#228B22','#8B6914','#708090','#2E8B57','#8B0000'];

// ========================
// SVG CAPELLI — forme ridisegnate
// ========================

/** Ritorna l'SVG dei capelli dato stile, colore, size.
 *  Usato sia per le miniature che per l'avatar grande. */
function buildHairSVG(style, hc, s) {
    const cx = s / 2;
    if (style === 'bald' || !hc) return '';

    switch (style) {
        case 'short':
            // Calotta corta che abbraccia la testa, con due piccole ciocche ai lati
            return `
                <path d="M${s*0.26} ${s*0.38}
                    Q${s*0.26} ${s*0.12} ${cx} ${s*0.10}
                    Q${s*0.74} ${s*0.12} ${s*0.74} ${s*0.38}
                    Q${s*0.68} ${s*0.30} ${s*0.62} ${s*0.32}
                    Q${cx} ${s*0.28} ${s*0.38} ${s*0.32}
                    Q${s*0.32} ${s*0.30} ${s*0.26} ${s*0.38}Z"
                    fill="${hc}"/>`;

        case 'medium':
            // Capelli a lunghezza media: calotta + due ali ai lati che scendono fino a metà testa
            return `
                <path d="M${s*0.24} ${s*0.44}
                    Q${s*0.22} ${s*0.20} ${s*0.26} ${s*0.14}
                    Q${cx} ${s*0.08} ${s*0.74} ${s*0.14}
                    Q${s*0.78} ${s*0.20} ${s*0.76} ${s*0.44}
                    Q${s*0.72} ${s*0.36} ${s*0.68} ${s*0.38}
                    Q${cx} ${s*0.34} ${s*0.32} ${s*0.38}
                    Q${s*0.28} ${s*0.36} ${s*0.24} ${s*0.44}Z"
                    fill="${hc}"/>
                <path d="M${s*0.22} ${s*0.38} Q${s*0.18} ${s*0.46} ${s*0.20} ${s*0.58} Q${s*0.24} ${s*0.60} ${s*0.26} ${s*0.50} Q${s*0.26} ${s*0.42} ${s*0.24} ${s*0.38}Z" fill="${hc}"/>
                <path d="M${s*0.78} ${s*0.38} Q${s*0.82} ${s*0.46} ${s*0.80} ${s*0.58} Q${s*0.76} ${s*0.60} ${s*0.74} ${s*0.50} Q${s*0.74} ${s*0.42} ${s*0.76} ${s*0.38}Z" fill="${hc}"/>`;

        case 'long':
            // Capelli lunghi: calotta + due cascate fluenti fino in basso, con ondulazioni naturali
            return `
                <path d="M${s*0.26} ${s*0.42}
                    Q${s*0.24} ${s*0.18} ${s*0.28} ${s*0.12}
                    Q${cx} ${s*0.06} ${s*0.72} ${s*0.12}
                    Q${s*0.76} ${s*0.18} ${s*0.74} ${s*0.42}
                    Q${s*0.70} ${s*0.32} ${s*0.62} ${s*0.34}
                    Q${cx} ${s*0.30} ${s*0.38} ${s*0.34}
                    Q${s*0.30} ${s*0.32} ${s*0.26} ${s*0.42}Z"
                    fill="${hc}"/>
                <path d="M${s*0.20} ${s*0.40}
                    C${s*0.14} ${s*0.52} ${s*0.12} ${s*0.64} ${s*0.15} ${s*0.76}
                    C${s*0.17} ${s*0.86} ${s*0.22} ${s*0.92} ${s*0.28} ${s*0.94}
                    C${s*0.32} ${s*0.96} ${s*0.34} ${s*0.90} ${s*0.32} ${s*0.84}
                    C${s*0.28} ${s*0.74} ${s*0.26} ${s*0.62} ${s*0.26} ${s*0.50}
                    Q${s*0.24} ${s*0.44} ${s*0.20} ${s*0.40}Z"
                    fill="${hc}"/>
                <path d="M${s*0.80} ${s*0.40}
                    C${s*0.86} ${s*0.52} ${s*0.88} ${s*0.64} ${s*0.85} ${s*0.76}
                    C${s*0.83} ${s*0.86} ${s*0.78} ${s*0.92} ${s*0.72} ${s*0.94}
                    C${s*0.68} ${s*0.96} ${s*0.66} ${s*0.90} ${s*0.68} ${s*0.84}
                    C${s*0.72} ${s*0.74} ${s*0.74} ${s*0.62} ${s*0.74} ${s*0.50}
                    Q${s*0.76} ${s*0.44} ${s*0.80} ${s*0.40}Z"
                    fill="${hc}"/>`;

        case 'curly':
            // Ricci: calotta irregolare + ciuffi arrotondati ai lati e in alto
            return `
                <path d="M${s*0.26} ${s*0.40}
                    Q${s*0.20} ${s*0.28} ${s*0.26} ${s*0.16}
                    Q${cx} ${s*0.04} ${s*0.74} ${s*0.16}
                    Q${s*0.80} ${s*0.28} ${s*0.74} ${s*0.40}
                    Q${s*0.68} ${s*0.30} ${cx} ${s*0.28}
                    Q${s*0.32} ${s*0.30} ${s*0.26} ${s*0.40}Z"
                    fill="${hc}"/>
                <circle cx="${s*0.20}" cy="${s*0.34}" r="${s*0.09}" fill="${hc}"/>
                <circle cx="${s*0.80}" cy="${s*0.34}" r="${s*0.09}" fill="${hc}"/>
                <circle cx="${s*0.30}" cy="${s*0.14}" r="${s*0.08}" fill="${hc}"/>
                <circle cx="${s*0.70}" cy="${s*0.14}" r="${s*0.08}" fill="${hc}"/>
                <circle cx="${cx}"    cy="${s*0.09}" r="${s*0.08}" fill="${hc}"/>`;

        case 'afro':
            // Afro: grande ellisse soffice intorno alla testa
            return `
                <ellipse cx="${cx}" cy="${s*0.34}" rx="${s*0.36}" ry="${s*0.30}" fill="${hc}"/>
                <ellipse cx="${s*0.22}" cy="${s*0.44}" rx="${s*0.10}" ry="${s*0.14}" fill="${hc}"/>
                <ellipse cx="${s*0.78}" cy="${s*0.44}" rx="${s*0.10}" ry="${s*0.14}" fill="${hc}"/>`;

        case 'mohawk':
            // Mohawk: striscia centrale alta e spessa, lati rasati (nessun rettangolo verticale dritto)
            return `
                <path d="M${s*0.42} ${s*0.38}
                    C${s*0.40} ${s*0.28} ${s*0.42} ${s*0.10} ${cx} ${s*0.04}
                    C${s*0.58} ${s*0.10} ${s*0.60} ${s*0.28} ${s*0.58} ${s*0.38}
                    Q${cx} ${s*0.42} ${s*0.42} ${s*0.38}Z"
                    fill="${hc}"/>
                <path d="M${s*0.26} ${s*0.26} Q${s*0.34} ${s*0.22} ${s*0.42} ${s*0.28} Q${s*0.36} ${s*0.32} ${s*0.26} ${s*0.30}Z" fill="${hc}"/>
                <path d="M${s*0.74} ${s*0.26} Q${s*0.66} ${s*0.22} ${s*0.58} ${s*0.28} Q${s*0.64} ${s*0.32} ${s*0.74} ${s*0.30}Z" fill="${hc}"/>`;

        case 'bun':
            // Coda: calotta + chignon rotondo in cima
            return `
                <path d="M${s*0.26} ${s*0.38}
                    Q${s*0.24} ${s*0.18} ${s*0.28} ${s*0.14}
                    Q${cx} ${s*0.08} ${s*0.72} ${s*0.14}
                    Q${s*0.76} ${s*0.18} ${s*0.74} ${s*0.38}
                    Q${s*0.68} ${s*0.30} ${s*0.62} ${s*0.32}
                    Q${cx} ${s*0.28} ${s*0.38} ${s*0.32}
                    Q${s*0.32} ${s*0.30} ${s*0.26} ${s*0.38}Z"
                    fill="${hc}"/>
                <circle cx="${cx}" cy="${s*0.08}" r="${s*0.12}" fill="${hc}"/>
                <ellipse cx="${cx}" cy="${s*0.13}" rx="${s*0.08}" ry="${s*0.04}" fill="${hc}" opacity="0.7"/>`;

        default:
            return '';
    }
}

// ========================
// MINIATURA PER HAIR STYLE PICKER
// ========================
function hairStyleSwatchSVG(styleId, size = 44) {
    const s = size;
    const cx = s / 2;
    const skin = '#C68642';
    // Usa sempre un colore neutro marrone scuro per le miniature stile
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

// ========================
// AVATAR SVG COMPLETO
// ========================
function renderAvatarSVG(skinVal, hairStyle, eyeColor, gender, size = 120, hairColor = null) {
    const skin = SKIN_COLORS[skinVal] || skinVal || '#C68642';
    const eye  = (typeof eyeColor === 'string' && eyeColor.startsWith('#')) ? eyeColor : '#5C3317';
    const hc   = hairColor || selectedHairColor || '#1a1a1a';
    const s    = size;
    const cx   = s / 2;

    // Per retrocompatibilità: se hairStyle contiene '_' (es: 'short_black') estraiamo solo lo stile
    const styleKey = hairStyle ? hairStyle.split('_')[0] : 'short';

    const hairSVG = buildHairSVG(styleKey, (styleKey === 'bald' ? null : hc), s);

    return `<svg viewBox="0 0 ${s} ${s}" width="${s}" height="${s}" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="${cx}" cy="${s*0.92}" rx="${s*0.32}" ry="${s*0.16}" fill="${gender==='female'?'#c0397a':'#1565c0'}"/>
        <rect x="${s*0.43}" y="${s*0.64}" width="${s*0.14}" height="${s*0.14}" rx="${s*0.03}" fill="${skin}"/>
        <ellipse cx="${cx}" cy="${s*0.46}" rx="${s*0.26}" ry="${s*0.28}" fill="${skin}"/>
        ${hairSVG}
        <ellipse cx="${s*0.41}" cy="${s*0.44}" rx="${s*0.055}" ry="${s*0.06}" fill="white"/>
        <ellipse cx="${s*0.59}" cy="${s*0.44}" rx="${s*0.055}" ry="${s*0.06}" fill="white"/>
        <circle cx="${s*0.41}" cy="${s*0.445}" r="${s*0.030}" fill="${eye}"/>
        <circle cx="${s*0.59}" cy="${s*0.445}" r="${s*0.030}" fill="${eye}"/>
        <circle cx="${s*0.42}" cy="${s*0.435}" r="${s*0.010}" fill="white"/>
        <circle cx="${s*0.60}" cy="${s*0.435}" r="${s*0.010}" fill="white"/>
        <path d="M${cx} ${s*0.54} Q${s*0.46} ${s*0.57} ${s*0.45} ${s*0.575} Q${cx} ${s*0.59} ${s*0.55} ${s*0.575}" stroke="${skin}" stroke-width="${s*0.007}" fill="none" opacity="0.5"/>
        <path d="M${s*0.40} ${s*0.63} Q${cx} ${s*0.67} ${s*0.60} ${s*0.63}" stroke="#c0706c" stroke-width="${s*0.015}" fill="none" stroke-linecap="round"/>
        <path d="M${s*0.34} ${s*0.39} Q${s*0.41} ${s*0.36} ${s*0.48} ${s*0.39}" stroke="${hc||'#555'}" stroke-width="${s*0.018}" fill="none" stroke-linecap="round"/>
        <path d="M${s*0.52} ${s*0.39} Q${s*0.59} ${s*0.36} ${s*0.66} ${s*0.39}" stroke="${hc||'#555'}" stroke-width="${s*0.018}" fill="none" stroke-linecap="round"/>
    </svg>`;
}

// ========================
// HAIR PICKER — stili + colori separati
// ========================
function buildHairPicker() {
    // --- Stili ---
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

    // --- Colori capelli preset ---
    const colorEl = document.getElementById('hair-color-picker');
    if (colorEl) {
        colorEl.innerHTML = HAIR_PRESET_COLORS.map(c => {
            const isActive = c === selectedHairColor;
            return `<div class="hair-color-swatch ${isActive ? 'active' : ''}"
                data-color="${c}" title="${c}"
                style="background:${c}"
                onclick="selectHairColor('${c}', this)"></div>`;
        }).join('') +
        `<label class="hair-color-custom" title="Colore personalizzato">
            <input type="color" id="hair-custom-color" value="${selectedHairColor}"
                oninput="onHairCustomColor(this.value)">
            <span>🎨</span>
        </label>`;
    }
}

function selectHairStyle(val, el) {
    selectedHairStyle = val;
    document.querySelectorAll('#hair-style-picker .hair-swatch').forEach(s => s.classList.remove('active'));
    el.classList.add('active');
    updateAvatar();
}

function selectHairColor(color, el) {
    selectedHairColor = color;
    document.querySelectorAll('.hair-color-swatch').forEach(s => s.classList.remove('active'));
    el.classList.add('active');
    const inp = document.getElementById('hair-custom-color');
    if (inp) inp.value = color;
    updateAvatar();
}

function onHairCustomColor(color) {
    selectedHairColor = color;
    document.querySelectorAll('.hair-color-swatch').forEach(s => s.classList.remove('active'));
    updateAvatar();
}

function updateAvatar() {
    const gender = document.getElementById('c-gender')?.value || 'male';
    const el = document.getElementById('avatar-preview');
    if (el) el.innerHTML = renderAvatarSVG(selectedSkin, selectedHairStyle, selectedEye, gender, 110, selectedHairColor);
}

// ========================
// SKIN PICKER — preset + custom + cronologia ultimi 5
// ========================
const SKIN_PRESETS = [
    { val: 'light',       hex: '#FDDBB4', label: 'Chiara' },
    { val: 'medium_light',hex: '#E8B88A', label: 'Medio-chiara' },
    { val: 'medium',      hex: '#C68642', label: 'Media' },
    { val: 'medium_dark', hex: '#8D5524', label: 'Medio-scura' },
    { val: 'dark',        hex: '#3B1A08', label: 'Scura' },
];
let skinCustomHistory = []; // ultimi 5 colori custom usati

function buildSkinPicker() {
    const wrap = document.getElementById('skin-picker-wrap');
    if (!wrap) return;

    const presetsHtml = SKIN_PRESETS.map(s => {
        const isActive = selectedSkin === s.val || selectedSkin === s.hex;
        return `<div class="skin-swatch ${isActive ? 'active' : ''}"
            data-val="${s.val}" data-hex="${s.hex}" title="${s.label}"
            style="background:${s.hex}"
            onclick="selectSkinPreset('${s.val}', '${s.hex}', this)"></div>`;
    }).join('');

    // Cronologia ultimi 5 custom (hex liberi)
    const historyHtml = skinCustomHistory.length
        ? '<div class="skin-history-row">' +
          skinCustomHistory.map(hex => {
              const isActive = selectedSkin === hex;
              return `<div class="skin-swatch skin-history-swatch ${isActive ? 'active' : ''}"
                  data-val="${hex}" title="${hex}" style="background:${hex}"
                  onclick="selectSkinCustomFromHistory('${hex}', this)"></div>`;
          }).join('') +
          '</div>'
        : '';

    wrap.innerHTML = `
        <div class="skin-presets-row">${presetsHtml}</div>
        ${historyHtml}
        <div class="skin-wheel-wrap">
            <button class="eye-custom-btn" onclick="toggleSkinWheel()" id="skin-custom-btn"
                title="Colore personalizzato"
                style="background:${SKIN_COLORS[selectedSkin] || selectedSkin || '#C68642'}; border: 3px solid var(--gold)">
                🎨
            </button>
            <div class="eye-wheel-popup" id="skin-wheel-popup" style="display:none">
                <canvas id="skin-color-wheel" width="160" height="160"></canvas>
                <div id="skin-brightness-wrap">
                    <input type="range" id="skin-brightness" min="0" max="100" value="60"
                        oninput="onSkinBrightnessChange(this.value)" style="width:100%;margin-top:6px">
                    <div id="skin-preview-strip" style="height:18px;border-radius:6px;margin-top:4px;background:${SKIN_COLORS[selectedSkin] || selectedSkin || '#C68642'}"></div>
                </div>
                <input type="text" id="skin-hex-input" value="${SKIN_COLORS[selectedSkin] || selectedSkin || '#C68642'}" maxlength="7"
                    oninput="onSkinHexInput(this.value)"
                    style="width:100%;margin-top:6px;background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:4px 8px;color:var(--text);font-size:0.8rem">
            </div>
        </div>`;

    // Close on outside click
    setTimeout(() => {
        document.addEventListener('click', closeSkinWheelOutside);
    }, 0);
}

let skinWheelOpen = false;

function toggleSkinWheel() {
    skinWheelOpen = !skinWheelOpen;
    const popup = document.getElementById('skin-wheel-popup');
    if (!popup) return;
    popup.style.display = skinWheelOpen ? 'block' : 'none';
    if (skinWheelOpen) drawSkinColorWheel();
}

function closeSkinWheelOutside(e) {
    const wrap = document.getElementById('skin-picker-wrap');
    if (wrap && !wrap.contains(e.target)) closeSkinWheel();
}

function closeSkinWheel() {
    skinWheelOpen = false;
    const popup = document.getElementById('skin-wheel-popup');
    if (popup) popup.style.display = 'none';
}

function drawSkinColorWheel() {
    const canvas = document.getElementById('skin-color-wheel');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const cx = 80, cy = 80, r = 78;
    ctx.clearRect(0, 0, 160, 160);
    for (let angle = 0; angle < 360; angle += 1) {
        const rad1 = (angle - 1) * Math.PI / 180;
        const rad2 = (angle + 1) * Math.PI / 180;
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        gradient.addColorStop(0,   `hsl(${angle}, 0%, 100%)`);
        gradient.addColorStop(0.5, `hsl(${angle}, 100%, 50%)`);
        gradient.addColorStop(1,   `hsl(${angle}, 100%, 20%)`);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, rad1, rad2);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    canvas.onclick = (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left - cx;
        const y = e.clientY - rect.top  - cy;
        if (Math.sqrt(x*x + y*y) > r) return;
        const pixel = ctx.getImageData(e.clientX - rect.left, e.clientY - rect.top, 1, 1).data;
        const hex = '#' + [pixel[0], pixel[1], pixel[2]].map(v => v.toString(16).padStart(2,'0')).join('');
        applySkinCustomColor(hex);
    };
}

function onSkinBrightnessChange(val) {
    const currentHex = SKIN_COLORS[selectedSkin] || selectedSkin || '#C68642';
    const [h, s] = hexToHSL(currentHex);
    applySkinCustomColor(hslToHex(h, s, parseInt(val)));
}

function onSkinHexInput(val) {
    if (/^#[0-9a-fA-F]{6}$/.test(val)) applySkinCustomColor(val);
}

function applySkinCustomColor(hex) {
    selectedSkin = hex;
    // Aggiorna cronologia (max 5, no duplicati)
    skinCustomHistory = [hex, ...skinCustomHistory.filter(h => h !== hex)].slice(0, 5);
    const hexInput = document.getElementById('skin-hex-input');
    if (hexInput) hexInput.value = hex;
    const strip = document.getElementById('skin-preview-strip');
    if (strip) strip.style.background = hex;
    const btn = document.getElementById('skin-custom-btn');
    if (btn) btn.style.background = hex;
    document.querySelectorAll('.skin-swatch').forEach(s => s.classList.remove('active'));
    updateAvatar();
    // Ricostruisci picker per aggiornare cronologia (senza chiudere la ruota)
    const popup = document.getElementById('skin-wheel-popup');
    const wasOpen = skinWheelOpen;
    buildSkinPicker();
    if (wasOpen) {
        skinWheelOpen = true;
        const newPopup = document.getElementById('skin-wheel-popup');
        if (newPopup) { newPopup.style.display = 'block'; drawSkinColorWheel(); }
    }
}

function selectSkinPreset(val, hex, el) {
    closeSkinWheel();
    selectedSkin = val;
    document.querySelectorAll('.skin-swatch').forEach(s => s.classList.remove('active'));
    el.classList.add('active');
    const btn = document.getElementById('skin-custom-btn');
    if (btn) btn.style.background = hex;
    const strip = document.getElementById('skin-preview-strip');
    if (strip) strip.style.background = hex;
    const hexInput = document.getElementById('skin-hex-input');
    if (hexInput) hexInput.value = hex;
    updateAvatar();
}

function selectSkinCustomFromHistory(hex, el) {
    closeSkinWheel();
    selectedSkin = hex;
    document.querySelectorAll('.skin-swatch').forEach(s => s.classList.remove('active'));
    el.classList.add('active');
    const btn = document.getElementById('skin-custom-btn');
    if (btn) btn.style.background = hex;
    const strip = document.getElementById('skin-preview-strip');
    if (strip) strip.style.background = hex;
    const hexInput = document.getElementById('skin-hex-input');
    if (hexInput) hexInput.value = hex;
    updateAvatar();
}

// Keep legacy selectSkin for any inline calls
function selectSkin(val, el) {
    const preset = SKIN_PRESETS.find(s => s.val === val);
    selectSkinPreset(val, preset ? preset.hex : '#C68642', el);
}

// ========================
// EYE COLOR WHEEL
// ========================
let eyeWheelOpen = false;

function buildEyePicker() {
    const el = document.getElementById('eye-picker-wrap');
    if (!el) return;

    const presetsHtml = EYE_PRESETS.map(c =>
        `<div class="eye-swatch ${c === selectedEye ? 'active' : ''}"
            style="background:${c}" title="${c}"
            onclick="selectEyePreset('${c}', this)"></div>`
    ).join('');

    el.innerHTML = `
        <div class="eye-presets">${presetsHtml}</div>
        <div class="eye-wheel-wrap">
            <button class="eye-custom-btn" onclick="toggleEyeWheel()" id="eye-custom-btn"
                style="background:${selectedEye}; border: 3px solid ${selectedEye === '#5C3317' ? 'var(--gold)' : selectedEye}">
                🎨
            </button>
            <div class="eye-wheel-popup" id="eye-wheel-popup" style="display:none">
                <canvas id="eye-color-wheel" width="160" height="160"></canvas>
                <div id="eye-brightness-wrap">
                    <input type="range" id="eye-brightness" min="0" max="100" value="70"
                        oninput="onEyeBrightnessChange(this.value)" style="width:100%;margin-top:6px">
                    <div id="eye-preview-strip" style="height:18px;border-radius:6px;margin-top:4px;background:${selectedEye}"></div>
                </div>
                <input type="text" id="eye-hex-input" value="${selectedEye}" maxlength="7"
                    oninput="onEyeHexInput(this.value)"
                    style="width:100%;margin-top:6px;background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:4px 8px;color:var(--text);font-size:0.8rem">
            </div>
        </div>`;

    // Close when clicking outside
    setTimeout(() => {
        document.addEventListener('click', closeEyeWheelOutside);
    }, 0);
}

function closeEyeWheelOutside(e) {
    const wrap = document.getElementById('eye-picker-wrap');
    if (wrap && !wrap.contains(e.target)) {
        closeEyeWheel();
    }
}

function toggleEyeWheel() {
    eyeWheelOpen = !eyeWheelOpen;
    const popup = document.getElementById('eye-wheel-popup');
    if (!popup) return;
    popup.style.display = eyeWheelOpen ? 'block' : 'none';
    if (eyeWheelOpen) drawColorWheel();
}

function closeEyeWheel() {
    eyeWheelOpen = false;
    const popup = document.getElementById('eye-wheel-popup');
    if (popup) popup.style.display = 'none';
}

function drawColorWheel() {
    const canvas = document.getElementById('eye-color-wheel');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const cx = 80, cy = 80, r = 78;

    ctx.clearRect(0, 0, 160, 160);

    // Disegna la ruota HSL
    for (let angle = 0; angle < 360; angle += 1) {
        const rad1 = (angle - 1) * Math.PI / 180;
        const rad2 = (angle + 1) * Math.PI / 180;
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        gradient.addColorStop(0,   `hsl(${angle}, 0%, 100%)`);
        gradient.addColorStop(0.5, `hsl(${angle}, 100%, 50%)`);
        gradient.addColorStop(1,   `hsl(${angle}, 100%, 20%)`);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, rad1, rad2);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();
    }

    // Cerchio centrale bianco
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();

    canvas.onclick = (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left - cx;
        const y = e.clientY - rect.top  - cy;
        const dist = Math.sqrt(x*x + y*y);
        if (dist > r) return;

        const pixel = ctx.getImageData(e.clientX - rect.left, e.clientY - rect.top, 1, 1).data;
        const hex = '#' + [pixel[0], pixel[1], pixel[2]].map(v => v.toString(16).padStart(2,'0')).join('');
        applyEyeColor(hex);
    };
}

function onEyeBrightnessChange(val) {
    // Modifica luminosità del colore corrente
    const [h, s] = hexToHSL(selectedEye);
    const newColor = hslToHex(h, s, parseInt(val));
    applyEyeColor(newColor);
}

function onEyeHexInput(val) {
    if (/^#[0-9a-fA-F]{6}$/.test(val)) applyEyeColor(val);
}

function applyEyeColor(hex) {
    selectedEye = hex;
    const hexInput = document.getElementById('eye-hex-input');
    if (hexInput) hexInput.value = hex;
    const strip = document.getElementById('eye-preview-strip');
    if (strip) strip.style.background = hex;
    const btn = document.getElementById('eye-custom-btn');
    if (btn) btn.style.background = hex;
    document.querySelectorAll('.eye-swatch').forEach(s => {
        s.classList.toggle('active', s.style.background === hex || s.dataset?.color === hex);
    });
    updateAvatar();
}

function selectEyePreset(color, el) {
    closeEyeWheel();
    applyEyeColor(color);
    document.querySelectorAll('.eye-swatch').forEach(s => s.classList.remove('active'));
    el.classList.add('active');
}

function hexToHSL(hex) {
    let r = parseInt(hex.slice(1,3),16)/255;
    let g = parseInt(hex.slice(3,5),16)/255;
    let b = parseInt(hex.slice(5,7),16)/255;
    const max = Math.max(r,g,b), min = Math.min(r,g,b);
    let h, s, l = (max+min)/2;
    if (max === min) { h = s = 0; }
    else {
        const d = max - min;
        s = l > 0.5 ? d/(2-max-min) : d/(max+min);
        switch(max) {
            case r: h = ((g-b)/d + (g<b?6:0))/6; break;
            case g: h = ((b-r)/d + 2)/6; break;
            case b: h = ((r-g)/d + 4)/6; break;
        }
    }
    return [Math.round(h*360), Math.round(s*100), Math.round(l*100)];
}

function hslToHex(h, s, l) {
    s /= 100; l /= 100;
    const a = s * Math.min(l, 1-l);
    const f = n => { const k=(n+h/30)%12; const c=l-a*Math.max(Math.min(k-3,9-k,1),-1); return Math.round(255*c).toString(16).padStart(2,'0'); };
    return `#${f(0)}${f(8)}${f(4)}`;
}

// ========================
// EXIT DROPDOWN MENU
// ========================
function toggleExitMenu(e) {
    e.stopPropagation();
    const dd = document.getElementById('exit-dropdown');
    dd.classList.toggle('open');
}

// Chiudi dropdown se clicchi fuori
document.addEventListener('click', (e) => {
    const wrap = document.getElementById('exit-dropdown-wrap');
    if (wrap && !wrap.contains(e.target)) {
        document.getElementById('exit-dropdown')?.classList.remove('open');
    }
});

function goToCareerSelect() {
    document.getElementById('exit-dropdown')?.classList.remove('open');
    // Vai al menu carriere senza fare logout completo
    currentCareerId = null;
    localStorage.removeItem('gs_career');
    // Recupera le carriere dell'account
    api('auth.php', { action: 'careers' }, 'GET').then(res => {
        if (res.error) { doLogout(); return; }
        const emailStored = localStorage.getItem('gs_email') || '';
        showCareerSelect(res, emailStored);
    });
}

// ========================
// INIT
// ========================
document.addEventListener('DOMContentLoaded', async () => {
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
    buildSkinPicker();
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

    if (page === 'dashboard') renderDashboard();
    if (page === 'game')      renderGame();
    if (page === 'career')    loadCareer();
    if (page === 'transfer')  loadTransfer();
    if (page === 'strutture') loadStrutture();
    if (page === 'classifica') loadClassifica();
    if (page === 'agente')     loadAgente();
    if (page === 'notizie')    loadNotizie();
}

document.querySelectorAll('nav button[data-page]').forEach(btn => {
    btn.addEventListener('click', () => showPage(btn.dataset.page));
});

// ========================
// AUTH
// ========================
function showAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(b => b.classList.remove('active'));
    const btn = document.querySelector(`.auth-tab[data-tab="${tab}"]`);
    if (btn) btn.classList.add('active');
    const lf = document.getElementById('login-form');
    const rf = document.getElementById('register-form');
    const ff = document.getElementById('forgot-form');
    if (lf) lf.style.display = tab === 'login'    ? 'block' : 'none';
    if (rf) rf.style.display = tab === 'register' ? 'block' : 'none';
    if (ff) ff.style.display = 'none';
}

function showForgot() {
    ['login-form','register-form'].forEach(id => { const el=document.getElementById(id); if(el) el.style.display='none'; });
    const ff = document.getElementById('forgot-form');
    if (ff) ff.style.display = 'block';
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
    const email    = document.getElementById('r-email')?.value.trim();
    const password = document.getElementById('r-password')?.value;
    const pass2    = document.getElementById('r-password2')?.value;
    const errEl    = document.getElementById('register-error');
    if (errEl) errEl.textContent = '';
    if (password !== pass2) { if(errEl) errEl.textContent='Le password non coincidono'; return; }
    const res = await api('auth.php', { action:'register', email, password }, 'POST');
    if (res.error) { if(errEl) errEl.textContent = res.error; return; }
    authToken = res.token;
    localStorage.setItem('gs_token', authToken);
    localStorage.setItem('gs_email', email);
    currentCareerId = null;
    showCareerSelect([], email);
}

async function doForgot() {
    const email = document.getElementById('f-email')?.value.trim();
    const errEl = document.getElementById('forgot-error');
    if (errEl) errEl.textContent = '';
    const res = await api('auth.php', { action:'request_reset', email }, 'POST');
    if (res.error) { if(errEl) errEl.textContent = res.error; return; }
    if (errEl) {
        errEl.style.color='#4caf50';
        errEl.textContent = res.msg || 'Istruzioni inviate!';
    }
    if (res.debug_link) console.log('RESET LINK (dev):', res.debug_link);
}

async function doLogout() {
    document.getElementById('exit-dropdown')?.classList.remove('open');
    await api('auth.php', { action:'logout' }, 'POST');
    authToken = null; currentPlayer = null; currentCareerId = null;
    localStorage.removeItem('gs_token');
    localStorage.removeItem('gs_career');
    const mb = document.getElementById('auth-box-main');
    const cs = document.getElementById('career-select-box');
    const cc = document.getElementById('create-career-box');
    if (mb) mb.style.display = 'block';
    if (cs) cs.style.display = 'none';
    if (cc) cc.style.display = 'none';
    showPage('auth'); showAuthTab('login');
}

// CARRIERE
function showCareerSelect(careers, email) {
    showPage('auth');
    const mb = document.getElementById('auth-box-main');
    const cs = document.getElementById('career-select-box');
    const cc = document.getElementById('create-career-box');
    if (mb) mb.style.display = 'none';
    if (cs) cs.style.display = 'block';
    if (cc) cc.style.display = 'none';
    const emailEl = document.getElementById('career-account-email');
    if (emailEl) emailEl.textContent = email || '';
    renderCareerList(careers);
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
            <div class="career-avatar">${renderAvatarSVG(c.skin_color||'medium',c.skin_hair||'short_black',c.eye_color||'brown',c.gender||'male',52)}</div>
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
    const cs = document.getElementById('career-select-box');
    const cc = document.getElementById('create-career-box');
    if (cs) cs.style.display = 'none';
    if (cc) cc.style.display = 'block';
    // Reset defaults
    selectedSkin       = 'medium';
    selectedEye        = '#5C3317';
    selectedHairStyle  = 'short';
    selectedHairColor  = '#1a1a1a';
    buildSkinPicker();
    buildHairPicker();
    buildEyePicker();
    updateAvatar();
}

async function doCreateCareer() {
    const career_name = document.getElementById('c-career-name')?.value.trim() || 'Nuova Carriera';
    const player_name = document.getElementById('c-name')?.value.trim();
    const gender      = document.getElementById('c-gender')?.value || 'male';
    const age         = document.getElementById('c-age')?.value || '17';
    const nationality = document.getElementById('c-nationality')?.value || 'Italy';
    const errEl       = document.getElementById('create-error');
    if (errEl) errEl.textContent = '';
    const res = await api('auth.php', {
        action:'create_career', career_name, player_name, gender, age, nationality,
        skin_hair: selectedHairStyle, skin_color: selectedSkin, eye_color: selectedEye,
        hair_color: selectedHairColor
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

function showError(id, msg) { const el=document.getElementById(id); if(el){el.textContent=msg; setTimeout(()=>el.textContent='',5000);} }

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
        const agSconti = {1:2.5, 2:5.0, 3:7.5, 4:10.0};
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

    // Avatar SVG
    const avatarWrap = document.querySelector('.player-avatar');
    if (avatarWrap) {
        avatarWrap.innerHTML = renderAvatarSVG(
            p.skin_color||'medium', p.skin_hair||'short_black',
            p.eye_color||'brown', p.gender||'male', 72
        );
        avatarWrap.style.background = 'transparent';
        avatarWrap.style.border = '3px solid var(--gold)';
    }

    const stars = '⭐'.repeat(parseInt(p.team_stelle || 1));
    const legaInfo = p.lega_nome ? ` · ${p.nazione_bandiera || ''} ${p.lega_nome}` : '';
    document.getElementById('player-team').textContent = `${stars} ${p.team_nome || 'Senza squadra'}${legaInfo}`;

    const ov = parseInt(p.overall);
    document.getElementById('overall-value').textContent = ov;
    document.getElementById('overall-circle').style.setProperty('--pct', `${ov}%`);

    ['tiro','velocita','dribbling','fisico','mentalita'].forEach(s => {
        const val = parseInt(p[s]);
        const row = document.querySelector(`[data-stat="${s}"]`);
        if (row) {
            row.querySelector('.stat-bar').style.width = val + '%';
            row.querySelector('.stat-value').textContent = val;
        }
    });

    renderSpecialBar('energia',    parseInt(p.energia),    'bar-green');
    renderSpecialBar('morale',     parseInt(p.morale),     'bar-blue');
    renderSpecialBar('popolarita', parseInt(p.popolarita), 'bar-purple');

    document.getElementById('info-soldi').textContent    = formatMoney(p.soldi);
    document.getElementById('info-gol').textContent      = p.gol_carriera;
    document.getElementById('info-assist').textContent   = p.assist_carriera;
    document.getElementById('info-palloni').textContent  = p.palloni_doro;
    document.getElementById('info-struttura').textContent= getStrutturaName(p.struttura_livello);
    document.getElementById('info-mese').textContent     = getMeseName(p.mese_corrente) + ' - Anno ' + p.anno_corrente;
    loadDashboardObiettivi();
    loadDashboardNotizie();
}

function renderSpecialBar(id, val, cls) {
    const el = document.querySelector(`[data-special="${id}"]`);
    if (!el) return;
    el.querySelector('.stat-bar').style.width = val + '%';
    el.querySelector('.stat-value').textContent = val;
    el.classList.add(cls);
}

// ========================
// GAME
// ========================
function renderGame() {
    if (!currentPlayer) return;
    const p = currentPlayer;

    const dotsEl = document.getElementById('month-dots');
    dotsEl.innerHTML = '';
    for (let i = 1; i <= 12; i++) {
        const dot = document.createElement('div');
        dot.className = 'month-dot' + (i < p.mese_corrente ? ' done' : i == p.mese_corrente ? ' current' : '');
        dotsEl.appendChild(dot);
    }
    document.getElementById('current-month-text').textContent =
        `${getMeseName(p.mese_corrente)} Anno ${p.anno_corrente} · Età ${p.age}`;

    document.getElementById('g-overall').textContent = p.overall;
    document.getElementById('g-energia').textContent = p.energia;
    document.getElementById('g-morale').textContent  = p.morale;
    document.getElementById('g-soldi').textContent   = formatMoney(p.soldi);

    selectedActions = [];
    document.querySelectorAll('.action-btn').forEach(b => b.classList.remove('selected'));
    updatePlayBtn();
    loadRecentLog();
}

const ACTIONS = [
    { id: 'allenamento_tiro',      icon: '🎯', name: 'Allena Tiro',        desc: 'Migliora la precisione in porta' },
    { id: 'allenamento_velocita',  icon: '⚡', name: 'Allena Velocità',     desc: 'Aumenta la velocità di corsa' },
    { id: 'dribbling',             icon: '🏃', name: 'Allena Dribbling',    desc: 'Migliora il controllo palla' },
    { id: 'allenamento_fisico',    icon: '💪', name: 'Allena Fisico',       desc: 'Costruisci massa muscolare' },
    { id: 'riposo',                icon: '😴', name: 'Riposo',              desc: 'Recupera energia e morale' },
    { id: 'social',                icon: '📱', name: 'Attività Social',     desc: 'Aumenta la popolarità' },
    { id: 'allenamento_speciale',  icon: '🔥', name: 'Allenamento Speciale',desc: 'Alto rischio, alto guadagno' },
];

document.getElementById('actions-grid').innerHTML = ACTIONS.map(a => `
    <button class="action-btn" data-action="${a.id}" onclick="toggleAction('${a.id}', this)">
        <span class="action-icon">${a.icon}</span>
        <div class="action-name">${a.name}</div>
        <div class="action-desc">${a.desc}</div>
    </button>
`).join('');

function toggleAction(id, el) {
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
    showResults(res);
    renderGame();
    renderDashboard();
});

function showResults(res) {
    const modal = document.getElementById('results-modal');
    const list  = document.getElementById('results-list');
    let html = '';
    if (res.pallone_doro && res.pallone_doro.pos > 0) {
        html += `<div class="pallone-banner">🏆 ${res.pallone_doro.msg}</div>`;
    }
    if (res.fine_carriera) {
        html += `<div class="pallone-banner">🏁 FINE CARRIERA!</div>`;
    }
    if (res.promozione) {
        const tipo = res.promozione.includes('PROMOZIONE') ? 'promozione' : 'retrocessione';
        html += `<div class="pallone-banner ${tipo}-banner">${res.promozione}</div>`;
    }
    list.innerHTML = html + res.risultati.map(r => `<li class="result-item">${r}</li>`).join('');
    modal.classList.add('active');
}

document.getElementById('close-results').addEventListener('click', () => {
    document.getElementById('results-modal').classList.remove('active');
});

async function loadRecentLog() {
    const res = await api('player.php', { action: 'log' }, 'GET');
    const logEl = document.getElementById('recent-log');
    if (!res || res.error || !res.length) {
        logEl.innerHTML = '<li class="log-item" style="color:var(--text-dim)">Nessuna attività ancora</li>';
        return;
    }
    logEl.innerHTML = res.slice(0, 5).map(l => `
        <li class="log-item">
            <div class="log-date">${getMeseName(l.mese)} Anno ${l.anno}</div>
            <div class="log-text">${l.gol}⚽ ${l.assist}🎯 Voto: ${l.voto}</div>
            ${l.evento_speciale ? `<div style="color:var(--gold);font-size:0.75rem">🎲 ${l.evento_speciale}</div>` : ''}
        </li>
    `).join('');
}

// ========================
// CAREER
// ========================
async function loadCareer() {
    const res = await api('player.php', { action: 'season' }, 'GET');
    const el  = document.getElementById('season-table-body');
    if (!res || !res.length) {
        el.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text-dim)">Nessuna stagione completata</td></tr>';
        return;
    }
    el.innerHTML = res.map(s => {
        let badge = '-';
        if (s.pallone_doro_pos === 1 || s.pallone_doro_pos === '1') badge = '<span class="badge-gold">🏆 1°</span>';
        else if (s.pallone_doro_pos <= 3 && s.pallone_doro_pos > 0)  badge = `<span class="badge-silver">${s.pallone_doro_pos}°</span>`;
        else if (s.pallone_doro_pos <= 10 && s.pallone_doro_pos > 0) badge = `<span class="badge-bronze">Top 10</span>`;
        else if (s.pallone_doro_pos > 0)                              badge = 'Top 30';
        return `<tr>
            <td><strong>Anno ${s.anno}</strong><div style="font-size:0.7rem;color:var(--text-dim)">${s.team_nome || ''}</div></td>
            <td>${s.gol}</td>
            <td>${s.assist}</td>
            <td>${s.partite}</td>
            <td>${s.media_voto}</td>
            <td><div>${badge}</div><div style="font-size:0.7rem;color:var(--text-dim);margin-top:2px">${s.lega_nome || ''}</div></td>
        </tr>`;
    }).join('');
}

// ========================
// TRANSFER
// ========================
let selectedLegaId = null;
let selectedNazioneId = null;

async function loadTransfer() {
    const [leghe, p] = await Promise.all([
        api('player.php', { action: 'leghe' }, 'GET'),
        api('player.php', { action: 'get'   }, 'GET')
    ]);
    if (!selectedNazioneId && p.lega_id) {
        const myLega = leghe.find(l => l.id == p.lega_id);
        if (myLega) selectedNazioneId = myLega.nazione_id;
    }
    const el = document.getElementById('teams-grid');
    const nazioniMap = {};
    leghe.forEach(l => {
        if (!nazioniMap[l.nazione_id]) nazioniMap[l.nazione_id] = { id: l.nazione_id, nome: l.nazione_nome, bandiera: l.bandiera, leghe: [] };
        nazioniMap[l.nazione_id].leghe.push(l);
    });
    let html = '<div class="nazione-tabs">';
    Object.values(nazioniMap).forEach(n => {
        const isActive  = selectedNazioneId == n.id;
        const isCurrent = leghe.find(l => l.id == p.lega_id)?.nazione_id == n.id;
        html += `<button class="nazione-tab ${isActive ? 'active' : ''} ${isCurrent ? 'current-naz' : ''}"
            onclick="selectNazione(${n.id})">${n.bandiera} ${n.nome}${isCurrent ? ' ★' : ''}</button>`;
    });
    html += '</div>';
    const nazione = nazioniMap[selectedNazioneId];
    if (nazione) {
        html += '<div class="lega-subtabs">';
        nazione.leghe.forEach(l => {
            const isActive  = selectedLegaId == l.id || (!selectedLegaId && l.id == p.lega_id);
            const isCurrent = l.id == p.lega_id;
            html += `<button class="lega-subtab ${isActive ? 'active' : ''} ${isCurrent ? 'current-lega' : ''}"
                onclick="filterLega(${l.id})">${l.livello == 1 ? '🥇' : '🥈'} ${l.nome}${isCurrent ? ' (tua lega)' : ''}</button>`;
        });
        html += '</div>';
        const legaToShow = selectedLegaId || (nazione.leghe.find(l => l.id == p.lega_id) || nazione.leghe[0]).id;
        const teams = await api('player.php', { action: 'teams', lega_id: legaToShow }, 'GET');
        html += '<div class="teams-grid-inner">' + teams.map(t => renderTeamCard(t, p)).join('') + '</div>';
    }
    el.innerHTML = html;
}

function renderTeamCard(t, p) {
    const isCurrent = t.id == p.team_id;
    const stars = '⭐'.repeat(t.stelle);
    const minOvBase = (t.stelle - 1) * 15 + 55;
    const agentSconto = parseFloat(p.agent_ovr_sconto || 0);
    const minOv = t.stelle > 1 ? Math.max(55, Math.floor(minOvBase * (1 - agentSconto/100))) : minOvBase;
    const scontoLabel = agentSconto > 0 && t.stelle > 1 ? ` <span style="color:var(--green);font-size:0.7rem">(-${agentSconto}% agente)</span>` : '';
    const canJoin = p.overall >= minOv || t.stelle == 1;
    const legaBadge = t.lega_livello == 1 ? '<span class="lega-badge primo">1ª Div</span>' : '<span class="lega-badge secondo">2ª Div</span>';
    return `<div class="team-card ${isCurrent ? 'current' : ''}">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div class="team-stars">${stars}</div>${legaBadge}
        </div>
        <div class="team-name">${t.nome}</div>
        <div style="font-size:0.75rem;color:var(--text-dim);margin-bottom:8px">${t.bandiera || ''} ${t.nazione_nome || ''} · ${t.lega_nome || ''}</div>
        <div class="team-stats">
            <div class="team-stat"><div class="ts-label">Popolarità</div><div class="ts-val">${t.popolarita}/100</div></div>
            <div class="team-stat"><div class="ts-label">Obiettivo</div><div class="ts-val">${t.obiettivo}</div></div>
            <div class="team-stat"><div class="ts-label">OVR minimo</div><div class="ts-val">${minOv}</div></div>
            <div class="team-stat"><div class="ts-label">Stipendio ×</div><div class="ts-val">×${t.moltiplicatore_stipendio}</div></div>
        </div>
        ${isCurrent
            ? '<div style="text-align:center;color:var(--green);font-weight:700;margin-top:8px">✅ Squadra attuale</div>'
            : `<button class="btn-transfer" ${!canJoin?'disabled':''} onclick="transferTo(${t.id},'${t.nome}')">
                ${canJoin ? '🔄 Trasferisciti' : '🔒 OVR '+minOv+' richiesto'}
               </button>`
        }
    </div>`;
}

async function filterLega(legaId) { selectedLegaId = legaId; await loadTransfer(); }
async function selectNazione(nazioneId) { selectedNazioneId = nazioneId; selectedLegaId = null; await loadTransfer(); }

async function transferTo(teamId, teamName) {
    if (!confirm(`Vuoi trasferirti a ${teamName}?`)) return;
    const res = await api('game.php', { action: 'change_team', team_id: teamId });
    if (res.error) { toast(res.error, 'error'); return; }
    toast(res.msg, 'gold');
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
        api('player.php', { action: 'get'       }, 'GET')
    ]);
    currentPlayer = player;
    const el = document.getElementById('strutture-container');
    el.innerHTML = `
        <div class="info-cards" style="margin-bottom:20px">
            <div class="info-card"><div class="val">${formatMoney(player.soldi)}</div><div class="lbl">Soldi Disponibili</div></div>
            <div class="info-card"><div class="val">${getStrutturaName(player.struttura_livello)}</div><div class="lbl">Struttura Attuale</div></div>
        </div>`;
    strutture.forEach(s => {
        const owned   = player.struttura_livello >= s.livello;
        const isNext  = player.struttura_livello == s.livello - 1;
        const canAfford = player.soldi >= s.costo;
        const div = document.createElement('div');
        div.className = `struttura-card ${owned ? 'owned' : isNext ? 'next' : ''}`;
        div.innerHTML = `
            <div class="struttura-level">${s.livello}</div>
            <div>
                <div class="struttura-name">${s.nome}</div>
                <div class="struttura-desc">${s.descrizione}</div>
                <div class="struttura-bonuses">
                    ${s.bonus_allenamento  ? `<span class="struttura-bonus">+${s.bonus_allenamento} Allenamento</span>` : ''}
                    ${s.bonus_crescita     ? `<span class="struttura-bonus">+${s.bonus_crescita}% Crescita</span>` : ''}
                    ${s.riduzione_infortuni? `<span class="struttura-bonus">-${s.riduzione_infortuni}% Infortuni</span>` : ''}
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
        if (unread > 0) { badge.textContent = unread; badge.style.display = 'inline'; }
        else badge.style.display = 'none';
    }
    const el = document.getElementById('dash-notizie-lista');
    if (!el) return;
    if (!res.notizie || !res.notizie.length) {
        el.innerHTML = '<p style="color:var(--text-dim);font-size:0.82rem;padding:8px 0">Gioca il primo mese per ricevere notizie!</p>';
        return;
    }
    const tipoIcon = { positivo:'🟢', negativo:'🔴', mercato:'💼', agente:'🤝', obiettivo:'🎯', info:'📋' };
    el.innerHTML = res.notizie.slice(0, 8).map(n => `
        <div class="dash-news-item ${n.letto == 0 ? 'dash-news-unread' : ''} news-${n.tipo}">
            <div class="dash-news-top">
                <span>${tipoIcon[n.tipo] || '📋'} <strong>${n.titolo}</strong></span>
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
    if (!res || res.error || !res.notizie.length) {
        el.innerHTML = '<p style="color:var(--text-dim);padding:20px">Nessuna notizia ancora. Gioca qualche mese!</p>';
        return;
    }
    const tipoIcon = { positivo:'🟢', negativo:'🔴', mercato:'💼', agente:'🤝', obiettivo:'🎯', info:'📋' };
    el.innerHTML = res.notizie.map(n => `
        <div class="news-card ${n.letto == 0 ? 'news-unread' : ''} news-${n.tipo}">
            <div class="news-header">
                <span class="news-icon">${tipoIcon[n.tipo] || '📋'}</span>
                <span class="news-titolo">${n.titolo}</span>
                <span class="news-data">${getMeseName(n.mese)} Anno ${n.anno}</span>
            </div>
            <div class="news-testo">${n.testo}</div>
        </div>`).join('');
}

// ========================
// AGENTE PAGE
// ========================
async function loadAgente() {
    let res, player;
    try {
        [res, player] = await Promise.all([
            api('agente.php', { action: 'get' }, 'GET'),
            api('player.php',  { action: 'get' }, 'GET')
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

    const myPop   = parseInt(player?.popolarita) || 0;
    const mySoldi = parseFloat(player?.soldi)    || 0;

    if (livello > 0 && agenti[livello]) {
        const info = agenti[livello];
        cur.innerHTML = `
            <div class="agente-attuale">
                <div class="agente-avatar">🤝</div>
                <div>
                    <div class="agente-nome">${res.nome || info.nome}</div>
                    <div class="agente-livello">Livello ${livello}/4</div>
                    <div class="agente-bonus">
                        <span class="ag-bonus-item">💰 +${Math.round(parseFloat(info.bonus_stipendio)*100)}% stipendio</span>
                        <span class="ag-bonus-item">📉 -${info.bonus_ovr_sconto}% OVR trasferimento</span>
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
        else if (!soldiOk)       lockMsg = `💸 Mancano €${(costoReale - mySoldi).toLocaleString('it')}`;
        const btnLabel = livello > 0 && isNext
            ? `⬆️ Upgrade — €${costoReale.toLocaleString('it')}`
            : `🤝 Assumi — €${costoReale.toLocaleString('it')}`;
        html += `
        <div class="agente-card ${isOwned ? 'owned' : ''} ${isNext && popOk && !isOwned ? 'next' : ''}">
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
            <div class="ag-requisiti">
                <span class="${popOk ? 'req-ok' : 'req-no'}">👥 ${parseInt(info.pop_richiesta) > 0 ? 'Pop. ' + info.pop_richiesta : 'Libero'}</span>
                <span class="${soldiOk || isOwned ? 'req-ok' : 'req-no'}">💰 €${costoReale.toLocaleString('it')}</span>
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
        api('player.php', { action: 'get' }, 'GET')
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
            filterHtml += `<button class="lega-filter-btn ${isActive ? 'active' : ''} ${isCurrent ? 'current-lega' : ''}" onclick="selectClassLega(${l.id})">${n.bandiera} ${l.nome}${isCurrent ? ' ★' : ''}</button>`;
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
    const anno = player.anno_corrente;
    const data = await api('classifica.php', { action: 'get', lega_id: legaId, anno }, 'GET');
    if (!data || data.error || !data.length) {
        wrap.innerHTML = '<p style="color:var(--text-dim);padding:20px">Nessuna partita giocata ancora in questa lega.</p>';
        return;
    }
    let html = `<table class="season-table classifica-table">
        <thead><tr><th>#</th><th>Squadra</th><th>OVR</th><th>G</th><th>V</th><th>P</th><th>S</th><th>GF</th><th>GS</th><th>DR</th><th>Pts</th></tr></thead><tbody>`;
    data.forEach((row, i) => {
        const isMyTeam = row.team_id == player.team_id;
        const pos = i + 1;
        let posClass = '';
        if (pos === 1) posClass = 'class-pos-1';
        else if (pos <= 3) posClass = 'class-pos-top3';
        else if (pos <= 4) posClass = 'class-pos-top4';
        else if (pos >= data.length - 2) posClass = 'class-pos-retro';
        const dr = (row.gol_fatti - row.gol_subiti);
        const drStr = dr > 0 ? '+' + dr : dr;
        const stelle = '⭐'.repeat(parseInt(row.stelle));
        html += `<tr class="${isMyTeam ? 'my-team-row' : ''} ${posClass}">
            <td class="pos-cell"><span class="pos-badge ${posClass}">${pos}</span></td>
            <td class="team-name-cell"><span class="team-name-cl">${row.team_nome}</span><span class="team-stars-sm">${stelle}</span>${isMyTeam ? '<span class="my-team-badge">TU</span>' : ''}</td>
            <td><span class="ovr-badge">${row.ovr}</span></td>
            <td>${row.partite_giocate}</td><td>${row.vittorie}</td><td>${row.pareggi}</td><td>${row.sconfitte}</td>
            <td>${row.gol_fatti}</td><td>${row.gol_subiti}</td><td>${drStr}</td>
            <td><strong>${row.punti}</strong></td>
        </tr>`;
    });
    html += '</tbody></table>';
    html += `<div class="classifica-legenda">
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
    if (!data || data.error || !data.length) {
        wrap.innerHTML = '<p style="color:var(--text-dim);padding:20px">🏆 La Champions Cup non è ancora iniziata. Le squadre si qualificano a fine stagione (top 4 di ogni Prima Divisione).</p>';
        return;
    }
    const fasi = { vincitore: [], finale: [], semifinale: [], quarti: [], gironi: [] };
    data.forEach(t => {
        if (t.fase === 'vincitore') fasi.vincitore.push(t);
        else fasi[t.fase]?.push(t);
    });
    let html = '<div class="champions-grid">';
    const fasiOrdine = [
        { key: 'vincitore', label: '🏆 Vincitore', cls: 'fase-vincitore' },
        { key: 'finale',    label: '🥇 Finale',    cls: 'fase-finale' },
        { key: 'semifinale',label: '🥈 Semifinale',cls: 'fase-semi' },
        { key: 'quarti',    label: '⚽ Quarti',    cls: 'fase-quarti' },
        { key: 'gironi',    label: '📋 Gironi',    cls: 'fase-gironi' },
    ];
    fasiOrdine.forEach(f => {
        const teams = fasi[f.key];
        if (!teams || !teams.length) return;
        html += `<div class="champions-fase ${f.cls}"><div class="fase-titolo">${f.label}</div>`;
        teams.forEach(t => {
            const isMyTeam = t.team_id == player.team_id;
            html += `<div class="champions-team ${isMyTeam ? 'my-champions-team' : ''} ${t.eliminato ? 'elim' : ''}">
                <span>${t.bandiera || ''} ${t.team_nome}</span>
                <span>${'⭐'.repeat(parseInt(t.stelle))} <span class="ovr-badge">${t.ovr}</span></span>
                ${isMyTeam ? '<span class="my-team-badge">TU</span>' : ''}
                ${t.eliminato ? '<span class="elim-badge">Eliminato</span>' : ''}
            </div>`;
        });
        html += '</div>';
    });
    html += '</div>';
    document.getElementById('champions-wrap').innerHTML = html;
}

function switchClassTab(tab) {
    currentClassTab = tab;
    document.querySelectorAll('.class-tab').forEach(b => b.classList.toggle('active', b.onclick.toString().includes(tab)));
    document.getElementById('class-tab-lega').style.display     = tab === 'lega'     ? 'block' : 'none';
    document.getElementById('class-tab-champions').style.display = tab === 'champions' ? 'block' : 'none';
    if (tab === 'champions') {
        api('player.php', { action: 'get' }, 'GET').then(p => renderChampions(p));
    }
}

// ========================
// HELPERS
// ========================
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
    const nomi = ['Nessuna','Campetto Base','Centro Moderno','Centro High-Tech','Academy Personale'];
    return nomi[parseInt(lvl)] || 'Nessuna';
}

function toast(msg, type = '') {
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3500);
}
