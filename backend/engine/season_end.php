<?php
/**
 * engine/season_end.php — premi di fine stagione, promozioni/retrocessioni, bonus agente
 * Estratto da api/game.php (refactor): nessuna logica modificata.
 */

// ── PREMI CAMPIONATO A FINE ANNO ──
function calcPremiCampionato($db, $p, $player_id) {
    $lega_id = $p['lega_id'];
    $anno    = $p['anno_corrente'];
    $team_id = $p['team_id'];
    $msg_list = []; $soldi = 0; $trofei = 0;

    // Posizione finale
    $stmt = $db->prepare("
        SELECT c.team_id, c.punti, (c.gol_fatti-c.gol_subiti) as diff
        FROM classifica c
        WHERE c.lega_id=? AND c.anno=?
        ORDER BY c.punti DESC, diff DESC, c.gol_fatti DESC, c.vittorie DESC
    ");
    $stmt->execute([$lega_id,$anno]);
    $classifica = $stmt->fetchAll();

    $pos = 0;
    foreach ($classifica as $i => $row) {
        if ($row['team_id'] == $team_id) { $pos = $i + 1; break; }
    }
    if (!$pos) return ['messaggi'=>$msg_list,'soldi'=>$soldi,'trofei'=>$trofei];

    $lega_livello = intval($p['lega_livello'] ?? 2);

    if ($pos == 1) {
        $premio = ($lega_livello == 1) ? 300000 : 100000;
        $msg_list[] = _tn("🏆 CAMPIONI! La tua squadra ha vinto il campionato! +€".number_format($premio),"🏆 CHAMPIONS! Your team won the league! +€".number_format($premio),"🏆 MEISTER! Dein Team hat die Liga gewonnen! +€".number_format($premio),"🏆 ¡CAMPEONES! ¡Tu equipo ganó la liga! +€".number_format($premio));
        $soldi  += $premio; $trofei += 1;
    } elseif ($pos <= 3) {
        $premio = ($lega_livello == 1) ? 100000 : 30000;
        $msg_list[] = _tn("🥉 Podio in campionato (#{$pos})! +€".number_format($premio),"🥉 Podium finish (#{$pos})! +€".number_format($premio),"🥉 Podiumsplatz (#{$pos})! +€".number_format($premio),"🥉 ¡Podio en la liga (#{$pos})! +€".number_format($premio));
        $soldi += $premio;
    } elseif ($pos <= 4 && $lega_livello == 1) {
        $msg_list[] = _tn("⭐ Top 4 in Prima Divisione: qualificato alla Champions Cup!","⭐ Top 4 in First Division: qualified for the Champions Cup!","⭐ Top 4 in der Ersten Division: für den Champions Cup qualifiziert!","⭐ ¡Top 4 en Primera División: clasificado para la Copa de Campeones!");
    } elseif ($pos >= count($classifica) - 2 && count($classifica) >= 10) {
        $msg_list[] = _tn("⚠️ La tua squadra ha chiuso nelle ultime posizioni. Rischio retrocessione!", "⚠️ Your team finished in the bottom places. Relegation risk!", "⚠️ Deine Mannschaft schloss in den letzten Positionen. Abstiegsgefahr!", "⚠️ Tu equipo terminó en los últimos puestos. ¡Riesgo de descenso!");
    }

    return ['messaggi'=>$msg_list,'soldi'=>$soldi,'trofei'=>$trofei];
}

// ── PROMOZIONE / RETROCESSIONE ──
function checkPromozioneRetrocessione($db, $player_id, $p, $overall) {
    $lega_id      = intval($p['lega_id'] ?? 0);
    $lega_livello = intval($p['lega_livello'] ?? 1);
    $nazione_id   = intval($p['nazione_id'] ?? 1);
    if (!$lega_id) return null;

    $stmt = $db->prepare("SELECT SUM(gol) as gol, AVG(voto) as voto FROM log_mensile WHERE player_id=? AND anno=? AND avv!='' AND avv!='__riepilogo'");
    $stmt->execute([$player_id,$p['anno_corrente']]);
    $stats = $stmt->fetch();
    $voto = floatval($stats['voto'] ?? 6.0);
    $gol  = intval($stats['gol'] ?? 0);
    $perf_score = $voto*10 + $gol*2 + $overall*0.3;

    if ($lega_livello == 2 && $perf_score >= 100) {
        $stmt = $db->prepare("SELECT id FROM leghe WHERE nazione_id=? AND livello=1");
        $stmt->execute([$nazione_id]);
        $prima = $stmt->fetch();
        if ($prima) {
            $stmt = $db->prepare("SELECT id,nome FROM teams WHERE lega_id=? ORDER BY stelle ASC,popolarita ASC LIMIT 1");
            $stmt->execute([$prima['id']]);
            $sq = $stmt->fetch();
            if ($sq) return ['tipo'=>'promozione','msg'=>_tn("🚀 PROMOZIONE! Sei salito in Prima Divisione: ","🚀 PROMOTION! You've risen to the First Division: ","🚀 AUFSTIEG! Du bist in die Erste Division aufgestiegen: ","🚀 ¡ASCENSO! Has subido a la Primera División: ").$sq['nome'],'new_team_id'=>$sq['id']];
        }
    }
    if ($lega_livello == 1 && $perf_score < 60 && $overall < 85) {
        $stmt = $db->prepare("SELECT id FROM leghe WHERE nazione_id=? AND livello=2");
        $stmt->execute([$nazione_id]);
        $seconda = $stmt->fetch();
        if ($seconda) {
            $stmt = $db->prepare("SELECT id,nome FROM teams WHERE lega_id=? ORDER BY stelle DESC,popolarita DESC LIMIT 1");
            $stmt->execute([$seconda['id']]);
            $sq = $stmt->fetch();
            if ($sq) return ['tipo'=>'retrocessione','msg'=>_tn("📉 RETROCESSIONE in Seconda Divisione: ","📉 RELEGATION to Second Division: ","📉 ABSTIEG in die Zweite Division: ","📉 DESCENSO a la Segunda División: ").$sq['nome'],'new_team_id'=>$sq['id']];
        }
    }
    return null;
}

// ── AGENTE & NOTIZIE ──
function getAgentBonus($db, $player_id) {
    $stmt = $db->prepare("SELECT livello FROM agente WHERE player_id=?");
    $stmt->execute([$player_id]);
    $ag = $stmt->fetch();
    if (!$ag || !$ag['livello']) return ['bonus_stipendio'=>0,'bonus_offerte'=>0,'bonus_ovr_sconto'=>0];
    $agenti = [
        1=>['bonus_stipendio'=>0.10,'bonus_offerte'=>1,'bonus_ovr_sconto'=>2.5],
        2=>['bonus_stipendio'=>0.20,'bonus_offerte'=>2,'bonus_ovr_sconto'=>5.0],
        3=>['bonus_stipendio'=>0.35,'bonus_offerte'=>3,'bonus_ovr_sconto'=>7.5],
        4=>['bonus_stipendio'=>0.50,'bonus_offerte'=>5,'bonus_ovr_sconto'=>10.0],
        5=>['bonus_stipendio'=>0.75,'bonus_offerte'=>7,'bonus_ovr_sconto'=>15.0],
    ];
    return $agenti[$ag['livello']] ?? ['bonus_stipendio'=>0,'bonus_offerte'=>0,'bonus_ovr_sconto'=>0];
}

