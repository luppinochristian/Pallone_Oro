// ========================
// CONFIG
// ========================
const API_BASE = '/backend/api';
let currentPlayer = null;
let selectedActions = [];
let authToken = localStorage.getItem('gs_token') || null;

// ========================
// INIT
// ========================
document.addEventListener('DOMContentLoaded', async () => {
    if (authToken) {
        const res = await api('auth.php', { action: 'check' }, 'GET');
        if (res.logged) {
            await loadPlayer();
            showPage('dashboard');
            return;
        } else {
            authToken = null;
            localStorage.removeItem('gs_token');
        }
    }
    showPage('auth');
});

// ========================
// API HELPER — manda token in ogni richiesta
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
            // Aggiunge token anche come query param (fallback)
            data.token = authToken || '';
            url += '?' + new URLSearchParams(data);
        } else {
            // Aggiunge token nel body JSON
            data.token = authToken || '';
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
    if (!targetPage) {
        console.error(`Pagina non trovata: ${page}-page`);
        return;
    }
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
}

document.querySelectorAll('nav button[data-page]').forEach(btn => {
    btn.addEventListener('click', () => showPage(btn.dataset.page));
});

// ========================
// AUTH — tab switch
// ========================
document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById('login-form').style.display    = tab.dataset.tab === 'login'    ? 'block' : 'none';
        document.getElementById('register-form').style.display = tab.dataset.tab === 'register' ? 'block' : 'none';
    });
});

// Login
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true; btn.textContent = '⏳ Accesso...';

    const res = await api('auth.php', {
        action: 'login',
        username: document.getElementById('l-username').value,
        password: document.getElementById('l-password').value
    });

    btn.disabled = false; btn.textContent = '⚽ Accedi alla Carriera';

    if (res.error) { showError('login-error', res.error); return; }

    authToken = res.token;
    localStorage.setItem('gs_token', authToken);
    currentPlayer = res.player;
    await loadPlayer();
    showPage('dashboard');
});

// Register
document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true; btn.textContent = '⏳ Creazione...';

    const res = await api('auth.php', {
        action: 'register',
        username: document.getElementById('r-username').value,
        password: document.getElementById('r-password').value,
        player_name: document.getElementById('r-name').value,
        gender: document.getElementById('r-gender').value,
        nationality: document.getElementById('r-nationality').value,
        age: document.getElementById('r-age').value,
    });

    btn.disabled = false; btn.textContent = '🌟 Inizia la Carriera';

    if (res.error) { showError('register-error', res.error); return; }

    authToken = res.token;
    localStorage.setItem('gs_token', authToken);
    await loadPlayer();
    showPage('dashboard');
    toast('Benvenuto! La tua carriera inizia ora! ⚽', 'gold');
});

// Logout
document.getElementById('logout-btn').addEventListener('click', async () => {
    await api('auth.php', { action: 'logout' });
    authToken = null;
    localStorage.removeItem('gs_token');
    currentPlayer = null;
    showPage('auth');
});

function showError(id, msg) {
    const el = document.getElementById(id);
    el.textContent = msg;
    setTimeout(() => el.textContent = '', 5000);
}

// ========================
// LOAD PLAYER
// ========================
async function loadPlayer() {
    const res = await api('player.php', { action: 'get' }, 'GET');
    if (!res.error) currentPlayer = res;
}

// ========================
// DASHBOARD
// ========================
function renderDashboard() {
    if (!currentPlayer) return;
    const p = currentPlayer;

    document.getElementById('player-name-display').textContent = p.player_name;
    document.getElementById('player-subtitle').textContent = `${p.nationality} · ${p.age} anni · Anno ${p.anno_corrente}`;
    document.getElementById('player-avatar-icon').textContent = p.gender === 'female' ? '👩' : '👦';

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

async function loadTransfer() {
    const [leghe, p] = await Promise.all([
        api('player.php', { action: 'leghe' }, 'GET'),
        api('player.php', { action: 'get'   }, 'GET')
    ]);

    const el = document.getElementById('teams-grid');

    // Raggruppa leghe per nazione
    const nazioniMap = {};
    leghe.forEach(l => {
        if (!nazioniMap[l.nazione_id]) nazioniMap[l.nazione_id] = { nome: l.nazione_nome, bandiera: l.bandiera, leghe: [] };
        nazioniMap[l.nazione_id].leghe.push(l);
    });

    // Costruisci filtri nazione/lega
    let filterHtml = '<div class="lega-filters">';
    filterHtml += `<button class="lega-filter-btn ${!selectedLegaId ? 'active' : ''}" onclick="filterLega(null)">🌍 Tutte</button>`;
    Object.values(nazioniMap).forEach(n => {
        n.leghe.forEach(l => {
            const isActive = selectedLegaId == l.id;
            const isCurrent = p.lega_id == l.id;
            filterHtml += `<button class="lega-filter-btn ${isActive ? 'active' : ''} ${isCurrent ? 'current-lega' : ''}" onclick="filterLega(${l.id})">
                ${n.bandiera} ${l.nome}${isCurrent ? ' ★' : ''}
            </button>`;
        });
    });
    filterHtml += '</div>';

    // Carica squadre
    const params = { action: 'teams' };
    if (selectedLegaId) params.lega_id = selectedLegaId;
    const teams = await api('player.php', params, 'GET');

    let teamsHtml = '';
    // Raggruppa per lega se si vedono tutte
    if (!selectedLegaId) {
        const legheMap = {};
        teams.forEach(t => {
            const key = t.lega_id;
            if (!legheMap[key]) legheMap[key] = { nome: t.lega_nome, bandiera: t.bandiera, livello: t.lega_livello, nazione: t.nazione_nome, teams: [] };
            legheMap[key].teams.push(t);
        });
        Object.values(legheMap).forEach(lg => {
            teamsHtml += `<div class="lega-section-header">${lg.bandiera} ${lg.nazione} — ${lg.nome} ${lg.livello == 1 ? '🥇' : '🥈'}</div>`;
            teamsHtml += lg.teams.slice(0,4).map(t => renderTeamCard(t, p)).join('');
            teamsHtml += `<div style="color:var(--text-dim);font-size:0.8rem;text-align:center;margin-bottom:16px">...e altre ${lg.teams.length - 4} squadre. Filtra per lega per vederle tutte.</div>`;
        });
    } else {
        teamsHtml = teams.map(t => renderTeamCard(t, p)).join('');
    }

    el.innerHTML = filterHtml + '<div class="teams-grid-inner">' + teamsHtml + '</div>';
}

function renderTeamCard(t, p) {
    const isCurrent = t.id == p.team_id;
    const stars = '⭐'.repeat(t.stelle);
    const minOv = (t.stelle - 1) * 15 + 55;
    const canJoin = p.overall >= minOv || t.stelle == 1;
    const legaBadge = t.lega_livello == 1 ? '<span class="lega-badge primo">1ª Div</span>' : '<span class="lega-badge secondo">2ª Div</span>';
    return `<div class="team-card ${isCurrent ? 'current' : ''}">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div class="team-stars">${stars}</div>
            ${legaBadge}
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

async function filterLega(legaId) {
    selectedLegaId = legaId;
    await loadTransfer();
}

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
            <div class="info-card">
                <div class="val">${formatMoney(player.soldi)}</div>
                <div class="lbl">Soldi Disponibili</div>
            </div>
            <div class="info-card">
                <div class="val">${getStrutturaName(player.struttura_livello)}</div>
                <div class="lbl">Struttura Attuale</div>
            </div>
        </div>
    `;
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
            </div>
        `;
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
// CLASSIFICA
// ========================
let selectedClassLegaId = null;
let currentClassTab = 'lega';

async function loadClassifica() {
    const [leghe, player] = await Promise.all([
        api('player.php', { action: 'leghe' }, 'GET'),
        api('player.php', { action: 'get' }, 'GET')
    ]);

    // Default: lega del giocatore
    if (!selectedClassLegaId && player.lega_id) selectedClassLegaId = player.lega_id;

    // Filtri lega
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
            filterHtml += `<button class="lega-filter-btn ${isActive ? 'active' : ''} ${isCurrent ? 'current-lega' : ''}"
                onclick="selectClassLega(${l.id})">
                ${n.bandiera} ${l.nome}${isCurrent ? ' ★' : ''}
            </button>`;
        });
    });
    filterEl.innerHTML = filterHtml;

    if (selectedClassLegaId) await renderClassificaTable(selectedClassLegaId, player);
    if (currentClassTab === 'champions') await renderChampions(player);
}

async function selectClassLega(legaId) {
    selectedClassLegaId = legaId;
    const player = await api('player.php', { action: 'get' }, 'GET');
    // Aggiorna bottoni filtro
    document.querySelectorAll('#classifica-lega-filters .lega-filter-btn').forEach(b => {
        b.classList.toggle('active', b.textContent.includes(legaId));
    });
    await renderClassificaTable(legaId, player);
    // Ricarica i filtri per aggiornare lo stato
    await loadClassifica();
}

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
        <thead><tr>
            <th>#</th>
            <th>Squadra</th>
            <th>OVR</th>
            <th>G</th>
            <th>V</th>
            <th>P</th>
            <th>S</th>
            <th>GF</th>
            <th>GS</th>
            <th>DR</th>
            <th>Pts</th>
        </tr></thead><tbody>`;

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
            <td class="team-name-cell">
                <span class="team-name-cl">${row.team_nome}</span>
                <span class="team-stars-sm">${stelle}</span>
                ${isMyTeam ? '<span class="my-team-badge">TU</span>' : ''}
            </td>
            <td><span class="ovr-badge">${row.ovr}</span></td>
            <td>${row.partite_giocate}</td>
            <td>${row.vittorie}</td>
            <td>${row.pareggi}</td>
            <td>${row.sconfitte}</td>
            <td>${row.gol_fatti}</td>
            <td>${row.gol_subiti}</td>
            <td>${drStr}</td>
            <td><strong>${row.punti}</strong></td>
        </tr>`;
    });

    html += '</tbody></table>';

    // Legenda
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
    const anno = player.anno_corrente;
    const data = await api('classifica.php', { action: 'champions', anno }, 'GET');

    if (!data || data.error || !data.length) {
        wrap.innerHTML = '<p style="color:var(--text-dim);padding:20px">🏆 La Champions Cup non è ancora iniziata. Le squadre si qualificano a fine stagione (top 4 di ogni Prima Divisione).</p>';
        return;
    }

    const fasi = { vincitore: [], finale: [], semifinale: [], quarti: [], gironi: [] };
    data.forEach(t => {
        const f = t.eliminato ? 'eliminato_' + t.fase : t.fase;
        if (t.fase === 'vincitore') fasi.vincitore.push(t);
        else if (!t.eliminato) fasi[t.fase]?.push(t);
        else fasi[t.fase]?.push({...t, eliminato: true});
    });

    let html = '<div class="champions-grid">';

    const fasiOrdine = [
        { key: 'vincitore',   label: '🏆 Vincitore', cls: 'fase-vincitore' },
        { key: 'finale',      label: '🥇 Finale',     cls: 'fase-finale' },
        { key: 'semifinale',  label: '🥈 Semifinale', cls: 'fase-semi' },
        { key: 'quarti',      label: '⚽ Quarti',     cls: 'fase-quarti' },
        { key: 'gironi',      label: '📋 Fase Gironi',cls: 'fase-gironi' },
    ];

    fasiOrdine.forEach(f => {
        const teams = fasi[f.key];
        if (!teams || !teams.length) return;
        html += `<div class="champions-fase ${f.cls}">
            <div class="fase-titolo">${f.label}</div>`;
        teams.forEach(t => {
            const isMyTeam = t.team_id == player.team_id;
            const stelle   = '⭐'.repeat(parseInt(t.stelle));
            html += `<div class="champions-team ${isMyTeam ? 'my-champions-team' : ''} ${t.eliminato ? 'elim' : ''}">
                <span>${t.bandiera || ''} ${t.team_nome}</span>
                <span>${stelle} <span class="ovr-badge">${t.ovr}</span></span>
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
