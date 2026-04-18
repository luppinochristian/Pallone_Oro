/**
 * ============================================================
 * season_planner.js — Pianificatore stagionale e calendario partite
 * ============================================================
 * Visualizza il calendario della stagione corrente con le partite
 * già giocate e quelle future, con previsioni di difficoltà.
 *
 * FUNZIONALITÀ:
 *  - Visualizzazione mese per mese della stagione (set → giu)
 *  - Indicatore di difficoltà per ogni avversario futuro
 *  - Riepilogo statistiche mensili (vinte/pareggiate/perse)
 *  - Previsione punti e posizione in classifica
 *  - Grafico andamento overall durante la stagione
 *  - Suggerimenti tattici in base al prossimo avversario
 *
 * API pubblica:
 *  - render(container, playerData): disegna il planner completo
 *  - renderMonthCard(month, data): card singolo mese
 *  - getDifficultyLabel(ovr): etichetta difficoltà avversario
 *
 * Esposto come oggetto globale GS_SeasonPlanner.
 * ============================================================
 */

const GS_SeasonPlanner = (() => {

    // ── Season months in order ────────────────────────────────────────────────
    const SEASON_MONTHS = [9, 10, 11, 12, 1, 2, 3, 4, 5, 6];
    const MONTH_NAMES = {
        it: { 1:'Gennaio', 2:'Febbraio', 3:'Marzo', 4:'Aprile', 5:'Maggio', 6:'Giugno',
              7:'Luglio', 8:'Agosto', 9:'Settembre', 10:'Ottobre', 11:'Novembre', 12:'Dicembre' },
        en: { 1:'January', 2:'February', 3:'March', 4:'April', 5:'May', 6:'June',
              7:'July', 8:'August', 9:'September', 10:'October', 11:'November', 12:'December' }
    };

    function getLang() { return localStorage.getItem('gs_lang') || 'it'; }
    function getMonthName(m) { return MONTH_NAMES[getLang()][m] || `M${m}`; }

    // ── Difficulty rating of upcoming opponent ─────────────────────────────
    function getDifficultyLabel(ovr) {
        const lang = getLang();
        if (ovr >= 95) return { label: lang === 'en' ? 'Legendary' : 'Leggendario', color: '#ef4444', stars: 5 };
        if (ovr >= 88) return { label: lang === 'en' ? 'Very Hard' : 'Molto difficile', color: '#f97316', stars: 4 };
        if (ovr >= 80) return { label: lang === 'en' ? 'Hard' : 'Difficile', color: '#eab308', stars: 3 };
        if (ovr >= 70) return { label: lang === 'en' ? 'Medium' : 'Medio', color: '#10b981', stars: 2 };
        return { label: lang === 'en' ? 'Easy' : 'Facile', color: '#3b82f6', stars: 1 };
    }

    // ── Win probability calculator ────────────────────────────────────────────
    function calcWinProb(playerOvr, teamOvr, opponentOvr, homeBonus = false) {
        const teamStrength = (teamOvr + playerOvr) / 2;
        let prob = 50 + (teamStrength - opponentOvr) * 1.2;
        if (homeBonus) prob += 6;
        return Math.round(Math.max(10, Math.min(90, prob)));
    }

    // ── Build season calendar view ────────────────────────────────────────────
    function renderSeasonCalendar(container, calData, playerData) {
        if (!container || !calData) return;
        const lang = getLang();

        const { partite, team_id, mese, anno } = calData;
        if (!partite?.length) {
            container.innerHTML = `<p style="color:var(--text-dim);padding:20px">${lang === 'en' ? 'No fixtures available.' : 'Nessuna partita disponibile.'}</p>`;
            return;
        }

        // Group matches by month
        const byMonth = {};
        partite.forEach(p => {
            if (!byMonth[p.mese]) byMonth[p.mese] = [];
            byMonth[p.mese].push(p);
        });

        const playerOvr = parseInt(playerData?.overall || 70);
        const teamOvr   = parseInt(playerData?.team_ovr || 70);

        let html = `<div class="season-calendar-wrap">`;

        SEASON_MONTHS.forEach(m => {
            const matches = byMonth[m] || [];
            const isPast  = (m < mese && m >= 9) || (m < mese && m < 9);
            const isCurrent = m === mese;
            const monthName = getMonthName(m);

            html += `
                <div class="sc-month ${isCurrent ? 'sc-month-current' : ''} ${isPast ? 'sc-month-past' : ''}">
                    <div class="sc-month-header">
                        <span class="sc-month-name">${monthName}</span>
                        ${isCurrent ? `<span class="sc-current-badge">${lang === 'en' ? '● NOW' : '● ORA'}</span>` : ''}
                        <span class="sc-match-count">${matches.length} ${lang === 'en' ? 'match' : matches.length === 1 ? 'partita' : 'partite'}</span>
                    </div>
                    <div class="sc-matches">`;

            if (!matches.length) {
                html += `<div class="sc-no-match">${lang === 'en' ? 'No fixtures this month' : 'Nessuna partita questo mese'}</div>`;
            }

            matches.forEach(match => {
                const isHome    = match.home_id == team_id;
                const oppOvr    = isHome ? parseInt(match.away_ovr || 70) : parseInt(match.home_ovr || 70);
                const oppName   = isHome ? match.away_nome : match.home_nome;
                const homeName  = match.home_nome;
                const awayName  = match.away_nome;
                const diff      = getDifficultyLabel(oppOvr);
                const prob      = calcWinProb(playerOvr, teamOvr, oppOvr, isHome);
                const stars     = '★'.repeat(diff.stars) + '☆'.repeat(5 - diff.stars);
                const played    = match.giocata == 1;

                html += `
                    <div class="sc-match-row ${played ? 'sc-played' : ''} ${isPast && !played ? 'sc-skipped' : ''}">
                        <div class="sc-match-info">
                            <span class="sc-giornata">G${match.giornata}</span>
                            <span class="sc-venue" title="${isHome ? (lang === 'en' ? 'Home' : 'Casa') : (lang === 'en' ? 'Away' : 'Trasferta')}">
                                ${isHome ? '🏠' : '✈️'}
                            </span>
                            <span class="sc-teams">
                                <strong>${homeName}</strong>
                                <span style="color:var(--text-dim);font-size:0.75rem"> vs </span>
                                <strong>${awayName}</strong>
                            </span>
                        </div>
                        <div class="sc-match-meta">
                            ${played
                                ? `<span class="sc-played-badge">${lang === 'en' ? '✓ Played' : '✓ Giocata'}</span>`
                                : `<span class="sc-difficulty" style="color:${diff.color}" title="${diff.label}">${stars}</span>
                                   <span class="sc-win-prob" style="color:${prob >= 60 ? '#10b981' : prob >= 45 ? '#eab308' : '#ef4444'}">${prob}%</span>`
                            }
                        </div>
                    </div>`;
            });

            html += `</div></div>`;
        });

        html += `</div>`;
        container.innerHTML = html;
    }

    // ── Season stats projection ───────────────────────────────────────────────
    function projectSeasonStats(currentStats, currentMonth, playerOvr) {
        const lang = getLang();
        const monthsLeft = SEASON_MONTHS.slice(SEASON_MONTHS.indexOf(currentMonth) + 1).length;
        const monthsPlayed = 10 - monthsLeft;
        if (monthsPlayed <= 0) return null;

        const avgGol    = (currentStats.gol    || 0) / monthsPlayed;
        const avgAssist = (currentStats.assist  || 0) / monthsPlayed;
        const avgVoto   = (currentStats.voto    || 6) / monthsPlayed;

        const projGol    = Math.round(avgGol    * 10);
        const projAssist = Math.round(avgAssist * 10);
        const projVoto   = (avgVoto * 10 / 10).toFixed(1);

        return {
            projected_gol:    projGol,
            projected_assist: projAssist,
            projected_voto:   projVoto,
            months_played:    monthsPlayed,
            months_left:      monthsLeft,
            label_gol:    lang === 'en' ? 'Projected Goals'   : 'Gol Proiettati',
            label_assist: lang === 'en' ? 'Projected Assists' : 'Assist Proiettati',
            label_voto:   lang === 'en' ? 'Avg Rating'        : 'Media Voto',
        };
    }

    // ── Render projection widget ──────────────────────────────────────────────
    function renderProjection(container, projection) {
        if (!container || !projection) return;
        const lang = getLang();
        container.innerHTML = `
            <div class="sc-projection-box">
                <div class="sc-proj-title">📊 ${lang === 'en' ? 'Season Projection' : 'Proiezione Stagionale'}</div>
                <div class="sc-proj-stats">
                    <div class="sc-proj-stat">
                        <div class="sc-proj-val">${projection.projected_gol}</div>
                        <div class="sc-proj-label">${projection.label_gol}</div>
                    </div>
                    <div class="sc-proj-stat">
                        <div class="sc-proj-val">${projection.projected_assist}</div>
                        <div class="sc-proj-label">${projection.label_assist}</div>
                    </div>
                    <div class="sc-proj-stat">
                        <div class="sc-proj-val">${projection.projected_voto}</div>
                        <div class="sc-proj-label">${projection.label_voto}</div>
                    </div>
                </div>
                <div class="sc-proj-note">
                    ${lang === 'en'
                        ? `Based on ${projection.months_played} months played · ${projection.months_left} remaining`
                        : `Su ${projection.months_played} mesi giocati · ${projection.months_left} rimanenti`}
                </div>
            </div>
        `;
    }

    // ── Monthly performance heatmap ───────────────────────────────────────────
    function renderHeatmap(container, seasonHistory) {
        if (!container || !seasonHistory?.length) return;
        const lang = getLang();

        const map = {};
        seasonHistory.forEach(entry => {
            if (!map[entry.anno]) map[entry.anno] = {};
            if (!map[entry.anno][entry.mese]) {
                map[entry.anno][entry.mese] = { gol: 0, assist: 0, voto: 0, partite: 0 };
            }
            const m = map[entry.anno][entry.mese];
            m.gol    += parseInt(entry.gol    || 0);
            m.assist += parseInt(entry.assist  || 0);
            m.voto   += parseFloat(entry.voto  || 6);
            m.partite++;
        });

        const years = Object.keys(map).sort();
        if (!years.length) return;

        let html = `<div class="heatmap-wrap">
            <div class="heatmap-title">🌡️ ${lang === 'en' ? 'Monthly Performance Map' : 'Mappa Prestazioni Mensili'}</div>
            <div class="heatmap-legend">
                <span style="background:rgba(16,185,129,0.2)"></span> ${lang === 'en' ? 'Great' : 'Ottima'}
                <span style="background:rgba(234,179,8,0.2)"></span> ${lang === 'en' ? 'Average' : 'Media'}
                <span style="background:rgba(239,68,68,0.2)"></span> ${lang === 'en' ? 'Poor' : 'Scarsa'}
            </div>`;

        years.slice(-3).forEach(anno => {
            html += `<div class="heatmap-row">
                <div class="heatmap-year">A${anno}</div>
                <div class="heatmap-months">`;

            SEASON_MONTHS.forEach(m => {
                const data = map[anno]?.[m];
                if (!data) {
                    html += `<div class="heatmap-cell heatmap-empty" title="${getMonthName(m)}">–</div>`;
                    return;
                }
                const avgVoto = data.partite > 0 ? data.voto / data.partite : 6;
                const bg = avgVoto >= 7.5 ? 'rgba(16,185,129,0.3)' :
                           avgVoto >= 6.5 ? 'rgba(234,179,8,0.2)' :
                                           'rgba(239,68,68,0.2)';
                const border = avgVoto >= 7.5 ? '#10b981' :
                               avgVoto >= 6.5 ? '#eab308' : '#ef4444';
                html += `<div class="heatmap-cell" style="background:${bg};border-color:${border}"
                             title="${getMonthName(m)}: ${data.gol}⚽ ${data.assist}🎯 ${avgVoto.toFixed(1)}★">
                             <span class="heatmap-gol">${data.gol > 0 ? data.gol : '·'}</span>
                         </div>`;
            });

            html += `</div></div>`;
        });

        html += `</div>`;
        container.innerHTML = html;
    }

    // ── CSS for season planner ────────────────────────────────────────────────
    function injectStyles() {
        if (document.getElementById('gs-season-planner-styles')) return;
        const style = document.createElement('style');
        style.id = 'gs-season-planner-styles';
        style.textContent = `
            .season-calendar-wrap { display: flex; flex-direction: column; gap: 2px; }
            .sc-month { background: var(--card); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; transition: all 0.2s; }
            .sc-month-current { border-color: rgba(255,215,0,0.4); box-shadow: 0 0 16px rgba(255,215,0,0.1); }
            .sc-month-past { opacity: 0.6; }
            .sc-month-header { display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: var(--bg3); border-bottom: 1px solid var(--border); }
            .sc-month-name { font-weight: 700; font-size: 0.85rem; color: #fff; flex: 1; }
            .sc-current-badge { font-size: 0.65rem; color: #FFD700; font-weight: 800; letter-spacing: 1px; animation: liveBlinkDot 1.5s infinite; }
            .sc-match-count { font-size: 0.72rem; color: var(--text-dim); }
            .sc-matches { padding: 6px 8px; display: flex; flex-direction: column; gap: 4px; }
            .sc-no-match { padding: 8px 6px; font-size: 0.78rem; color: var(--text-dim); font-style: italic; }
            .sc-match-row { display: flex; align-items: center; justify-content: space-between; padding: 6px 8px; border-radius: 6px; background: var(--bg3); transition: background 0.15s; }
            .sc-match-row:hover { background: rgba(255,255,255,0.04); }
            .sc-played { opacity: 0.55; }
            .sc-skipped { border-left: 2px solid rgba(239,68,68,0.4); }
            .sc-match-info { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
            .sc-giornata { font-size: 0.68rem; color: var(--text-dim); min-width: 24px; }
            .sc-venue { font-size: 0.9rem; }
            .sc-teams { font-size: 0.78rem; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .sc-match-meta { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
            .sc-difficulty { font-size: 0.75rem; letter-spacing: -1px; }
            .sc-win-prob { font-size: 0.75rem; font-weight: 700; min-width: 32px; text-align: right; }
            .sc-played-badge { font-size: 0.68rem; color: #10b981; font-weight: 700; }
            .sc-projection-box { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 16px; margin-bottom: 16px; }
            .sc-proj-title { font-size: 0.82rem; font-weight: 700; color: var(--gold); margin-bottom: 12px; }
            .sc-proj-stats { display: flex; gap: 16px; margin-bottom: 10px; }
            .sc-proj-stat { flex: 1; text-align: center; }
            .sc-proj-val { font-size: 1.5rem; font-weight: 900; color: #fff; }
            .sc-proj-label { font-size: 0.68rem; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.5px; }
            .sc-proj-note { font-size: 0.72rem; color: var(--text-dim); text-align: center; }
            .heatmap-wrap { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 14px; }
            .heatmap-title { font-size: 0.82rem; font-weight: 700; color: var(--gold); margin-bottom: 10px; }
            .heatmap-legend { display: flex; gap: 12px; font-size: 0.7rem; color: var(--text-dim); margin-bottom: 10px; }
            .heatmap-legend span { display: inline-block; width: 12px; height: 12px; border-radius: 3px; margin-right: 3px; vertical-align: middle; }
            .heatmap-row { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
            .heatmap-year { font-size: 0.7rem; color: var(--text-dim); min-width: 28px; }
            .heatmap-months { display: flex; gap: 3px; }
            .heatmap-cell { width: 28px; height: 28px; border-radius: 5px; border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; cursor: default; transition: transform 0.15s; font-size: 0.75rem; font-weight: 700; color: #fff; }
            .heatmap-cell:hover { transform: scale(1.15); z-index: 10; }
            .heatmap-empty { color: var(--text-dim); font-size: 0.8rem; }
            .heatmap-gol { font-size: 0.75rem; font-weight: 800; }
            @media (max-width: 600px) {
                .sc-proj-stats { gap: 8px; }
                .heatmap-cell { width: 22px; height: 22px; font-size: 0.65rem; }
                .sc-teams { font-size: 0.72rem; }
            }
        `;
        document.head.appendChild(style);
    }

    injectStyles();

    return {
        renderSeasonCalendar, renderProjection, renderHeatmap,
        projectSeasonStats, getMonthName, SEASON_MONTHS,
    };
})();

window.GS_SeasonPlanner = GS_SeasonPlanner;


// ── Extended season analysis ──────────────────────────────────────────────────
const SEASON_INSIGHTS = {
    it: {
        strong_start: "Inizio di stagione forte: la fiducia è alle stelle. Mantieni questo ritmo.",
        slow_start: "Avvio lento ma niente panico — le stagioni si decidono nel girone di ritorno.",
        consistent: "Consistenza è la parola chiave: prestazioni stabili portano lontano.",
        top_scorer: "Tra i migliori marcatori della lega: il Pallone d'Oro si avvicina.",
        struggle: "Periodo difficile. Analizza, adatta, reagisci — i campioni non mollano.",
        comeback: "Il recupero è iniziato. La determinazione paga sempre.",
        final_push: "Rush finale: ogni punto, ogni gol conta il doppio.",
        season_end_great: "Stagione eccezionale. I numeri parlano da soli.",
        season_end_ok: "Stagione solida. C'è ancora margine per crescere.",
        season_end_poor: "Stagione sotto le aspettative. Analizza e prepara la prossima con più determinazione.",
    },
    en: {
        strong_start: "Strong start: confidence is sky high. Maintain this rhythm.",
        slow_start: "Slow start but no panic — seasons are decided in the second half.",
        consistent: "Consistency is key: stable performances take you far.",
        top_scorer: "Among the league's top scorers: the Ballon d'Or is getting closer.",
        struggle: "Difficult period. Analyse, adapt, react — champions don't quit.",
        comeback: "The comeback has started. Determination always pays.",
        final_push: "Final push: every point, every goal counts double.",
        season_end_great: "Exceptional season. The numbers speak for themselves.",
        season_end_ok: "Solid season. There's still room to grow.",
        season_end_poor: "Below-expectation season. Analyse and prepare the next one with more determination.",
    }
};

// ── Match result predictor based on stats ──────────────────────────────────────
function predictMatchResult(playerOvr, teamOvr, oppOvr, homeBonus, playerForm) {
    const lang = localStorage.getItem('gs_lang') || 'it';
    const teamAdv = ((teamOvr + playerOvr * 0.3) - oppOvr);
    const homeAdv = homeBonus ? 5 : -2;
    const formAdj = (playerForm - 6.5) * 3;
    const totalAdv = teamAdv + homeAdj + formAdj;
    
    let prediction, confidence, color;
    if (totalAdv >= 15) { prediction = lang === 'en' ? 'High Win chance' : 'Alta probabilità vittoria'; confidence = 80; color = '#10b981'; }
    else if (totalAdv >= 8) { prediction = lang === 'en' ? 'Slight advantage' : 'Leggero vantaggio'; confidence = 65; color = '#84cc16'; }
    else if (totalAdv >= -5) { prediction = lang === 'en' ? 'Even match' : 'Partita equilibrata'; confidence = 50; color = '#eab308'; }
    else if (totalAdv >= -15) { prediction = lang === 'en' ? 'Slight disadvantage' : 'Leggero svantaggio'; confidence = 40; color = '#f97316'; }
    else { prediction = lang === 'en' ? 'Tough challenge' : 'Sfida ardua'; confidence = 25; color = '#ef4444'; }
    
    return { prediction, confidence, color, advantage: Math.round(totalAdv) };
}

// ── Season targets generator ───────────────────────────────────────────────────
function generateSeasonTargets(player) {
    const lang = localStorage.getItem('gs_lang') || 'it';
    const ovr = parseInt(player.overall || 65);
    const gol = parseInt(player.gol_carriera || 0);
    const targets = [];
    
    // Goals target
    const goalTarget = Math.max(8, Math.round(ovr * 0.35));
    targets.push({
        icon: '⚽',
        label: lang === 'en' ? `Score ${goalTarget}+ goals` : `Segna ${goalTarget}+ gol`,
        type: 'goals',
        target: goalTarget,
    });
    
    // Rating target
    const ratingTarget = Math.min(8.5, 6.0 + (ovr - 60) * 0.04);
    targets.push({
        icon: '⭐',
        label: lang === 'en' ? `Avg rating ≥ ${ratingTarget.toFixed(1)}` : `Media voto ≥ ${ratingTarget.toFixed(1)}`,
        type: 'rating',
        target: ratingTarget,
    });
    
    // OVR growth
    if (parseInt(player.age || 20) <= 28) {
        const ovrTarget = Math.min(125, ovr + 5);
        targets.push({
            icon: '📈',
            label: lang === 'en' ? `Reach OVR ${ovrTarget}` : `Raggiungi OVR ${ovrTarget}`,
            type: 'ovr',
            target: ovrTarget,
        });
    }
    
    // Popularity
    const popTarget = Math.min(100, parseInt(player.popolarita || 0) + 10);
    targets.push({
        icon: '📣',
        label: lang === 'en' ? `Popularity ≥ ${popTarget}` : `Popolarità ≥ ${popTarget}`,
        type: 'popularity',
        target: popTarget,
    });
    
    return targets;
}

// ── Render season targets ─────────────────────────────────────────────────────
function renderSeasonTargets(container, player) {
    if (!container || !player) return;
    const lang = localStorage.getItem('gs_lang') || 'it';
    const targets = generateSeasonTargets(player);
    
    container.innerHTML = `
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:14px;margin-bottom:16px">
            <div style="font-size:0.75rem;font-weight:800;color:var(--gold);text-transform:uppercase;letter-spacing:1px;margin-bottom:12px">
                🎯 ${lang === 'en' ? 'Season Targets' : 'Obiettivi Stagionali'}
            </div>
            ${targets.map(t => `
                <div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
                    <span style="font-size:1.1rem">${t.icon}</span>
                    <span style="font-size:0.82rem;color:var(--text);flex:1">${t.label}</span>
                    <span style="font-size:0.72rem;color:var(--text-dim)">${t.type}</span>
                </div>`).join('')}
        </div>`;
}

// ── Performance trend analysis ─────────────────────────────────────────────────
function analyzePerformanceTrend(logData, currentMonth) {
    if (!logData?.length) return null;
    const lang = localStorage.getItem('gs_lang') || 'it';
    
    // Get last 3 months of matches
    const recentMatches = logData.filter(l => 
        l.avv && l.avv !== '__riepilogo' &&
        SEASON_MONTHS.includes(parseInt(l.mese))
    ).slice(0, 15);
    
    if (recentMatches.length < 3) return null;
    
    const recentAvg = recentMatches.slice(0, 5).reduce((a, l) => a + parseFloat(l.voto || 6), 0) / Math.min(5, recentMatches.length);
    const olderAvg  = recentMatches.slice(5, 10).reduce((a, l) => a + parseFloat(l.voto || 6), 0) / Math.min(5, recentMatches.slice(5).length);
    const diff = recentAvg - olderAvg;
    
    const recentGol    = recentMatches.slice(0, 5).reduce((a, l) => a + parseInt(l.gol || 0), 0);
    const recentWins   = recentMatches.slice(0, 5).filter(l => l.esito === 'V').length;
    const recentDraws  = recentMatches.slice(0, 5).filter(l => l.esito === 'P').length;
    const recentLosses = recentMatches.slice(0, 5).filter(l => l.esito === 'S').length;
    
    let trendType = 'flat', trendLabel, trendColor;
    if (diff >= 0.5) { trendType = 'up'; trendLabel = lang === 'en' ? '📈 Rising form' : '📈 Forma in crescita'; trendColor = '#10b981'; }
    else if (diff <= -0.5) { trendType = 'down'; trendLabel = lang === 'en' ? '📉 Dipping form' : '📉 Forma in calo'; trendColor = '#ef4444'; }
    else { trendLabel = lang === 'en' ? '➡️ Stable form' : '➡️ Forma stabile'; trendColor = '#eab308'; }
    
    return {
        trendType, trendLabel, trendColor, diff: diff.toFixed(2),
        recentAvg: recentAvg.toFixed(2), olderAvg: olderAvg.toFixed(2),
        recentGol, recentWins, recentDraws, recentLosses,
        form: (
            recentMatches.slice(0, 5).map(l => l.esito === 'V' ? 'W' : l.esito === 'P' ? 'D' : 'L').join('')
        ),
    };
}

// ── Render form guide widget ───────────────────────────────────────────────────
function renderFormGuide(container, trend) {
    if (!container || !trend) return;
    const lang = localStorage.getItem('gs_lang') || 'it';
    const formColors = { W: '#10b981', D: '#eab308', L: '#ef4444' };
    const formLetters = { W: lang === 'en' ? 'W' : 'V', D: 'D', L: lang === 'en' ? 'L' : 'S' };
    
    container.innerHTML = `
        <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:12px;margin-bottom:12px">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
                <span style="font-size:0.75rem;font-weight:700;color:${trend.trendColor}">${trend.trendLabel}</span>
                <span style="font-size:0.72rem;color:var(--text-dim)">${lang === 'en' ? 'Last 5 matches' : 'Ultime 5 partite'}</span>
            </div>
            <div style="display:flex;gap:5px;margin-bottom:10px">
                ${trend.form.split('').map(r => `
                    <div style="width:28px;height:28px;border-radius:6px;background:${formColors[r]}22;border:1px solid ${formColors[r]}44;display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:800;color:${formColors[r]}">
                        ${formLetters[r] || r}
                    </div>`).join('')}
            </div>
            <div style="display:flex;gap:12px;font-size:0.72rem;color:var(--text-dim)">
                <span>${lang === 'en' ? 'Goals' : 'Gol'}: <strong style="color:#FFD700">${trend.recentGol}</strong></span>
                <span>${lang === 'en' ? 'Avg' : 'Media'}: <strong style="color:#fff">${trend.recentAvg}</strong></span>
                <span>${lang === 'en' ? 'W/D/L' : 'V/P/S'}: <strong>${trend.recentWins}/${trend.recentDraws}/${trend.recentLosses}</strong></span>
            </div>
        </div>`;
}

// Export new functions
if (typeof window !== 'undefined') {
    Object.assign(GS_SeasonPlanner, {
        SEASON_INSIGHTS,
        predictMatchResult,
        generateSeasonTargets,
        renderSeasonTargets,
        analyzePerformanceTrend,
        renderFormGuide,
    });
}

// ── Performance badges generator ──────────────────────────────────────────────
GS_SeasonPlanner.generatePerformanceBadges = function(stats, lang) {
    const badges = [];
    lang = lang || (localStorage.getItem('gs_lang') || 'it');
    const gol = parseInt(stats.gol || 0);
    const assist = parseInt(stats.assist || 0);
    const voto = parseFloat(stats.voto || 6);

    if (gol >= 30) badges.push({ icon: '🔥', label: lang === 'en' ? '30+ Goals' : '30+ Gol', color: '#ef4444' });
    else if (gol >= 20) badges.push({ icon: '⚽', label: lang === 'en' ? '20+ Goals' : '20+ Gol', color: '#f97316' });
    else if (gol >= 10) badges.push({ icon: '⚽', label: lang === 'en' ? '10+ Goals' : '10+ Gol', color: '#eab308' });

    if (assist >= 15) badges.push({ icon: '🎯', label: lang === 'en' ? '15+ Assists' : '15+ Assist', color: '#3b82f6' });
    else if (assist >= 10) badges.push({ icon: '🎯', label: lang === 'en' ? '10+ Assists' : '10+ Assist', color: '#60a5fa' });

    if (voto >= 8.0) badges.push({ icon: '⭐', label: lang === 'en' ? 'Excellent Rating' : 'Voto Eccellente', color: '#FFD700' });
    else if (voto >= 7.0) badges.push({ icon: '✅', label: lang === 'en' ? 'Good Rating' : 'Buon Voto', color: '#10b981' });

    if (gol >= 20 && assist >= 10) badges.push({ icon: '👑', label: lang === 'en' ? 'Complete Attacker' : 'Attaccante Completo', color: '#8b5cf6' });
    if (gol + assist >= 40) badges.push({ icon: '🌟', label: lang === 'en' ? 'Season of Glory' : 'Stagione di Gloria', color: '#FFD700' });

    return badges;
};

GS_SeasonPlanner.renderPerformanceBadges = function(container, badges) {
    if (!container || !badges?.length) return;
    const html = badges.map(b => `
        <span style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;
                     background:${b.color}22;border:1px solid ${b.color}44;color:${b.color};
                     font-size:0.72rem;font-weight:700;margin:2px">
            ${b.icon} ${b.label}
        </span>`).join('');
    container.innerHTML = `<div style="display:flex;flex-wrap:wrap;gap:4px;margin:8px 0">${html}</div>`;
};

// ── Next fixture preview ────────────────────────────────────────────────────────
GS_SeasonPlanner.getNextFixture = function(calData, teamId) {
    if (!calData?.partite) return null;
    const lang = localStorage.getItem('gs_lang') || 'it';
    const upcoming = calData.partite
        .filter(p => !p.giocata && (p.home_id == teamId || p.away_id == teamId))
        .sort((a, b) => a.giornata - b.giornata);
    if (!upcoming.length) return null;
    const next = upcoming[0];
    const isHome = next.home_id == teamId;
    return {
        giornata: next.giornata,
        opponent: isHome ? next.away_nome : next.home_nome,
        oppOvr:   isHome ? (next.away_ovr || 70) : (next.home_ovr || 70),
        isHome,
        mese: next.mese,
        monthName: GS_SeasonPlanner.getMonthName(next.mese),
        homeLabel: lang === 'en' ? (isHome ? '🏠 Home' : '✈️ Away') : (isHome ? '🏠 Casa' : '✈️ Trasferta'),
    };
};
