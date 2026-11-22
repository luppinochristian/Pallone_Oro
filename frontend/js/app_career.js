/* app_career.js — carriera: log, analytics, achievement, scorciatoie, eventi.
 * Estratto da app.js (refactor): nessuna logica modificata.
 * Caricato in ordine da index.html. */

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

// ── RICHIEDI UPDATE ──
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
    try {
    const txt = document.getElementById('update-request-text')?.value.trim();
    const err = document.getElementById('update-request-error');
    const ok  = document.getElementById('update-request-ok');
    if (err) err.textContent = '';
    if (!txt || txt.length < 10) {
        if (err) err.textContent = _t('agente_min_chars');
        return;
    }
    const res = await api('auth.php', { action: 'send_update_request', message: txt }, 'POST');
    if (res.error) { if (err) err.textContent = res.error; return; }
    if (ok) ok.style.display = 'block';
    setTimeout(closeUpdateRequest, 2500);
    } catch(e) { console.error('sendUpdateRequest error:', e); }
}

// ========================

// ── ENHANCED MATCH LOG VIEWER ──

let _logFilterEsito  = 'all';
let _logFilterSeason = 'all';
let _logSearchQuery  = '';
let _logPage         = 0;
const LOG_PAGE_SIZE  = 20;

function switchCareerTab(tab) {
    const seasonsList = document.getElementById('career-seasons-list');
    const logContainer = document.getElementById('career-log-container');
    const tabSeasons = document.getElementById('career-tab-seasons');
    const tabLog = document.getElementById('career-tab-log');
    if (tab === 'seasons') {
        if (seasonsList) seasonsList.style.display = '';
        if (logContainer) logContainer.style.display = 'none';
        if (tabSeasons) tabSeasons.classList.add('active');
        if (tabLog) tabLog.classList.remove('active');
    } else {
        if (seasonsList) seasonsList.style.display = 'none';
        if (logContainer) logContainer.style.display = '';
        if (tabSeasons) tabSeasons.classList.remove('active');
        if (tabLog) tabLog.classList.add('active');
        loadCareerLog();
    }
}

async function loadCareerLog() {
    try {
    const container = document.getElementById('career-log-container');
    if (!container) return;
    container.innerHTML = `<div class="gs-skeleton-wrap">${['100%','80%','90%','70%','85%'].map(w=>`<div class="gs-skeleton-line" style="width:${w}"></div>`).join('')}</div>`;

    const [logData, p] = await Promise.all([
        api('player.php', { action: 'log', career_id: currentCareerId }, 'GET'),
        api('player.php', { action: 'get', career_id: currentCareerId }, 'GET'),
    ]);

    if (!Array.isArray(logData) || !logData.length) {
        container.innerHTML = `<p style="color:var(--text-dim);padding:20px;text-align:center">${_t('no_seasons')}</p>`;
        return;
    }

    // Build filter UI
    const seasons = [...new Set(logData.map(l => l.anno))].sort((a,b) => b - a);
    const filterBar = document.createElement('div');
    filterBar.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;align-items:center';
    filterBar.innerHTML = `
        <input type="text" placeholder="${{it:'Cerca avversario...',en:'Search opponent...',de:'Gegner suchen...',es:'Buscar rival...'}[currentLang]||'Cerca avversario...'}"
            style="flex:1;min-width:160px;background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:6px 12px;color:var(--text);font-size:0.82rem"
            id="log-search" oninput="filterLog(this.value,'search')">
        <select style="background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:6px 10px;color:var(--text);font-size:0.82rem" onchange="filterLog(this.value,'season')" id="log-season-filter">
            <option value="all">${{it:'Tutte le stagioni',en:'All seasons',de:'Alle Saisons',es:'Todas las temporadas'}[currentLang]||'Tutte le stagioni'}</option>
            ${seasons.map(s => `<option value="${s}">${{it:'Stagione',en:'Season',de:'Saison',es:'Temporada'}[currentLang]||'Stagione'} ${s}</option>`).join('')}
        </select>
        <div style="display:flex;gap:4px">
            ${['all','V','P','S'].map(e => `<button onclick="filterLog('${e}','esito')" 
                style="padding:5px 10px;border-radius:6px;border:1px solid var(--border);background:transparent;color:var(--text-dim);font-size:0.75rem;cursor:pointer;font-weight:700"
                class="log-esito-btn" data-esito="${e}">${e === 'all' ? ({it:'Tutti',en:'All',de:'Alle',es:'Todos'}[currentLang]||'Tutti') : e === 'V' ? (currentLang === 'en' ? 'W' : 'V') : e === 'P' ? 'D' : (currentLang === 'en' ? 'L' : 'S')}</button>`).join('')}
        </div>`;

    // Stats summary
    const wins = logData.filter(l => l.esito === 'V').length;
    const draws = logData.filter(l => l.esito === 'P').length;
    const losses = logData.filter(l => l.esito === 'S').length;
    const totalGol = logData.reduce((a, l) => a + parseInt(l.gol || 0), 0);
    const totalAssist = logData.reduce((a, l) => a + parseInt(l.assist || 0), 0);
    const avgVoto = logData.length ? (logData.reduce((a, l) => a + parseFloat(l.voto || 6), 0) / logData.length).toFixed(2) : '0';

    const statsBar = document.createElement('div');
    statsBar.style.cssText = 'display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px';
    const statItems = [
        { val: logData.length, lbl: {it:'Partite',en:'Matches',de:'Spiele',es:'Partidos'}[currentLang]||'Partite', color: '#fff' },
        { val: wins, lbl: {it:'Vittorie',en:'Wins',de:'Siege',es:'Victorias'}[currentLang]||'Vittorie', color: '#10b981' },
        { val: draws, lbl: {it:'Pareggi',en:'Draws',de:'Unentschieden',es:'Empates'}[currentLang]||'Pareggi', color: '#eab308' },
        { val: losses, lbl: {it:'Sconfitte',en:'Losses',de:'Niederlagen',es:'Derrotas'}[currentLang]||'Sconfitte', color: '#ef4444' },
        { val: totalGol, lbl: {it:'Gol',en:'Goals',de:'Tore',es:'Goles'}[currentLang]||'Gol', color: '#FFD700' },
        { val: totalAssist, lbl: {it:'Assist',en:'Assists',de:'Vorlagen',es:'Asistencias'}[currentLang]||'Assist', color: '#3b82f6' },
        { val: avgVoto, lbl: {it:'Media Voto',en:'Avg Rating',de:'Ø Bewertung',es:'Media Valoración'}[currentLang]||'Media Voto', color: '#8b5cf6' },
    ];
    statsBar.innerHTML = statItems.map(s => `
        <div style="background:var(--bg3);border:1px solid var(--border);border-radius:10px;padding:10px 14px;text-align:center;flex:1;min-width:70px">
            <div style="font-size:1.3rem;font-weight:900;color:${s.color}">${s.val}</div>
            <div style="font-size:0.65rem;color:var(--text-dim);text-transform:uppercase;letter-spacing:0.5px;margin-top:2px">${s.lbl}</div>
        </div>`).join('');

    // Log table
    const tableWrap = document.createElement('div');
    tableWrap.id = 'log-table-wrap';
    tableWrap.className = 'table-scroll';

    container.innerHTML = '';
    container.appendChild(filterBar);
    container.appendChild(statsBar);
    container.appendChild(tableWrap);

    // Store data for filtering
    container._logData = logData;
    renderLogTable(logData, tableWrap);
    } catch(e) { console.error('loadCareerLog error:', e); }
}

function filterLog(val, type) {
    const container = document.getElementById('career-log-container');
    if (!container?._logData) return;
    if (type === 'search') _logSearchQuery = val.toLowerCase();
    if (type === 'season') _logFilterSeason = val;
    if (type === 'esito')  { _logFilterEsito = val; updateLogEsitoButtons(val); }
    _logPage = 0;

    let filtered = container._logData;
    if (_logFilterSeason !== 'all') filtered = filtered.filter(l => l.anno == _logFilterSeason);
    if (_logFilterEsito !== 'all')  filtered = filtered.filter(l => l.esito === _logFilterEsito);
    if (_logSearchQuery)            filtered = filtered.filter(l => (l.avv||'').toLowerCase().includes(_logSearchQuery));

    const wrap = document.getElementById('log-table-wrap');
    if (wrap) renderLogTable(filtered, wrap);
}

function updateLogEsitoButtons(active) {
    document.querySelectorAll('.log-esito-btn').forEach(btn => {
        const isActive = btn.dataset.esito === active;
        btn.style.background = isActive ? 'rgba(255,215,0,0.12)' : 'transparent';
        btn.style.borderColor = isActive ? 'var(--gold)' : 'var(--border)';
        btn.style.color = isActive ? 'var(--gold)' : 'var(--text-dim)';
    });
}

function renderLogTable(data, container) {
    if (!data.length) {
        container.innerHTML = `<p style="color:var(--text-dim);padding:20px;text-align:center">${_t('no_seasons')}</p>`;
        return;
    }

    const esitoColors = { V: '#10b981', P: '#eab308', S: '#ef4444' };
    const esitoLabels = {
        V: {it:'V',en:'W',de:'S',es:'V'}[currentLang]||'V',
        P: 'D',
        S: {it:'S',en:'L',de:'N',es:'D'}[currentLang]||'S',
    };

    let html = `
        <table class="table-gs table-responsive" style="width:100%">
            <thead>
                <tr>
                    <th>${{it:'Stag/Mese',en:'Season/Month',de:'Sais/Monat',es:'Temp/Mes'}[currentLang]||'Stag/Mese'}</th>
                    <th>${{it:'Avversario',en:'Opponent',de:'Gegner',es:'Rival'}[currentLang]||'Avversario'}</th>
                    <th>${{it:'Esito',en:'Result',de:'Ergebnis',es:'Resultado'}[currentLang]||'Esito'}</th>
                    <th>${{it:'Risultato',en:'Score',de:'Resultat',es:'Marcador'}[currentLang]||'Risultato'}</th>
                    <th>⚽</th>
                    <th>🎯</th>
                    <th>★</th>
                </tr>
            </thead>
            <tbody>`;

    const paginated = data.slice(0, LOG_PAGE_SIZE * (_logPage + 1));
    paginated.forEach(l => {
        if (!l.avv || l.avv === '__riepilogo') return;
        const color = esitoColors[l.esito] || '#94a3b8';
        const lbl   = esitoLabels[l.esito] || l.esito;
        const voto  = parseFloat(l.voto || 6).toFixed(1);
        const votoColor = voto >= 7.5 ? '#10b981' : voto <= 5.5 ? '#ef4444' : '#fff';
        html += `
            <tr>
                <td><span style="color:var(--text-dim);font-size:0.72rem">A${l.anno}/M${l.mese}</span></td>
                <td style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${(l.avv||'').replace(/"/g,'&quot;')}">${(l.avv||'').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</td>
                <td><span class="badge" style="background:${color}22;color:${color};border-color:${color}44">${lbl}</span></td>
                <td style="font-weight:700;font-variant-numeric:tabular-nums;color:var(--text)">${(l.gf!=null && l.gs!=null && (parseInt(l.gf)||parseInt(l.gs)||l.esito)) ? `${l.gf}-${l.gs}` : '—'}</td>
                <td style="font-weight:700;color:${parseInt(l.gol)>0?'#FFD700':'var(--text-dim)'}">${l.gol||0}</td>
                <td style="color:${parseInt(l.assist)>0?'#3b82f6':'var(--text-dim)'}">${l.assist||0}</td>
                <td style="font-weight:700;color:${votoColor}">${voto}</td>
            </tr>`;
    });

    html += '</tbody></table>';

    if (data.length > paginated.length) {
        html += `<button onclick="loadMoreLog()" style="width:100%;padding:10px;margin-top:8px;background:var(--bg3);border:1px solid var(--border);border-radius:8px;color:var(--text-dim);cursor:pointer;font-size:0.82rem">
            ${{it:'Carica altri...',en:'Load more...',de:'Mehr laden...',es:'Cargar más...'}[currentLang]||'Carica altri...'} (${data.length - paginated.length} ${{it:'rimanenti',en:'remaining',de:'verbleibend',es:'restantes'}[currentLang]||'rimananti'})
        </button>`;
    }

    container.innerHTML = html;
    container._fullData = data;
}

function loadMoreLog() {
    _logPage++;
    const container = document.getElementById('log-table-wrap');
    if (container?._fullData) renderLogTable(container._fullData, container);
}

// ── CAREER COMPARISON & ANALYTICS ──

async function loadCareerAnalytics() {
    try {
    const container = document.getElementById('career-seasons-list');
    if (!container) return;

    const [seasons, logData, p] = await Promise.all([
        api('player.php', { action: 'season' }, 'GET'),
        api('player.php', { action: 'log', career_id: currentCareerId }, 'GET'),
        api('player.php', { action: 'get', career_id: currentCareerId }, 'GET'),
    ]);

    if (!seasons?.length || !p) return;

    const lang = currentLang;

    // ── Career KPI Summary ────────────────────────────────────────────────
    const kpiWrap = document.createElement('div');
    kpiWrap.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:10px;margin-bottom:20px';
    
    const totalGol    = seasons.reduce((a, s) => a + parseInt(s.gol || 0), 0);
    const totalAssist = seasons.reduce((a, s) => a + parseInt(s.assist || 0), 0);
    const bestSeason  = seasons.reduce((best, s) => parseInt(s.gol || 0) > parseInt(best.gol || 0) ? s : best, seasons[0]);
    const avgVoto     = seasons.length ? (seasons.reduce((a, s) => a + parseFloat(s.media_voto || 6), 0) / seasons.length).toFixed(2) : '—';
    const totalPd     = parseInt(p.palloni_doro || 0);
    const totalTrofei = parseInt(p.trofei || 0);

    const kpis = [
        { icon: '⚽', val: totalGol,    lbl: {it:'Gol Carriera',en:'Career Goals',de:'Karriere-Tore',es:'Goles Carrera'}[lang]||'Gol Carriera', color: '#FFD700' },
        { icon: '🎯', val: totalAssist, lbl: {it:'Assist Carriera',en:'Career Assists',de:'Karriere-Vorlagen',es:'Asistencias Carrera'}[lang]||'Assist Carriera', color: '#3b82f6' },
        { icon: '⭐', val: avgVoto,     lbl: {it:'Media Voto',en:'Avg Rating',de:'Ø Bewertung',es:'Media Valoración'}[lang]||'Media Voto', color: '#8b5cf6' },
        { icon: '🏆', val: totalTrofei, lbl: {it:'Trofei',en:'Trophies',de:'Trophäen',es:'Trofeos'}[lang]||'Trofei', color: '#10b981' },
        { icon: '🥇', val: totalPd,     lbl: {it:"Palloni d'Or",en:"Ballon d'Or",de:"Ballon d'Or",es:"Balón de Oro"}[lang]||"Palloni d'Or", color: '#f59e0b' },
        { icon: '📅', val: seasons.length, lbl: {it:'Stagioni',en:'Seasons',de:'Saisons',es:'Temporadas'}[lang]||'Stagioni', color: '#64748b' },
    ];

    kpiWrap.innerHTML = kpis.map(k => `
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:14px;text-align:center">
            <div style="font-size:1.5rem;margin-bottom:4px">${k.icon}</div>
            <div style="font-size:1.4rem;font-weight:900;color:${k.color}">${k.val}</div>
            <div style="font-size:0.68rem;color:var(--text-dim);text-transform:uppercase;letter-spacing:0.5px;margin-top:3px">${k.lbl}</div>
        </div>`).join('');

    // ── Best season highlight ─────────────────────────────────────────────
    const bestWrap = document.createElement('div');
    bestWrap.style.cssText = 'background:linear-gradient(135deg,rgba(255,215,0,0.08),var(--card));border:1px solid rgba(255,215,0,0.3);border-radius:14px;padding:16px;margin-bottom:20px';
    bestWrap.innerHTML = `
        <div style="font-size:0.72rem;font-weight:800;color:var(--gold);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px">
            🏆 ${{it:'Miglior Stagione',en:'Best Season',de:'Beste Saison',es:'Mejor Temporada'}[lang]||'Miglior Stagione'} — ${{it:'Anno',en:'Year',de:'Jahr',es:'Año'}[lang]||'Anno'} ${bestSeason.anno}
        </div>
        <div style="display:flex;gap:20px;flex-wrap:wrap">
            <div><span style="font-size:1.8rem;font-weight:900;color:#FFD700">${bestSeason.gol}</span>
                 <span style="font-size:0.75rem;color:var(--text-dim);margin-left:4px">${{it:'gol',en:'goals',de:'Tore',es:'goles'}[lang]||'gol'}</span></div>
            <div><span style="font-size:1.8rem;font-weight:900;color:#3b82f6">${bestSeason.assist}</span>
                 <span style="font-size:0.75rem;color:var(--text-dim);margin-left:4px">${{it:'assist',en:'assists',de:'Vorlagen',es:'asistencias'}[lang]||'assist'}</span></div>
            <div><span style="font-size:1.8rem;font-weight:900;color:#8b5cf6">${parseFloat(bestSeason.media_voto || 6).toFixed(2)}</span>
                 <span style="font-size:0.75rem;color:var(--text-dim);margin-left:4px">${{it:'media voto',en:'avg rating',de:'Ø Wertung',es:'media valoración'}[lang]||'media voto'}</span></div>
            <div><span style="font-size:1.8rem;font-weight:900;color:#10b981">${bestSeason.partite || 0}</span>
                 <span style="font-size:0.75rem;color:var(--text-dim);margin-left:4px">${{it:'partite',en:'matches',de:'Spiele',es:'partidos'}[lang]||'partite'}</span></div>
        </div>
        <div style="font-size:0.75rem;color:var(--text-dim);margin-top:8px">
            🏟️ ${bestSeason.team_nome || '—'} · ${bestSeason.lega_nome || '—'}
        </div>`;

    // ── Quote of the day ──────────────────────────────────────────────────
    const quoteWrap = document.createElement('div');
    quoteWrap.id = 'career-quote-of-day';
    if (window.GS_Encyclopedia) GS_Encyclopedia.showQuoteOfTheDay('career-quote-of-day');

    // Insert analytics before existing content
    const existingContent = container.innerHTML;
    container.innerHTML = '';
    container.appendChild(kpiWrap);
    container.appendChild(bestWrap);
    container.appendChild(quoteWrap);
    
    // Restore existing season list below
    const div = document.createElement('div');
    div.innerHTML = existingContent;
    container.appendChild(div);
    } catch(e) { console.error('loadCareerAnalytics error:', e); }
}

// ── HELP SYSTEM & TOOLTIPS ──

const GS_HELP_TEXTS = {
    it: {
        overall: "L'Overall è la media delle 5 statistiche tecniche (max 125). Determina quali squadre puoi raggiungere e la tua competitività in campo.",
        tiro: "La qualità del tiro. Influenza la probabilità di segnare e il tipo di gol disponibili nel match.",
        velocita: "La velocità di sprint. Fondamentale per i contropiedi e per superare i difensori.",
        dribbling: "La tecnica individuale. Migliora la qualità delle azioni e sblocca mosse speciali.",
        fisico: "La forza e resistenza fisica. Riduce il rischio infortuni e migliora i contrasti.",
        mentalita: "La lucidità mentale. Migliora le decisioni in campo nei momenti cruciali.",
        popolarita: "La tua fama nel mondo del calcio. Cresce con i gol, le vittorie e i premi.",
        energia: "Il carburante fisico. Si consuma con l'allenamento, si recupera con il riposo.",
        morale: "Lo stato emotivo. Alto morale = prestazioni migliori. Cura il tuo umore!",
        soldi: "I guadagni della tua carriera. Usali per la struttura e per l'agente.",
        pallone_doro: "Il massimo riconoscimento calcistico. Si vince con gol, assist, voto medio alto e overall elevato.",
        struttura: "La tua struttura di allenamento personale. Più è avanzata, più cresci velocemente.",
        agente: "Il tuo procuratore. Ti aiuta a guadagnare di più e a trasferirsi in club migliori.",
        champions: "La Champions Cup: il torneo per élite europee. Top 4 della Prima Divisione si qualificano.",
        skill_tree: "L'albero delle abilità. Ogni skill sbloccata aggiunge bonus permanenti alle stats.",
    },
    en: {
        overall: "Overall is the average of 5 technical stats (max 125). Determines which clubs you can reach and your competitiveness on the pitch.",
        tiro: "Shot quality. Affects the probability of scoring and the types of goals available in matches.",
        velocita: "Sprint speed. Essential for counter-attacks and beating defenders.",
        dribbling: "Individual technique. Improves action quality and unlocks special moves.",
        fisico: "Physical strength and endurance. Reduces injury risk and improves tackles.",
        mentalita: "Mental clarity. Improves on-pitch decisions in crucial moments.",
        popolarita: "Your fame in the football world. Grows with goals, wins and awards.",
        energia: "Physical fuel. Used by training, recovered with rest.",
        morale: "Emotional state. High morale = better performances. Look after your mood!",
        soldi: "Career earnings. Use them for facilities and your agent.",
        pallone_doro: "The highest football honour. Won with goals, assists, high average rating and overall.",
        struttura: "Your personal training facility. The more advanced, the faster you grow.",
        agente: "Your agent. Helps you earn more and move to better clubs.",
        champions: "Champions Cup: the European elite tournament. Top 4 of First Division qualify.",
        skill_tree: "The skill tree. Each unlocked skill adds permanent stat bonuses.",
    },
    de: {
        overall: "Der Overall ist der Durchschnitt der 5 technischen Werte (max 125). Bestimmt, welche Klubs du erreichen kannst und wie konkurrenzfähig du bist.",
        tiro: "Schussqualität. Beeinflusst die Torchance und die verfügbaren Tortypen im Spiel.",
        velocita: "Sprintgeschwindigkeit. Entscheidend für Konter und das Überwinden von Verteidigern.",
        dribbling: "Individuelle Technik. Verbessert Aktionen und schaltet Spezialmoves frei.",
        fisico: "Körperkraft und Ausdauer. Reduziert Verletzungsrisiko und verbessert Zweikämpfe.",
        mentalita: "Mentale Klarheit. Verbessert Entscheidungen auf dem Platz in entscheidenden Momenten.",
        popolarita: "Dein Ruhm in der Fußballwelt. Wächst durch Tore, Siege und Auszeichnungen.",
        energia: "Körperlicher Treibstoff. Verbraucht durch Training, erholt durch Ruhe.",
        morale: "Emotionaler Zustand. Hohe Moral = bessere Leistungen. Pflege deine Stimmung!",
        soldi: "Karriere-Einnahmen. Nutze sie für die Einrichtung und deinen Agenten.",
        pallone_doro: "Die höchste Fußballauszeichnung. Gewonnen durch Tore, Vorlagen, hohe Bewertung und Overall.",
        struttura: "Deine persönliche Trainingseinrichtung. Je fortschrittlicher, desto schneller wächst du.",
        agente: "Dein Agent. Hilft dir mehr zu verdienen und in bessere Klubs zu wechseln.",
        champions: "Champions Cup: das europäische Elite-Turnier. Top 4 der Ersten Division qualifizieren sich.",
        skill_tree: "Der Fähigkeitsbaum. Jede freigeschaltete Fähigkeit fügt permanente Stat-Boni hinzu.",
    },
    es: {
        overall: "El Overall es la media de 5 estadísticas técnicas (máx 125). Determina qué clubes puedes alcanzar y tu competitividad en el campo.",
        tiro: "Calidad del disparo. Afecta la probabilidad de marcar y los tipos de goles disponibles.",
        velocita: "Velocidad de sprint. Esencial para los contragolpes y para superar defensas.",
        dribbling: "Técnica individual. Mejora la calidad de las acciones y desbloquea movimientos especiales.",
        fisico: "Fuerza y resistencia física. Reduce el riesgo de lesiones y mejora los duelos.",
        mentalita: "Claridad mental. Mejora las decisiones en el campo en los momentos cruciales.",
        popolarita: "Tu fama en el mundo del fútbol. Crece con goles, victorias y premios.",
        energia: "Combustible físico. Lo consume el entrenamiento, lo recupera el descanso.",
        morale: "Estado emocional. Alta moral = mejores actuaciones. ¡Cuida tu estado de ánimo!",
        soldi: "Ingresos de tu carrera. Úsalos para las instalaciones y tu agente.",
        pallone_doro: "El máximo reconocimiento del fútbol. Se gana con goles, asistencias, alta media y overall.",
        struttura: "Tu instalación de entrenamiento personal. Cuanto más avanzada, más rápido creces.",
        agente: "Tu agente. Te ayuda a ganar más y a fichar por mejores clubes.",
        champions: "Copa de Campeones: el torneo de élite europeo. Top 4 de la Primera División se clasifican.",
        skill_tree: "El árbol de habilidades. Cada habilidad desbloqueada añade bonificaciones permanentes.",
    }
};

function attachTooltips() {
    // Attach help text to stat rows
    const tooltipMap = {
        '[data-stat="tiro"]':         'tiro',
        '[data-stat="velocita"]':     'velocita',
        '[data-stat="dribbling"]':    'dribbling',
        '[data-stat="fisico"]':       'fisico',
        '[data-stat="mentalita"]':    'mentalita',
        '[data-special="energia"]':   'energia',
        '[data-special="morale"]':    'morale',
        '[data-special="popolarita"]':'popolarita',
        '.overall-circle':             'overall',
        '#info-soldi':                 'soldi',
        '#info-struttura':             'struttura',
        '#info-agente':                'agente',
        '#info-pallone-doro':          'pallone_doro',
        '#nav-skilltree':              'skill_tree',
        '#nav-classifica':             'champions',
    };

    Object.entries(tooltipMap).forEach(([selector, key]) => {
        document.querySelectorAll(selector).forEach(el => {
            const lang = currentLang || 'it';
            // Always refresh tooltip on lang change (remove cache guard)
            el.dataset.tip = GS_HELP_TEXTS[lang]?.[key] || GS_HELP_TEXTS.it[key] || '';
            el.dataset.tipPos = 'top';
        });
    });
}

// ── KEYBOARD SHORTCUTS ──

const GS_SHORTCUTS = {
    'g': () => { if (document.getElementById('game-page')?.classList.contains('active')) document.getElementById('play-month-btn')?.click(); },
    '1': () => showPage('dashboard'),
    '2': () => showPage('game'),
    '3': () => showPage('career'),
    '4': () => showPage('transfer'),
    '5': () => showPage('notizie'),
    '6': () => showPage('skilltree'),
    '7': () => showPage('achievements'),
    'a': () => showPage('agente'),
    'c': () => showPage('classifica'),
    '?': () => { if (window.GS_Tutorial) GS_Tutorial.start(true); },
    'Escape': () => {
        document.querySelectorAll('.modal-overlay.active').forEach(m => {
            m.classList.remove('active');
        });
    },
};

document.addEventListener('keydown', (e) => {
    // Don't trigger shortcuts in input fields
    if (['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const handler = GS_SHORTCUTS[e.key];
    if (handler) { e.preventDefault(); handler(); }
});

// ── PERFORMANCE MONITOR ──

const GS_Performance = {
    _fps: 0, _lastTime: 0, _frames: 0,
    _monitoring: false,

    start() {
        this._monitoring = true;
        this._lastTime = performance.now();
        this._frames = 0;
        const loop = (now) => {
            if (!this._monitoring) return;
            this._frames++;
            if (now - this._lastTime >= 1000) {
                this._fps = this._frames;
                this._frames = 0;
                this._lastTime = now;
            }
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    },

    stop() { this._monitoring = false; },
    getFPS() { return this._fps; },

    // Check if device is low-performance
    isLowPerformance() {
        return this._fps > 0 && this._fps < 30;
    },

    // Reduce animation complexity on low-end devices
    adaptAnimations() {
        if (this.isLowPerformance()) {
            document.body.classList.add('reduced-motion');
        }
    }
};

// ── ACHIEVEMENTS PAGE ──
async function loadAchievements() {
    if (!window.GS_Achievements) return;
    const grid    = document.getElementById('achievements-grid');
    const fillEl  = document.getElementById('ach-progress-fill');
    const countEl = document.getElementById('ach-count');
    const totalEl = document.getElementById('ach-total');
    if (!grid) return;

    const all = GS_Achievements.getAll();
    const unlocked = GS_Achievements.getUnlockedCount();
    const total = GS_Achievements.getTotalCount();

    if (fillEl) fillEl.style.transform = `scaleX(${unlocked / total})`;
    if (countEl) countEl.textContent = unlocked;
    if (totalEl) totalEl.textContent = total;

    // Group by category
    const categories = ['milestones', 'scoring', 'growth', 'trophies', 'career', 'skills', 'facilities', 'secrets'];
    const byCategory = {};
    all.forEach(a => {
        if (!byCategory[a.category]) byCategory[a.category] = [];
        byCategory[a.category].push(a);
    });

    const catKeys = {
        milestones: _t('ach_category_milestones'), scoring: _t('ach_category_scoring'),
        growth: _t('ach_category_growth'), trophies: _t('ach_category_trophies'),
        career: _t('ach_category_career'), skills: _t('ach_category_skills'),
        facilities: _t('ach_category_facilities'), secrets: _t('ach_category_secrets'),
    };

    let html = '';
    categories.forEach(cat => {
        const items = byCategory[cat];
        if (!items?.length) return;
        html += `<div class="ach-category-title">${catKeys[cat] || cat}</div>`;
        html += '<div class="ach-grid" style="margin-bottom:8px">';
        items.forEach(a => {
            const locked = !a.isUnlocked;
            const secret = a.secret && locked;
            const nameKey = {en:a.name_en||a.name,de:a.name_de||a.name_en||a.name,es:a.name_es||a.name_en||a.name,it:a.name}[currentLang]||a.name;
            const descKey = {en:a.desc_en||a.desc,de:a.desc_de||a.desc_en||a.desc,es:a.desc_es||a.desc_en||a.desc,it:a.desc}[currentLang]||a.desc;
            html += `
                <div class="ach-card ${a.isUnlocked ? 'unlocked' : 'locked'} ${secret ? 'secret' : ''}">
                    <span class="ach-icon">${secret ? '🔒' : a.icon}</span>
                    <div class="ach-body">
                        <div class="ach-name">${secret ? '???' : nameKey}</div>
                        <div class="ach-desc">${secret ? ({it:'Obiettivo segreto',en:'Secret achievement',de:'Geheime Errungenschaft',es:'Logro secreto'}[currentLang]||'Obiettivo segreto') : descKey}</div>
                        ${a.isUnlocked ? `<div class="ach-unlocked-label">✓ ${{it:'Sbloccato',en:'Unlocked',de:'Freigeschaltet',es:'Desbloqueado'}[currentLang]||'Sbloccato'}</div>` : ''}
                    </div>
                </div>`;
        });
        html += '</div>';
    });
    grid.innerHTML = html;
}

// ── EXTENDED EVENT SYSTEM ──

const GS_Events = {
    _listeners: {},

    on(event, handler) {
        if (!this._listeners[event]) this._listeners[event] = [];
        this._listeners[event].push(handler);
    },

    off(event, handler) {
        if (this._listeners[event]) {
            this._listeners[event] = this._listeners[event].filter(h => h !== handler);
        }
    },

    emit(event, data) {
        (this._listeners[event] || []).forEach(h => {
            try { h(data); } catch(e) { console.warn('Event handler error:', e); }
        });
    },
};

// ── Register core event handlers ──────────────────────────────────────────────
GS_Events.on('goal', ({ player, gol, esito }) => {
    if (window.GS_Particles) GS_Particles.effects.goalCelebration();
});

GS_Events.on('win', ({ player }) => {
    if (window.GS_Particles) GS_Particles.effects.confettiRain();
});

GS_Events.on('year_end', ({ newYear, player }) => {
    if (window.GS_Particles) GS_Particles.effects.fireworks?.(3);
});

GS_Events.on('achievement', ({ achievement }) => {
});

GS_Events.on('skill_unlock', ({ skillId, level }) => {
});

// Make available globally
window.GS_Events = GS_Events;

// INIT
// ========================
document.addEventListener('DOMContentLoaded', async () => {
    // Nascondi solo il nav (non lang-switcher e settings, sempre visibili)
    const mainNav = document.getElementById('main-nav');
    if (mainNav) mainNav.style.display = 'none';
    // lang-switcher e settings sempre visibili fin dall'inizio
    const exitWrapInit = document.getElementById('exit-dropdown-wrap');
    if (exitWrapInit) exitWrapInit.style.display = 'flex';
    const langWrapInit = document.getElementById('lang-switcher-wrap');
    if (langWrapInit) langWrapInit.style.display = 'flex';

    // Init header flag
    const flagElInit = document.getElementById('lang-switcher-flag');
    const _flagMap = { it:'🇮🇹', en:'🇬🇧', de:'🇩🇪', es:'🇪🇸' };
    const _codeMap = { it:'IT',   en:'EN',   de:'DE',   es:'ES'   };
    if (flagElInit) {
        flagElInit.innerHTML = `${_flagMap[currentLang] || '🇮🇹'} <span style="font-size:0.7rem;font-weight:700;letter-spacing:0.5px;">${_codeMap[currentLang] || 'IT'}</span>`;
    }
    ['it','en','de','es'].forEach(l => document.getElementById('lang-sw-'+l)?.classList.toggle('active', currentLang === l));

    // Close lang dropdown on outside click
    document.addEventListener('click', (e) => {
        const wrap = document.getElementById('lang-switcher-wrap');
        if (wrap && !wrap.contains(e.target)) {
            document.getElementById('lang-switcher-dropdown')?.classList.remove('open');
        }
    });

    // Language init
    _applyTranslations();
    _updateNavLabels();
    ['it','en','de','es'].forEach(l => document.getElementById('lang-btn-'+l)?.classList.toggle('active', currentLang === l));

    // First-launch: chiedi la lingua una sola volta (sopra ogni altra schermata)
    maybeShowLangOnboard();

    // Build actions grid on load
    _buildActionsGrid();

    document.querySelectorAll('.auth-tab').forEach(btn => {
        btn.addEventListener('click', () => showAuthTab(btn.dataset.tab));
    });
    document.addEventListener('keydown', e => {
        if (e.key !== 'Enter') return;
        // If verify panel is visible and focused in code input, confirm code (not re-send)
        const verifyPanel = document.getElementById('verify-panel');
        if (verifyPanel && verifyPanel.style.display !== 'none' && getComputedStyle(verifyPanel).display !== 'none') {
            e.preventDefault();
            doVerifyCode();
            return;
        }
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
                // Reapply language now that game elements are visible
                _applyTranslations();
                _updateNavLabels();
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

// ── API HELPER ──
