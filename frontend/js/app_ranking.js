/* app_ranking.js — classifiche, Champions, capocannonieri, abilità, toast.
 * Estratto da app.js (refactor): nessuna logica modificata.
 * Caricato in ordine da index.html. */

let selectedClassLegaId = null;
let currentClassTab = 'lega';

async function loadClassifica() {
    const [leghe, player] = await Promise.all([
        api('player.php', { action: 'leghe' }, 'GET'),
        api('player.php', { action: 'get', career_id: currentCareerId }, 'GET')
    ]);
    if (player && !player.error) {
        if (!selectedClassLegaId && player.lega_id) selectedClassLegaId = player.lega_id;
    }
    const filterEl = document.getElementById('classifica-lega-filters');
    if (!Array.isArray(leghe)) { if (filterEl) filterEl.innerHTML = ''; return; }
    const nazioniMap = {};
    leghe.forEach(l => {
        if (!nazioniMap[l.nazione_id]) nazioniMap[l.nazione_id] = { nome: l.nazione_nome, bandiera: l.bandiera, leghe: [] };
        nazioniMap[l.nazione_id].leghe.push(l);
    });
    let filterHtml = '';
    Object.values(nazioniMap).forEach(n => {
        n.leghe.forEach(l => {
            const isActive  = selectedClassLegaId == l.id;
            const isCurrent = player?.lega_id == l.id;
            filterHtml += `<button class="lega-filter-btn ${isActive?'active':''} ${isCurrent?'current-lega':''}" onclick="selectClassLega(${l.id})">${n.bandiera} ${l.nome}${isCurrent?' ★':''}</button>`;
        });
    });
    filterEl.innerHTML = filterHtml;
    if (player && !player.error) {
        if (selectedClassLegaId) await renderClassificaTable(selectedClassLegaId, player);
        if (currentClassTab === 'champions') await renderChampions(player);
    }
}

async function selectClassLega(legaId) { selectedClassLegaId = legaId; await loadClassifica(); }

async function renderClassificaTable(legaId, player) {
    const wrap = document.getElementById('classifica-table-wrap');
    wrap.innerHTML = `<p class="loading">${_t('loading')}</p>`;
    const data = await api('classifica.php', { action: 'get', lega_id: legaId, anno: player.anno_corrente }, 'GET');
    if (!data || data.error || !data.length) {
        wrap.innerHTML = `<p style="color:var(--text-dim);padding:20px">${_t('no_matches')}</p>`;
        return;
    }
    let html = `<table class="season-table classifica-table">
        <thead><tr>
            <th>#</th><th style="text-align:left">${{it:'Squadra',en:'Team',de:'Team',es:'Equipo'}[currentLang]||'Squadra'}</th><th title="Overall">OVR</th>
            <th title="${{it:'Partite Giocate',en:'Played',de:'Gespielt',es:'Jugados'}[currentLang]||'Partite Giocate'}">PG</th><th title="${{it:'Vittorie',en:'Won',de:'Siege',es:'Victorias'}[currentLang]||'Vittorie'}">V</th>
            <th title="${{it:'Pareggi',en:'Drawn',de:'Unentsch.',es:'Empates'}[currentLang]||'Pareggi'}">P</th><th title="${currentLang==='en'?'Lost':'Sconfitte'}">S</th>
            <th title="${{it:'Gol Fatti',en:'Goals For',de:'Tore',es:'Goles a Favor'}[currentLang]||'Gol Fatti'}">GF</th><th title="${{it:'Gol Subiti',en:'Goals Against',de:'Gegentore',es:'Goles en Contra'}[currentLang]||'Gol Subiti'}">GS</th>
            <th title="${{it:'Differenza Reti',en:'Goal Difference',de:'Tordifferenz',es:'Diferencia de Goles'}[currentLang]||'Differenza Reti'}">DR</th><th title="${{it:'Punti',en:'Points',de:'Punkte',es:'Puntos'}[currentLang]||'Punti'}">Pts</th>
        </tr></thead><tbody>`;
    data.forEach((row, i) => {
        const isMyTeam = row.team_id == player.team_id;
        const pos = i + 1;
        let posClass = '';
        if (pos === 1) posClass = 'class-pos-1';
        else if (pos <= 3) posClass = 'class-pos-top3';
        else if (pos <= 4) posClass = 'class-pos-top4';
        else if (pos >= data.length - 2) posClass = 'class-pos-retro';
        const dr = row.gol_fatti - row.gol_subiti;
        const drStr = dr > 0 ? '+' + dr : dr;
        html += `<tr class="${isMyTeam?'my-team-row':''} ${posClass}">
            <td class="pos-cell"><span class="pos-badge ${posClass}">${pos}</span></td>
            <td class="team-name-cell"><span class="team-name-cl">${row.team_nome}</span><span class="team-stars-sm">${'⭐'.repeat(parseInt(row.stelle))}</span>${isMyTeam?'<span class="my-team-badge">TU</span>':''}</td>
            <td><span class="ovr-badge">${row.ovr}</span></td>
            <td>${row.partite_giocate}</td><td>${row.vittorie}</td><td>${row.pareggi}</td><td>${row.sconfitte}</td>
            <td>${row.gol_fatti}</td><td>${row.gol_subiti}</td><td>${drStr}</td>
            <td><strong>${row.punti}</strong></td>
        </tr>`;
    });
    html += `</tbody></table>
        <div class="classifica-legenda">
            <span class="leg-item class-pos-1">${_t('classifica_legend_champion')}</span>
            <span class="leg-item class-pos-top3">${_t('classifica_legend_top3')}</span>
            <span class="leg-item class-pos-top4">${_t('classifica_legend_top4')}</span>
            <span class="leg-item class-pos-retro">${_t('classifica_legend_retro')}</span>
        </div>`;
    wrap.innerHTML = html;
}

async function renderChampions(player) {
    const wrap = document.getElementById('champions-wrap');
    if (!wrap) return;
    wrap.innerHTML = `<p class="loading">${_t('loading')}</p>`;

    const data = await api('classifica.php', { action: 'champions', anno: player.anno_corrente }, 'GET');
    if (!data || data.error || (!Object.keys(data.gironi || {}).length && !data.bracket?.length)) {
        wrap.innerHTML = `<p style="color:var(--text-dim);padding:20px">${_t('champions_not_started_full')}</p>`;
        return;
    }

    const gironi     = data.gironi || {};
    const gruppiKeys = Object.keys(gironi).sort();
    const bracket    = data.bracket || [];
    // Il giocatore potrebbe non essere in Champions — mostriamo comunque tutto
    const myId       = player?.team_id;
    let html = '';

    // ── MENU GRUPPI ──────────────────────────────────────────────────────────
    if (gruppiKeys.length) {
        html += `<div class="champ-group-nav">`;
        html += `<button class="champ-group-nav-btn active" onclick="_champShowAll(this)">${{it:'Tutti i Gruppi',en:'All Groups',de:'Alle Gruppen',es:'Todos los grupos'}[currentLang]||'Tutti i Gruppi'}</button>`;
        gruppiKeys.forEach(g => {
            html += `<button class="champ-group-nav-btn" onclick="_champShowGroup(this,'${g}')">Gr. ${g}</button>`;
        });
        html += `</div>`;
    }

    // ── GIRONI ───────────────────────────────────────────────────────────────
    if (gruppiKeys.length) {
        html += `<div class="zone-label" style="margin:20px 0 14px">📋 ${{it:'Fase a Gironi',en:'Group Stage',de:'Gruppenphase',es:'Fase de Grupos'}[currentLang]||'Fase a Gironi'}</div>`;
        html += `<div class="champ-groups-grid" id="champ-groups-grid">`;
        gruppiKeys.forEach(g => {
            const teams = gironi[g];
            html += `<div class="champ-group-card" data-gruppo="${g}">
                <div class="champ-group-header">
                    <span class="champ-group-letter">${g}</span>
                    <span class="champ-group-head-label">${{it:'Gruppo',en:'Group',de:'Gruppe',es:'Grupo'}[currentLang]||'Gruppo'}</span>
                </div>
                <table class="champ-group-table">
                    <thead><tr>
                        <th style="text-align:left">${{it:'Squadra',en:'Team',de:'Team',es:'Equipo'}[currentLang]||'Squadra'}</th>
                        <th title="${{it:'Giocate',en:'Played',de:'Gespielt',es:'Jugados'}[currentLang]||'Giocate'}">PG</th><th title="${{it:'Vinte',en:'Won',de:'Siege',es:'Ganados'}[currentLang]||'Vinte'}">V</th><th title="${currentLang==='en'?'Drawn':'Paregg.'}">P</th><th title="${{it:'Perse',en:'Lost',de:'Nieder.',es:'Perdidos'}[currentLang]||'Perse'}">S</th>
                        <th title="${{it:'Gol Fatti',en:'Goals For',de:'Tore',es:'Goles a Favor'}[currentLang]||'Gol Fatti'}">GF</th><th title="${{it:'Gol Subiti',en:'Goals Against',de:'Gegentore',es:'Goles en Contra'}[currentLang]||'Gol Subiti'}">GS</th><th title="${currentLang==='en'?'Goal Diff.':'Diff. Reti'}">DR</th><th title="${{it:'Punti',en:'Points',de:'Punkte',es:'Puntos'}[currentLang]||'Punti'}">Pt</th>
                    </tr></thead><tbody>`;
            teams.forEach((t, i) => {
                const isMe = t.team_id == myId;
                const pos  = parseInt(t.posizione_gruppo) || (i + 1);
                const qualClass = pos === 1 ? 'champ-g-primo'
                                : pos === 2 ? 'champ-g-secondo'
                                : pos === 3 ? 'champ-g-terzo'
                                : t.eliminato ? 'champ-g-elim' : '';
                const flag = _buildFlag(t.nazione_nome || '');
                const dr   = (t.gol_fatti_gruppo || 0) - (t.gol_subiti_gruppo || 0);
                const drStr = dr > 0 ? `+${dr}` : `${dr}`;
                html += `<tr class="${qualClass} ${isMe ? 'champ-g-me' : ''}">
                    <td><span class="champ-team-name">${flag ? flag + '\u00a0' : ''}${t.team_nome}</span>${isMe ? ' <span class="my-team-badge">TU</span>' : ''}</td>
                    <td>${t.partite_gruppo ?? 0}</td>
                    <td>${t.vittorie_gruppo ?? 0}</td><td>${t.pareggi_gruppo ?? 0}</td><td>${t.sconfitte_gruppo ?? 0}</td>
                    <td>${t.gol_fatti_gruppo ?? 0}</td><td>${t.gol_subiti_gruppo ?? 0}</td>
                    <td class="champ-dr ${dr > 0 ? 'dr-pos' : dr < 0 ? 'dr-neg' : ''}">${drStr}</td>
                    <td><strong>${t.punti_gruppo ?? 0}</strong></td>
                </tr>`;
            });
            html += `</tbody></table>
                <div class="champ-group-legend">
                    <span class="champ-leg champ-g-primo">${{it:'→ Ottavi',en:'→ Round of 16',de:'→ Achtelfinale',es:'→ Octavos'}[currentLang]||'→ Ottavi'}</span>
                    <span class="champ-leg champ-g-secondo">${{it:'→ Playoff 2ª',en:'→ Playoff 2nd',de:'→ Playoff 2.',es:'→ Playoff 2º'}[currentLang]||'→ Playoff 2ª'}</span>
                    <span class="champ-leg champ-g-terzo">${{it:'→ Playoff 3ª',en:'→ Playoff 3rd',de:'→ Playoff 3.',es:'→ Playoff 3º'}[currentLang]||'→ Playoff 3ª'}</span>
                </div></div>`;
        });
        html += `</div>`;
    }

    // ── BRACKET ───────────────────────────────────────────────────────────────
    if (bracket.length) {
        html += `<div class="zone-label" style="margin:28px 0 14px">⚔️ ${{it:'Fase a Eliminazione Diretta',en:'Knockout Stage',de:'K.O.-Runde',es:'Fase Eliminatoria'}[currentLang]||'Fase a Eliminazione Diretta'}</div>`;
        html += _renderBracket(bracket, player);
    }

    wrap.innerHTML = html;

    // ── ANIMAZIONI ENTRATA ────────────────────────────────────────────────────
    requestAnimationFrame(() => {
        // Gironi: stagger righe
        let rowDelay = 30;
        wrap.querySelectorAll('.champ-group-table tbody tr').forEach(tr => {
            setTimeout(() => tr.classList.add('champ-row-visible'), rowDelay);
            rowDelay += 35;
        });

        // Bracket: colonne da sx con stagger
        wrap.querySelectorAll('.bk-col').forEach((col, i) => {
            col.style.opacity = '0';
            col.style.transform = 'translateX(-16px)';
            setTimeout(() => {
                col.style.transition = 'opacity 0.3s ease, transform 0.3s cubic-bezier(0.22,1,0.36,1)';
                col.style.opacity = '1';
                col.style.transform = 'translateX(0)';
            }, 200 + i * 90);
        });

        // Champion box: già coperto dallo stagger della colonna che la contiene
    });
}

function _champShowAll(btn) {
    document.querySelectorAll('.champ-group-nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.champ-group-card').forEach(c => c.style.display = '');
    const grid = document.getElementById('champ-groups-grid');
    if (grid) grid.style.gridTemplateColumns = 'repeat(2,1fr)';
}

function _champShowGroup(btn, gruppo) {
    document.querySelectorAll('.champ-group-nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.champ-group-card').forEach(c => {
        c.style.display = c.dataset.gruppo === gruppo ? '' : 'none';
    });
    const grid = document.getElementById('champ-groups-grid');
    if (grid) grid.style.gridTemplateColumns = '1fr';
}

function _renderBracket(bracket, player) {
    if (!bracket || !bracket.length)
        return `<p style="color:var(--text-dim);padding:20px;text-align:center">${_t('bracket_no_data_full')}</p>`;

    // Rinomina fasi: ottavi→Ottavi, quarti→Semifinali, semifinale→Finale, finale→Finale
    // (le label visualizzate, le chiavi DB restano invariate)
    const PHASE_LABELS = {
        it: { playoff:'Playoff', ottavi:'Ottavi di Finale', quarti:'Semifinali', semifinale:'Finale', finale:'Finale', vincitore:'Campione' },
        en: { playoff:'Playoff', ottavi:'Round of 16',     quarti:'Semi-finals', semifinale:'Final',  finale:'Final',  vincitore:'Champion' },
    };
    const lang   = (typeof localStorage !== 'undefined' && localStorage.getItem('gs_lang')) || 'it';
    const LABELS = PHASE_LABELS[lang] || PHASE_LABELS.it;
    const ICONS  = { playoff:'⚡', ottavi:'🔵', quarti:'⚔️', semifinale:'🏆', finale:'🏆', vincitore:'🏆' };

    const RANK = { playoff:0, playoff_3:0, ottavi:1, quarti:2, semifinale:3, finale:4, vincitore:5 };
    const phaseRank = t => RANK[t.fase] ?? -1;
    const isElim    = t => t && (t.eliminato == 1 || t.eliminato === '1');
    const isWon     = t => t && t.fase === 'vincitore' && !isElim(t);
    const allWhoReached = r => bracket.filter(t => phaseRank(t) >= r);

    const myId = player?.team_id;
    const flag = t => _buildFlag(t?.nazione_nome || '');

    // ── Riga squadra ──────────────────────────────────────────────────────────
    const teamRow = (t, winner, lostHere) => {
        if (!t) return `<div class="bk-team bk-tbd"><span class="bk-flag"></span><span class="bk-name">${_t('bracket_tbd')}</span></div>`;
        const safeWinner = winner && !lostHere;
        const me    = t.team_id == myId;
        const champ = isWon(t);
        let cls = 'bk-team';
        if (champ)         cls += ' bk-champ-team';
        else if (me)       cls += ' bk-me';
        else if (lostHere) cls += ' bk-out';
        if (safeWinner)    cls += ' bk-winner';
        return `<div class="${cls}">
            <span class="bk-flag">${flag(t)}</span>
            <span class="bk-name">${t.team_nome}${me ? '<span class="bk-you-badge">TU</span>' : ''}</span>
            <span class="bk-right">
                <span class="bk-ovr">${t.ovr}</span>
                ${lostHere          ? '<span class="bk-elim-x">✕</span>' : ''}
                ${champ             ? '<span class="bk-trophy-ico">🏆</span>' : ''}
                ${safeWinner && !champ ? '<span class="bk-adv">›</span>' : ''}
            </span>
        </div>`;
    };

    // ── Match card ────────────────────────────────────────────────────────────
    const matchCard = (a, b, matchPhaseRank) => {
        const rankA = a ? phaseRank(a) : -1, rankB = b ? phaseRank(b) : -1;
        const aElim = !!(a && isElim(a)), bElim = !!(b && isElim(b));
        let aWon = false, bWon = false;
        if      (rankA > rankB)   { aWon = true; }
        else if (rankB > rankA)   { bWon = true; }
        else if (aElim && !bElim) { bWon = true; }
        else if (bElim && !aElim) { aWon = true; }
        else if (aElim && bElim && rankA === matchPhaseRank && rankB === matchPhaseRank) {
            const ovrA = parseInt(a?.ovr || 0), ovrB = parseInt(b?.ovr || 0);
            if      (ovrA > ovrB) aWon = true;
            else if (ovrB > ovrA) bWon = true;
        }
        if (aWon && bWon) bWon = false;
        const aLost = aElim && bWon && rankA <= matchPhaseRank;
        const bLost = bElim && aWon && rankB <= matchPhaseRank;
        return `<div class="bk-match">
            ${teamRow(a, aWon, aLost)}
            <div class="bk-div"></div>
            ${teamRow(b, bWon, bLost)}
        </div>`;
    };

    const pairUp    = arr => { const p=[]; for(let i=0;i<arr.length;i+=2) p.push([arr[i],arr[i+1]||null]); return p; };
    const byGrp     = (arr, g) => arr.find(t => t.gruppo === g) || null;
    const winnerOf  = (a, b) => {
        if (!a) return b; if (!b) return a;
        const rA=phaseRank(a), rB=phaseRank(b);
        if (rA>rB) return a; if (rB>rA) return b;
        if (isElim(a)&&!isElim(b)) return b;
        if (isElim(b)&&!isElim(a)) return a;
        return null;
    };

    // ── Raccogli partecipanti ─────────────────────────────────────────────────
    const po2all  = bracket.filter(t => parseInt(t.posizione_gruppo) === 2);
    const po3all  = bracket.filter(t => parseInt(t.posizione_gruppo) === 3);
    const primiAll = {};
    bracket.filter(t => parseInt(t.posizione_gruppo) === 1).forEach(t => { primiAll[t.gruppo] = t; });
    const ottAll     = allWhoReached(RANK.ottavi);
    const po_winners = ottAll.filter(t => [2,3].includes(parseInt(t.posizione_gruppo)));

    const findPoWinner = (g2, p2, g3, p3) =>
        po_winners.find(t => t.gruppo === g2 && parseInt(t.posizione_gruppo) === p2) ||
        po_winners.find(t => t.gruppo === g3 && parseInt(t.posizione_gruppo) === p3) || null;

    const quaAll = allWhoReached(RANK.quarti);
    const semAll = allWhoReached(RANK.semifinale);
    const finAll = allWhoReached(RANK.finale);
    const vicAll = bracket.filter(t => t.fase === 'vincitore' && !isElim(t));

    // ── Costruisci fasi ───────────────────────────────────────────────────────
    const phases = [];

    const poPairs = [
        [byGrp(po2all,'A'), byGrp(po3all,'C')],
        [byGrp(po2all,'B'), byGrp(po3all,'D')],
        [byGrp(po2all,'C'), byGrp(po3all,'A')],
        [byGrp(po2all,'D'), byGrp(po3all,'B')],
    ].filter(([a,b]) => a || b);
    if (poPairs.length)
        phases.push({ key:'playoff', pairs:poPairs, rank:0 });

    const ottPairs = [
        [primiAll['A'], findPoWinner('B',2,'D',3)],
        [primiAll['B'], findPoWinner('A',2,'C',3)],
        [primiAll['C'], findPoWinner('D',2,'B',3)],
        [primiAll['D'], findPoWinner('C',2,'A',3)],
    ];
    const ottPairsDisplay = ottPairs.filter(([a,b]) => a || b);
    if (ottPairsDisplay.length)
        phases.push({ key:'ottavi', pairs:ottPairsDisplay, rank:1 });

    const w = ottPairs.map(([a,b]) => winnerOf(a,b));
    const quaPairs = [[w[0]||null,w[2]||null],[w[1]||null,w[3]||null]].filter(([a,b])=>a||b);
    const semPairs = quaPairs.length
        ? [[winnerOf(quaPairs[0]?.[0],quaPairs[0]?.[1]), winnerOf(quaPairs[1]?.[0],quaPairs[1]?.[1])]].filter(([a,b])=>a||b)
        : pairUp(semAll);
    const quaFinal = quaPairs.length ? quaPairs : pairUp(quaAll);
    const semFinal = semPairs.length ? semPairs : pairUp(semAll);
    const finFinal = semPairs.length ? semPairs : (pairUp(finAll).length ? pairUp(finAll) : []);

    if (quaFinal.length) phases.push({ key:'quarti',    pairs:quaFinal, rank:2 });
    if (semFinal.length) phases.push({ key:'semifinale', pairs:semFinal, rank:3 });
    else if (finFinal.length || vicAll.length)
        phases.push({ key:'finale', pairs:finFinal, vincitore:vicAll[0]||null, rank:4 });

    // Aggiungi campione se non già incluso nell'ultima fase
    const lastPhase = phases[phases.length-1];
    if (lastPhase && !lastPhase.vincitore && vicAll.length)
        lastPhase.vincitore = vicAll[0];

    if (!phases.length)
        return `<p style="color:var(--text-dim);padding:20px;text-align:center">${_t('bracket_no_data_full')}</p>`;

    // ── Render ────────────────────────────────────────────────────────────────
    // Fase attualmente in corso: la più avanzata tra le squadre non eliminate
    const activeFaseRank = bracket
        .filter(t => !isElim(t) && t.fase !== 'vincitore' && t.fase !== 'gironi')
        .reduce((max, t) => Math.max(max, phaseRank(t)), -1);

    const cols = phases.map((phase, phIdx) => {
        const isLast    = phIdx === phases.length - 1;
        const isActive  = phase.rank === activeFaseRank;
        const label     = LABELS[phase.key] || phase.key;
        const icon      = ICONS[phase.key]  || '📌';
        const matches   = phase.pairs.map(([a,b]) => matchCard(a, b, phase.rank)).join('');

        let champHtml = '';
        if (phase.vincitore) {
            const v  = phase.vincitore;
            const me = v.team_id == myId;
            champHtml = `<div class="bk-champion">
                <div class="bk-champion-trophy">🏆</div>
                <div class="bk-champion-label">${LABELS.vincitore}</div>
                <div class="bk-champion-name ${me ? 'bk-champ-me' : ''}">${flag(v)}\u00a0${v.team_nome}${me ? '<span class="bk-you-badge">TU</span>' : ''}</div>
                <div class="bk-champion-ovr">OVR ${v.ovr}</div>
            </div>`;
        }

        const connector = !isLast
            ? `<div class="bk-connector"><div class="bk-connector-arrow ${isActive ? 'bk-connector-active' : ''}">›</div></div>`
            : '';

        return `<div class="bk-col">
            <div class="bk-col-head">
                <span class="bk-col-icon">${icon}</span>
                <div>
                    <div class="bk-col-label ${isActive ? 'bk-label-active' : ''}">${label}</div>
                </div>
            </div>
            <div class="bk-col-body">${matches}${champHtml}</div>
        </div>${connector}`;
    }).join('');

    // Legend
    const legendHtml = `<div class="bk-legend">
        <div class="bk-leg-item"><span class="bk-leg-dot bk-leg-green"></span>${{it:'Avanzato',en:'Advanced',de:'Weitergekommen',es:'Avanzado'}[lang]||'Avanzato'}</div>
        <div class="bk-leg-item"><span class="bk-leg-dot bk-leg-gold"></span>${{it:'Campione / TU',en:'Champion / You',de:'Champion / DU',es:'Campeón / TÚ'}[lang]||'Campione / TU'}</div>
        <div class="bk-leg-item"><span class="bk-leg-dot bk-leg-red"></span>${{it:'Eliminato',en:'Eliminated',de:'Ausgeschieden',es:'Eliminado'}[lang]||'Eliminato'}</div>
        <div class="bk-leg-item"><span class="bk-leg-dot bk-leg-dim"></span>${{it:'Da disputare',en:'To be played',de:'Noch zu spielen',es:'Por disputar'}[lang]||'Da disputare'}</div>
    </div>`;

    return `<div class="bk-wrap"><div class="bk-bracket">${cols}</div>${legendHtml}</div>`;
}


function switchClassTab(tab) {
    // Handle calendario tab
    if (tab === 'calendario' && window.GS_SeasonPlanner) {
        document.querySelectorAll('[id^="class-tab-"]').forEach(el => el.style.display = 'none');
        const calTab = document.getElementById('class-tab-calendario');
        if (calTab) { calTab.style.display = 'block'; }
        document.querySelectorAll('.class-tab').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.class-tab').forEach(b => {
            b.classList.toggle('active', b.getAttribute('onclick')?.includes("'calendario'"));
        });
        loadCalendarioTab();
        return;
    }
    currentClassTab = tab;
    document.querySelectorAll('.class-tab').forEach(b => {
        b.classList.toggle('active', b.getAttribute('onclick')?.includes(`'${tab}'`));
    });
    document.getElementById('class-tab-lega').style.display      = tab === 'lega'      ? 'block' : 'none';
    document.getElementById('class-tab-champions').style.display = tab === 'champions' ? 'block' : 'none';
    const capoTab = document.getElementById('class-tab-capocannonieri');
    if (capoTab) capoTab.style.display = tab === 'capocannonieri' ? 'block' : 'none';
    if (tab === 'champions') {
        api('player.php', { action:'get', career_id:currentCareerId }, 'GET').then(p => { if (p && !p.error) renderChampions(p); });
    }
    if (tab === 'capocannonieri') {
        loadCapocannonieri();
    }
}

// Carica e mostra la classifica marcatori e migliori per voto della lega del giocatore
async function loadCapocannonieri() {
    const wrap = document.getElementById('capocannonieri-wrap');
    if (!wrap) return;
    wrap.innerHTML = `<p class="loading">${_t('loading')}</p>`;
    const player = await api('player.php', { action: 'get', career_id: currentCareerId }, 'GET');
    if (!player || player.error) { wrap.innerHTML = `<p style="color:var(--text-dim);padding:20px">${_t('no_matches')}</p>`; return; }
    const data = await api('classifica.php', {
        action: 'capocannonieri', lega_id: player.lega_id, anno: player.anno_corrente
    }, 'GET');
    if (!data || data.error) { wrap.innerHTML = `<p style="color:var(--text-dim);padding:20px">${data?.error || _t('no_matches')}</p>`; return; }

    const L = {
        scorers:  {it:'👟 Classifica Marcatori', en:'👟 Top Scorers', de:'👟 Torjägerliste', es:'👟 Goleadores'}[currentLang] || '👟 Classifica Marcatori',
        rated:    {it:'⭐ Migliori per Voto', en:'⭐ Top Rated', de:'⭐ Beste nach Note', es:'⭐ Mejores por Nota'}[currentLang] || '⭐ Migliori per Voto',
        player:   {it:'Tu', en:'You', de:'Du', es:'Tú'}[currentLang] || 'Tu',
        goals:    {it:'Gol', en:'Goals', de:'Tore', es:'Goles'}[currentLang] || 'Gol',
        avg:      {it:'Voto', en:'Rating', de:'Note', es:'Nota'}[currentLang] || 'Voto',
        rank:     {it:'La tua posizione', en:'Your rank', de:'Dein Rang', es:'Tu posición'}[currentLang] || 'La tua posizione',
    };

    const buildTable = (rows, valKey, valLabel, fmt) => {
        let h = `<table class="season-table classifica-table"><thead><tr>
            <th>#</th><th style="text-align:left">${{it:'Giocatore',en:'Player',de:'Spieler',es:'Jugador'}[currentLang]||'Giocatore'}</th>
            <th style="text-align:left">${{it:'Squadra',en:'Team',de:'Team',es:'Equipo'}[currentLang]||'Squadra'}</th>
            <th>${valLabel}</th></tr></thead><tbody>`;
        rows.forEach((r, i) => {
            const me = r.is_player;
            h += `<tr class="${me?'my-team-row':''}">
                <td class="pos-cell"><span class="pos-badge ${i===0?'class-pos-1':(i<3?'class-pos-top3':'')}">${i+1}</span></td>
                <td class="team-name-cell"><span class="team-name-cl">${esc(r.nome)}</span>${me?`<span class="my-team-badge">${L.player}</span>`:''}</td>
                <td style="text-align:left;color:var(--text-dim)">${r.team||'—'}</td>
                <td><strong>${fmt(r[valKey])}</strong></td></tr>`;
        });
        h += `</tbody></table>`;
        return h;
    };

    wrap.innerHTML = `
        <div class="capo-grid">
            <div class="capo-col">
                <h3 class="capo-title">${L.scorers}</h3>
                ${buildTable(data.top_scorers||[], 'gol', L.goals, v=>v)}
                <p class="capo-rank">${L.rank}: <strong>#${data.player_rank_scorers}</strong> / ${data.total}</p>
            </div>
            <div class="capo-col">
                <h3 class="capo-title">${L.rated}</h3>
                ${buildTable(data.top_rated||[], 'voto', L.avg, v=>{const n=parseFloat(v); return Number.isFinite(n)?n.toFixed(2):'—';})}
                <p class="capo-rank">${L.rank}: <strong>#${data.player_rank_rated}</strong> / ${data.total}</p>
            </div>
        </div>`;
}

// Mappa nazione → codice ISO per costruire flag emoji via Regional Indicator characters
// (più affidabili delle emoji dirette su Windows)
const _nazioneFlag = {
    'Italia': 'IT', 'Francia': 'FR', 'Inghilterra': 'GB',
    'Spagna': 'ES', 'Germania': 'DE'
};
function _buildFlag(nomeNazione) {
    const code = _nazioneFlag[nomeNazione] || null;
    if (!code) return '';
    // Regional Indicator A = 0x1F1E6, offset by char code - 65
    return String.fromCodePoint(0x1F1E6 + (code.charCodeAt(0) - 65)) +
           String.fromCodePoint(0x1F1E6 + (code.charCodeAt(1) - 65));
}
function formatMoney(n) {
    n = parseFloat(n);
    if (n >= 1000000) return '€' + (n/1000000).toFixed(1) + 'M';
    if (n >= 1000)    return '€' + (n/1000).toFixed(0) + 'K';
    return '€' + Math.floor(n);
}

function getMeseName(m, full) {
    if (full) return _t('month_full_' + m) || _t('month_' + m) || '?';
    return _t('month_' + m) || '?';
}

function getStrutturaName(lvl) {
    const idx = parseInt(lvl);
    if (idx <= 0 || isNaN(idx)) return {it:'Nessuna',en:'None',de:'Keine',es:'Ninguna'}[currentLang]||'Nessuna';
    const nomiIT = {1:'Campetto Base',2:'Spogliatoio Attrezzato',3:'Palestra e Campo',4:'Centro Sportivo',5:'Centro High-Tech',6:"Centro d'Elite",7:'Academy Personale'};
    const nomiEN = {1:'Basic Pitch',2:'Equipped Changing Room',3:'Gym & Field',4:'Sports Centre',5:'High-Tech Centre',6:'Elite Centre',7:'Personal Academy'};
    const nomiDE = {1:'Einfacher Platz',2:'Ausgestattete Umkleidekabine',3:'Fitnessstudio & Feld',4:'Sportzentrum',5:'High-Tech-Zentrum',6:'Elite-Zentrum',7:'Persönliche Akademie'};
    const nomiES = {1:'Campo Básico',2:'Vestuario Equipado',3:'Gimnasio y Campo',4:'Centro Deportivo',5:'Centro de Alta Tecnología',6:'Centro de Élite',7:'Academia Personal'};
    return ({en:nomiEN[idx]||'Unknown',de:nomiDE?.[idx]||nomiEN[idx]||'Unbekannt',es:nomiES?.[idx]||nomiEN[idx]||'Desconocida',it:nomiIT[idx]||'Sconosciuta'})[currentLang]||nomiIT[idx]||'Sconosciuta';
}

function toast(msg, type = '') {
    if (window.GS_UI) { GS_UI.toast(msg, type || 'info'); return; }
    // Fallback if GS_UI not yet loaded
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3500);
}

// ── SKILL TREE ──
const ST_MILESTONES = [40,50,60,70,75,80,85,90,95,100,105,110,115,120,125];

const SKILL_TREES = {
    dribbling: {
        label_it:'Dribbling', label_en:'Dribbling', label_de:'Dribbling', label_es:'Regate', icon:'🏃', color:'#f39c12',
        skills: [
            { id:'elastico',        icon:'🌀', tier:1, cost:1, maxLv:3, boostStat:'dribbling', boostPerLv:[2,4,7],
              name_it:'Elastico', name_en:'Elastic', name_de:'Elastik', name_es:'Elástico', requires:null,
              desc_it:'Aumenta il dribbling base. Lv3: sblocca doppio passo.', desc_en:'Increases base dribbling. Lv3: unlocks step-over.', desc_de:'Verbessert Basis-Dribbling. Lv3: schaltet Steptrick frei.', desc_es:'Aumenta el regate base. Nv3: desbloquea el pasito.' },
            { id:'dribbler',        icon:'⚡', tier:2, cost:2, maxLv:3, boostStat:'dribbling', boostPerLv:[4,7,12],
              name_it:'Dribbler Nato', name_en:'Natural Dribbler', name_de:'Natürlicher Dribblist', name_es:'Regateador Nato', requires:'elastico',
              desc_it:'Bonus dribbling in 1v1.', desc_en:'Dribbling bonus in 1v1.', desc_de:'Dribbling-Bonus im 1-gegen-1.', desc_es:'Bono de regate en duelos 1v1.' },
            { id:'finta_speciale',  icon:'🎩', tier:3, cost:3, maxLv:2, boostStat:'dribbling', boostPerLv:[8,15],
              name_it:'Finta Speciale', name_en:'Special Feint', name_de:'Spezialtäuschung', name_es:'Finta Especial', requires:'dribbler',
              desc_it:'Finta imprevedibile.', desc_en:'Unpredictable feint.', desc_de:'Unberechenbare Täuschbewegung.', desc_es:'Finta imprevisible.' },
            { id:'visione',         icon:'👁️', tier:2, cost:2, maxLv:3, boostStat:'mentalita', boostPerLv:[3,5,8],
              name_it:'Visione di Gioco', name_en:'Game Vision', name_de:'Spielübersicht', name_es:'Visión de Juego', requires:'elastico',
              desc_it:'Migliora la mentalità.', desc_en:'Improves mental stats.', desc_de:'Verbessert Mentalitätswerte.', desc_es:'Mejora los atributos mentales.' },
            { id:'controllo_palla', icon:'⚽', tier:3, cost:3, maxLv:2, boostStat:'dribbling', boostPerLv:[6,11],
              name_it:'Controllo Palla', name_en:'Ball Control', name_de:'Ballkontrolle', name_es:'Control de Balón', requires:'visione',
              desc_it:'Massimo controllo sotto pressione.', desc_en:'Maximum control under pressure.', desc_de:'Maximale Kontrolle unter Druck.', desc_es:'Control máximo bajo presión.' },
        ]
    },
    tiro: {
        label_it:'Tiro', label_en:'Shooting', label_de:'Schuss', label_es:'Disparo', icon:'🎯', color:'#e74c3c',
        skills: [
            { id:'precisione',  icon:'🎯', tier:1, cost:1, maxLv:3, boostStat:'tiro', boostPerLv:[2,4,7],
              name_it:'Precisione', name_en:'Precision', name_de:'Präzision', name_es:'Precisión', requires:null,
              desc_it:'Migliora la precisione dei tiri.', desc_en:'Improves shooting precision.', desc_de:'Verbessert die Schussgenauigkeit.', desc_es:'Mejora la precisión de los disparos.' },
            { id:'tiro_potente',icon:'💥', tier:2, cost:2, maxLv:3, boostStat:'tiro', boostPerLv:[4,8,13],
              name_it:'Tiro Potente', name_en:'Power Shot', name_de:'Kraftschuss', name_es:'Disparo Potente', requires:'precisione',
              desc_it:'Aumenta la potenza del tiro.', desc_en:'Increases shot power.', desc_de:'Erhöht die Schusskraft.', desc_es:'Aumenta la potencia del disparo.' },
            { id:'tiro_giro',   icon:'🌪️', tier:3, cost:3, maxLv:2, boostStat:'tiro', boostPerLv:[7,14],
              name_it:'Tiro a Giro', name_en:'Curved Shot', name_de:'Bogenball', name_es:'Disparo Curvo', requires:'tiro_potente',
              desc_it:'Padroneggi la curva del pallone.', desc_en:'Master the ball curve.', desc_de:'Meistere den Bogenball.', desc_es:'Domina la curva del balón.' },
            { id:'freddezza',   icon:'🧊', tier:2, cost:2, maxLv:3, boostStat:'mentalita', boostPerLv:[3,6,9],
              name_it:'Freddezza', name_en:'Composure', name_de:'Kaltblütigkeit', name_es:'Sangre Fría', requires:'precisione',
              desc_it:'Sotto pressione non sbagli.', desc_en:"You don't miss under pressure.", desc_de:'Unter Druck triffst du immer.', desc_es:'Bajo presión no fallas.' },
            { id:'gol_rabona',  icon:'🦅', tier:3, cost:3, maxLv:1, boostStat:'tiro', boostPerLv:[12],
              name_it:'Gol di Rabona', name_en:'Rabona Goal', name_de:'Rabona-Tor', name_es:'Gol de Rabona', requires:'freddezza',
              desc_it:'Abilità leggendaria.', desc_en:'Legendary skill.', desc_de:'Legendäre Fähigkeit.', desc_es:'Habilidad legendaria.' },
        ]
    },
    velocita: {
        label_it:'Velocità', label_en:'Speed', label_de:'Geschwindigkeit', label_es:'Velocidad', icon:'⚡', color:'#3498db',
        skills: [
            { id:'scatto',           icon:'💨', tier:1, cost:1, maxLv:3, boostStat:'velocita', boostPerLv:[2,4,7],
              name_it:'Scatto', name_en:'Sprint', name_de:'Sprint', name_es:'Arranque', requires:null,
              desc_it:"Migliora l'accelerazione.", desc_en:'Improves acceleration.', desc_de:'Verbessert die Beschleunigung.', desc_es:'Mejora la aceleración.' },
            { id:'velocista',        icon:'🏅', tier:2, cost:2, maxLv:3, boostStat:'velocita', boostPerLv:[4,7,12],
              name_it:'Velocista', name_en:'Sprinter', name_de:'Sprinter', name_es:'Velocista', requires:'scatto',
              desc_it:'Velocità di punta incrementata.', desc_en:'Top speed increased.', desc_de:'Höchstgeschwindigkeit erhöht.', desc_es:'Velocidad máxima aumentada.' },
            { id:'turbo',            icon:'🚀', tier:3, cost:3, maxLv:2, boostStat:'velocita', boostPerLv:[8,16],
              name_it:'Turbo', name_en:'Turbo', name_de:'Turbo', name_es:'Turbo', requires:'velocista',
              desc_it:'Burst di velocità sovrumano.', desc_en:'Superhuman speed burst.', desc_de:'Übermenschlicher Geschwindigkeitsschub.', desc_es:'Explosión de velocidad sobrehumana.' },
            { id:'resistenza',       icon:'🔋', tier:2, cost:2, maxLv:3, boostStat:'fisico',   boostPerLv:[3,5,8],
              name_it:'Resistenza', name_en:'Stamina', name_de:'Ausdauer', name_es:'Resistencia', requires:'scatto',
              desc_it:'Mantieni la velocità per tutta la partita.', desc_en:'Maintain speed for the whole match.', desc_de:'Behalte die Geschwindigkeit über das gesamte Spiel.', desc_es:'Mantén la velocidad durante todo el partido.' },
            { id:'dribbling_veloce', icon:'🌩️', tier:3, cost:3, maxLv:2, boostStat:'dribbling', boostPerLv:[5,10],
              name_it:'Dribbling Veloce', name_en:'Speed Dribble', name_de:'Schnell-Dribbling', name_es:'Regate Veloz', requires:'resistenza',
              desc_it:'Combina velocità e dribbling.', desc_en:'Combine speed and dribbling.', desc_de:'Kombination aus Geschwindigkeit und Dribbling.', desc_es:'Combina velocidad y regate.' },
        ]
    },
    fisico: {
        label_it:'Fisico', label_en:'Physical', label_de:'Körper', label_es:'Físico', icon:'💪', color:'#27ae60',
        skills: [
            { id:'forza',       icon:'🏋️', tier:1, cost:1, maxLv:3, boostStat:'fisico', boostPerLv:[2,4,7],
              name_it:'Forza', name_en:'Strength', name_de:'Kraft', name_es:'Fuerza', requires:null,
              desc_it:'Aumenta la forza fisica.', desc_en:'Increases physical strength.', desc_de:'Erhöht die körperliche Kraft.', desc_es:'Aumenta la fuerza física.' },
            { id:'colpo_testa', icon:'⚽', tier:2, cost:2, maxLv:3, boostStat:'fisico', boostPerLv:[4,7,12],
              name_it:'Colpo di Testa', name_en:'Header', name_de:'Kopfball', name_es:'Cabezazo', requires:'forza',
              desc_it:'Dominante sui cross.', desc_en:'Dominant on crosses.', desc_de:'Dominant bei Flanken.', desc_es:'Dominante en los centros.' },
            { id:'muro',        icon:'🧱', tier:3, cost:3, maxLv:2, boostStat:'fisico', boostPerLv:[8,15],
              name_it:'Muro', name_en:'Wall', name_de:'Mauer', name_es:'Muro', requires:'colpo_testa',
              desc_it:'Impossibile spostarlo.', desc_en:"Impossible to move.", desc_de:'Nicht wegzubewegen.', desc_es:'Imposible de desplazar.' },
            { id:'recupero',    icon:'❤️', tier:2, cost:2, maxLv:3, boostStat:'fisico', boostPerLv:[3,5,8],
              name_it:'Recupero Rapido', name_en:'Fast Recovery', name_de:'Schnelle Erholung', name_es:'Recuperación Rápida', requires:'forza',
              desc_it:'Recuperi più in fretta.', desc_en:'You recover faster.', desc_de:'Du erholtst dich schneller.', desc_es:'Te recuperas más rápido.' },
            { id:'stamina',     icon:'🔥', tier:3, cost:3, maxLv:2, boostStat:'fisico', boostPerLv:[6,12],
              name_it:'Stamina', name_en:'Stamina', name_de:'Kondition', name_es:'Stamina', requires:'recupero',
              desc_it:"Sei ancora al 100% al 90°.", desc_en:"Still at 100% at the 90th minute.", desc_de:"Noch bei 100 % in der 90. Minute.", desc_es:"Todavía al 100 % en el minuto 90." },
        ]
    },
    mentalita: {
        label_it:'Mentalità', label_en:'Mental', label_de:'Mentalität', label_es:'Mentalidad', icon:'🧠', color:'#9b59b6',
        skills: [
            { id:'concentrazione', icon:'🎯', tier:1, cost:1, maxLv:3, boostStat:'mentalita', boostPerLv:[2,4,7],
              name_it:'Concentrazione', name_en:'Focus', name_de:'Konzentration', name_es:'Concentración', requires:null,
              desc_it:'Mantieni il focus.', desc_en:'Maintain your focus.', desc_de:'Behalte den Fokus.', desc_es:'Mantén la concentración.' },
            { id:'leadership',     icon:'👑', tier:2, cost:2, maxLv:3, boostStat:'mentalita', boostPerLv:[4,7,12],
              name_it:'Leadership', name_en:'Leadership', name_de:'Führungsqualität', name_es:'Liderazgo', requires:'concentrazione',
              desc_it:'Trascini la squadra.', desc_en:'You drive the team forward.', desc_de:'Du reißt das Team mit.', desc_es:'Arrastras al equipo.' },
            { id:'campione',       icon:'🏆', tier:3, cost:3, maxLv:2, boostStat:'mentalita', boostPerLv:[8,16],
              name_it:'Mentalità Campione', name_en:'Champion Mindset', name_de:'Siegermentalität', name_es:'Mentalidad Campeón', requires:'leadership',
              desc_it:'Nei momenti decisivi sei il migliore.', desc_en:'Best when it matters most.', desc_de:'Im entscheidenden Moment der Beste.', desc_es:'El mejor en los momentos decisivos.' },
            { id:'carisma',        icon:'🌟', tier:2, cost:2, maxLv:3, boostStat:'mentalita', boostPerLv:[3,5,8],
              name_it:'Carisma', name_en:'Charisma', name_de:'Charisma', name_es:'Carisma', requires:'concentrazione',
              desc_it:'La tua personalità convince tutti.', desc_en:'Your personality convinces everyone.', desc_de:'Deine Persönlichkeit überzeugt alle.', desc_es:'Tu personalidad convence a todos.' },
            { id:'istinto',        icon:'👁️', tier:3, cost:3, maxLv:2, boostStat:'tiro',      boostPerLv:[5,10],
              name_it:'Istinto del Goleador', name_en:"Striker's Instinct", name_de:'Torjäger-Instinkt', name_es:'Instinto Goleador', requires:'carisma',
              desc_it:'Sei sempre nel posto giusto.', desc_en:'Always in the right place.', desc_de:'Immer zur richtigen Zeit am richtigen Ort.', desc_es:'Siempre en el lugar correcto.' },
        ]
    }
}

let stState = { points: 0, unlocked: {} };

function stGetSaveKey() { return `gs_skilltree_${currentCareerId}`; }

function stLoad() {
    const raw = localStorage.getItem(stGetSaveKey());
    if (raw) {
        try {
            const parsed = JSON.parse(raw);
            const migrated = {};
            Object.entries(parsed.unlocked || {}).forEach(([id, val]) => {
                migrated[id] = typeof val === 'number' ? { level: val, applied: 0 } : val;
            });
            stState = { points: parsed.points || 0, unlocked: migrated };
        } catch(e) { stState = { points: 0, unlocked: {} }; }
    } else {
        stState = { points: 0, unlocked: {} };
    }
}

function stSave() { localStorage.setItem(stGetSaveKey(), JSON.stringify(stState)); }

async function stSyncBoosts() {
    for (const [skillId, entry] of Object.entries(stState.unlocked)) {
        const curLv     = typeof entry === 'number' ? entry : (entry.level   || 0);
        const appliedLv = typeof entry === 'number' ? 0     : (entry.applied || 0);
        // Salta se già sincronizzato con il server a questo livello
        if (curLv <= 0 || appliedLv >= curLv) continue;
        let sk = null;
        for (const tree of Object.values(SKILL_TREES)) {
            sk = tree.skills.find(s => s.id === skillId);
            if (sk) break;
        }
        if (!sk) continue;
        const totalBoost = sk.boostPerLv[curLv - 1] || 0;
        if (totalBoost <= 0) continue;
        try {
            const res = await api('game.php', {
                action: 'apply_skill_boost', skill_id: skillId,
                stat: sk.boostStat, total_boost: totalBoost, level: curLv
            }, 'POST');
            if (res && res.success && currentPlayer) {
                currentPlayer[sk.boostStat] = res.new_val;
                currentPlayer.overall       = res.new_overall;
                if (res.piede_forte)   currentPlayer.piede_forte   = res.piede_forte;
                if (res.piede_debole)  currentPlayer.piede_debole  = res.piede_debole;
                if (res.livello_skill) currentPlayer.livello_skill = res.livello_skill;
                stState.unlocked[skillId] = { level: curLv, applied: curLv };
                stSave();
            }
        } catch(e) { console.warn('stSyncBoosts error', skillId, e); }
    }
}

function stComputeEarnedPoints(player) {
    let earned = 0;
    ['dribbling','tiro','velocita','fisico','mentalita'].forEach(s => {
        const val = parseInt(player[s]) || 0;
        ST_MILESTONES.forEach(m => { if (val >= m) earned++; });
    });
    return earned;
}

function stComputeSpentPoints() {
    let spent = 0;
    Object.entries(stState.unlocked).forEach(([id, entry]) => {
        const lv = typeof entry === 'number' ? entry : (entry?.level || 0);
        for (const tree of Object.values(SKILL_TREES)) {
            const sk = tree.skills.find(s => s.id === id);
            if (sk) { for (let i=0;i<lv;i++) spent += sk.cost; break; }
        }
    });
    return spent;
}

let stActiveTab = 'dribbling';

async function loadSkillTree() {
    if (!currentPlayer) {
        const p = await api('player.php',{action:'get',career_id:currentCareerId},'GET');
        if (p && !p.error) currentPlayer = p;
        else { console.warn('loadSkillTree: failed to load player', p); return; }
    }
    stLoad();

    // Riconcilia lo stato locale con il DB: segna come già applicati i boost già presenti sul server
    const dbBoosts = await api('game.php', { action: 'get_skill_boosts' }, 'GET');
    if (dbBoosts && dbBoosts.boosts) {
        Object.entries(dbBoosts.boosts).forEach(([skillId, info]) => {
            const localEntry = stState.unlocked[skillId];
            const localLv = localEntry ? (typeof localEntry === 'number' ? localEntry : localEntry.level || 0) : 0;
            const dbLv = info.level || 0;
            // Se il DB ha un livello >= quello locale, considera applicato
            if (dbLv >= localLv && localLv > 0) {
                stState.unlocked[skillId] = { level: localLv, applied: localLv };
            }
        });
        stSave();
    }

    await stSyncBoosts();

    const earned = stComputeEarnedPoints(currentPlayer);
    const spent  = stComputeSpentPoints();
    stState.points = earned - spent;

    const banner = document.getElementById('st-points-banner');
    const label  = document.getElementById('st-points-label');
    if (label) {
        const _pts = stState.points;
        const _ptLabel = {
            it: `${_pts} punt${_pts===1?'o':'i'} abilità disponibil${_pts===1?'e':'i'}`,
            en: `${_pts} skill point${_pts === 1 ? '' : 's'} available`,
            de: `${_pts} Fähigkeitspoint${_pts === 1 ? '' : 's'} verfügbar`,
            es: `${_pts} punto${_pts === 1 ? '' : 's'} de habilidad disponible${_pts === 1 ? '' : 's'}`,
        };
        label.textContent = _ptLabel[currentLang] || _ptLabel.it;
        if (banner) banner.className = 'st-points-banner' + (stState.points > 0 ? ' has-points' : '');
    }

    const pf = parseInt(currentPlayer.piede_forte || 3);
    const pd = parseInt(currentPlayer.piede_debole || 2);
    const ls = parseInt(currentPlayer.livello_skill || 2);
    const pfLato = currentPlayer.piede_forte_lato  === 'sx' ? _t('foot_sx') : _t('foot_dx');
    const pdLato = currentPlayer.piede_debole_lato === 'sx' ? _t('foot_sx') : _t('foot_dx');
    const pfV = document.getElementById('st-piede-forte-val');
    const pdV = document.getElementById('st-piede-debole-val');
    const lsV = document.getElementById('st-livello-skill-val');
    if (pfV) pfV.innerHTML = `${'⭐'.repeat(pf)}${'☆'.repeat(5-pf)} <span style="color:var(--text-dim);font-size:0.8rem">${pfLato}</span>`;
    if (pdV) pdV.innerHTML = `${'⭐'.repeat(pd)}${'☆'.repeat(5-pd)} <span style="color:var(--text-dim);font-size:0.8rem">${pdLato}</span>`;
    if (lsV) lsV.textContent = '⭐'.repeat(ls) + '☆'.repeat(5-ls) + ` (${ls}/5)`;

    const tabsEl = document.getElementById('st-tabs');
    if (tabsEl) {
        tabsEl.innerHTML = Object.entries(SKILL_TREES).map(([key, tree]) => {
            const statVal = parseInt(currentPlayer[key]) || 0;
            return `<button class="st-tab ${stActiveTab===key?'active':''}"
                onclick="stSwitchTab('${key}')" data-tree-key="${key}" style="--tree-color:${tree.color}">
                <span class="st-tab-icon">${tree.icon}</span>
                <span class="st-tab-name">${({en:tree.label_en,de:tree.label_de||tree.label_en,es:tree.label_es||tree.label_en,it:tree.label_it}[currentLang]||tree.label_it)}</span>
                <span class="st-tab-val">${statVal}</span>
            </button>`;
        }).join('');
    }
    stRenderTree(stActiveTab);
}

function stSwitchTab(key) {
    stActiveTab = key;
    document.querySelectorAll('.st-tab').forEach(t =>
        t.classList.toggle('active', t.dataset.treeKey === key)
    );
    stRenderTree(key);
}

function stRenderTree(key) {
    const tree    = SKILL_TREES[key];
    const statVal = parseInt(currentPlayer[key]) || 0;
    const content = document.getElementById('st-content');
    if (!content) return;

    const milestoneHtml = `
    <div class="st-milestone-wrap">
        <div class="st-milestone-header">
            <span style="color:${tree.color}">${tree.icon} ${({en:tree.label_en,de:tree.label_de||tree.label_en,es:tree.label_es||tree.label_en,it:tree.label_it}[currentLang]||tree.label_it)}</span>
            <span class="st-stat-value">${statVal} / 125</span>
        </div>
        <div class="st-milestone-bar-bg">
            <div class="st-milestone-bar-fill" style="transform:scaleX(${(Math.min(100,(statVal/125)*100)/100).toFixed(4)});background:${tree.color}"></div>
            ${ST_MILESTONES.map(m => {
                const pct = (m/125)*100;
                const reached = statVal >= m;
                return `<div class="st-milestone-marker ${reached?'reached':''}" style="left:${pct.toFixed(1)}%">
                    <div class="st-milestone-dot" style="${reached?`background:${tree.color}`:''}"></div>
                    <div class="st-milestone-label">${m}</div>
                </div>`;
            }).join('')}
        </div>
        <div class="st-milestone-hint">${{it:'15 milestone (40→125) · ogni soglia = 1 punto abilità',en:'15 milestones (40→125) · each threshold = 1 skill point',de:'15 Meilensteine (40→125) · jede Schwelle = 1 Fähigkeitspunkt',es:'15 hitos (40→125) · cada umbral = 1 punto de habilidad'}[currentLang]||'15 milestone (40→125) · ogni soglia = 1 punto abilità'}</div>
    </div>`;

    const tiers = {};
    tree.skills.forEach(sk => { if (!tiers[sk.tier]) tiers[sk.tier]=[]; tiers[sk.tier].push(sk); });
    const tierNames = { 1:'Livello Base', 2:'Specialista', 3:'Elite' };

    const skillsHtml = Object.entries(tiers).map(([tier, skills]) => {
        const skHtml = skills.map(sk => {
            const entryData  = stState.unlocked[sk.id];
            const unlockedLv = typeof entryData==='number' ? entryData : (entryData?.level||0);
            const isMaxed    = unlockedLv >= sk.maxLv;
            const reqEntry   = sk.requires ? stState.unlocked[sk.requires] : null;
            const reqLv      = sk.requires ? (typeof reqEntry==='number' ? reqEntry : (reqEntry?.level||0)) : 1;
            const canUnlock  = reqLv > 0 && !isMaxed && stState.points >= sk.cost;
            const isLocked   = reqLv === 0;
            const boostNow   = unlockedLv > 0 ? sk.boostPerLv[unlockedLv-1] : 0;
            const boostNext  = !isMaxed ? sk.boostPerLv[unlockedLv] : null;
            const statLabel  = { tiro:'Tiro',velocita:'Velocità',dribbling:'Dribbling',fisico:'Fisico',mentalita:'Mentalità' }[sk.boostStat]||sk.boostStat;
            const pips = Array.from({length:sk.maxLv},(_,i)=>
                `<div class="st-pip ${i<unlockedLv?'filled':''}" style="${i<unlockedLv?`background:${tree.color}`:''}"></div>`
            ).join('');
            return `<div class="st-node ${isLocked?'locked':''} ${isMaxed?'maxed':''} ${unlockedLv>0&&!isMaxed?'partial':''}" data-skill-id="${sk.id}" style="--tree-color:${tree.color}">
                <div class="st-node-icon">${sk.icon}</div>
                <div class="st-node-body">
                    <div class="st-node-name">${({en:sk.name_en,de:sk.name_de||sk.name_en,es:sk.name_es||sk.name_en,it:sk.name_it}[currentLang]||sk.name_it)}</div>
                    <div class="st-node-desc">${({en:sk.desc_en,de:sk.desc_de||sk.desc_en,es:sk.desc_es||sk.desc_en,it:sk.desc_it}[currentLang]||sk.desc_it)}</div>
                    <div class="st-node-boost">
                        ${unlockedLv>0?`<span class="st-boost-active">+${boostNow} ${statLabel}</span>`:''}
                        ${boostNext!==null?`<span class="st-boost-next">${unlockedLv>0?'→':''} +${boostNext} ${statLabel} al prossimo lv</span>`:''}
                    </div>
                    <div class="st-node-pips">${pips}</div>
                </div>
                <div class="st-node-actions">
                    ${isLocked
                        ? `<div class="st-lock-badge">🔒 Richiede: ${tree.skills.find(s=>s.id===sk.requires)?.name||sk.requires}</div>`
                        : isMaxed
                            ? `<div class="st-maxed-badge">✨ MAX</div>`
                            : `<button class="st-upgrade-btn ${canUnlock?'':'disabled'}" onclick="stUpgrade('${key}','${sk.id}')" ${canUnlock?'':'disabled'}>
                                <span class="st-cost">💎 ${sk.cost}</span>
                                ${unlockedLv===0?'Sblocca':'Potenzia'}
                               </button>`
                    }
                </div>
            </div>`;
        }).join('');
        return `<div class="st-tier">
            <div class="st-tier-label">
                <span class="st-tier-badge" style="background:${tree.color}22;color:${tree.color};border-color:${tree.color}44">Tier ${tier} — ${tierNames[tier]}</span>
            </div>
            <div class="st-tier-nodes">${skHtml}</div>
        </div>`;
    }).join('');

    content.innerHTML = milestoneHtml + `<div class="st-skills-wrap">${skillsHtml}</div>`;
}

async function stUpgrade(treeKey, skillId) {
    if (!currentPlayer) return;
    const tree = SKILL_TREES[treeKey];
    const sk   = tree.skills.find(s => s.id === skillId);
    if (!sk) return;

    const entry  = stState.unlocked[skillId];
    const curLv  = typeof entry==='number' ? entry : (entry?.level||0);
    const reqEntry = sk.requires ? stState.unlocked[sk.requires] : null;
    const reqLv  = sk.requires ? (typeof reqEntry==='number' ? reqEntry : (reqEntry?.level||0)) : 1;
    const available = stComputeEarnedPoints(currentPlayer) - stComputeSpentPoints();

    if (reqLv === 0)         { toast(_t('prereq_unlock'), 'error'); return; }
    if (curLv >= sk.maxLv)   { toast(_t('skill_maxed'), ''); return; }
    if (available < sk.cost) { toast({it:`Servono ${sk.cost} punti (hai ${available})`,en:`Need ${sk.cost} points (you have ${available})`,de:`Benötige ${sk.cost} Punkte (du hast ${available})`,es:`Necesitas ${sk.cost} puntos (tienes ${available})`}[currentLang]||`Servono ${sk.cost} punti (hai ${available})`, 'error'); return; }

    const newLv      = curLv + 1;
    const totalBoost = sk.boostPerLv[newLv-1] || 0;
    const statLabels = { tiro:'Tiro',velocita:'Velocita',dribbling:'Dribbling',fisico:'Fisico',mentalita:'Mentalita' };

    if (window.GS_Particles) {
        const btn = document.querySelector(`[data-skill-id='${skillId}']`);
        GS_Particles.effects.levelUpBurst(btn?.getBoundingClientRect()?.left + 40, btn?.getBoundingClientRect()?.top + 40);
    }
    if (window.GS_Achievements) {
        const totalSkills = Object.keys(stState.unlocked).length;
        GS_Achievements.checkSkillUnlocked(totalSkills);
    }
    stState.unlocked[skillId] = { level: newLv, applied: newLv };
    stSave();

    try {
        const res = await api('game.php', {
            action: 'apply_skill_boost', skill_id: skillId,
            stat: sk.boostStat, total_boost: totalBoost, level: newLv
        }, 'POST');
        if (res && res.success) {
            if (currentPlayer) {
                currentPlayer[sk.boostStat] = res.new_val;
                currentPlayer.overall       = res.new_overall;
                if (res.piede_forte)   currentPlayer.piede_forte   = res.piede_forte;
                if (res.piede_debole)  currentPlayer.piede_debole  = res.piede_debole;
                if (res.livello_skill) currentPlayer.livello_skill = res.livello_skill;
            }
            const delta = res.delta || 0;
            toast(`✨ ${({en:sk.name_en,de:sk.name_de||sk.name_en,es:sk.name_es||sk.name_en,it:sk.name_it}[currentLang]||sk.name_it)} Lv${newLv}! ${delta>0?`+${delta} ${statLabels[sk.boostStat]} aggiunto!`:'Già applicato.'}`, 'success');
            // Leggi posizione bottone PRIMA che loadSkillTree() ricostruisca il DOM
            const btn = document.querySelector(`button[onclick="stUpgrade('${treeKey}','${skillId}')"]`);
            const btnColor = tree.color;
            if (btn) {
                // getBoundingClientRect ora, mentre il nodo esiste ancora
                const rect = btn.getBoundingClientRect();
                _skillParticleBurst(btn, btnColor, rect);
            }
        } else {
            toast(_t('api_error_label') + (res?.error || _t('error_unknown')), 'error');
            stState.unlocked[skillId] = { level: curLv, applied: curLv };
            stSave();
        }
    } catch(e) {
        toast(_t('conn_error_short'), 'error');
        stState.unlocked[skillId] = { level: curLv, applied: curLv };
        stSave();
    }
    loadSkillTree();
}

