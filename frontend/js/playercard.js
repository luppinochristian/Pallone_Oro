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

    // ── SVG face — clean, no hair-cap artifacts ───────────────────────────────
    function generateFaceSVG(player, cx, cy) {
        const skinMap = {
            light: '#FDDBB4', medium_light: '#E8B88A', medium: '#C68642',
            medium_dark: '#8D5524', dark: '#3B1A08',
        };
        const skin = skinMap[player.skin_color] || player.skin_color || '#C68642';
        const hair = player.hair_color || '#1a1a1a';
        const eye  = player.eye_color  || '#3d1f0a';
        const noseStroke = (skin === '#FDDBB4' || skin === '#E8B88A') ? '#c4956a' : '#8D5524';
        const r = 52;
        return `<g transform="translate(${cx},${cy})">
  <rect x="-13" y="${r-6}" width="26" height="22" rx="5" fill="${skin}"/>
  <circle cx="0" cy="0" r="${r}" fill="${skin}"/>
  <ellipse cx="0" cy="${-r*0.62}" rx="${r*0.78}" ry="${r*0.38}" fill="${hair}"/>
  <ellipse cx="${-r}" cy="2" rx="7" ry="11" fill="${skin}"/>
  <ellipse cx="${r}"  cy="2" rx="7" ry="11" fill="${skin}"/>
  <path d="M -22,-15 Q -14,-20 -6,-15" stroke="${hair}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M 6,-15 Q 14,-20 22,-15"   stroke="${hair}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <ellipse cx="-15" cy="-7" rx="9" ry="7" fill="white"/>
  <ellipse cx="15"  cy="-7" rx="9" ry="7" fill="white"/>
  <circle cx="-15" cy="-7" r="5" fill="${eye}"/>
  <circle cx="15"  cy="-7" r="5" fill="${eye}"/>
  <circle cx="-13" cy="-9" r="2" fill="white" opacity="0.85"/>
  <circle cx="17"  cy="-9" r="2" fill="white" opacity="0.85"/>
  <path d="M -5,3 Q 0,11 5,3" stroke="${noseStroke}" stroke-width="1.5" fill="none"/>
  <path d="M -11,19 Q 0,27 11,19" stroke="${noseStroke}" stroke-width="2" fill="none" stroke-linecap="round"/>
</g>`;
    }

    // ── Main card generator ───────────────────────────────────────────────────
    function generate(player, options) {
        options = options || {};
        const theme = options.theme || pickTheme(player.overall, player.palloni_doro);
        const W = 340, H = 520;
        const ovr  = parseInt(player.overall || 65);
        const oc   = ovrColor(ovr);
        const lang = (typeof localStorage !== 'undefined' && localStorage.getItem('gs_lang')) || 'it';

        const stelle    = Math.max(0, Math.min(5, parseInt(player.team_stelle || 1)));
        const starsStr  = '★'.repeat(stelle) + '☆'.repeat(5 - stelle);
        const statLabels = lang === 'en'
            ? { tiro:'SHO', velocita:'SPD', dribbling:'DRI', fisico:'PHY', mentalita:'MEN' }
            : { tiro:'TIR', velocita:'VEL', dribbling:'DRI', fisico:'FIS', mentalita:'MEN' };

        const avatarSection = player.ai_avatar
            ? `<image href="${player.ai_avatar}" x="104" y="62" width="132" height="140" clip-path="url(#avatarClip)" preserveAspectRatio="xMidYMid meet"/>`
            : generateFaceSVG(player, 170, 130);

        const diagLines = Array.from({length: 20}, (_, i) =>
            `<line x1="${-20 + i*38}" y1="0" x2="${-20 + i*38 + H*0.6}" y2="${H}" stroke="${theme.accent}" stroke-width="10"/>`
        ).join('');

        const pdBadge = (player.palloni_doro || 0) > 0 ? `
  <circle cx="${W-22}" cy="57" r="16" fill="${theme.accent}" opacity="0.92" filter="url(#glowFilter)"/>
  <text x="${W-22}" y="53" font-size="11" text-anchor="middle" font-family="system-ui">🥇</text>
  <text x="${W-22}" y="66" font-size="9" font-weight="900" fill="#000" text-anchor="middle" font-family="system-ui">×${player.palloni_doro}</text>` : '';

        return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<defs>
  <linearGradient id="cardBg" x1="0%" y1="0%" x2="60%" y2="100%">
    <stop offset="0%"   stop-color="${theme.bg1}"/>
    <stop offset="50%"  stop-color="${theme.bg2}"/>
    <stop offset="100%" stop-color="${theme.bg1}"/>
  </linearGradient>
  <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
    <stop offset="0%"   stop-color="${theme.accent}"  stop-opacity="0.9"/>
    <stop offset="100%" stop-color="${theme.accent2}" stop-opacity="0.9"/>
  </linearGradient>
  <linearGradient id="headerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%"   stop-color="${theme.accent}" stop-opacity="0.16"/>
    <stop offset="100%" stop-color="${theme.accent}" stop-opacity="0"/>
  </linearGradient>
  <linearGradient id="footerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%"   stop-color="rgba(0,0,0,0)"/>
    <stop offset="100%" stop-color="rgba(0,0,0,0.62)"/>
  </linearGradient>
  <linearGradient id="sf1" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#ef4444"/><stop offset="100%" stop-color="#f97316"/></linearGradient>
  <linearGradient id="sf2" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#3b82f6"/><stop offset="100%" stop-color="#06b6d4"/></linearGradient>
  <linearGradient id="sf3" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#f59e0b"/><stop offset="100%" stop-color="#fbbf24"/></linearGradient>
  <linearGradient id="sf4" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#10b981"/><stop offset="100%" stop-color="#34d399"/></linearGradient>
  <linearGradient id="sf5" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#8b5cf6"/><stop offset="100%" stop-color="#a78bfa"/></linearGradient>
  <clipPath id="avatarClip"><circle cx="170" cy="130" r="64"/></clipPath>
  <clipPath id="cardClip"><rect width="${W}" height="${H}" rx="22"/></clipPath>
  <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
    <feGaussianBlur stdDeviation="4" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
    <feGaussianBlur stdDeviation="8" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <filter id="dropShadow">
    <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.5)"/>
  </filter>
</defs>

<!-- Base card -->
<rect width="${W}" height="${H}" rx="22" fill="url(#cardBg)" clip-path="url(#cardClip)"/>

<!-- Diagonal pattern -->
<g clip-path="url(#cardClip)" opacity="0.025">${diagLines}</g>

<!-- Header glow -->
<rect x="0" y="0" width="${W}" height="275" fill="url(#headerGrad)" clip-path="url(#cardClip)"/>

<!-- Top stripe -->
<rect x="0" y="0" width="${W}" height="6" fill="url(#accentGrad)" clip-path="url(#cardClip)"/>

<!-- OVR Badge -->
<g filter="url(#dropShadow)">
  <rect x="14" y="13" width="60" height="74" rx="13" fill="rgba(0,0,0,0.55)" stroke="${oc}" stroke-width="1.5" stroke-opacity="0.8"/>
  <text x="44" y="54" font-family="'Impact','Arial Black',sans-serif" font-size="30" font-weight="900" fill="${oc}" text-anchor="middle" filter="url(#glowFilter)">${ovr}</text>
  <text x="44" y="68" font-family="system-ui,sans-serif" font-size="9"  font-weight="700" fill="${oc}"           text-anchor="middle" opacity="0.75">OVR</text>
  <text x="44" y="81" font-family="system-ui,sans-serif" font-size="8"  font-weight="700" fill="${theme.accent}" text-anchor="middle" opacity="0.9">ATT</text>
</g>

<!-- Nationality -->
<rect x="${W-78}" y="13" width="64" height="28" rx="10" fill="rgba(0,0,0,0.5)" stroke="${theme.accent}" stroke-width="1" stroke-opacity="0.4"/>
<text x="${W-46}" y="31" font-family="system-ui,sans-serif" font-size="10" font-weight="700" fill="${theme.text}" text-anchor="middle" opacity="0.9">${(player.nationality||'Italy').replace(/_/g,' ').slice(0,12)}</text>

<!-- Pallone d'oro badge -->
${pdBadge}

<!-- Avatar glow rings -->
<circle cx="170" cy="130" r="78" fill="${theme.accent}" opacity="0.07" filter="url(#softGlow)"/>
<circle cx="170" cy="130" r="68" fill="rgba(255,255,255,0.04)" stroke="${theme.accent}" stroke-width="2.5" stroke-opacity="0.5"/>
${avatarSection}

<!-- Stars -->
<text x="${W/2}" y="216" font-family="system-ui,sans-serif" font-size="13" fill="${theme.accent}" text-anchor="middle" opacity="0.88">${starsStr}</text>

<!-- Player name -->
<text x="${W/2}" y="243" font-family="'Impact','Arial Black',sans-serif" font-size="22" font-weight="900" fill="${theme.text}" text-anchor="middle" filter="url(#dropShadow)" letter-spacing="1">${(player.player_name||'?').toUpperCase()}</text>

<!-- Team name -->
<text x="${W/2}" y="262" font-family="system-ui,sans-serif" font-size="11" fill="${theme.accent}" text-anchor="middle" opacity="0.85" font-weight="600">${player.team_nome||''}</text>

<!-- Divider -->
<line x1="30" y1="275" x2="${W-30}" y2="275" stroke="${theme.accent}" stroke-width="0.75" opacity="0.22"/>
<circle cx="${W/2-8}" cy="275" r="2.5" fill="${theme.accent}" opacity="0.5"/>
<circle cx="${W/2}"   cy="275" r="2.5" fill="${theme.accent}" opacity="0.72"/>
<circle cx="${W/2+8}" cy="275" r="2.5" fill="${theme.accent}" opacity="0.5"/>

<!-- Stats 2-col grid -->
<g font-family="system-ui,sans-serif">
  ${statBar2col(24,  293, statLabels.tiro,      player.tiro||60,      125, 'url(#sf1)', 132)}
  ${statBar2col(184, 293, statLabels.velocita,   player.velocita||60,  125, 'url(#sf2)', 132)}
  ${statBar2col(24,  323, statLabels.dribbling,  player.dribbling||60, 125, 'url(#sf3)', 132)}
  ${statBar2col(184, 323, statLabels.fisico,     player.fisico||60,    125, 'url(#sf4)', 132)}
  ${statBar2col(24,  353, statLabels.mentalita,  player.mentalita||60, 125, 'url(#sf5)', 132)}
  ${statBar2col(184, 353, 'OVR', ovr, 125, 'url(#accentGrad)', 132)}
</g>

<!-- Footer -->
<rect x="0" y="${H-112}" width="${W}" height="112" fill="url(#footerGrad)" clip-path="url(#cardClip)"/>
<rect x="0" y="${H-112}" width="${W}" height="1"   fill="${theme.accent}" opacity="0.15"/>

<!-- 3-col career stats -->
<g text-anchor="middle" font-family="system-ui,sans-serif">
  <rect x="14"  y="${H-98}" width="92" height="64" rx="13" fill="rgba(255,255,255,0.035)" stroke="${theme.accent}" stroke-width="0.75" stroke-opacity="0.2"/>
  <text x="60"  y="${H-73}" font-size="9"  font-weight="700" fill="${theme.textDim}" letter-spacing="1">${lang==='en'?'GOALS':'GOL'}</text>
  <text x="60"  y="${H-50}" font-size="22" font-weight="900" fill="${theme.text}">${player.gol_carriera||0}</text>

  <rect x="124" y="${H-98}" width="92" height="64" rx="13" fill="rgba(255,255,255,0.035)" stroke="${theme.accent}" stroke-width="0.75" stroke-opacity="0.2"/>
  <text x="170" y="${H-73}" font-size="9"  font-weight="700" fill="${theme.textDim}" letter-spacing="1">${lang==='en'?'ASSISTS':'ASSIST'}</text>
  <text x="170" y="${H-50}" font-size="22" font-weight="900" fill="${theme.text}">${player.assist_carriera||0}</text>

  <rect x="234" y="${H-98}" width="92" height="64" rx="13" fill="rgba(255,255,255,0.035)" stroke="${theme.accent}" stroke-width="0.75" stroke-opacity="0.2"/>
  <text x="280" y="${H-73}" font-size="9"  font-weight="700" fill="${theme.textDim}" letter-spacing="1">TROFEI</text>
  <text x="280" y="${H-50}" font-size="22" font-weight="900" fill="${theme.accent}">${player.trofei||0}</text>
</g>

<!-- Watermark -->
<text x="${W/2}" y="${H-8}" font-family="system-ui,sans-serif" font-size="7" fill="${theme.accent}" text-anchor="middle" opacity="0.28" letter-spacing="3">GOLDEN STRIKER</text>

<!-- Border -->
<rect x="1" y="1" width="${W-2}" height="${H-2}" rx="21" fill="none" stroke="${theme.accent}" stroke-width="1.5" stroke-opacity="0.2"/>
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

        const themeButtons = Object.entries(THEMES).map(([name, t]) =>
            `<button onclick="GS_PlayerCard.renderCard(document.getElementById('gs-card-content'),window._gsCardPlayer,{theme:GS_PlayerCard.THEMES['${name}']})" title="${name}" ` +
            `style="width:30px;height:30px;border-radius:7px;border:2px solid ${t.accent};background:${t.bg1};cursor:pointer;transition:transform 0.15s" ` +
            `onmouseover="this.style.transform='scale(1.18)'" onmouseout="this.style.transform='scale(1)'"></button>`
        ).join('');

        const modal = document.createElement('div');
        modal.id = 'gs-card-modal';
        modal.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.88);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:20px';
        modal.innerHTML = `
<div style="max-width:360px;width:100%">
  <div id="gs-card-content" style="border-radius:22px;overflow:hidden"></div>
  <div style="display:flex;gap:8px;margin-top:16px;justify-content:center;flex-wrap:wrap">${themeButtons}</div>
  <div style="display:flex;gap:10px;margin-top:14px;justify-content:center">
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

    return { generate, renderCard, downloadCard, showCardModal, THEMES, pickTheme };
})();

window.GS_PlayerCard = GS_PlayerCard;
