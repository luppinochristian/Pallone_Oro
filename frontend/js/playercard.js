/**
 * Golden Striker — Player Card Generator
 * Generates beautiful SVG player cards for sharing and display
 */

const GS_PlayerCard = (() => {

    // ── Card themes ───────────────────────────────────────────────────────────
    const THEMES = {
        gold: {
            bg1: '#0a0e1a', bg2: '#1a1a2e',
            accent: '#FFD700', accent2: '#B8860B',
            text: '#fff', textDim: '#94a3b8',
            border: '#FFD700',
            starFull: '⭐', starEmpty: '☆',
        },
        silver: {
            bg1: '#111827', bg2: '#1f2937',
            accent: '#C0C0C0', accent2: '#808080',
            text: '#fff', textDim: '#9ca3af',
            border: '#C0C0C0',
            starFull: '⭐', starEmpty: '☆',
        },
        elite: {
            bg1: '#0f0a1e', bg2: '#1a0a2e',
            accent: '#a855f7', accent2: '#7c3aed',
            text: '#fff', textDim: '#c4b5fd',
            border: '#a855f7',
            starFull: '💜', starEmpty: '☆',
        },
        fire: {
            bg1: '#1a0a00', bg2: '#2a1000',
            accent: '#f97316', accent2: '#ea580c',
            text: '#fff', textDim: '#fed7aa',
            border: '#f97316',
            starFull: '🔥', starEmpty: '☆',
        },
        ice: {
            bg1: '#0a1a2a', bg2: '#0a2a3a',
            accent: '#38bdf8', accent2: '#0ea5e9',
            text: '#fff', textDim: '#bae6fd',
            border: '#38bdf8',
            starFull: '❄️', starEmpty: '☆',
        },
        legend: {
            bg1: '#0a0500', bg2: '#150a00',
            accent: '#FFD700', accent2: '#FF6B00',
            text: '#fff', textDim: '#fbbf24',
            border: 'url(#legendGrad)',
            starFull: '🌟', starEmpty: '☆',
        },
    };

    // ── Pick theme based on overall ───────────────────────────────────────────
    function pickTheme(overall, palloneDoro = 0) {
        if (palloneDoro >= 3) return THEMES.legend;
        if (overall >= 115)  return THEMES.elite;
        if (overall >= 100)  return THEMES.gold;
        if (overall >= 90)   return THEMES.fire;
        if (overall >= 80)   return THEMES.ice;
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

    // ── Stat bar SVG ──────────────────────────────────────────────────────────
    function statBar(x, y, label, value, max, color, w = 160) {
        const pct = Math.min(value / max, 1);
        const barW = Math.round(w * pct);
        return `
            <text x="${x}" y="${y}" font-family="system-ui,sans-serif" font-size="10" fill="#94a3b8" font-weight="600">${label}</text>
            <text x="${x + w}" y="${y}" font-family="system-ui,sans-serif" font-size="10" fill="${color}" font-weight="800" text-anchor="end">${value}</text>
            <rect x="${x}" y="${y + 3}" width="${w}" height="5" rx="2.5" fill="rgba(255,255,255,0.08)"/>
            <rect x="${x}" y="${y + 3}" width="${barW}" height="5" rx="2.5" fill="${color}" opacity="0.9"/>
        `;
    }

    // ── Main card generator ───────────────────────────────────────────────────
    function generate(player, options = {}) {
        const theme = options.theme || pickTheme(player.overall, player.palloni_doro);
        const W = 320, H = 480;
        const ovr = parseInt(player.overall || 65);
        const oc = ovrColor(ovr);
        const lang = localStorage.getItem('gs_lang') || 'it';

        // Position label
        const posLabel = lang === 'en' ? 'ATT' : 'ATT';

        // Stars from team
        const stelle = parseInt(player.team_stelle || 1);
        const starsStr = '★'.repeat(stelle) + '☆'.repeat(5 - stelle);

        // Stat labels
        const statLabels = lang === 'en'
            ? { tiro: 'SHO', velocita: 'SPD', dribbling: 'DRI', fisico: 'PHY', mentalita: 'MEN' }
            : { tiro: 'TIR', velocita: 'VEL', dribbling: 'DRI', fisico: 'FIS', mentalita: 'MEN' };

        // Avatar: use AI avatar URL or generated SVG face
        const avatarSection = player.ai_avatar
            ? `<image href="${player.ai_avatar}" x="85" y="60" width="150" height="150" clip-path="url(#avatarClip)" preserveAspectRatio="xMidYMid meet"/>`
            : generateFaceSVG(player, 160, 135);

        // Trophies row
        const trophiesStr = player.trofei > 0 ? `🏆 ${player.trofei}` : '';
        const pdStr = player.palloni_doro > 0 ? `  🥇 ${player.palloni_doro}` : '';

        const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
    <defs>
        <linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${theme.bg1}"/>
            <stop offset="100%" stop-color="${theme.bg2}"/>
        </linearGradient>
        <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="${theme.accent}"/>
            <stop offset="100%" stop-color="${theme.accent2}"/>
        </linearGradient>
        <linearGradient id="legendGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FFD700"/>
            <stop offset="50%" stop-color="#FF6B00"/>
            <stop offset="100%" stop-color="#FFD700"/>
        </linearGradient>
        <clipPath id="avatarClip">
            <circle cx="160" cy="135" r="72"/>
        </clipPath>
        <filter id="cardGlow">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="textGlow">
            <feGaussianBlur stdDeviation="2" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
    </defs>

    <!-- Card background -->
    <rect width="${W}" height="${H}" rx="20" fill="url(#cardBg)"/>

    <!-- Top accent bar -->
    <rect width="${W}" height="8" rx="0" fill="url(#accentGrad)"/>
    <rect y="0" width="${W}" height="8" rx="20" fill="url(#accentGrad)"/>

    <!-- Decorative hexagon pattern -->
    <g opacity="0.04" fill="${theme.accent}">
        ${Array.from({length: 12}, (_, i) => {
            const cx = (i % 4) * 90 - 20;
            const cy = Math.floor(i / 4) * 80 - 20;
            return `<polygon points="${cx},${cy-20} ${cx+17},${cy-10} ${cx+17},${cy+10} ${cx},${cy+20} ${cx-17},${cy+10} ${cx-17},${cy-10}"/>`;
        }).join('')}
    </g>

    <!-- Overall badge -->
    <circle cx="50" cy="50" r="35" fill="${oc}" opacity="0.15"/>
    <circle cx="50" cy="50" r="35" fill="none" stroke="${oc}" stroke-width="2" opacity="0.8"/>
    <text x="50" y="44" font-family="system-ui,sans-serif" font-size="22" font-weight="900" fill="${oc}" text-anchor="middle" filter="url(#textGlow)">${ovr}</text>
    <text x="50" y="56" font-family="system-ui,sans-serif" font-size="9" font-weight="700" fill="${oc}" text-anchor="middle" opacity="0.8">OVR</text>

    <!-- Position badge -->
    <rect x="20" y="92" width="40" height="18" rx="9" fill="${theme.accent}" opacity="0.2"/>
    <text x="40" y="104" font-family="system-ui,sans-serif" font-size="10" font-weight="800" fill="${theme.accent}" text-anchor="middle">${posLabel}</text>

    <!-- Nationality -->
    <text x="270" y="30" font-family="system-ui,sans-serif" font-size="10" fill="${theme.textDim}" text-anchor="middle">${player.nationality || 'Italy'}</text>

    <!-- Avatar circle -->
    <circle cx="160" cy="135" r="75" fill="rgba(255,255,255,0.05)" stroke="${theme.accent}" stroke-width="2" opacity="0.6"/>
    ${avatarSection}

    <!-- Player name -->
    <text x="${W/2}" y="235" font-family="system-ui,sans-serif" font-size="18" font-weight="900" fill="${theme.text}" text-anchor="middle" filter="url(#textGlow)">${(player.player_name || '?').toUpperCase()}</text>

    <!-- Team name -->
    <text x="${W/2}" y="252" font-family="system-ui,sans-serif" font-size="11" fill="${theme.accent}" text-anchor="middle" opacity="0.9">${player.team_nome || ''}</text>

    <!-- Stars -->
    <text x="${W/2}" y="270" font-family="system-ui,sans-serif" font-size="13" fill="${theme.accent}" text-anchor="middle">${starsStr}</text>

    <!-- Divider -->
    <line x1="30" y1="280" x2="${W-30}" y2="280" stroke="${theme.accent}" stroke-width="1" opacity="0.2"/>

    <!-- Stats -->
    <g>
        ${statBar(30, 300, statLabels.tiro, player.tiro || 60, 125, '#ef4444')}
        ${statBar(30, 320, statLabels.velocita, player.velocita || 60, 125, '#3b82f6')}
        ${statBar(30, 340, statLabels.dribbling, player.dribbling || 60, 125, '#f59e0b')}
        ${statBar(30, 360, statLabels.fisico, player.fisico || 60, 125, '#10b981')}
        ${statBar(30, 380, statLabels.mentalita, player.mentalita || 60, 125, '#8b5cf6')}
    </g>

    <!-- Bottom bar -->
    <rect x="0" y="${H - 50}" width="${W}" height="50" rx="20" fill="rgba(0,0,0,0.3)"/>
    <rect x="0" y="${H - 50}" width="${W}" height="20" fill="rgba(0,0,0,0.3)"/>

    <!-- Career stats row -->
    <text x="40" y="${H - 28}" font-family="system-ui,sans-serif" font-size="9" fill="${theme.textDim}" text-anchor="middle">${lang === 'en' ? 'GOALS' : 'GOL'}</text>
    <text x="40" y="${H - 16}" font-family="system-ui,sans-serif" font-size="14" font-weight="800" fill="${theme.text}" text-anchor="middle">${player.gol_carriera || 0}</text>

    <text x="${W/2}" y="${H - 28}" font-family="system-ui,sans-serif" font-size="9" fill="${theme.textDim}" text-anchor="middle">${lang === 'en' ? 'ASSISTS' : 'ASSIST'}</text>
    <text x="${W/2}" y="${H - 16}" font-family="system-ui,sans-serif" font-size="14" font-weight="800" fill="${theme.text}" text-anchor="middle">${player.assist_carriera || 0}</text>

    <text x="${W - 40}" y="${H - 28}" font-family="system-ui,sans-serif" font-size="9" fill="${theme.textDim}" text-anchor="middle">${lang === 'en' ? 'TROPHIES' : 'TROFEI'}</text>
    <text x="${W - 40}" y="${H - 16}" font-family="system-ui,sans-serif" font-size="14" font-weight="800" fill="${theme.accent}" text-anchor="middle">${player.trofei || 0}</text>

    <!-- Pallone d'oro indicator -->
    ${(player.palloni_doro || 0) > 0 ? `
    <circle cx="${W - 20}" cy="20" r="14" fill="${theme.accent}" opacity="0.9"/>
    <text x="${W - 20}" y="16" font-family="system-ui,sans-serif" font-size="8" font-weight="900" fill="#000" text-anchor="middle">🥇</text>
    <text x="${W - 20}" y="27" font-family="system-ui,sans-serif" font-size="9" font-weight="900" fill="#000" text-anchor="middle">x${player.palloni_doro}</text>
    ` : ''}

    <!-- GOLDEN STRIKER watermark -->
    <text x="${W/2}" y="${H - 4}" font-family="system-ui,sans-serif" font-size="7" fill="${theme.accent}" text-anchor="middle" opacity="0.35" letter-spacing="2">GOLDEN STRIKER</text>
</svg>`;

        return svg;
    }

    // ── Simple SVG face generator ─────────────────────────────────────────────
    function generateFaceSVG(player, cx, cy) {
        const skinColors = {
            light: '#FDDBB4', medium_light: '#E8B88A', medium: '#C68642',
            medium_dark: '#8D5524', dark: '#3B1A08',
        };
        const skin = skinColors[player.skin_color] || player.skin_color || '#C68642';
        const hair = player.hair_color || '#1a1a1a';
        const eye  = player.eye_color  || '#3d1f0a';
        const r = 55;

        return `
            <g transform="translate(${cx}, ${cy})">
                <!-- Head -->
                <circle cx="0" cy="0" r="${r}" fill="${skin}"/>
                <!-- Hair -->
                <ellipse cx="0" cy="${-r * 0.7}" rx="${r * 0.85}" ry="${r * 0.45}" fill="${hair}"/>
                <!-- Eyes -->
                <ellipse cx="-15" cy="-8" rx="9" ry="7" fill="white"/>
                <ellipse cx="15"  cy="-8" rx="9" ry="7" fill="white"/>
                <circle cx="-15" cy="-8" r="5" fill="${eye}"/>
                <circle cx="15"  cy="-8" r="5" fill="${eye}"/>
                <circle cx="-13" cy="-10" r="2" fill="white" opacity="0.8"/>
                <circle cx="17"  cy="-10" r="2" fill="white" opacity="0.8"/>
                <!-- Eyebrows -->
                <path d="M -23,-17 Q -15,-21 -7,-17" stroke="${hair}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
                <path d="M 7,-17 Q 15,-21 23,-17" stroke="${hair}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
                <!-- Nose -->
                <path d="M -5,2 Q 0,10 5,2" stroke="${skin === '#FDDBB4' ? '#c4956a' : '#8D5524'}" stroke-width="1.5" fill="none"/>
                <!-- Mouth -->
                <path d="M -12,18 Q 0,26 12,18" stroke="${skin === '#FDDBB4' ? '#c4956a' : '#8D5524'}" stroke-width="2" fill="none" stroke-linecap="round"/>
                <!-- Ears -->
                <ellipse cx="${-r}" cy="0" rx="7" ry="12" fill="${skin}"/>
                <ellipse cx="${r}"  cy="0" rx="7" ry="12" fill="${skin}"/>
                <!-- Neck -->
                <rect x="-14" y="${r - 5}" width="28" height="20" rx="5" fill="${skin}"/>
            </g>
        `;
    }

    // ── Render card into a container ──────────────────────────────────────────
    function renderCard(container, player, options = {}) {
        if (!container) return;
        const svg = generate(player, options);
        container.innerHTML = svg;
        container.querySelector('svg')?.setAttribute('style', 'width:100%;height:auto;border-radius:20px;box-shadow:0 20px 60px rgba(0,0,0,0.6)');
    }

    // ── Download card as PNG ──────────────────────────────────────────────────
    async function downloadCard(player, options = {}) {
        const svg = generate(player, options);
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `${(player.player_name || 'card').replace(/\s+/g, '_')}_golden_striker.svg`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // ── Show card modal ───────────────────────────────────────────────────────
    function showCardModal(player) {
        const existing = document.getElementById('gs-card-modal');
        if (existing) existing.remove();

        const lang = localStorage.getItem('gs_lang') || 'it';
        const modal = document.createElement('div');
        modal.id = 'gs-card-modal';
        modal.style.cssText = `
            position: fixed; inset: 0; z-index: 99999;
            background: rgba(0,0,0,0.85); backdrop-filter: blur(8px);
            display: flex; align-items: center; justify-content: center;
            padding: 20px;
        `;
        modal.innerHTML = `
            <div style="max-width:340px;width:100%;position:relative">
                <div id="gs-card-content" style="border-radius:20px;overflow:hidden"></div>
                <div style="display:flex;gap:10px;margin-top:16px;justify-content:center">
                    ${Object.keys(THEMES).map(t => `
                        <button onclick="GS_PlayerCard.renderCard(document.getElementById('gs-card-content'),window._cardPlayer,{theme:GS_PlayerCard.THEMES['${t}']})"
                                style="width:28px;height:28px;border-radius:6px;border:2px solid ${THEMES[t].accent};background:${THEMES[t].bg1};cursor:pointer;transition:transform 0.15s"
                                title="${t}" onmouseover="this.style.transform='scale(1.15)'" onmouseout="this.style.transform='scale(1)'">
                        </button>`).join('')}
                </div>
                <div style="display:flex;gap:10px;margin-top:12px;justify-content:center">
                    <button onclick="GS_PlayerCard.downloadCard(window._cardPlayer)" 
                            style="background:linear-gradient(135deg,#FFD700,#B8860B);color:#000;border:none;padding:10px 24px;border-radius:10px;cursor:pointer;font-weight:700;font-size:0.9rem">
                        ⬇️ ${lang === 'en' ? 'Download SVG' : 'Scarica SVG'}
                    </button>
                    <button onclick="document.getElementById('gs-card-modal').remove()"
                            style="background:rgba(255,255,255,0.1);color:#fff;border:1px solid rgba(255,255,255,0.2);padding:10px 20px;border-radius:10px;cursor:pointer;font-size:0.9rem">
                        ${lang === 'en' ? 'Close' : 'Chiudi'}
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        window._cardPlayer = player;
        renderCard(document.getElementById('gs-card-content'), player);
        modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

        if (window.GS_Particles) GS_Particles.effects.confettiRain();
    }

    return { generate, renderCard, downloadCard, showCardModal, THEMES, pickTheme };
})();

window.GS_PlayerCard = GS_PlayerCard;
