/**
 * ============================================================
 * playercard.js — Generatore di card giocatore in SVG
 * ============================================================
 * Genera card visive del giocatore in formato SVG, ottimizzate
 * per la condivisione sui social e la visualizzazione in-game.
 *
 * TEMI DISPONIBILI:
 *  - gold: sfondo scuro con bordi dorati (giocatori top)
 *  - silver: grigi eleganti (giocatori medi)
 *  - elite: gradiente violetto premium (leggende)
 *  - retro: stile vintage anni '80 (Easter egg)
 *
 * ELEMENTI DELLA CARD:
 *  - Nome giocatore e soprannome
 *  - Overall in grande con colore dinamico
 *  - 6 attributi principali con barre di avanzamento
 *  - Squadra, lega e nazione corrente
 *  - Stagione e anno di carriera
 *  - Badge trofei e Palloni d'Oro
 *
 * API pubblica:
 *  - generate(player, theme): restituisce stringa SVG
 *  - download(player, theme): scarica la card come PNG
 *  - renderInContainer(el, player, theme): disegna nel DOM
 *
 * Esposto come oggetto globale GS_PlayerCard.
 * ============================================================
 */

const GS_PlayerCard = (() => {

    // ── Card themes ───────────────────────────────────────────────────────────
    const THEMES = {
        gold: {
            bg1: '#0a0e1a', bg2: '#1a1a2e',
            accent: '#FFD700', accent2: '#B8860B',
            text: '#fff', textDim: '#94a3b8',
        },
        silver: {
            bg1: '#111827', bg2: '#1f2937',
            accent: '#C0C0C0', accent2: '#808080',
            text: '#fff', textDim: '#9ca3af',
        },
        elite: {
            bg1: '#0f0a1e', bg2: '#1a0a2e',
            accent: '#a855f7', accent2: '#7c3aed',
            text: '#fff', textDim: '#c4b5fd',
        },
        fire: {
            bg1: '#1a0a00', bg2: '#2a1000',
            accent: '#f97316', accent2: '#ea580c',
            text: '#fff', textDim: '#fed7aa',
        },
        ice: {
            bg1: '#0a1a2a', bg2: '#0a2a3a',
            accent: '#38bdf8', accent2: '#0ea5e9',
            text: '#fff', textDim: '#bae6fd',
        },
        legend: {
            bg1: '#0a0500', bg2: '#150a00',
            accent: '#FFD700', accent2: '#FF6B00',
            text: '#fff', textDim: '#fbbf24',
        },
    };

    // ── Pick theme based on overall ───────────────────────────────────────────
    function pickTheme(overall, palloneDoro) {
        palloneDoro = palloneDoro || 0;
        if (palloneDoro >= 3) return THEMES.legend;
        if (overall >= 115)   return THEMES.elite;
        if (overall >= 100)   return THEMES.gold;
        if (overall >= 90)    return THEMES.fire;
        if (overall >= 80)    return THEMES.ice;
        return THEMES.silver;
    }

    // ── Overall color ─────────────────────────────────────────────────────────
    function ovrColor(ovr) {
        if (ovr >= 115) return '#a855f7';
        if (ovr >= 100) return '#FFD700';
        if (ovr >= 90)  return '#10b981';
        if (ovr >= 80)  return '#3b82f6';
        if (ovr >= 70)  return '#f59e0b';
        return '#6b7280';
    }

    // ── 2-column stat bar helper ──────────────────────────────────────────────
    function statBar2col(x, y, label, value, max, color, w) {
        const pct  = Math.min(value / max, 1);
        const barW = Math.max(4, Math.round(w * pct));
        const tc   = (typeof color === 'string' && color.startsWith('#')) ? color : '#e8ecf4';
        return `<text x="${x}" y="${y}" font-size="9" fill="#7b8ba5" font-weight="600" letter-spacing="0.5">${label}</text>` +
               `<text x="${x + w}" y="${y}" font-size="10" fill="${tc}" font-weight="900" text-anchor="end">${value}</text>` +
               `<rect x="${x}" y="${y + 4}" width="${w}" height="5" rx="2.5" fill="rgba(255,255,255,0.07)"/>` +
               `<rect x="${x}" y="${y + 4}" width="${barW}" height="5" rx="2.5" fill="${color}" opacity="0.95"/>`;
    }

    // ── Build hair SVG for card (mirrors app.js buildHairSVG logic) ──────────
    function _buildCardHair(style, hc, s) {
        const cx = s / 2;
        if (style === 'bald' || !hc) return '';
        switch (style) {
            case 'short':
                return `<path d="M${s*.26} ${s*.30} Q${s*.24} ${s*.13} ${cx} ${s*.11} Q${s*.76} ${s*.13} ${s*.74} ${s*.30} Q${s*.68} ${s*.22} ${s*.60} ${s*.24} Q${cx} ${s*.20} ${s*.40} ${s*.24} Q${s*.32} ${s*.22} ${s*.26} ${s*.30}Z" fill="${hc}"/>`;
            case 'medium':
                return `<path d="M${s*.24} ${s*.34} Q${s*.22} ${s*.15} ${s*.28} ${s*.11} Q${cx} ${s*.07} ${s*.72} ${s*.11} Q${s*.78} ${s*.15} ${s*.76} ${s*.34} Q${s*.70} ${s*.26} ${s*.62} ${s*.28} Q${cx} ${s*.24} ${s*.38} ${s*.28} Q${s*.30} ${s*.26} ${s*.24} ${s*.34}Z" fill="${hc}"/><path d="M${s*.22} ${s*.32} Q${s*.18} ${s*.42} ${s*.20} ${s*.51} Q${s*.24} ${s*.53} ${s*.26} ${s*.44} Q${s*.26} ${s*.36} ${s*.22} ${s*.32}Z" fill="${hc}"/><path d="M${s*.78} ${s*.32} Q${s*.82} ${s*.42} ${s*.80} ${s*.51} Q${s*.76} ${s*.53} ${s*.74} ${s*.44} Q${s*.74} ${s*.36} ${s*.78} ${s*.32}Z" fill="${hc}"/>`;
            case 'long':
                return `<path d="M${s*.26} ${s*.32} Q${s*.24} ${s*.13} ${s*.28} ${s*.09} Q${cx} ${s*.05} ${s*.72} ${s*.09} Q${s*.76} ${s*.13} ${s*.74} ${s*.32} Q${s*.68} ${s*.24} ${s*.60} ${s*.26} Q${cx} ${s*.22} ${s*.40} ${s*.26} Q${s*.32} ${s*.24} ${s*.26} ${s*.32}Z" fill="${hc}"/><path d="M${s*.20} ${s*.34} C${s*.14} ${s*.46} ${s*.12} ${s*.58} ${s*.14} ${s*.70} C${s*.16} ${s*.80} ${s*.20} ${s*.86} ${s*.26} ${s*.88} C${s*.30} ${s*.90} ${s*.32} ${s*.84} ${s*.30} ${s*.78} C${s*.27} ${s*.68} ${s*.25} ${s*.56} ${s*.25} ${s*.44} Q${s*.24} ${s*.38} ${s*.20} ${s*.34}Z" fill="${hc}"/><path d="M${s*.80} ${s*.34} C${s*.86} ${s*.46} ${s*.88} ${s*.58} ${s*.86} ${s*.70} C${s*.84} ${s*.80} ${s*.80} ${s*.86} ${s*.74} ${s*.88} C${s*.70} ${s*.90} ${s*.68} ${s*.84} ${s*.70} ${s*.78} C${s*.73} ${s*.68} ${s*.75} ${s*.56} ${s*.75} ${s*.44} Q${s*.76} ${s*.38} ${s*.80} ${s*.34}Z" fill="${hc}"/>`;
            case 'curly':
                return `<path d="M${s*.28} ${s*.32} Q${s*.22} ${s*.20} ${s*.28} ${s*.13} Q${cx} ${s*.05} ${s*.72} ${s*.13} Q${s*.78} ${s*.20} ${s*.72} ${s*.32} Q${s*.66} ${s*.24} ${cx} ${s*.22} Q${s*.34} ${s*.24} ${s*.28} ${s*.32}Z" fill="${hc}"/><circle cx="${s*.22}" cy="${s*.28}" r="${s*.08}" fill="${hc}"/><circle cx="${s*.78}" cy="${s*.28}" r="${s*.08}" fill="${hc}"/><circle cx="${s*.32}" cy="${s*.12}" r="${s*.07}" fill="${hc}"/><circle cx="${s*.68}" cy="${s*.12}" r="${s*.07}" fill="${hc}"/><circle cx="${cx}" cy="${s*.08}" r="${s*.07}" fill="${hc}"/><circle cx="${s*.44}" cy="${s*.10}" r="${s*.055}" fill="${hc}"/><circle cx="${s*.56}" cy="${s*.10}" r="${s*.055}" fill="${hc}"/>`;
            case 'afro':
                return `<ellipse cx="${cx}" cy="${s*.18}" rx="${s*.30}" ry="${s*.18}" fill="${hc}"/><ellipse cx="${s*.20}" cy="${s*.24}" rx="${s*.10}" ry="${s*.12}" fill="${hc}"/><ellipse cx="${s*.80}" cy="${s*.24}" rx="${s*.10}" ry="${s*.12}" fill="${hc}"/><ellipse cx="${s*.26}" cy="${s*.34}" rx="${s*.07}" ry="${s*.08}" fill="${hc}"/><ellipse cx="${s*.74}" cy="${s*.34}" rx="${s*.07}" ry="${s*.08}" fill="${hc}"/>`;
            case 'mohawk':
                return `<path d="M${s*.42} ${s*.32} C${s*.40} ${s*.22} ${s*.42} ${s*.07} ${cx} ${s*.02} C${s*.58} ${s*.07} ${s*.60} ${s*.22} ${s*.58} ${s*.32} Q${cx} ${s*.36} ${s*.42} ${s*.32}Z" fill="${hc}"/>`;
            case 'bun':
                return `<path d="M${s*.26} ${s*.30} Q${s*.24} ${s*.13} ${s*.28} ${s*.11} Q${cx} ${s*.07} ${s*.72} ${s*.11} Q${s*.76} ${s*.13} ${s*.74} ${s*.30} Q${s*.68} ${s*.22} ${s*.60} ${s*.24} Q${cx} ${s*.20} ${s*.40} ${s*.24} Q${s*.32} ${s*.22} ${s*.26} ${s*.30}Z" fill="${hc}"/><circle cx="${cx}" cy="${s*.06}" r="${s*.10}" fill="${hc}"/>`;
            default: return '';
        }
    }

    // ── Face SVG — mirrors app.js renderAvatarSVG proportions exactly ─────────
    function generateFaceSVG(player, cx, cy) {
        const skinMap = {
            light: '#FDDBB4', medium_light: '#E8B88A', medium: '#C68642',
            medium_dark: '#8D5524', dark: '#3B1A08',
        };
        const skin  = skinMap[player.skin_color] || player.skin_color || '#C68642';
        const hc    = player.hair_color || '#1a1a1a';
        const eye   = player.eye_color  || '#5C3317';
        const gender = player.gender || 'male';
        const skinShirt = gender === 'female' ? '#c0397a' : '#1565c0';

        // shade helper
        const hexToRgb = h => { h=h.replace('#',''); return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]; };
        const shade = (h,d) => { const [r,g,b]=hexToRgb(h||'#C68642'); return '#'+[r+d,g+d,b+d].map(v=>'0'+Math.max(0,Math.min(255,v)).toString(16)).map(s=>s.slice(-2)).join(''); };
        const skinDark = shade(skin, -35);
        const noseStroke = skinDark;

        // use same proportions as renderAvatarSVG — canvas size 140, centred at cx,cy
        const s = 140;
        const ox = cx - s/2, oy = cy - s/2; // offset to place within card SVG
        const headCY = s*0.40, headRX = s*0.24, headRY = s*0.24;
        const eyeY   = s*0.38;
        const noseY  = s*0.49;
        const mouthY = s*0.56;
        const chinY  = s*0.64;
        const cxL    = s/2; // local cx

        // hair style key
        const rawStyle = player.skin_hair || 'short';
        const styleKey = rawStyle.split('_')[0];
        const hairSVG  = _buildCardHair(styleKey, styleKey === 'bald' ? null : hc, s);

        return `<g transform="translate(${ox},${oy})">
  <defs>
    <clipPath id="cardHairClip">
      <rect x="${cxL - s*0.38}" y="0" width="${s*0.76}" height="${headCY + headRY*0.3}"/>
    </clipPath>
  </defs>
  <!-- Shirt/shoulders -->
  <path d="M${s*.10} ${s} L${s*.10} ${s*.80} Q${cxL} ${s*.70} ${s*.90} ${s*.80} L${s*.90} ${s}Z" fill="${skinShirt}"/>
  <!-- Neck -->
  <path d="M${s*.43} ${chinY} L${s*.40} ${s*.78} Q${cxL} ${s*.76} ${s*.60} ${s*.78} L${s*.57} ${chinY}Z" fill="${skin}"/>
  <!-- Head -->
  <ellipse cx="${cxL}" cy="${headCY}" rx="${headRX}" ry="${headRY}" fill="${skin}"/>
  <!-- Side shadow -->
  <ellipse cx="${s*.74}" cy="${headCY}" rx="${s*.07}" ry="${headRY*.85}" fill="${skinDark}" opacity="0.15"/>
  <!-- Hair clipped -->
  <g clip-path="url(#cardHairClip)">${hairSVG}</g>
  <!-- Eyebrows -->
  <path d="M${s*.34} ${s*.335} Q${s*.41} ${s*.305} ${s*.47} ${s*.335}" stroke="${hc||'#555'}" stroke-width="${s*.017}" fill="none" stroke-linecap="round"/>
  <path d="M${s*.53} ${s*.335} Q${s*.59} ${s*.305} ${s*.66} ${s*.335}" stroke="${hc||'#555'}" stroke-width="${s*.017}" fill="none" stroke-linecap="round"/>
  <!-- Eyes white -->
  <ellipse cx="${s*.40}" cy="${eyeY}" rx="${s*.055}" ry="${s*.055}" fill="white"/>
  <ellipse cx="${s*.60}" cy="${eyeY}" rx="${s*.055}" ry="${s*.055}" fill="white"/>
  <!-- Iris + pupil -->
  <circle cx="${s*.40}" cy="${eyeY}" r="${s*.032}" fill="${eye}"/>
  <circle cx="${s*.60}" cy="${eyeY}" r="${s*.032}" fill="${eye}"/>
  <circle cx="${s*.40}" cy="${eyeY}" r="${s*.016}" fill="#111"/>
  <circle cx="${s*.60}" cy="${eyeY}" r="${s*.016}" fill="#111"/>
  <!-- Eye highlights -->
  <circle cx="${s*.413}" cy="${eyeY - s*.012}" r="${s*.007}" fill="white" opacity="0.9"/>
  <circle cx="${s*.613}" cy="${eyeY - s*.012}" r="${s*.007}" fill="white" opacity="0.9"/>
  <!-- Nose -->
  <path d="M${s*.48} ${noseY-s*.04} Q${cxL} ${noseY} ${s*.52} ${noseY-s*.04}" stroke="${noseStroke}" stroke-width="${s*.012}" fill="none" stroke-linecap="round"/>
  <path d="M${s*.455} ${noseY} Q${cxL} ${noseY+s*.015} ${s*.545} ${noseY}" stroke="${noseStroke}" stroke-width="${s*.011}" fill="none" stroke-linecap="round"/>
  <!-- Mouth -->
  <path d="M${s*.41} ${mouthY} Q${cxL} ${mouthY+s*.035} ${s*.59} ${mouthY}" stroke="#c0706c" stroke-width="${s*.013}" fill="none" stroke-linecap="round"/>
</g>`;
    }

    // ── Marble card colour palettes (based on OVR) ────────────────────────────
    function _marblePalette(ovr, palloneDoro) {
        palloneDoro = palloneDoro || 0;
        if (palloneDoro >= 3 || ovr >= 115) return {
            // Legendary: obsidian/fire
            marbleA: '#1a0f00', marbleB: '#2d1800', marbleC: '#0a0500',
            vein: '#FF6B00', vein2: '#FFD700',
            border: '#FF6B00', border2: '#FFD700',
            numCol: '#FFD700', textCol: '#fff',
            statCol: '#FFD700', dimCol: 'rgba(255,215,0,0.65)',
            shimmer: 'rgba(255,107,0,0.18)',
            glow: '#FF6B00',
        };
        if (ovr >= 100) return {
            // World Class: dark marble + purple gold
            marbleA: '#10082a', marbleB: '#1c1040', marbleC: '#08041a',
            vein: '#c084fc', vein2: '#FFD700',
            border: '#a855f7', border2: '#FFD700',
            numCol: '#FFD700', textCol: '#fff',
            statCol: '#e9d5ff', dimCol: 'rgba(216,180,254,0.65)',
            shimmer: 'rgba(168,85,247,0.18)',
            glow: '#c084fc',
        };
        if (ovr >= 90) return {
            // Elite: rich dark marble + emerald
            marbleA: '#0a1a0f', marbleB: '#0f2417', marbleC: '#050f08',
            vein: '#34d399', vein2: '#FFD700',
            border: '#10b981', border2: '#6ee7b7',
            numCol: '#FFD700', textCol: '#fff',
            statCol: '#a7f3d0', dimCol: 'rgba(167,243,208,0.65)',
            shimmer: 'rgba(16,185,129,0.18)',
            glow: '#34d399',
        };
        if (ovr >= 80) return {
            // Gold: classic white marble + gold veins (like the image)
            marbleA: '#f5f0e8', marbleB: '#ede5d5', marbleC: '#faf7f0',
            vein: '#B8860B', vein2: '#FFD700',
            border: '#FFD700', border2: '#B8860B',
            numCol: '#8B6914', textCol: '#1a1206',
            statCol: '#7a5c0a', dimCol: 'rgba(139,105,20,0.7)',
            shimmer: 'rgba(255,215,0,0.22)',
            glow: '#FFD700',
        };
        if (ovr >= 70) return {
            // Silver: grey marble
            marbleA: '#dde2ea', marbleB: '#c8cfd8', marbleC: '#e8edf3',
            vein: '#8899aa', vein2: '#c0c8d4',
            border: '#8fa0b0', border2: '#c0cdd8',
            numCol: '#3a4a5a', textCol: '#1a2530',
            statCol: '#3a4a5a', dimCol: 'rgba(58,74,90,0.65)',
            shimmer: 'rgba(136,153,170,0.18)',
            glow: '#8899aa',
        };
        return {
            // Bronze: warm beige marble
            marbleA: '#e8d8c0', marbleB: '#d4c0a0', marbleC: '#f0e4cc',
            vein: '#8B6914', vein2: '#a07820',
            border: '#a07820', border2: '#c09030',
            numCol: '#5a3c0a', textCol: '#3a2608',
            statCol: '#5a3c0a', dimCol: 'rgba(90,60,10,0.65)',
            shimmer: 'rgba(160,120,32,0.18)',
            glow: '#a07820',
        };
    }

    // ── Single stat block (FIFA-style: number big, label small below) ─────────
    function _statBlock(cx, y, label, value, col) {
        return `<text x="${cx}" y="${y}" font-family="'Impact','Arial Black',sans-serif" font-size="20" font-weight="900" fill="${col}" text-anchor="middle">${value}</text>` +
               `<text x="${cx}" y="${y+13}" font-family="system-ui,sans-serif" font-size="7.5" font-weight="800" fill="${col}" text-anchor="middle" opacity="0.75" letter-spacing="0.5">${label}</text>`;
    }

    // ── Marble vein paths (procedural) ────────────────────────────────────────
    function _marbleVeins(W, H, col, col2) {
        // Several organic crack lines
        return [
            `<path d="M${W*0.15} 0 Q${W*0.25} ${H*0.12} ${W*0.18} ${H*0.28} Q${W*0.22} ${H*0.42} ${W*0.30} ${H*0.55}" stroke="${col}" stroke-width="1.2" fill="none" opacity="0.45"/>`,
            `<path d="M${W*0.55} 0 Q${W*0.62} ${H*0.08} ${W*0.58} ${H*0.20} Q${W*0.52} ${H*0.35} ${W*0.60} ${H*0.50} Q${W*0.65} ${H*0.65} ${W*0.55} ${H*0.80}" stroke="${col}" stroke-width="0.9" fill="none" opacity="0.35"/>`,
            `<path d="M${W*0.80} ${H*0.10} Q${W*0.70} ${H*0.22} ${W*0.75} ${H*0.40} Q${W*0.78} ${H*0.52} ${W*0.72} ${H*0.65}" stroke="${col2}" stroke-width="0.7" fill="none" opacity="0.3"/>`,
            `<path d="M0 ${H*0.45} Q${W*0.12} ${H*0.50} ${W*0.08} ${H*0.62} Q${W*0.14} ${H*0.75} ${W*0.10} ${H}" stroke="${col}" stroke-width="0.8" fill="none" opacity="0.28"/>`,
            `<path d="M${W*0.35} ${H*0.05} Q${W*0.40} ${H*0.18} ${W*0.32} ${H*0.30}" stroke="${col2}" stroke-width="1.5" fill="none" opacity="0.5"/>`,
            `<path d="M${W*0.68} ${H*0.30} Q${W*0.75} ${H*0.38} ${W*0.65} ${H*0.48}" stroke="${col2}" stroke-width="1.8" fill="none" opacity="0.55"/>`,
        ].join('');
    }

    // ── Main card generator — FIFA marble style ───────────────────────────────
    function generate(player, options) {
        options = options || {};
        const W = 340, H = 520;
        const ovr  = parseInt(player.overall || 65);
        const lang = (typeof localStorage !== 'undefined' && localStorage.getItem('gs_lang')) || 'it';
        const pal  = _marblePalette(ovr, player.palloni_doro);

        // Stat labels — game's own stats (no PAC/DEF/etc.)
        const SL = lang === 'en'
            ? { tiro:'SHO', velocita:'SPD', dribbling:'DRI', fisico:'PHY', mentalita:'MEN', ovr:'OVR' }
            : { tiro:'TIR', velocita:'VEL', dribbling:'DRI', fisico:'FIS', mentalita:'MEN', ovr:'OVR' };

        // 6 stats values
        const stats = [
            { l: SL.tiro,      v: Math.min(99, parseInt(player.tiro      || 60)) },
            { l: SL.velocita,  v: Math.min(99, parseInt(player.velocita  || 60)) },
            { l: SL.dribbling, v: Math.min(99, parseInt(player.dribbling || 60)) },
            { l: SL.fisico,    v: Math.min(99, parseInt(player.fisico    || 60)) },
            { l: SL.mentalita, v: Math.min(99, parseInt(player.mentalita || 60)) },
            { l: SL.ovr,       v: Math.min(125, ovr) },
        ];

        // Octagonal card clip path (cut corners ~30px)
        const CUT = 30;
        const octPath = `M${CUT},0 H${W-CUT} L${W},${CUT} V${H-CUT} L${W-CUT},${H} H${CUT} L0,${H-CUT} V${CUT} Z`;

        // Avatar
        const avatarSection = player.ai_avatar
            ? `<image href="${player.ai_avatar}" x="50" y="68" width="240" height="258" clip-path="url(#avatarClip)" preserveAspectRatio="xMidYMid meet"/>`
            : generateFaceSVG(player, 170, 168);

        // Pallone d'oro badge (top-right)
        const pdBadge = (player.palloni_doro || 0) > 0
            ? `<circle cx="${W-32}" cy="52" r="18" fill="${pal.border}" opacity="0.92" filter="url(#glow)"/>
               <text x="${W-32}" y="48" font-size="13" text-anchor="middle" font-family="system-ui">🥇</text>
               <text x="${W-32}" y="62" font-size="9" font-weight="900" fill="${pal.marbleA}" text-anchor="middle" font-family="system-ui">×${player.palloni_doro}</text>`
            : '';

        // Star at top-center
        const starBadge = `<text x="${W/2}" y="30" font-size="16" text-anchor="middle" font-family="system-ui" opacity="0.85">⭐</text>`;

        // Marble veins
        const veins = _marbleVeins(W, H, pal.vein, pal.vein2);

        // Stat strip positions — 6 stats evenly spaced
        const statStripY = H - 68;
        const colW = W / 6;
        const statBlocks = stats.map((s, i) =>
            _statBlock(colW * i + colW / 2, statStripY, s.l, s.v, pal.statCol)
        ).join('');

        // Nation flag text
        const nation = (player.nationality || 'Italy').replace(/_/g, ' ');

        return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<defs>
  <!-- Marble base gradient -->
  <linearGradient id="mbl" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%"   stop-color="${pal.marbleC}"/>
    <stop offset="45%"  stop-color="${pal.marbleA}"/>
    <stop offset="100%" stop-color="${pal.marbleB}"/>
  </linearGradient>
  <!-- Gold border gradient -->
  <linearGradient id="brdG" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%"   stop-color="${pal.border}"/>
    <stop offset="50%"  stop-color="${pal.border2}"/>
    <stop offset="100%" stop-color="${pal.border}"/>
  </linearGradient>
  <!-- Name strip gradient -->
  <linearGradient id="nameStrip" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%"   stop-color="${pal.border}" stop-opacity="0.18"/>
    <stop offset="100%" stop-color="${pal.border}" stop-opacity="0.06"/>
  </linearGradient>
  <!-- Stat strip gradient -->
  <linearGradient id="statStrip" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%"   stop-color="${pal.marbleB}" stop-opacity="0.92"/>
    <stop offset="100%" stop-color="${pal.marbleA}" stop-opacity="0.98"/>
  </linearGradient>
  <!-- Shimmer overlay -->
  <linearGradient id="shimmer" x1="0%" y1="0%" x2="60%" y2="100%">
    <stop offset="0%"   stop-color="${pal.shimmer}"/>
    <stop offset="50%"  stop-color="rgba(255,255,255,0.06)"/>
    <stop offset="100%" stop-color="${pal.shimmer}"/>
  </linearGradient>
  <!-- Avatar clip: portrait rectangle soft -->
  <clipPath id="avatarClip">
    <rect x="50" y="68" width="240" height="258" rx="4"/>
  </clipPath>
  <!-- Card shape clip -->
  <clipPath id="cardClip">
    <path d="${octPath}"/>
  </clipPath>
  <!-- Inner gold border inset -->
  <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
    <feGaussianBlur stdDeviation="5" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <filter id="textShadow">
    <feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="rgba(0,0,0,0.45)"/>
  </filter>
  <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
    <feGaussianBlur stdDeviation="3" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
</defs>

<!-- === CARD BODY === -->
<!-- Outer gold border shape -->
<path d="${octPath}" fill="url(#brdG)"/>

<!-- Inner card (inset 4px) -->
<path d="M${CUT+4},4 H${W-CUT-4} L${W-4},${CUT+4} V${H-CUT-4} L${W-CUT-4},${H-4} H${CUT+4} L4,${H-CUT-4} V${CUT+4} Z"
      fill="url(#mbl)" clip-path="url(#cardClip)"/>

<!-- Marble veins -->
<g clip-path="url(#cardClip)">${veins}</g>

<!-- Shimmer overlay -->
<path d="${octPath}" fill="url(#shimmer)" clip-path="url(#cardClip)"/>

<!-- Inner gold ring (thin) -->
<path d="M${CUT+8},8 H${W-CUT-8} L${W-8},${CUT+8} V${H-CUT-8} L${W-CUT-8},${H-8} H${CUT+8} L8,${H-CUT-8} V${CUT+8} Z"
      fill="none" stroke="${pal.border}" stroke-width="1" stroke-opacity="0.6" clip-path="url(#cardClip)"/>

<!-- === TOP AREA: OVR + star + nation === -->
<!-- OVR number (top-left, big) -->
<text x="28" y="62" font-family="'Impact','Arial Black',sans-serif" font-size="52" font-weight="900"
      fill="${pal.numCol}" filter="url(#goldGlow)" clip-path="url(#cardClip)">${ovr}</text>

<!-- Star badge top-center -->
${starBadge}

<!-- Nation (top-left, below OVR) -->
<text x="28" y="78" font-family="system-ui,sans-serif" font-size="9" font-weight="700"
      fill="${pal.dimCol}" clip-path="url(#cardClip)" letter-spacing="0.5">${nation.slice(0,14).toUpperCase()}</text>

<!-- League badge top-right (small text) -->
<text x="${W-14}" y="78" font-family="system-ui,sans-serif" font-size="9" font-weight="700"
      fill="${pal.dimCol}" text-anchor="end" clip-path="url(#cardClip)" letter-spacing="0.5">${(player.team_nome||'').slice(0,14).toUpperCase()}</text>

<!-- Pallone d'oro badge -->
${pdBadge}

<!-- === AVATAR === -->
<g clip-path="url(#cardClip)">${avatarSection}</g>

<!-- Gradient fade at bottom of avatar into name area -->
<linearGradient id="avatarFade" x1="0%" y1="0%" x2="0%" y2="100%">
  <stop offset="0%" stop-color="${pal.marbleA}" stop-opacity="0"/>
  <stop offset="100%" stop-color="${pal.marbleA}" stop-opacity="0.92"/>
</linearGradient>
<rect x="4" y="270" width="${W-8}" height="80" fill="url(#avatarFade)" clip-path="url(#cardClip)"/>

<!-- === NAME AREA === -->
<!-- Decorative separator line -->
<line x1="30" y1="342" x2="${W-30}" y2="342" stroke="${pal.border}" stroke-width="0.8" opacity="0.5" clip-path="url(#cardClip)"/>
<circle cx="${W/2}" cy="342" r="3" fill="${pal.border}" opacity="0.8" clip-path="url(#cardClip)"/>

<!-- Player name -->
<text x="${W/2}" y="370" font-family="'Impact','Arial Black',sans-serif" font-size="28" font-weight="900"
      fill="${pal.textCol}" text-anchor="middle" filter="url(#textShadow)" letter-spacing="2"
      clip-path="url(#cardClip)">${(player.player_name||'?').toUpperCase()}</text>

<!-- Separator under name -->
<line x1="30" y1="380" x2="${W-30}" y2="380" stroke="${pal.border}" stroke-width="0.8" opacity="0.5" clip-path="url(#cardClip)"/>

<!-- === STATS STRIP === -->
<rect x="4" y="${H-92}" width="${W-8}" height="64" fill="url(#statStrip)" clip-path="url(#cardClip)"/>
<line x1="4" y1="${H-92}" x2="${W-4}" y2="${H-92}" stroke="${pal.border}" stroke-width="1" opacity="0.55" clip-path="url(#cardClip)"/>

<!-- Vertical separators between stats -->
${[1,2,3,4,5].map(i => `<line x1="${colW*i}" y1="${H-88}" x2="${colW*i}" y2="${H-32}" stroke="${pal.border}" stroke-width="0.6" opacity="0.3" clip-path="url(#cardClip)"/>`).join('')}

<!-- Stat values + labels -->
<g clip-path="url(#cardClip)">${statBlocks}</g>

<!-- Bottom gold line -->
<line x1="4" y1="${H-28}" x2="${W-4}" y2="${H-28}" stroke="${pal.border}" stroke-width="0.8" opacity="0.4" clip-path="url(#cardClip)"/>

<!-- Watermark -->
<text x="${W/2}" y="${H-14}" font-family="system-ui,sans-serif" font-size="7" fill="${pal.dimCol}"
      text-anchor="middle" letter-spacing="4" clip-path="url(#cardClip)">GOLDEN STRIKER</text>

<!-- Outer border re-draw on top for crispness -->
<path d="${octPath}" fill="none" stroke="url(#brdG)" stroke-width="4"/>
</svg>`;
    }

    // ── Render card into a container ──────────────────────────────────────────
    function renderCard(container, player, options) {
        if (!container) return;
        container.innerHTML = generate(player, options);
        const svgEl = container.querySelector('svg');
        if (svgEl) svgEl.style.cssText = 'width:100%;height:auto;border-radius:20px;box-shadow:0 20px 60px rgba(0,0,0,0.65);display:block';
    }

    // ── Download card as SVG ──────────────────────────────────────────────────
    function downloadCard(player, options) {
        const svg  = generate(player, options);
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `${(player.player_name||'card').replace(/\s+/g,'_')}_golden_striker.svg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // ── Show card modal ───────────────────────────────────────────────────────
    function showCardModal(player) {
        const prev = document.getElementById('gs-card-modal');
        if (prev) prev.remove();

        const lang = (typeof localStorage !== 'undefined' && localStorage.getItem('gs_lang')) || 'it';

        const modal = document.createElement('div');
        modal.id = 'gs-card-modal';
        modal.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.88);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:20px';
        modal.innerHTML = `
<div style="max-width:360px;width:100%">
  <div id="gs-card-content" style="border-radius:12px;overflow:hidden"></div>
  <div style="display:flex;gap:10px;margin-top:16px;justify-content:center">
    <button onclick="GS_PlayerCard.downloadCard(window._gsCardPlayer)"
      style="background:linear-gradient(135deg,#FFD700,#B8860B);color:#000;border:none;padding:10px 26px;border-radius:10px;cursor:pointer;font-weight:800;font-size:0.88rem">
      ⬇️ ${lang==='en'?'Download SVG':'Scarica SVG'}
    </button>
    <button onclick="document.getElementById('gs-card-modal').remove()"
      style="background:rgba(255,255,255,0.1);color:#fff;border:1px solid rgba(255,255,255,0.2);padding:10px 20px;border-radius:10px;cursor:pointer;font-size:0.88rem">
      ${lang==='en'?'Close':'Chiudi'}
    </button>
  </div>
</div>`;

        document.body.appendChild(modal);
        window._gsCardPlayer = player;
        renderCard(document.getElementById('gs-card-content'), player);
        modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
        if (window.GS_Particles) GS_Particles.effects.confettiRain();
    }

    return { generate, renderCard, downloadCard, showCardModal, _marblePalette };
})();

window.GS_PlayerCard = GS_PlayerCard;
