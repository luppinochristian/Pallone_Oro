/* app_avatar.js — avatar SVG, selettori colore e capelli.
 * Estratto da app.js (refactor): nessuna logica modificata.
 * Caricato in ordine da index.html. */

function buildHairSVG(style, hc, s) {
    // Proporzioni allineate alla nuova testa: cy=0.40, ry=0.24 → top=0.16, sides=0.16-0.64
    const cx = s / 2;
    if (style === 'bald' || !hc) return '';
    switch (style) {
        case 'short':
            // Copertura top+tempie, niente che scende oltre le orecchie
            return `<path d="M${s*0.26} ${s*0.30}\n                Q${s*0.24} ${s*0.13} ${cx} ${s*0.11}\n                Q${s*0.76} ${s*0.13} ${s*0.74} ${s*0.30}\n                Q${s*0.68} ${s*0.22} ${s*0.60} ${s*0.24}\n                Q${cx} ${s*0.20} ${s*0.40} ${s*0.24}\n                Q${s*0.32} ${s*0.22} ${s*0.26} ${s*0.30}Z"\n                fill="${hc}"/>`;
        case 'medium':
            return `<path d="M${s*0.24} ${s*0.34}\n                Q${s*0.22} ${s*0.15} ${s*0.28} ${s*0.11}\n                Q${cx} ${s*0.07} ${s*0.72} ${s*0.11}\n                Q${s*0.78} ${s*0.15} ${s*0.76} ${s*0.34}\n                Q${s*0.70} ${s*0.26} ${s*0.62} ${s*0.28}\n                Q${cx} ${s*0.24} ${s*0.38} ${s*0.28}\n                Q${s*0.30} ${s*0.26} ${s*0.24} ${s*0.34}Z" fill="${hc}"/>\n                <path d="M${s*0.22} ${s*0.32} Q${s*0.18} ${s*0.42} ${s*0.20} ${s*0.51} Q${s*0.24} ${s*0.53} ${s*0.26} ${s*0.44} Q${s*0.26} ${s*0.36} ${s*0.22} ${s*0.32}Z" fill="${hc}"/>\n                <path d="M${s*0.78} ${s*0.32} Q${s*0.82} ${s*0.42} ${s*0.80} ${s*0.51} Q${s*0.76} ${s*0.53} ${s*0.74} ${s*0.44} Q${s*0.74} ${s*0.36} ${s*0.78} ${s*0.32}Z" fill="${hc}"/>`;
        case 'long':
            return `<path d="M${s*0.26} ${s*0.32}\n                Q${s*0.24} ${s*0.13} ${s*0.28} ${s*0.09}\n                Q${cx} ${s*0.05} ${s*0.72} ${s*0.09}\n                Q${s*0.76} ${s*0.13} ${s*0.74} ${s*0.32}\n                Q${s*0.68} ${s*0.24} ${s*0.60} ${s*0.26}\n                Q${cx} ${s*0.22} ${s*0.40} ${s*0.26}\n                Q${s*0.32} ${s*0.24} ${s*0.26} ${s*0.32}Z" fill="${hc}"/>\n                <path d="M${s*0.20} ${s*0.34} C${s*0.14} ${s*0.46} ${s*0.12} ${s*0.58} ${s*0.14} ${s*0.70} C${s*0.16} ${s*0.80} ${s*0.20} ${s*0.86} ${s*0.26} ${s*0.88} C${s*0.30} ${s*0.90} ${s*0.32} ${s*0.84} ${s*0.30} ${s*0.78} C${s*0.27} ${s*0.68} ${s*0.25} ${s*0.56} ${s*0.25} ${s*0.44} Q${s*0.24} ${s*0.38} ${s*0.20} ${s*0.34}Z" fill="${hc}"/>\n                <path d="M${s*0.80} ${s*0.34} C${s*0.86} ${s*0.46} ${s*0.88} ${s*0.58} ${s*0.86} ${s*0.70} C${s*0.84} ${s*0.80} ${s*0.80} ${s*0.86} ${s*0.74} ${s*0.88} C${s*0.70} ${s*0.90} ${s*0.68} ${s*0.84} ${s*0.70} ${s*0.78} C${s*0.73} ${s*0.68} ${s*0.75} ${s*0.56} ${s*0.75} ${s*0.44} Q${s*0.76} ${s*0.38} ${s*0.80} ${s*0.34}Z" fill="${hc}"/>`;
        case 'curly':
            return `<path d="M${s*0.28} ${s*0.32}\n                Q${s*0.22} ${s*0.20} ${s*0.28} ${s*0.13}\n                Q${cx} ${s*0.05} ${s*0.72} ${s*0.13}\n                Q${s*0.78} ${s*0.20} ${s*0.72} ${s*0.32}\n                Q${s*0.66} ${s*0.24} ${cx} ${s*0.22}\n                Q${s*0.34} ${s*0.24} ${s*0.28} ${s*0.32}Z" fill="${hc}"/>\n                <circle cx="${s*0.22}" cy="${s*0.28}" r="${s*0.08}" fill="${hc}"/>\n                <circle cx="${s*0.78}" cy="${s*0.28}" r="${s*0.08}" fill="${hc}"/>\n                <circle cx="${s*0.32}" cy="${s*0.12}" r="${s*0.07}" fill="${hc}"/>\n                <circle cx="${s*0.68}" cy="${s*0.12}" r="${s*0.07}" fill="${hc}"/>\n                <circle cx="${cx}" cy="${s*0.08}" r="${s*0.07}" fill="${hc}"/>\n                <circle cx="${s*0.44}" cy="${s*0.10}" r="${s*0.055}" fill="${hc}"/>\n                <circle cx="${s*0.56}" cy="${s*0.10}" r="${s*0.055}" fill="${hc}"/>`;
        case 'afro':
            return `<ellipse cx="${cx}" cy="${s*0.18}" rx="${s*0.30}" ry="${s*0.18}" fill="${hc}"/>\n                <ellipse cx="${s*0.20}" cy="${s*0.24}" rx="${s*0.10}" ry="${s*0.12}" fill="${hc}"/>\n                <ellipse cx="${s*0.80}" cy="${s*0.24}" rx="${s*0.10}" ry="${s*0.12}" fill="${hc}"/>\n                <ellipse cx="${s*0.26}" cy="${s*0.34}" rx="${s*0.07}" ry="${s*0.08}" fill="${hc}"/>\n                <ellipse cx="${s*0.74}" cy="${s*0.34}" rx="${s*0.07}" ry="${s*0.08}" fill="${hc}"/>`;
        case 'mohawk':
            return `<path d="M${s*0.42} ${s*0.32}\n                C${s*0.40} ${s*0.22} ${s*0.42} ${s*0.07} ${cx} ${s*0.02}\n                C${s*0.58} ${s*0.07} ${s*0.60} ${s*0.22} ${s*0.58} ${s*0.32}\n                Q${cx} ${s*0.36} ${s*0.42} ${s*0.32}Z" fill="${hc}"/>`;
        case 'bun':
            return `<path d="M${s*0.26} ${s*0.30}\n                Q${s*0.24} ${s*0.13} ${s*0.28} ${s*0.11}\n                Q${cx} ${s*0.07} ${s*0.72} ${s*0.11}\n                Q${s*0.76} ${s*0.13} ${s*0.74} ${s*0.30}\n                Q${s*0.68} ${s*0.22} ${s*0.60} ${s*0.24}\n                Q${cx} ${s*0.20} ${s*0.40} ${s*0.24}\n                Q${s*0.32} ${s*0.22} ${s*0.26} ${s*0.30}Z" fill="${hc}"/>\n                <circle cx="${cx}" cy="${s*0.06}" r="${s*0.10}" fill="${hc}"/>`;
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

function renderAvatarSVG(skinVal, hairStyle, eyeColor, gender, size = 120, hairColor = null, facialHair = 'none', eyebrowStyle = 'standard', freckles = 0, kitColor = null) {
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
    const skinShirt = kitShirtColor(kitColor, gender);

    // Proporzioni: testa più compatta, niente rect-collo separato
    // Testa: cy=0.40, ry=0.24 → top=0.16, bottom=0.64 (niente spazio doppio mento)
    // Collo+spalle: path continuo dalla base della testa
    // Naso: piccolo hint triangolare
    const headCY = s*0.40, headRX = s*0.24, headRY = s*0.24;
    const eyeY   = s*0.38;
    const noseY  = s*0.49;
    const mouthY = s*0.56;  // bocca più vicina al centro → meno spazio sotto
    const chinY  = s*0.64;  // = bottom della testa

    // uid to avoid duplicate clipPath ids when multiple avatars on page
    const _uid = s + '_' + Math.floor(Math.random()*9999);
    return `<svg viewBox="0 0 ${s} ${s}" width="${s}" height="${s}" xmlns="http://www.w3.org/2000/svg" style="overflow:hidden;display:block">
        <defs>
          <clipPath id="hairClip-${_uid}">
            <!-- Allow hair above head + clip to sides so no stray strands on bg -->
            <rect x="${cx - s*0.38}" y="0" width="${s*0.76}" height="${headCY + headRY*0.3}"/>
          </clipPath>
          <clipPath id="avatarBodyClip-${_uid}">
            <rect x="0" y="0" width="${s}" height="${s}"/>
          </clipPath>
        </defs>
        <!-- Spalle / maglietta -->
        <path d="M${s*0.10} ${s*1.00} L${s*0.10} ${s*0.80} Q${cx} ${s*0.70} ${s*0.90} ${s*0.80} L${s*0.90} ${s*1.00}Z" fill="${skinShirt}"/>
        <path d="M${s*0.10} ${s*0.80} Q${cx} ${s*0.70} ${s*0.90} ${s*0.80}" stroke="${skinShirt}" stroke-width="${s*0.01}" fill="none"/>
        <!-- Collo: path continuo senza stacco -->
        <path d="M${s*0.43} ${chinY} L${s*0.40} ${s*0.78} Q${cx} ${s*0.76} ${s*0.60} ${s*0.78} L${s*0.57} ${chinY}Z" fill="${skin}"/>
        <!-- Testa: forma ellittica con chin definito (nessun doppio mento) -->
        <ellipse cx="${cx}" cy="${headCY}" rx="${headRX}" ry="${headRY}" fill="${skin}"/>
        <!-- Leggera ombra laterale sul viso -->
        <ellipse cx="${s*0.74}" cy="${headCY}" rx="${s*0.07}" ry="${headRY*0.85}" fill="${skinDark}" opacity="0.15"/>
        <!-- Capelli clippati: nessuna ciocca fuori dalla testa -->
        <g clip-path="url(#hairClip-${_uid})">${hairSVG}</g>
        <!-- Sopracciglia -->
        ${buildEyebrowsSVG(eyebrowStyle, hc, s)}
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
        <!-- Lentiggini (sotto gli occhi, prima della barba) -->
        ${Number(freckles) === 1 ? buildFrecklesSVG(skin, s, cx) : ''}
        <!-- Barba / baffi (sotto la bocca, così la bocca resta visibile) -->
        ${buildFacialHairSVG(facialHair, hc, s, cx)}
        <!-- Bocca: sorriso naturale -->
        <path d="M${s*0.41} ${mouthY} Q${cx} ${mouthY+s*0.035} ${s*0.59} ${mouthY}" stroke="#c0706c" stroke-width="${s*0.013}" fill="none" stroke-linecap="round"/>
    </svg>`;
}

// ── SKIN TONE PICKER ──
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

// Attivazione da tastiera per gli swatch (role="button"): Invio o Spazio = click
const KEY_ACTIVATE = "if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click()}";

// Valori di partenza della personalizzazione (usati da Ripristina e alla prima apertura)
const DEFAULT_APPEARANCE = { skin: '#C68642', hair: 'short', hairColor: '#1a1a1a', eye: '#5C3317', facial: 'none', eyebrow: 'standard', freckles: 0, kit: null };

// Colori capelli plausibili per un giocatore giovane (Casuale non sceglie bianco/grigio estremo)
const RANDOM_HAIR_COLORS = ['#1a1a1a','#2d1a0e','#3d2b1f','#5c3317','#8B4513','#A0522D','#C4893E','#D4A017','#F5C842'];

function buildSkinTonePicker() {
    const wrap = document.getElementById('skin-tone-picker');
    if (!wrap) return;
    wrap.innerHTML = SKIN_TONES.map(t => {
        const isActive = selectedSkin === t.hex;
        return `<div class="skin-tone-swatch ${isActive ? 'active' : ''}"
            role="button" tabindex="0" aria-label="${t.label}" aria-pressed="${isActive}"
            title="${t.label}" style="background:${t.hex}"
            onkeydown="${KEY_ACTIVATE}"
            onclick="selectSkinTone('${t.hex}',this)"></div>`;
    }).join('');
}

function selectSkinTone(hex, el) {
    selectedSkin = hex;
    document.querySelectorAll('.skin-tone-swatch').forEach(s => { s.classList.remove('active'); s.setAttribute('aria-pressed', 'false'); });
    el.classList.add('active'); el.setAttribute('aria-pressed', 'true');
    updateAvatar();
}

// ── HAIR PICKER ──
function buildHairPicker() {
    const styleEl = document.getElementById('hair-style-picker');
    if (styleEl) {
        styleEl.innerHTML = HAIR_STYLE_DEFS.map(h => {
            const isActive = h.id === selectedHairStyle;
            const label = (typeof h.label === 'object') ? (h.label[currentLang] || h.label.en || h.label.it) : h.label;
            return `<div class="hair-swatch ${isActive ? 'active' : ''}"
                data-val="${h.id}" title="${label}"
                role="button" tabindex="0" aria-label="${label}" aria-pressed="${isActive}"
                onkeydown="${KEY_ACTIVATE}"
                onclick="selectHairStyle('${h.id}', this)">
                ${hairStyleSwatchSVG(h.id, 44)}
                <span class="hair-swatch-label">${label}</span>
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
        <span class="cp-open-label">${_t('color_hair_label')}</span>`;
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
    document.querySelectorAll('#hair-style-picker .hair-swatch').forEach(s => { s.classList.remove('active'); s.setAttribute('aria-pressed', 'false'); });
    el.classList.add('active'); el.setAttribute('aria-pressed', 'true');
    updateAvatar();
}

// ── BARBA E BAFFI ──
function buildFacialHairPicker() {
    const el = document.getElementById('facial-hair-picker');
    if (!el) return;
    el.innerHTML = FACIAL_HAIR_STYLES.map(style => {
        const isActive = style === selectedFacialHair;
        const label = _t('facial_' + style);
        return `<div class="hair-swatch ${isActive ? 'active' : ''}"
            data-val="${style}" title="${label}"
            role="button" tabindex="0" aria-label="${label}" aria-pressed="${isActive}"
            onkeydown="${KEY_ACTIVATE}"
            onclick="selectFacialHair('${style}', this)">
            ${renderAvatarSVG(selectedSkin, 'short', selectedEye, _ccGender || 'male', 44, selectedHairColor, style, selectedEyebrowStyle, selectedFreckles, selectedKit)}
            <span class="hair-swatch-label">${label}</span>
        </div>`;
    }).join('');
}

function selectFacialHair(style, el) {
    selectedFacialHair = FACIAL_HAIR_STYLES.includes(style) ? style : 'none';
    _markSwatch('#facial-hair-picker', el);
    updateAvatar();
}

// ── SOPRACCIGLIA E LENTIGGINI ──
// Evidenzia lo swatch scelto dentro un selettore (stesso schema degli altri).
function _markSwatch(selector, el) {
    document.querySelectorAll(selector + ' .hair-swatch').forEach(s => { s.classList.remove('active'); s.setAttribute('aria-pressed', 'false'); });
    if (el) { el.classList.add('active'); el.setAttribute('aria-pressed', 'true'); }
}

function buildEyebrowPicker() {
    const el = document.getElementById('eyebrow-picker');
    if (!el) return;
    el.innerHTML = EYEBROW_STYLES.map(style => {
        const isActive = style === selectedEyebrowStyle;
        const label = _t('eyebrow_' + style);
        return `<div class="hair-swatch ${isActive ? 'active' : ''}"
            data-val="${style}" title="${label}"
            role="button" tabindex="0" aria-label="${label}" aria-pressed="${isActive}"
            onkeydown="${KEY_ACTIVATE}"
            onclick="selectEyebrowStyle('${style}', this)">
            ${renderAvatarSVG(selectedSkin, 'short', selectedEye, _ccGender || 'male', 44, selectedHairColor, selectedFacialHair, style, selectedFreckles, selectedKit)}
            <span class="hair-swatch-label">${label}</span>
        </div>`;
    }).join('');
}

function selectEyebrowStyle(style, el) {
    selectedEyebrowStyle = EYEBROW_STYLES.includes(style) ? style : 'standard';
    _markSwatch('#eyebrow-picker', el);
    updateAvatar();
}

function buildFrecklesPicker() {
    const el = document.getElementById('freckles-picker');
    if (!el) return;
    el.innerHTML = [{ v: 0, label: _t('freckles_off') }, { v: 1, label: _t('freckles_on') }].map(o => {
        const isActive = o.v === selectedFreckles;
        return `<div class="hair-swatch ${isActive ? 'active' : ''}"
            data-val="${o.v}" title="${o.label}"
            role="button" tabindex="0" aria-label="${o.label}" aria-pressed="${isActive}"
            onkeydown="${KEY_ACTIVATE}"
            onclick="selectFreckles(${o.v}, this)">
            ${renderAvatarSVG(selectedSkin, 'short', selectedEye, _ccGender || 'male', 44, selectedHairColor, selectedFacialHair, selectedEyebrowStyle, o.v, selectedKit)}
            <span class="hair-swatch-label">${o.label}</span>
        </div>`;
    }).join('');
}

function selectFreckles(v, el) {
    selectedFreckles = v === 1 ? 1 : 0;
    _markSwatch('#freckles-picker', el);
    updateAvatar();
}

// ── MAGLIA ──
function buildKitPicker() {
    const el = document.getElementById('kit-picker');
    if (!el) return;
    el.innerHTML = KIT_COLORS.map((hex, i) => {
        const isActive = hex === selectedKit;
        const label = _t(KIT_KEYS[i]);
        return `<button type="button" class="kit-swatch ${isActive ? 'active' : ''}"
            style="background:${hex}" data-val="${hex}"
            title="${label}" aria-label="${label}" aria-pressed="${isActive}"
            onclick="selectKit('${hex}', this)"></button>`;
    }).join('');
}

function selectKit(hex, el) {
    selectedKit = KIT_COLORS.includes(hex) ? hex : null;
    document.querySelectorAll('#kit-picker .kit-swatch').forEach(s => { s.classList.remove('active'); s.setAttribute('aria-pressed', 'false'); });
    if (el) { el.classList.add('active'); el.setAttribute('aria-pressed', 'true'); }
    updateAvatar();
}

// Ridisegna tutti i selettori dai valori correnti
function rebuildAppearancePickers() {
    buildSkinTonePicker();
    buildHairPicker();
    buildEyePicker();
    buildFacialHairPicker();
    buildEyebrowPicker();
    buildFrecklesPicker();
    buildKitPicker();
    updateAvatar();
}

// 🎲 Casuale: sceglie un aspetto completo
function randomizeAppearance() {
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];
    selectedSkin       = pick(SKIN_TONES).hex;
    selectedHairStyle  = pick(HAIR_STYLE_DEFS).id;
    selectedHairColor  = pick(RANDOM_HAIR_COLORS);
    selectedEye        = pick(EYE_PRESETS);
    // Barba: rasato più spesso, per non far sembrare ogni giocatore barbuto
    selectedFacialHair = pick(['none','none','stubble','goatee','beard','mustache']);
    selectedEyebrowStyle = pick(EYEBROW_STYLES);
    selectedFreckles   = Math.random() < 0.3 ? 1 : 0; // lentiggini: meno frequenti
    selectedKit        = pick(KIT_COLORS);
    rebuildAppearancePickers();
}

// ↺ Ripristina: torna all'aspetto di partenza
function resetAppearance() {
    selectedSkin       = DEFAULT_APPEARANCE.skin;
    selectedHairStyle  = DEFAULT_APPEARANCE.hair;
    selectedHairColor  = DEFAULT_APPEARANCE.hairColor;
    selectedEye        = DEFAULT_APPEARANCE.eye;
    selectedFacialHair = DEFAULT_APPEARANCE.facial;
    selectedEyebrowStyle = DEFAULT_APPEARANCE.eyebrow;
    selectedFreckles   = DEFAULT_APPEARANCE.freckles;
    selectedKit        = DEFAULT_APPEARANCE.kit;
    rebuildAppearancePickers();
}

function updateAvatar() {
    const gender = _ccGender || document.getElementById('c-gender')?.value || 'male';
    const el = document.getElementById('avatar-preview');
    if (el) el.innerHTML = renderAvatarSVG(selectedSkin, selectedHairStyle, selectedEye, gender, 110, selectedHairColor, selectedFacialHair, selectedEyebrowStyle, selectedFreckles, selectedKit);
}

// ── EYE PICKER ──
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
        <span class="cp-open-label">${_t('color_eye_label')}</span>`;
    requestAnimationFrame(() => {
        const [h,s,v] = hexToHSV(selectedEye);
        drawGradientCanvas('cp-eye-grad', h);
        drawHueSlider('cp-eye-hue');
        updateGradCursor('eye', s, 100 - v);
        updateHueCursor('eye', (h / 360) * 100);
    });
}

// ── CUSTOM COLOR PICKER (shared) ──
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

// ── EXIT DROPDOWN ──

