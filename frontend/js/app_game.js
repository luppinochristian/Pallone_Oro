/* app_game.js — dashboard, gioca mese, risultati, ritiro, tab carriera.
 * Estratto da app.js (refactor): nessuna logica modificata.
 * Caricato in ordine da index.html. */

function renderDashboard() {
    if (!currentPlayer) return;
    const p = currentPlayer;

    document.getElementById('player-name-display').textContent = p.player_name;
    // Show milestone badge
    if (window.GS_Locale) {
        const m = GS_Locale.getMilestone(parseInt(p.overall || 0));
        const existingBadge = document.getElementById('player-milestone-badge');
        if (existingBadge) { existingBadge.textContent = m.label; existingBadge.style.color = m.color; }
        else {
            const nameEl = document.getElementById('player-name-display');
            const badge = document.createElement('span');
            badge.id = 'player-milestone-badge';
            badge.style.cssText = `font-size:0.68rem;font-weight:800;padding:2px 8px;border-radius:10px;margin-left:8px;color:${m.color};background:rgba(255,255,255,0.05);border:1px solid ${m.color}44;vertical-align:middle`;
            badge.textContent = m.label;
            nameEl.insertAdjacentElement('afterend', badge);
        }
    }
    const _natDisplay = (() => {
        const n = CC_ALL_NATIONS.find(x => x.key === p.nationality);
        if (!n) return p.nationality;
        return ({en:n.key.replace(/_/g,' '),it:n.key_it,de:n.key_de||n.key_it,es:n.key_es||n.key_it})[currentLang]||n.key_it;
    })();
    document.getElementById('player-subtitle').textContent = `${_natDisplay} · ${p.age} ${_t('dash_age')} · ${_t('dash_season_full')} ${p.anno_corrente}`;

    const avatarWrap = document.querySelector('.player-avatar');
    if (avatarWrap) {
        avatarWrap.innerHTML = renderAvatarSVG(p.skin_color||'medium', p.skin_hair||'short_black', p.eye_color||'brown', p.gender||'male', 72, p.hair_color||'#1a1a1a', p.facial_hair||'none', p.eyebrow_style||'standard', p.freckles||0, p.kit_color||null);
        avatarWrap.style.background = 'transparent';
        avatarWrap.style.border = '3px solid var(--gold)';
    }

    const stars = '⭐'.repeat(parseInt(p.team_stelle || 1));
    const legaInfo = p.lega_nome ? ` · ${p.nazione_bandiera || ''} ${p.lega_nome}` : '';
    document.getElementById('player-team').textContent = `${stars} ${p.team_nome || _t('no_team')}${legaInfo}`;

    // OVR circle — anima da 0% → valore reale via rAF (cross-browser)
    const ov = parseInt(p.overall || 0);
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
        const val = parseInt(p[s] || 0);
        const row = document.querySelector(`[data-stat="${s}"]`);
        if (row) {
            const pct   = Math.min(100,(val/125)*100);
            const bar   = row.querySelector('.stat-bar');
            const valEl = row.querySelector('.stat-value');
            if (val >= 100) { bar.classList.add('stat-bar-super'); valEl.classList.add('legendary'); }
            else { bar.classList.remove('stat-bar-super'); valEl.classList.remove('legendary'); }
            bar.style.transform = 'scaleX(0)';
            valEl.textContent = '0';
            requestAnimationFrame(() => requestAnimationFrame(() => {
                bar.style.transform = `scaleX(${pct / 100})`;
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
    document.getElementById('info-mese').textContent = `${_t('dash_season')} ${p.anno_corrente} — ${getMeseName(p.mese_corrente, true)}`;

    _loadSeasonStats(p.anno_corrente);

    const pf = parseInt(p.piede_forte || 3);
    const pd = parseInt(p.piede_debole || 2);
    const ls = parseInt(p.livello_skill || 2);
    const pfLato = p.piede_forte_lato === 'sx' ? _t('foot_sx') : _t('foot_dx');
    const pdLato = p.piede_debole_lato === 'sx' ? _t('foot_sx') : _t('foot_dx');
    const pfEl = document.getElementById('info-piede-forte');
    const pdEl = document.getElementById('info-piede-debole');
    const lsEl = document.getElementById('info-livello-skill');
    if (pfEl) pfEl.innerHTML = `${'⭐'.repeat(pf)}${'☆'.repeat(5-pf)} <small style="color:var(--text-dim)">${pfLato}</small>`;
    if (pdEl) pdEl.innerHTML = `${'⭐'.repeat(pd)}${'☆'.repeat(5-pd)} <small style="color:var(--text-dim)">${pdLato}</small>`;
    if (lsEl) lsEl.textContent = '⭐'.repeat(ls) + '☆'.repeat(5-ls) + ` (${ls}/5)`;

    loadDashboardObiettivi();
    loadDashboardNotizie();
    // Attach help tooltips after render
    setTimeout(attachTooltips, 300);
}

async function _loadSeasonStats(anno) {
    try {
    const golEl    = document.getElementById('info-gol');
    const assistEl = document.getElementById('info-assist');
    if (!golEl || !assistEl) return;
    const res = await api('player.php', { action: 'season_detail', anno }, 'GET');
    if (res && !res.error) {
        if (parseInt(res.gol ?? 0) > parseInt(golEl.textContent || '0')) {
            if (window.GS_Particles) GS_Particles.effects.goalCelebration();
        }
        golEl.textContent    = res.gol ?? 0;
        assistEl.textContent = res.assist ?? 0;
    } else {
        golEl.textContent    = 0;
        assistEl.textContent = 0;
    }
    } catch(e) { console.error('_loadSeasonStats error:', e); }
}

function renderSpecialBar(id, val, cls) {
    const el = document.querySelector(`[data-special="${id}"]`);
    if (!el) return;
    const bar   = el.querySelector('.stat-bar');
    const valEl = el.querySelector('.stat-value');
    // Rimuovi eventuali classi colore precedenti prima di aggiungere
    el.classList.remove('bar-green', 'bar-blue', 'bar-purple');
    el.classList.add(cls);
    bar.style.transform = 'scaleX(0)';
    valEl.textContent = '0';
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            bar.style.transform = `scaleX(${val / 100})`;
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
    // Rebuild actions grid in current language on every render
    _buildActionsGrid();
    // Show training tip
    if (window.GS_Encyclopedia) GS_Encyclopedia.showRandomTip('gs-training-tip-card');
    // Show pre-match hype
    if (window.GS_GameData) setTimeout(() => GS_GameData.showPreMatchHype(), 100);
    const p = currentPlayer;
    const dotsEl = document.getElementById('month-dots');
    dotsEl.innerHTML = '';
    // La stagione va da Settembre(9) a Giugno(6): 9,10,11,12,1,2,3,4,5,6
    const SEASON_MONTHS = [9, 10, 11, 12, 1, 2, 3, 4, 5, 6];
    const MONTH_ABBR    = [''].concat([1,2,3,4,5,6,7,8,9,10,11,12].map(m => _t('month_'+m)));
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
    const meseCorrente = parseInt(p.mese_corrente || 9);
    // Anno di inizio stagione: se siamo in Set-Dic è p.anno_corrente, se in Gen-Giu è p.anno_corrente
    // L'anno della stagione è sempre p.anno_corrente (che avanza solo dopo giugno)
    const annoStagione = parseInt(p.anno_corrente || 1);
    document.getElementById('current-month-text').textContent =
        `${MONTH_ABBR[meseCorrente]} · ${_t('dash_season_full')} ${annoStagione} · ${_t('dash_age')} ${p.age}`;
    document.getElementById('g-overall').textContent = p.overall;
    document.getElementById('g-energia').textContent = p.energia;
    document.getElementById('g-morale').textContent  = p.morale;
    document.getElementById('g-soldi').textContent   = formatMoney(p.soldi);
    selectedActions = [];
    updatePlayBtn();

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
            bannerHTML = _t('default_career_injury_banner').replace('{0}', infortuni).replace('{1}', infortuni===1 ? _t('injury_mese') : _t('injury_mesi'));
        } else if (energia === 0) {
            bannerHTML = _t('energy_zero_banner');
        } else if (energia <= 25) {
            bannerHTML = _t('energy_low_banner').replace('{0}', energia);
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

const ACTIONS_DEF = [
    { id: 'allenamento_tiro',      icon: '🎯',
      name_it: 'Allena Tiro',         name_en: 'Shooting Training',  name_de: 'Schusstraining',       name_es: 'Entrenamiento de Disparo',
      desc_it: 'Migliora la precisione in porta',     desc_en: 'Improve shooting accuracy',
      desc_de: 'Verbessere die Genauigkeit vor dem Tor', desc_es: 'Mejora la precisión ante la portería' },
    { id: 'allenamento_velocita',  icon: '⚡',
      name_it: 'Allena Velocità',      name_en: 'Speed Training',     name_de: 'Schnelligkeitstraining', name_es: 'Entrenamiento de Velocidad',
      desc_it: 'Aumenta la velocità di corsa',        desc_en: 'Increase running speed',
      desc_de: 'Erhöhe die Laufgeschwindigkeit',      desc_es: 'Aumenta la velocidad de carrera' },
    { id: 'dribbling',             icon: '🏃',
      name_it: 'Allena Dribbling',     name_en: 'Dribbling',          name_de: 'Dribbling-Training',   name_es: 'Entrenamiento de Regate',
      desc_it: 'Migliora il controllo palla',         desc_en: 'Improve ball control',
      desc_de: 'Verbessere die Ballkontrolle',        desc_es: 'Mejora el control del balón' },
    { id: 'allenamento_fisico',    icon: '💪',
      name_it: 'Allena Fisico',        name_en: 'Physical Training',  name_de: 'Körpertraining',       name_es: 'Entrenamiento Físico',
      desc_it: 'Costruisci massa muscolare',          desc_en: 'Build muscle mass',
      desc_de: 'Baue Muskelmasse auf',               desc_es: 'Desarrolla masa muscular' },
    { id: 'allenamento_mentalita', icon: '🧠',
      name_it: 'Allena Mentalità',     name_en: 'Mental Training',    name_de: 'Mentaltraining',       name_es: 'Entrenamiento Mental',
      desc_it: 'Migliora focus e resistenza mentale', desc_en: 'Improve focus and mental stamina',
      desc_de: 'Verbessere Fokus und mentale Stärke', desc_es: 'Mejora el enfoque y la resistencia mental' },
    { id: 'riposo',                icon: '😴',
      name_it: 'Riposo',               name_en: 'Rest',               name_de: 'Ruhe',                 name_es: 'Descanso',
      desc_it: 'Recupera energia e morale',           desc_en: 'Recover energy and morale',
      desc_de: 'Energie und Moral erholen',           desc_es: 'Recupera energía y moral' },
    { id: 'social',                icon: '📱',
      name_it: 'Attività Social',      name_en: 'Social Activity',    name_de: 'Soziale Aktivitäten',  name_es: 'Actividades Sociales',
      desc_it: 'Aumenta la popolarità',               desc_en: 'Increase popularity',
      desc_de: 'Popularität steigern',                desc_es: 'Aumenta la popularidad' },
    { id: 'allenamento_speciale',  icon: '🔥',
      name_it: 'Allenamento Speciale', name_en: 'Special Training',   name_de: 'Spezialtraining',      name_es: 'Entrenamiento Especial',
      desc_it: 'Alto rischio, alto guadagno',         desc_en: 'High risk, high reward',
      desc_de: 'Hohes Risiko, hoher Gewinn',          desc_es: 'Alto riesgo, alta recompensa' },
];
function getActions() {
    return ACTIONS_DEF.map(a => ({
        id: a.id, icon: a.icon,
        name: {en:a.name_en,de:a.name_de||a.name_en,es:a.name_es||a.name_en,it:a.name_it}[currentLang]||a.name_it,
        desc: {en:a.desc_en,de:a.desc_de||a.desc_en,es:a.desc_es||a.desc_en,it:a.desc_it}[currentLang]||a.desc_it,
    }));
}
function _buildActionsGrid() {
    const grid = document.getElementById('actions-grid');
    if (!grid) return;
    grid.innerHTML = getActions().map(a => `
        <button class="action-btn" data-action="${a.id}" onclick="toggleAction('${a.id}', this)">
            <span class="action-icon">${a.icon}</span>
            <div class="action-name">${a.name}</div>
            <div class="action-desc">${a.desc}</div>
        </button>`).join('');
}

function toggleAction(id, el) {
    if (el.classList.contains('action-blocked')) {
        const infortuni = parseInt(currentPlayer?.infortuni_mesi ?? 0);
        const energia   = parseInt(currentPlayer?.energia ?? 0);
        if (infortuni > 0) toast(_t('injury_blocked'), 'error');
        else if (energia === 0) toast(_t('energy_blocked'), 'error');
        return;
    }
    if (selectedActions.includes(id)) {
        selectedActions = selectedActions.filter(a => a !== id);
        el.classList.remove('selected');
    } else if (selectedActions.length < 3) {
        selectedActions.push(id);
        el.classList.add('selected');
    } else {
        toast(_t('actions_max'), 'error');
    }
    updatePlayBtn();
}

function updatePlayBtn() {
    const btn = document.getElementById('play-month-btn');
    btn.disabled = selectedActions.length === 0;
    btn.textContent = selectedActions.length > 0
        ? `${_t('play_btn_ready')} (${selectedActions.length})`
        : _t('play_btn');
}

document.getElementById('play-month-btn')?.addEventListener('click', async () => {
    if (selectedActions.length === 0) return;
    // Guest mode: non può giocare partite reali
    if (_isGuestMode) {
        toast({it:'👤 Modalità Ospite — registrati per salvare la carriera e giocare!',en:'👤 Guest mode — sign up to save your career and play!',de:'👤 Gastmodus — registriere dich, um deine Karriere zu speichern!',es:'👤 Modo Invitado — regístrate para guardar tu carrera!'}[currentLang]||'👤 Modalità Ospite — registrati per salvare la carriera e giocare!', 'gold');
        setTimeout(() => exitGuestMode(), 1800);
        return;
    }
    const btn = document.getElementById('play-month-btn');
    btn.disabled = true;
    btn.textContent = _t('sim_running');
    const res = await api('game.php', { action: 'play_month', azioni: selectedActions });
    if (res.error) {
        toast(res.error, 'error');
        btn.disabled = false;
        updatePlayBtn();
        return;
    }
    await loadPlayer();

    // Particles for special events
    if (window.GS_Particles) {
        if (res.pallone_doro?.pos === 1 || res.champions_win || res.promozione?.includes('PROMOZIONE')) {
            GS_Particles.effects.confettiRain();
        }
    }

    // Achievements check
    if (window.GS_Achievements && currentPlayer) {
        GS_Achievements.checkMonthResults(res, currentPlayer);
        GS_Achievements.checkFromPlayer(currentPlayer);
    }

    // Live commentary
    if (window.GS_Commentary && res.lega_msgs?.length > 0) {
        const lm = res.lega_msgs[0];
        const seq = GS_Commentary.generateMatchSequence(
            currentPlayer?.player_name || '',
            currentPlayer?.team_nome || '',
            lm.player_gol || 0,
            lm.esito || 'P',
            currentLang
        );
        GS_Commentary.playCommentary(seq, 3500);
    }

    if (res.pallone_doro?.pos === 1) {
        // Show Pallone d'Or speech
        if (window.GS_Locale) {
            const speech = GS_Locale.getPalloneSpeech();
            setTimeout(() => {
                const speechEl = document.getElementById('pd-speech');
                if (speechEl) { speechEl.textContent = speech; speechEl.style.display = 'block'; }
            }, 1500);
        }
        await _showPalloneDoro(res.pallone_doro.msg);
    }
    showResults(res);

    // Schermata di ritiro / fine carriera
    if (res.fine_carriera && res.career_summary) {
        showRetirement(res.career_summary);
    }
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
        if (r.startsWith('🩹') || r.startsWith('🚑') || r.startsWith('🚨') || r.startsWith('🤕') || r.includes('INFORTUN') || r.includes('infortun') || r.includes('Verletz') || r.includes('lesión') || r.includes('Lesión') || r.includes('blessure')) infortuni.push(r);
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
        html += `<div class="res-banner">${_t('end_career_banner')}</div>`;
    if (res.promozione) {
        const tipo = res.promozione.includes('PROMOZIONE') ? 'promozione' : 'retrocessione';
        html += `<div class="res-banner ${tipo}-banner">${res.promozione}</div>`;
    }
    if (allenamento.length) {
        html += `<div class="res-section"><div class="res-section-title">${_t('res_section_training')}</div>
            <div class="res-row-wrap">${allenamento.map(r=>`<div class="res-chip">${r}</div>`).join('')}</div></div>`;
    }
    if (infortuni.length) {
        html += `<div class="res-section infortuni-section"><div class="res-section-title">${_t('res_section_injuries')}</div>
            ${infortuni.map(r=>`<div class="res-chip danger">${r}</div>`).join('')}</div>`;
    }
    if (legaMsgs.length) {
        const esitoColor = { V:'#4ade80', P:'#facc15', S:'#f87171' };
        const esitoLabel = { V:_t('match_win'), P:_t('match_draw'), S:_t('match_loss') };
        html += `<div class="res-section"><div class="res-section-title">${_t('res_section_matches')}</div><div class="res-matches">`;
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
                    <span class="res-match-casa">${m.isHome ? _t('match_home') : _t('match_away')}</span>
                </div>
                <div class="res-match-score">${m.gf} – ${m.gs}</div>
                <div class="res-match-vs">vs <strong>${m.avv}</strong></div>
                <div class="res-match-pts">+${punti} pt</div>
                <div class="res-match-stats">
                    <span>⚽ ${m.player_gol ?? '-'} ${_t('stat_gol')}</span>
                    <span>🎯 ${m.player_assist ?? '-'} assist</span>
                    <span>📊 ${m.player_voto ?? '-'}</span>
                </div>
            </div>`;
        });
        html += `</div></div>`;
    }
    // Feed live: altre partite della giornata nella lega del giocatore.
    // Le righe vengono popolate progressivamente da _animateResultsModal.
    const altre = res.altre_partite || [];
    if (altre.length) {
        html += `<div class="res-section res-livefeed-section"><div class="res-section-title">${_t('res_section_livefeed')}</div>
            <div class="res-livefeed" id="res-livefeed"></div></div>`;
    }
    if (champions.length) {
        html += `<div class="res-section"><div class="res-section-title">${_t('res_section_champions')}</div>
            ${champions.map(r=>`<div class="res-chip">${r}</div>`).join('')}</div>`;
    }
    if (altri.length) {
        html += `<div class="res-section"><div class="res-section-title">${_t('res_section_other')}</div>
            <div class="res-row-wrap">${altri.map(r=>`<div class="res-chip">${r}</div>`).join('')}</div></div>`;
    }

    list.innerHTML = html;
    _animateResultsModal(modal, res);
}

// ── Schermata di ritiro / fine carriera ─────────────────────────────────────
function showRetirement(summary) {
    const modal = document.getElementById('retirement-modal');
    const content = document.getElementById('retirement-content');
    if (!modal || !content || !summary) return;

    const s = summary.stats || {};
    const L = {
        title:   {it:'🏁 Ritiro dal Calcio', en:'🏁 Retirement', de:'🏁 Karriereende', es:'🏁 Retirada'}[currentLang] || '🏁 Ritiro dal Calcio',
        rating:  {it:'Voto alla Carriera', en:'Career Rating', de:'Karrierenote', es:'Nota de Carrera'}[currentLang] || 'Voto alla Carriera',
        lifetime:{it:'Statistiche Lifetime', en:'Lifetime Stats', de:'Karrierestatistik', es:'Estadísticas de por vida'}[currentLang] || 'Statistiche Lifetime',
        legends: {it:'Tra le leggende', en:'Among the legends', de:'Unter den Legenden', es:'Entre las leyendas'}[currentLang] || 'Tra le leggende',
        you:     {it:'TU', en:'YOU', de:'DU', es:'TÚ'}[currentLang] || 'TU',
        lbl: {
            seasons: {it:'Stagioni', en:'Seasons', de:'Saisons', es:'Temporadas'}[currentLang] || 'Stagioni',
            matches: {it:'Partite', en:'Matches', de:'Spiele', es:'Partidos'}[currentLang] || 'Partite',
            goals:   {it:'Gol', en:'Goals', de:'Tore', es:'Goles'}[currentLang] || 'Gol',
            assists: {it:'Assist', en:'Assists', de:'Vorlagen', es:'Asistencias'}[currentLang] || 'Assist',
            ballon:  {it:"Palloni d'Oro", en:'Ballon d\'Ors', de:'Ballons d\'Or', es:'Balones de Oro'}[currentLang] || "Palloni d'Oro",
            trophies:{it:'Trofei', en:'Trophies', de:'Trophäen', es:'Trofeos'}[currentLang] || 'Trofei',
            avg:     {it:'Media voto', en:'Avg rating', de:'Ø Note', es:'Media nota'}[currentLang] || 'Media voto',
            gpm:     {it:'Gol/partita', en:'Goals/match', de:'Tore/Spiel', es:'Goles/partido'}[currentLang] || 'Gol/partita',
            peak:    {it:'Overall di picco', en:'Peak overall', de:'Höchster Overall', es:'Overall máximo'}[currentLang] || 'Overall di picco',
        }
    };

    // Colore del voto in base alla fascia
    const v = summary.voto;
    const vColor = v >= 88 ? '#FFD700' : v >= 72 ? '#00C566' : v >= 55 ? '#3E8FE8' : v >= 38 ? '#7C5CFC' : v >= 22 ? '#A0B4C8' : '#6B8299';

    const statCard = (lbl, val, color) => `
        <div class="ret-stat">
            <div class="ret-stat-val" style="color:${color||'#fff'}">${val}</div>
            <div class="ret-stat-lbl">${lbl}</div>
        </div>`;

    const legendRows = (summary.confronto || []).map(c => `
        <div class="ret-legend-row ${c.is_player ? 'ret-legend-me' : ''}">
            <span class="ret-legend-name">${c.is_player ? `⭐ ${esc(c.nome)}` : esc(c.nome)}${c.is_player ? ` <span class="ret-you-badge">${L.you}</span>` : ''}</span>
            <span class="ret-legend-desc">${c.desc || ''}</span>
            <span class="ret-legend-voto" style="color:${c.is_player ? vColor : 'var(--text-dim)'}">${c.voto}</span>
        </div>`).join('');

    content.innerHTML = `
        <h2 id="retirement-title" class="ret-title">${L.title}</h2>
        <div class="ret-hero">
            <div class="ret-emoji">${summary.emoji}</div>
            <div class="ret-honor">${esc(summary.titolo)}</div>
            <div class="ret-rating-ring" style="--ring-color:${vColor};--pct:${v}">
                <span class="ret-rating-num" style="color:${vColor}">${v}</span>
                <span class="ret-rating-max">/100</span>
            </div>
            <div class="ret-rating-lbl">${L.rating}</div>
        </div>
        <p class="ret-verdict">${summary.verdetto}</p>

        <div class="ret-section-title">${L.lifetime}</div>
        <div class="ret-stats-grid">
            ${statCard(L.lbl.ballon, s.palloni_doro ?? 0, '#FFD700')}
            ${statCard(L.lbl.trophies, s.trofei ?? 0, '#E8B84B')}
            ${statCard(L.lbl.goals, s.gol ?? 0, '#00C566')}
            ${statCard(L.lbl.assists, s.assist ?? 0, '#3E8FE8')}
            ${statCard(L.lbl.matches, s.partite ?? 0)}
            ${statCard(L.lbl.seasons, s.stagioni ?? 0)}
            ${statCard(L.lbl.avg, (() => { const v = parseFloat(s.media_voto); return Number.isFinite(v) ? v.toFixed(2) : '—'; })(), '#7C5CFC')}
            ${statCard(L.lbl.gpm, s.gol_partita ?? 0)}
            ${statCard(L.lbl.peak, s.overall_max ?? 0)}
        </div>

        <div class="ret-section-title">${L.legends} — #${summary.rank_leggende}</div>
        <div class="ret-legends">${legendRows}</div>`;

    modal.classList.add('active');
    void modal.offsetHeight;
    requestAnimationFrame(() => modal.classList.add('modal-fade-in'));

    // Celebrazione per carriere di alto livello
    if (window.GS_Particles && v >= 72) {
        setTimeout(() => GS_Particles.effects.confettiRain(), 400);
    }
}

function closeRetirement() {
    const modal = document.getElementById('retirement-modal');
    if (modal) { modal.classList.remove('modal-fade-in'); modal.classList.remove('active'); }
    // Torna alla selezione carriere
    if (typeof goToCareerSelect === 'function') goToCareerSelect();
}

function _animateResultsModal(modal, res) {
    // Annulla eventuali timer del feed live ancora pendenti da una chiamata
    // precedente (es. mese giocato in rapida successione), così non scrivono
    // su un elemento ormai sostituito.
    if (window._feedTimers) { window._feedTimers.forEach(clearTimeout); }
    window._feedTimers = [];

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
        setTimeout(() => el.classList.add('anim-in'), 350 + i * 250);
    });

    // 4. Card partite: flip sequenziale
    // Le card partono dopo che la sezione "Partite" ha finito la sua transizione (delay + 400ms durata)
    const cards = modal.querySelectorAll('.res-match-card');
    const lastSectionDelay = sections.length > 0 ? 350 + (sections.length - 1) * 250 : 350;
    const cardStart = lastSectionDelay + 600; // attendi fine transizione dell'ultima sezione
    cards.forEach((card, i) => {
        setTimeout(() => {
            card.classList.add('flipped');
            if (parseInt(card.dataset.gol) >= 3) {
                setTimeout(() => _burstBalls(card), 200);
            }
        }, cardStart + i * 500);
    });

    // 5. Confetti se campionato vinto
    const hasCampionato = (res.risultati || []).some(r => r.includes('CAMPIONI') || r.includes('campionato'));
    if (hasCampionato) {
        setTimeout(() => _launchConfetti(), cardStart + cards.length * 500 + 200);
    }

    // 6. Feed live: le altre partite della lega compaiono una alla volta,
    //    come una giornata di campionato che si aggiorna in tempo reale.
    const feed = modal.querySelector('#res-livefeed');
    const altre = res.altre_partite || [];
    if (feed && altre.length) {
        const feedStart = cardStart + cards.length * 500 + 300;
        altre.forEach((m, i) => {
            const timer = setTimeout(() => {
                // Se il feed è stato rimosso dal DOM (modale chiusa), non fare nulla
                if (!feed.isConnected) return;
                const row = document.createElement('div');
                row.className = 'res-feed-row';
                const homeWin = parseInt(m.gf) > parseInt(m.gs);
                const awayWin = parseInt(m.gs) > parseInt(m.gf);
                row.innerHTML = `
                    <span class="res-feed-team ${homeWin ? 'res-feed-win' : ''}">${(m.home||'').replace(/</g,'&lt;')}</span>
                    <span class="res-feed-score">${m.gf}<span class="res-feed-dash">–</span>${m.gs}</span>
                    <span class="res-feed-team res-feed-away ${awayWin ? 'res-feed-win' : ''}">${(m.away||'').replace(/</g,'&lt;')}</span>`;
                feed.appendChild(row);
                void row.offsetHeight; // reflow per attivare la transizione
                requestAnimationFrame(() => row.classList.add('res-feed-in'));
                feed.scrollTop = feed.scrollHeight;
            }, feedStart + i * 320);
            window._feedTimers.push(timer);
        });
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
                <div id="pd-speech" class="pd-speech" style="display:none;font-style:italic;color:rgba(255,215,0,0.85);font-size:0.92rem;max-width:380px;text-align:center;margin-top:16px;padding:10px 16px;border:1px solid rgba(255,215,0,0.2);border-radius:8px;background:rgba(255,215,0,0.04);"></div>
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

document.getElementById('close-results')?.addEventListener('click', () => {
    const modal = document.getElementById('results-modal');
    modal.classList.remove('active', 'modal-fade-in');
    modal.querySelectorAll('.anim-in').forEach(el => el.classList.remove('anim-in'));
    modal.querySelectorAll('.flipped').forEach(el => el.classList.remove('flipped'));
    // Annulla i timer del feed live ancora pendenti
    if (window._feedTimers) { window._feedTimers.forEach(clearTimeout); window._feedTimers = []; }
    // Aggiorna dashboard ora che è visibile — le barre animano correttamente
    if (_pendingDashboardRefresh) {
        _pendingDashboardRefresh = false;
        renderDashboard();
    }
});

async function loadRecentLog() {
    try {
    const res = await api('player.php', { action: 'log' }, 'GET');
    const logEl = document.getElementById('recent-log');
    if (!logEl) return;
    if (!res || res.error || !res.length) {
        logEl.innerHTML = `<li class="log-item" style="color:var(--text-dim)">${_t('no_activity')}</li>`;
        return;
    }
    logEl.innerHTML = res.slice(0, 6).map(l => `
        <li class="log-item">
            <div class="log-date">${getMeseName(l.mese)} ${_t('career_year_label')} ${l.anno}${l.avv ? ` · vs ${l.avv}` : ''}</div>
            <div class="log-text">${l.gol}⚽ ${l.assist}🎯 ${_t('stat_voto').charAt(0).toUpperCase()+_t('stat_voto').slice(1)}: ${l.voto}</div>
            ${l.evento_speciale ? `<div style="color:var(--gold);font-size:0.75rem">🎲 ${l.evento_speciale}</div>` : ''}
        </li>
    `).join('');
    } catch(e) { console.error('loadRecentLog error:', e); }
}

// ── CAREER ──
async function loadCareer() {
    try {
    const container = document.getElementById('career-seasons-list');
    container.innerHTML = `<p class="loading">${_t('loading')}</p>`;

    let [seasons, p] = await Promise.all([
        api('player.php', { action: 'season' }, 'GET'),
        api('player.php', { action: 'get', career_id: currentCareerId }, 'GET')
    ]);
    // Difesa: l'API può restituire un oggetto errore invece di un array.
    // Normalizziamo sempre a array per evitare crash su spread/map/length.
    if (!Array.isArray(seasons)) seasons = [];
    const annoCorrente = p?.anno_corrente ?? 0;

    // Load enhanced analytics after seasons render
    setTimeout(loadCareerAnalytics, 100);

    // ── Career Charts ───────────────────────────────────────────
    if (window.GS_Charts && seasons?.length > 1) {
        const careerHeader = document.getElementById('career-seasons-list');
        const chartsDiv = document.createElement('div');
        chartsDiv.className = 'career-charts-grid';
        chartsDiv.style.marginBottom = '20px';

        // Goals per season bar chart
        const goalBox = document.createElement('div');
        goalBox.className = 'career-chart-box';
        const goalData = (seasons || []).slice(0, 8).reverse().map(s => ({
            label: `A${s.anno}`,
            value: parseInt(s.gol || 0),
            color: '#FFD700',
        }));
        GS_Charts.barChart(goalBox, goalData, { id: 'chart-goals', title: '⚽ Gol / Stagione', height: 180 });
        chartsDiv.appendChild(goalBox);

        // OVR progression line chart
        const ovrBox = document.createElement('div');
        ovrBox.className = 'career-chart-box';
        const seasonsSorted = (seasons || []).slice(0, 8).reverse();
        GS_Charts.lineChart(ovrBox, [{
            data: seasonsSorted.map(s => parseInt(s.media_voto || 6)),
            label: _t('career_best_rating'),
            color: '#10b981',
        }], {
            id: 'chart-ovr',
            title: '📈 Voto Medio',
            labels: seasonsSorted.map(s => `A${s.anno}`),
            height: 180,
        });
        chartsDiv.appendChild(ovrBox);

        // Stats radar
        if (p) {
            const radarBox = document.createElement('div');
            radarBox.className = 'career-chart-box radar-chart-container';
            GS_Charts.radarChart(radarBox, {
                [_t('stat_tiro')]: parseInt(p.tiro || 0),
                [_t('stat_velocita')]: parseInt(p.velocita || 0),
                [_t('stat_dribbling')]: parseInt(p.dribbling || 0),
                [_t('stat_fisico')]: parseInt(p.fisico || 0),
                [_t('stat_mentalita')]: parseInt(p.mentalita || 0),
            }, { id: 'career-radar', size: 240 });
            chartsDiv.appendChild(radarBox);
        }

        // Assist bar chart
        const assistBox = document.createElement('div');
        assistBox.className = 'career-chart-box';
        const assistData = (seasons || []).slice(0, 8).reverse().map(s => ({
            label: `A${s.anno}`,
            value: parseInt(s.assist || 0),
            color: '#3b82f6',
        }));
        GS_Charts.barChart(assistBox, assistData, { id: 'chart-assists', title: '🎯 Assist / Stagione', height: 180 });
        chartsDiv.appendChild(assistBox);

        // Remove old charts if they exist (prevent duplicates on re-render)
        const existingCharts = careerHeader.parentElement.querySelector('.career-charts-grid');
        if (existingCharts) existingCharts.remove();
        careerHeader.parentElement.insertBefore(chartsDiv, careerHeader);

    // ── Analytics dashboard ──────────────────────────────────────────────────
    if (window.GS_Analytics && p) {
        const analyticsDash = document.getElementById('career-analytics-dash');
        if (analyticsDash) {
            analyticsDash.innerHTML = ''; // Clear previous content
            analyticsDash.style.cssText = 'background:var(--card);border:1px solid var(--border);border-radius:14px;padding:16px';
            const label = document.createElement('div');
            label.style.cssText = 'font-size:0.72rem;font-weight:800;color:var(--gold);text-transform:uppercase;letter-spacing:1px;margin-bottom:10px';
            label.textContent = {it:'🏃 Prestazioni',en:'🏃 Performance',de:'🏃 Leistung',es:'🏃 Rendimiento'}[currentLang]||'🏃 Prestazioni';
            analyticsDash.appendChild(label);
            const keyStatsEl = document.createElement('div');
            analyticsDash.appendChild(keyStatsEl);
            GS_Analytics.renderKeyStats(keyStatsEl, p, []);
        }
    }

    // ── W/L/D Pie chart ──────────────────────────────────────────────────────
    if (window.GS_Analytics) {
        const log = await api('player.php', { action: 'log', career_id: currentCareerId }, 'GET');
        const pieWrap = document.getElementById('career-wld-pie');
        if (pieWrap && log?.length) {
            pieWrap.innerHTML = ''; // Clear previous
            const pieContainer = document.createElement('div');
            pieWrap.appendChild(pieContainer);
            GS_Analytics.renderWLDPie(pieContainer, log);

            // Also render goal heatmap
            const heatWrap = document.createElement('div');
            heatWrap.style.marginTop = '16px';
            const heatLabel = document.createElement('div');
            heatLabel.style.cssText = 'font-size:0.72rem;font-weight:800;color:var(--gold);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px';
            heatLabel.textContent = {it:'⚽ Gol/Mese',en:'⚽ Goals/Month',de:'⚽ Tore/Monat',es:'⚽ Goles/Mes'}[currentLang]||'⚽ Gol/Mese';
            pieWrap.appendChild(heatLabel);
            GS_Analytics.renderGoalHeatmap(pieWrap, log);
        }
    }

    // ── Career Timeline ──────────────────────────────────────────────────────
    if (window.GS_Timeline) {
        const timelineWrap = document.getElementById('career-timeline-wrap');
        const achievData = window.GS_Achievements ? GS_Achievements.getAll() : [];
        if (timelineWrap) GS_Timeline.render(timelineWrap, seasons, p, achievData);
    }
    }

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
        container.innerHTML = `<p style="color:var(--text-dim);text-align:center;padding:40px">${_t('no_seasons')}</p>`;
        return;
    }

    container.innerHTML = rows.map(s => {
        const inCorso = s.inCorso || s.anno === annoCorrente;
        const tag = inCorso ? `<span class="career-year-tag">${_t('career_ongoing')}</span>` : '';
        return `
        <div class="career-year-row ${inCorso ? 'in-corso' : ''}" id="career-row-${s.anno}">
            <div class="career-year-header" onclick="toggleCareerYear(${s.anno})">
                <span class="career-year-title">${_t('career_year_label')} ${s.anno}</span>
                ${tag}
                <span class="career-year-stats">
                    <span>⚽ <strong>${s.gol ?? '-'}</strong> ${_t('stat_gol')}</span>
                    <span>🎯 <strong>${s.assist ?? '-'}</strong> assist</span>
                    <span>🏟️ <strong>${s.partite ?? '-'}</strong> ${_t('stat_partite')}</span>
                    <span>⭐ <strong>${s.media_voto ?? '-'}</strong> ${_t('stat_voto')}</span>
                    ${s.lega_nome ? `<span style="color:var(--text-dim)">${s.lega_nome}</span>` : ''}
                </span>
                <span class="career-year-chevron">▼</span>
            </div>
            <div class="career-year-detail" id="career-detail-${s.anno}">
                <p style="color:var(--text-dim);font-size:0.85rem;padding:12px 0">${_t('loading')}</p>
            </div>
        </div>`;
    }).join('');
    } catch(e) { console.error('loadCareer error:', e); }
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
        detail.innerHTML = `<p style="color:var(--text-dim);padding:8px 0">${_t('career_no_data_season')}</p>`;
        return;
    }

    const getMeseNome = (m) => ['','Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'][m] || `M${m}`;

    // Trofei
    let trofeiHTML = '';
    const trofei = [];
    if (res.campionato_vinto) {
        const lv = parseInt(res.campionato_vinto.livello ?? 1);
        const nome = res.campionato_vinto.lega_nome || (lv === 1 ? _t('league_div1') : _t('league_div2'));
        trofei.push(`<span class="career-trofeo-badge ${lv === 1 ? 'trofeo-campionato-1' : 'trofeo-campionato-2'}">🏆 ${nome}</span>`);
    }
    if (res.champions_win) {
        trofei.push(`<span class="career-trofeo-badge trofeo-champions">${_t('champions_badge')}</span>`);
    }
    if (res.pallone_doro_pos === 1) {
        trofei.push(`<span class="career-trofeo-badge trofeo-pallone">${_t('pallone_badge')}</span>`);
    } else if (res.pallone_doro_pos > 0 && res.pallone_doro_pos <= 3) {
        trofei.push(`<span class="career-trofeo-badge" style="background:rgba(148,163,184,0.12);border-color:var(--text-dim);color:var(--text-dim)">🥈 ${_t('pallone_top')} ${res.pallone_doro_pos}</span>`);
    }
    if (trofei.length) {
        trofeiHTML = `<div style="margin-top:16px"><div style="font-size:0.75rem;color:var(--text-dim);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">${_t('career_trophies_title')}</div><div class="career-trofei">${trofei.join('')}</div></div>`;
    }

    // Card best performances
    // tipo: 'gol' | 'assist' | 'rating' (internal key, not display label)
    const fmtLog = (log, tipo) => {
        const label = tipo === 'gol'    ? _t('career_best_gol_label')
                    : tipo === 'assist' ? _t('career_best_assist_label')
                    :                    _t('career_best_rating_label');
        if (!log) return `<div class="career-detail-card"><div class="career-detail-label">${label}</div><div class="career-detail-sub">${_t('career_no_data')}</div></div>`;
        const mese = getMeseNome(parseInt(log.mese));
        const logAnno = log.anno || anno;
        const avvStr = log.avversario ? ` · vs ${log.avversario}` : '';
        const dataStr = `${mese} ${_t('career_year_label')} ${logAnno}${avvStr}`;
        if (tipo === 'gol')
            return `<div class="career-detail-card">
                <div class="career-detail-label">⚽ ${label}</div>
                <div class="career-detail-val">${log.gol} ${_t('stat_gol')}</div>
                <div class="career-detail-sub">${dataStr}</div>
                <div class="career-detail-sub">${log.assist} ${_t('stat_assist')} · ${_t('stat_voto')} ${log.voto}</div>
            </div>`;
        if (tipo === 'assist')
            return `<div class="career-detail-card">
                <div class="career-detail-label">🎯 ${label}</div>
                <div class="career-detail-val">${log.assist} ${_t('stat_assist')}</div>
                <div class="career-detail-sub">${dataStr}</div>
                <div class="career-detail-sub">${log.gol} ${_t('stat_gol')} · ${_t('stat_voto')} ${log.voto}</div>
            </div>`;
        return `<div class="career-detail-card">
            <div class="career-detail-label">⭐ ${label}</div>
            <div class="career-detail-val">${_t('stat_voto').charAt(0).toUpperCase()+_t('stat_voto').slice(1)} ${log.voto}</div>
            <div class="career-detail-sub">${dataStr}</div>
            <div class="career-detail-sub">${log.gol} ${_t('stat_gol')} · ${log.assist} ${_t('stat_assist')}</div>
        </div>`;
    };

    detail.innerHTML = `
        <div class="career-detail-grid">
            ${fmtLog(res.best_gol, 'gol')}
            ${fmtLog(res.best_assist, 'assist')}
            ${fmtLog(res.best_voto, 'rating')}
        </div>
        ${trofeiHTML}
    `;
}

// ── TRANSFER (BUG CORRETTO — funzione completata) ──
