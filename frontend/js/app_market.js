/* app_market.js — trasferimenti, strutture, agente, notizie, calendario.
 * Estratto da app.js (refactor): nessuna logica modificata.
 * Caricato in ordine da index.html. */

let _trNaz = null, _trLiv = null;

// Regole di gioco caricate una sola volta dal backend (rules.php)
let GAME_RULES = null;
async function getGameRules() {
    if (GAME_RULES) return GAME_RULES;
    const res = await api('rules.php', {}, 'GET');
    if (res.error) throw new Error(res.error);
    GAME_RULES = res;
    return GAME_RULES;
}

async function loadTransfer() {
    const el = document.getElementById('teams-grid');
    el.innerHTML = `<div style="text-align:center;padding:48px;color:var(--text-dim)">${_t('loading')}</div>`;

    const [teams, p, leghe, rules] = await Promise.all([
        api('player.php', { action: 'teams' }, 'GET'),
        api('player.php', { action: 'get', career_id: currentCareerId }, 'GET'),
        api('player.php', { action: 'leghe' }, 'GET'),
        getGameRules()
    ]);
    GAME_RULES = rules;

    if (!p || p.error || !Array.isArray(teams) || !Array.isArray(leghe)) {
        el.innerHTML = `<div style="text-align:center;padding:48px;color:#f87171">${_t('error_loading_teams')}</div>`;
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
    const ovr = parseInt(p.overall || 0);
    // agScontoOvr è una percentuale (es. 5.0 = 5%) — stessa logica del backend
    const agScontoPerc = p.agent_ovr_sconto || 0;
    // Mappa stelle → OVR minimo: letta dal backend (game_rules.php), non duplicata qui
    const STELLE_OVR_MAP = GAME_RULES.stelle_ovr_map;

    let cardsHtml = '';
    if (teamsFiltrati.length === 0) {
        cardsHtml = `<div style="text-align:center;padding:32px;color:var(--text-dim)">${_t('transfer_no_teams')}</div>`;
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
            const salaryLabelMap = {1:_t('salary_base'), 2:_t('salary_buono'), 3:_t('salary_ottimo'), 4:_t('salary_alto'), 5:_t('salary_top')};
            const salaryMult = salaryMultMap[stelleNum] || '1×';
            const salaryLabel = salaryLabelMap[stelleNum] || 'base';
            cardsHtml += `<div class="team-card ${isCurrent?'current':''}">
                <div class="team-stars">${stelle}</div>
                <div class="team-name">${esc(t.nome)}</div>
                <div class="team-stats">
                    <div class="team-stat"><div class="ts-label">${_t('ts_ovr')}</div><div class="ts-val">${teamOvr}</div></div>
                    <div class="team-stat"><div class="ts-label">${_t('ts_salary')}</div><div class="ts-val ts-salary">${salaryMult} <span class="salary-label">${salaryLabel}</span></div></div>
                    <div class="team-stat"><div class="ts-label">${_t('ts_pop')}</div><div class="ts-val">${t.popolarita}</div></div>
                    <div class="team-stat"><div class="ts-label">${_t('transfer_ovr_req')}</div><div class="ts-val">${minOvrScontato}${agScontoPerc>0?` <small style="color:var(--green)">(-${agScontoPerc}%)</small>`:''}</div></div>
                </div>
                ${isCurrent
                    ? `<div style="text-align:center;color:var(--green);font-weight:700;padding:10px">${_t('transfer_current_team')}</div>`
                    : `<button class="btn-transfer" ${canTransfer?'':'disabled'}
                        data-name="${esc(t.nome)}" onclick="doTransfer(${Number(t.id)}, this.dataset.name)">
                        ${canTransfer ? _t('transfer_btn_go') : `🔒 OVR ${minOvrScontato} ${_t('transfer_ovr_req').replace(/^\S+\s*/, '').replace(/^OVR\s*/i, '')}`}
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
        ${agScontoPerc > 0 ? `<div style="background:rgba(0,200,100,0.1);border:1px solid var(--green);border-radius:8px;padding:8px 14px;margin-bottom:14px;font-size:0.82rem;color:var(--green)">${_t('transfer_agent_bonus').replace('{0}', agScontoPerc)}</div>` : ''}
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
    if (!confirm(_t('transfer_confirm').replace('{0}', teamName))) return;
    const res = await api('game.php', { action: 'change_team', team_id: teamId }, 'POST');
    if (res.error) { toast(res.error, 'error'); return; }
    if (window.GS_Particles) GS_Particles.effects.transferWhoosh();
    toast(_t('transfer_toast').replace('{0}', teamName), 'gold');
    _trNaz = null; _trLiv = null;
    await loadPlayer();
    loadTransfer();
    renderDashboard();
}

// ── STRUTTURE ──
async function loadStrutture() {
    const [strutture, player] = await Promise.all([
        api('player.php', { action: 'strutture' }, 'GET'),
        api('player.php', { action: 'get', career_id: currentCareerId }, 'GET')
    ]);
    if (!player || player.error) return;
    currentPlayer = player;
    const el = document.getElementById('strutture-container');
    if (!el) return;
    el.innerHTML = `
        <div class="info-cards" style="margin-bottom:20px">
            <div class="info-card"><div class="val">${formatMoney(player.soldi)}</div><div class="lbl">${{it:'Soldi Disponibili',en:'Available Budget',de:'Verfügbares Budget',es:'Presupuesto Disponible'}[currentLang]||'Soldi Disponibili'}</div></div>
            <div class="info-card"><div class="val">${getStrutturaName(player.struttura_livello)}</div><div class="lbl">${_t('struttura_current')}</div></div>
        </div>`;
    strutture.forEach(s => {
        const owned     = player.struttura_livello >= s.livello;
        const isNext    = player.struttura_livello == s.livello - 1;
        const canAfford = player.soldi >= s.costo;

        // Nomi e descrizioni localizzati (DB è in italiano)
        const nomiEN = {
            1:'Basic Pitch', 2:'Equipped Changing Room', 3:'Gym & Field',
            4:'Sports Centre', 5:'High-Tech Centre', 6:'Elite Centre', 7:'Personal Academy'
        };
        const nomiDE = {
            1:'Einfacher Platz', 2:'Ausgestattete Umkleidekabine', 3:'Fitnessstudio & Feld',
            4:'Sportzentrum', 5:'High-Tech-Zentrum', 6:'Elite-Zentrum', 7:'Persönliche Akademie'
        };
        const nomiES = {
            1:'Campo Básico', 2:'Vestuario Equipado', 3:'Gimnasio y Campo',
            4:'Centro Deportivo', 5:'Centro de Alta Tecnología', 6:'Centro de Élite', 7:'Academia Personal'
        };
        const descrEN = {
            1:'+1 training bonus', 2:'+1 growth, -2% injuries',
            3:'+2 growth, -5% injuries', 4:'+10% growth, -8% injuries',
            5:'+20% growth, -10% injuries', 6:'Medical staff, +28% growth, -15% injuries',
            7:'+35% growth, -20% injuries'
        };
        const descrDE = {
            1:'+1 Trainingsbonus', 2:'+1 Wachstum, -2% Verletzungen',
            3:'+2 Wachstum, -5% Verletzungen', 4:'+10% Wachstum, -8% Verletzungen',
            5:'+20% Wachstum, -10% Verletzungen', 6:'Med. Personal, +28% Wachstum, -15% Verletzungen',
            7:'+35% Wachstum, -20% Verletzungen'
        };
        const descrES = {
            1:'+1 bono entrenamiento', 2:'+1 crecimiento, -2% lesiones',
            3:'+2 crecimiento, -5% lesiones', 4:'+10% crecimiento, -8% lesiones',
            5:'+20% crecimiento, -10% lesiones', 6:'Personal médico, +28% crecimiento, -15% lesiones',
            7:'+35% crecimiento, -20% lesiones'
        };
        const displayNome  = {en:nomiEN[s.livello]||s.nome,de:nomiDE[s.livello]||nomiEN[s.livello]||s.nome,es:nomiES[s.livello]||nomiEN[s.livello]||s.nome,it:s.nome}[currentLang]||s.nome;
        const displayDescr = {en:descrEN[s.livello]||s.descrizione,de:descrDE[s.livello]||descrEN[s.livello]||s.descrizione,es:descrES[s.livello]||descrEN[s.livello]||s.descrizione,it:s.descrizione}[currentLang]||s.descrizione;

        const div = document.createElement('div');
        div.className = `struttura-card ${owned ? 'owned' : isNext ? 'next' : ''}`;
        div.innerHTML = `
            <div class="struttura-level">${s.livello}</div>
            <div>
                <div class="struttura-name">${displayNome}</div>
                <div class="struttura-bonuses">
                    ${parseInt(s.bonus_allenamento)   ? `<span class="struttura-bonus">+${s.bonus_allenamento} ${_t('strutture_bonus_training')}</span>` : ''}
                    ${parseInt(s.bonus_crescita)      ? `<span class="struttura-bonus">+${s.bonus_crescita}% ${_t('strutture_bonus_growth')}</span>` : ''}
                    ${parseInt(s.riduzione_infortuni) ? `<span class="struttura-bonus">-${s.riduzione_infortuni}% ${_t('strutture_bonus_injury')}</span>` : ''}
                </div>
            </div>
            <div class="struttura-cost">
                <div class="cost-val">${formatMoney(s.costo)}</div>
                <div class="cost-lbl">${{it:'Costo',en:'Cost',de:'Kosten',es:'Coste'}[currentLang]||'Costo'}</div>
                ${owned
                    ? `<div class="owned-badge" style="margin-top:8px">✅ ${{it:'Posseduto',en:'Owned',de:'Vorhanden',es:'Poseído'}[currentLang]||'Posseduto'}</div>`
                    : `<button class="btn-buy" ${(!isNext||!canAfford)?'disabled':''} onclick="buyStruttura(${s.livello})">
                        ${!isNext ? _t('struttura_locked') : !canAfford ? _t('struttura_no_funds') : _t('struttura_buy')}
                      </button>`
                }
            </div>`;
        el.appendChild(div);
    });
}

async function buyStruttura(livello) {
    const res = await api('game.php', { action: 'buy_struttura', livello });
    if (res.error) { toast(res.error, 'error'); return; }
    if (window.GS_Particles) {
        const btn = document.getElementById(`struttura-buy-${livello}`);
        GS_Particles.effects.sparkle(btn, 20);
    }
    if (window.GS_Achievements) GS_Achievements.checkFromPlayer(currentPlayer);
    toast(res.msg, 'gold');
    await loadPlayer();
    loadStrutture();
}

// ── OBIETTIVI ──
async function loadDashboardObiettivi() {
    const res = await api('extra.php', { action: 'obiettivi' }, 'GET');
    const el  = document.getElementById('dashboard-obiettivi');
    if (!el || !res || res.error || !res.length) return;
    const tot = res.length, completati = res.filter(o => o.completato == 1).length;
    let html = `<div class="obiettivi-box">
        <div class="obiettivi-header"><span>${_t('obj_header')}</span><span class="ob-counter">${completati}/${tot} ${_t('obj_completed')}</span></div>
        <div class="obiettivi-list">`;
    res.forEach(ob => {
        const pct  = Math.min(100, Math.round((ob.progresso / ob.target) * 100));
        const done = ob.completato == 1;
        html += `<div class="obiettivo-row ${done ? 'ob-done' : ''}">
            <div class="ob-info">
                <span class="ob-desc">${done ? '✅' : '🎯'} ${(()=>{
                    const tKey = 'obj_'+ob.tipo;
                    const tpl = _t(tKey);
                    return (tpl && tpl !== tKey) ? tpl.replace('{0}', ob.target) : ob.descrizione;
                })()}</span>
                <span class="ob-premio">+€${parseInt(ob.premio_soldi).toLocaleString()} · +${ob.premio_morale} ${_t('obj_morale_prize')}</span>
            </div>
            <div class="ob-progress-wrap">
                <div class="ob-progress-bar" style="transform:scaleX(${pct/100})"></div>
                <span class="ob-pct">${ob.progresso}/${ob.target}</span>
            </div>
        </div>`;
    });
    html += '</div></div>';
    el.innerHTML = html;
}

// ── NOTIZIE DASHBOARD ──
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
        el.innerHTML = `<p style="color:var(--text-dim);font-size:0.82rem;padding:8px 0">${_t('dash_no_news')}</p>`;
        return;
    }
    _rawNewsData = res.notizie;

    const tipoIcon = { positivo:'🟢', negativo:'🔴', mercato:'💼', agente:'🤝', obiettivo:'🎯', info:'📋' };
    const notizie = await _translateNewsItems(res.notizie.slice(0, 5), currentLang);

    el.innerHTML = notizie.map(n => `
        <div class="dash-news-item ${n.letto == 0 ? 'dash-news-unread' : ''} news-${n.tipo}">
            <div class="dash-news-top">
                <span>${tipoIcon[n.tipo]||'📋'} <strong>${esc(n.titolo)}</strong></span>
                <span class="dash-news-data">${getMeseName(n.mese)} A${n.anno}</span>
            </div>
            <div class="dash-news-testo">${esc(n.testo)}</div>
        </div>`).join('');
    api('extra.php', { action: 'leggi' }, 'GET');
}

// ── NOTIZIE PAGE ──
async function loadNotizie() {
    const res = await api('extra.php', { action: 'notizie' }, 'GET');
    const el  = document.getElementById('notizie-lista');
    api('extra.php', { action: 'leggi' }, 'GET');
    const btn = document.getElementById('nav-notizie');
    if (btn) btn.innerHTML = _t('nav_notizie');
    if (!res || res.error || !res.notizie?.length) {
        el.innerHTML = `<p style="color:var(--text-dim);padding:20px">${_t('dash_no_news')}</p>`;
        return;
    }

    _rawNewsData = res.notizie;

    const tipoIcon = { positivo:'🟢', negativo:'🔴', mercato:'💼', agente:'🤝', obiettivo:'🎯', info:'📋' };
    const notizie = await _translateNewsItems(res.notizie, currentLang);

    el.innerHTML = notizie.map(n => `
        <div class="news-card ${n.letto == 0 ? 'news-unread' : ''} news-${n.tipo}">
            <div class="news-header">
                <span class="news-icon">${tipoIcon[n.tipo]||'📋'}</span>
                <span class="news-titolo">${esc(n.titolo)}</span>
                <span class="news-data">${getMeseName(n.mese)} ${_t('career_year_label')} ${n.anno}</span>
            </div>
            <div class="news-testo">${esc(n.testo)}</div>
        </div>`).join('');
}

// ========================
// CALENDARIO TAB
async function loadCalendarioTab() {
    if (!window.GS_SeasonPlanner || !currentPlayer) return;
    const [calData, logData] = await Promise.all([
        api('player.php', { action: 'calendario', career_id: currentCareerId }, 'GET'),
        api('player.php', { action: 'log', career_id: currentCareerId }, 'GET'),
    ]);

    // Render season calendar
    const calContainer = document.getElementById('sc-calendar-container');
    if (calContainer && calData && !calData.error) {
        GS_SeasonPlanner.renderSeasonCalendar(calContainer, calData, currentPlayer);
    }

    // Render projection
    const projContainer = document.getElementById('sc-projection-container');
    if (projContainer && logData && !logData.error) {
        const thisYearLog = (Array.isArray(logData) ? logData : []).filter(l =>
            l.anno == (currentPlayer?.anno_corrente ?? 0) && l.avv && l.avv !== '__riepilogo'
        );
        const stats = {
            gol:    thisYearLog.reduce((a, l) => a + parseInt(l.gol || 0), 0),
            assist: thisYearLog.reduce((a, l) => a + parseInt(l.assist || 0), 0),
            voto:   thisYearLog.length ? thisYearLog.reduce((a, l) => a + parseFloat(l.voto || 6), 0) : 0,
        };
        const proj = GS_SeasonPlanner.projectSeasonStats(stats, currentPlayer?.mese_corrente, currentPlayer?.overall);
        if (proj) GS_SeasonPlanner.renderProjection(projContainer, proj);
    }

    // Render heatmap
    const hmContainer = document.getElementById('sc-heatmap-container');
    if (hmContainer && Array.isArray(logData)) {
        GS_SeasonPlanner.renderHeatmap(hmContainer, logData);
    }
}

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
        lst.innerHTML = `<p style="color:#ff6b6b">${_t('api_error_label')}${res?.error || _t('api_resp_invalid')}</p>`;
        return;
    }

    const livello = parseInt(res.livello) || 0;
    const agenti  = res.agenti || {};
    const entries = Object.entries(agenti);
    if (!entries.length) { lst.innerHTML = `<p style="color:var(--text-dim)">${_t('no_agent')}</p>`; return; }

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
                    <div class="agente-livello">${_t('ag_level')} ${livello}/5</div>
                    <div class="agente-bonus">
                        <span class="ag-bonus-item">💰 +${Math.round(parseFloat(info.bonus_stipendio)*100)}% ${_t('ag_salary_bonus')}</span>
                        <span class="ag-bonus-item">📉 -${info.bonus_ovr_sconto}% ${_t('ag_ovr_bonus')}</span>
                    </div>
                    <div class="agente-bonus-mensile">
                        📊 ${_t('ag_monthly_est')}: <strong>+€${formatMoney(Math.round((player?.overall||60) * (player?.moltiplicatore_stipendio||100) * 100 * parseFloat(info.bonus_stipendio)))}</strong>
                        <span style="color:var(--text-dim);font-size:0.75rem"> ${_t('ag_ovr_note')}</span>
                    </div>
                </div>
            </div>`;
    } else {
        cur.innerHTML = `<div class="agente-vuoto">${_t('agent_empty')}</div>`;
    }

    let html = `<h3 style="margin-bottom:16px;color:var(--gold)">${_t('agent_choose')}</h3><div class="agenti-grid">`;
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
        if (!isOwned && !isNext) lockMsg = `🔒 ${_t('ag_req_prev')}${lv-1}`;
        else if (!popOk)         lockMsg = `👥 ${_t('ag_req_pop')} ${info.pop_richiesta} (${myPop})`;
        else if (!soldiOk)       lockMsg = `💸 ${_t('ag_req_money')} €${(costoReale-mySoldi).toLocaleString('it')}`;
        const btnLabel = livello > 0 && isNext
            ? `${_t('ag_upgrade_btn')} — €${costoReale.toLocaleString('it')}`
            : `${_t('ag_hire_btn')} — €${costoReale.toLocaleString('it')}`;
        html += `
        <div class="agente-card ${isOwned?'owned':''} ${isNext&&popOk&&!isOwned?'next':''}">
            <div class="agente-card-header">
                <span class="ag-livello-badge">Lv.${lv}</span>
                <span class="ag-nome">${info.nome}</span>
                ${isOwned ? `<span class="ag-owned">${_t('ag_owned')}</span>` : ''}
            </div>
            <div class="ag-stats">
                ${parseFloat(info.bonus_stipendio) ? `<span>💰 +${Math.round(parseFloat(info.bonus_stipendio)*100)}% ${_t('ag_salary_bonus')}</span>` : ''}
                ${parseInt(info.bonus_ovr_sconto)  ? `<span>📉 -${info.bonus_ovr_sconto}% ${_t('ag_ovr_bonus')}</span>` : ''}
            </div>
            <div class="ag-bonus-est" style="font-size:0.78rem;color:var(--text-dim);margin-top:4px">
                📊 ~+€${formatMoney(Math.round((myOverall) * (myMoltStip) * 100 * parseFloat(info.bonus_stipendio)))} /${{it:'mese',en:'month',de:'Monat',es:'mes'}[currentLang]||'mese'}
            </div>
            <div class="ag-requisiti">
                <span class="${popOk?'req-ok':'req-no'}">👥 ${parseInt(info.pop_richiesta)>0?_t('ag_req_pop')+' '+info.pop_richiesta:_t('ag_pop_free')}</span>
                <span class="${soldiOk||isOwned?'req-ok':'req-no'}">💰 €${costoReale.toLocaleString('it')}</span>
            </div>
            ${isOwned
                ? `<div class="ag-badge-ok">${_t('agent_active_badge')}</div>`
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

// ── CLASSIFICA ──
