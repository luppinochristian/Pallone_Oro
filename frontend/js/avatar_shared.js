/* avatar_shared.js — elementi del volto condivisi tra l'avatar della creazione
 * (app_avatar.js → renderAvatarSVG) e la card giocatore (playercard.js).
 * Le coordinate sono proporzionali alla dimensione s, come nel resto del disegno.
 * Va disegnata PRIMA della bocca, così la bocca resta visibile sopra la barba. */

const FACIAL_HAIR_STYLES = ['none', 'stubble', 'goatee', 'beard', 'mustache'];
const EYEBROW_STYLES = ['thin', 'standard', 'thick', 'arched'];

/**
 * SVG della barba/baffi.
 * @param {string} style  uno di FACIAL_HAIR_STYLES
 * @param {string} color  colore (di norma il colore dei capelli)
 * @param {number} s      dimensione della tela
 * @param {number} cx     coordinata x del centro del volto
 */
/** Mescola due colori esadecimali (t = 0 → a, t = 1 → b). */
function _mixHex(a, b, t) {
    const toRgb = h => { h = h.replace('#', ''); return [0,2,4].map(i => parseInt(h.substr(i, 2), 16)); };
    const [ra, ga, ba] = toRgb(a), [rb, gb, bb] = toRgb(b);
    return '#' + [ra + (rb - ra) * t, ga + (gb - ga) * t, ba + (bb - ba) * t]
        .map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
}

function buildFacialHairSVG(style, color, s, cx) {
    // La barba è un po' più scura dei capelli: con capelli chiari resta leggibile sulla pelle
    const base = /^#[0-9a-fA-F]{6}$/.test(color || '') ? color : '#1a1a1a';
    const c = _mixHex(base, '#2b1a0e', 0.3);
    switch (style) {
        case 'stubble':
            // Ombra leggera di barba di 2-3 giorni sulla mascella
            return `<path d="M${s*0.27} ${s*0.44} Q${s*0.28} ${s*0.66} ${cx} ${s*0.655} Q${s*0.72} ${s*0.66} ${s*0.73} ${s*0.44} Q${s*0.70} ${s*0.52} ${cx} ${s*0.54} Q${s*0.30} ${s*0.52} ${s*0.27} ${s*0.44}Z" fill="${c}" opacity="0.35"/>`;
        case 'beard':
            // Barba piena: copre guance e mento, lascia libera la bocca
            return `<path d="M${s*0.25} ${s*0.42} Q${s*0.25} ${s*0.70} ${cx} ${s*0.69} Q${s*0.75} ${s*0.70} ${s*0.75} ${s*0.42} Q${s*0.71} ${s*0.52} ${cx} ${s*0.53} Q${s*0.29} ${s*0.52} ${s*0.25} ${s*0.42}Z" fill="${c}" opacity="0.92"/>`;
        case 'goatee':
            // Pizzetto: solo sotto il labbro
            return `<path d="M${s*0.45} ${s*0.58} Q${cx} ${s*0.60} ${s*0.55} ${s*0.58} Q${s*0.56} ${s*0.68} ${cx} ${s*0.685} Q${s*0.44} ${s*0.68} ${s*0.45} ${s*0.58}Z" fill="${c}" opacity="0.92"/>`;
        case 'mustache':
            // Baffi a ali: estremità rialzate, centro leggermente più basso, tra naso e labbro
            return `<path d="M${s*0.39} ${s*0.528} Q${s*0.44} ${s*0.506} ${cx} ${s*0.522} Q${s*0.56} ${s*0.506} ${s*0.61} ${s*0.528} Q${s*0.59} ${s*0.549} ${cx} ${s*0.541} Q${s*0.41} ${s*0.549} ${s*0.39} ${s*0.528}Z" fill="${c}" opacity="0.92"/>`;
        default:
            return '';
    }
}

/**
 * Sopracciglia. Coordinate proporzionali a s; il volto è simmetrico su s/2.
 * 'standard' coincide con il disegno originale. Stile sconosciuto → 'standard'.
 */
function buildEyebrowsSVG(style, color, s) {
    const st = EYEBROW_STYLES.includes(style) ? style : 'standard';
    const c = /^#[0-9a-fA-F]{6}$/.test(color || '') ? color : '#555555';
    const geo = {
        thin:     { y: 0.335, peak: 0.305, w: 0.009 },
        standard: { y: 0.335, peak: 0.305, w: 0.017 },
        thick:    { y: 0.330, peak: 0.315, w: 0.030 },
        arched:   { y: 0.340, peak: 0.280, w: 0.017 },
    }[st];
    const arc = (x0, xc, x1) => `M${s*x0} ${s*geo.y} Q${s*xc} ${s*geo.peak} ${s*x1} ${s*geo.y}`;
    const stroke = `stroke="${c}" stroke-width="${(s*geo.w).toFixed(2)}" fill="none" stroke-linecap="round"`;
    return `<path d="${arc(0.34, 0.41, 0.47)}" ${stroke}/><path d="${arc(0.53, 0.59, 0.66)}" ${stroke}/>`;
}

/**
 * Lentiggini: piccoli punti sulle guance e sul ponte del naso.
 * Colore derivato dalla pelle (più scuro). cx è il centro del volto (s/2).
 */
function buildFrecklesSVG(skin, s, cx) {
    const base = /^#[0-9a-fA-F]{6}$/.test(skin || '') ? skin : '#C68642';
    const c = _mixHex(base, '#6b3a1e', 0.45);
    const spots = [
        [-0.16, 0.45], [-0.12, 0.47], [-0.08, 0.455], [-0.14, 0.49], [-0.10, 0.50], [-0.03, 0.43],
        [ 0.03, 0.43], [ 0.08, 0.455], [ 0.12, 0.47], [ 0.16, 0.45], [ 0.14, 0.49], [ 0.10, 0.50],
    ];
    const r = Math.max(0.5, s * 0.011).toFixed(2);
    return `<g fill="${c}" opacity="0.6">` +
        spots.map(([dx, dy]) => `<circle cx="${(cx + dx*s).toFixed(2)}" cy="${(dy*s).toFixed(2)}" r="${r}"/>`).join('') +
        `</g>`;
}

// Colori maglia (stessa lista di backend/config/appearance.php: KIT_COLORS).
const KIT_COLORS = ['#1565c0', '#c62828', '#2e7d32', '#eeeeee', '#212121', '#f9a825', '#6a1b9a', '#ef6c00'];
const KIT_KEYS = ['kit_blu', 'kit_rosso', 'kit_verde', 'kit_bianco', 'kit_nero', 'kit_giallo', 'kit_viola', 'kit_arancio'];

/** Colore effettivo della maglia: quello scelto, altrimenti il default del genere. */
function kitShirtColor(kit, gender) {
    return /^#[0-9a-fA-F]{6}$/.test(kit || '') ? kit : (gender === 'female' ? '#c0397a' : '#1565c0');
}

