<?php
/**
 * engine/league.php — calendario e simulazione partite di campionato
 * Estratto da api/game.php (refactor): nessuna logica modificata.
 */

// CALENDARIO: genera andata+ritorno per una lega (34 giornate per 18 squadre)
// Distribuisce le giornate nei 10 mesi di stagione (set→giu)
function generaCalendario($db, $lega_id, $anno) {
    // Già generato?
    $chk = $db->prepare("SELECT COUNT(*) as n FROM calendario WHERE lega_id=? AND anno=?");
    $chk->execute([$lega_id, $anno]);
    if ($chk->fetch()['n'] > 0) return;

    $stmt = $db->prepare("SELECT id FROM teams WHERE lega_id=?");
    $stmt->execute([$lega_id]);
    $teams = array_column($stmt->fetchAll(), 'id');
    $n = count($teams);
    if ($n < 2) return;

    // Round-robin algorithm (circle method)
    // Se n è dispari aggiungi un "bye"
    if ($n % 2 !== 0) $teams[] = null;
    $total = count($teams);
    $rounds = $total - 1;
    $matches_per_round = $total / 2;

    $giornate = []; // array of [home_id, away_id]
    $fixed = $teams[0];
    $rotating = array_slice($teams, 1);

    for ($r = 0; $r < $rounds; $r++) {
        $home = $fixed;
        $away = $rotating[0];
        if ($home !== null && $away !== null) $giornate[] = [$home, $away];
        for ($i = 1; $i < $matches_per_round; $i++) {
            $h = $rotating[$i];
            $a = $rotating[$total - 2 - $i];
            if ($h !== null && $a !== null) $giornate[] = [$h, $a];
        }
        $rotating = array_merge(array_slice($rotating, -1), array_slice($rotating, 0, -1));
    }

    // Duplica per ritorno (invertendo home/away)
    $andata  = $giornate;
    $ritorno = array_map(fn($m) => [$m[1], $m[0]], $giornate);
    $tutti   = array_merge($andata, $ritorno); // 34 giornate totali per 18 squadre

    // Distribuzione nei mesi: stagione set(9) ott(10) nov(11) dic(12) gen(1) feb(2) mar(3) apr(4) mag(5) giu(6)
    $mesi_stagione = [9, 10, 11, 12, 1, 2, 3, 4, 5, 6]; // 10 mesi
    $numMesi       = count($mesi_stagione);

    // $tutti contiene TUTTE le partite appiattite. Ogni "giornata" ha $matches_per_round partite.
    // Ricostruiamo le giornate raggruppate per turno.
    $turni = []; // $turni[turno_idx] = array di match
    $turno_size = max(1, $matches_per_round); // partite per giornata (min 1 to avoid division by zero)
    foreach ($tutti as $idx => $match) {
        $turno_idx = (int)floor($idx / $turno_size);
        $turni[$turno_idx][] = $match;
    }
    $totTurni = count($turni); // es. 34 turni per 18 squadre

    // Distribuzione equa: $perMese turni per mese, ultimi mesi prendono il resto
    $perMese = (int)floor($totTurni / $numMesi);
    $resto   = $totTurni % $numMesi;

    $ins = $db->prepare("INSERT IGNORE INTO calendario (lega_id,anno,giornata,mese,home_id,away_id) VALUES(?,?,?,?,?,?)");
    $giornataNum = 1;
    $turnoIdx    = 0;
    for ($mi = 0; $mi < $numMesi; $mi++) {
        $mese        = $mesi_stagione[$mi];
        $turniMese   = $perMese + ($mi < $resto ? 1 : 0);
        for ($t = 0; $t < $turniMese; $t++) {
            if (!isset($turni[$turnoIdx])) break;
            foreach ($turni[$turnoIdx] as $match) {
                $ins->execute([$lega_id, $anno, $giornataNum, $mese, $match[0], $match[1]]);
            }
            $giornataNum++;
            $turnoIdx++;
        }
    }
}

// SIMULA LE PARTITE DEL MESE per la lega del giocatore
// Returns la partita del giocatore e aggiorna la classifica
function simulaGiornataLega($db, $p, $player_skills = []) {
    $team_id  = $p['team_id'];
    $lega_id  = $p['lega_id'];
    $anno     = $p['anno_corrente'];
    $mese     = $p['mese_corrente'];
    $team_ovr = intval($p['team_ovr'] ?? 65);
    $match_principale = null;

    // Genera calendario se non esiste
    generaCalendario($db, $lega_id, $anno);

    // Sanity check: se il mese corrente non ha partite non giocate ma ce ne sono rimaste,
    // probabilmente il calendario era malformato (vecchio bug). Rigenera e redistribuisci.
    $chkMese = $db->prepare("SELECT COUNT(*) as n FROM calendario WHERE lega_id=? AND anno=? AND mese=? AND giocata=0");
    $chkMese->execute([$lega_id, $anno, $mese]);
    $partiteMeseCount = intval($chkMese->fetch()['n']);
    $chkTot = $db->prepare("SELECT COUNT(*) as n FROM calendario WHERE lega_id=? AND anno=? AND giocata=0");
    $chkTot->execute([$lega_id, $anno]);
    $partiteRimanenti = intval($chkTot->fetch()['n']);

    if ($partiteMeseCount === 0 && $partiteRimanenti > 0) {
        // Calendario malformato: elimina e rigenera. Azzera anche la classifica
        // per evitare punti/gol orfani legati alle partite cancellate.
        $db->prepare("DELETE FROM calendario WHERE lega_id=? AND anno=?")->execute([$lega_id, $anno]);
        $db->prepare("DELETE FROM classifica WHERE lega_id=? AND anno=?")->execute([$lega_id, $anno]);
        generaCalendario($db, $lega_id, $anno);
    }

    // Assicura record classifica per tutta la lega
    $stmt = $db->prepare("SELECT id, nome, ovr FROM teams WHERE lega_id=?");
    $stmt->execute([$lega_id]);
    $tutteLega = $stmt->fetchAll();
    foreach ($tutteLega as $t) {
        $db->prepare("INSERT IGNORE INTO classifica (team_id,lega_id,anno) VALUES(?,?,?)")
           ->execute([$t['id'], $lega_id, $anno]);
    }

    // Partite del mese corrente per questa lega
    $stmt = $db->prepare("SELECT * FROM calendario WHERE lega_id=? AND anno=? AND mese=? AND giocata=0 ORDER BY giornata");
    $stmt->execute([$lega_id, $anno, $mese]);
    $partiteMese = $stmt->fetchAll();

    $msgs = [];
    $altre_partite = []; // risultati delle altre partite della lega (feed live)

    foreach ($partiteMese as $partita) {
        $home_id = intval($partita['home_id']);
        $away_id = intval($partita['away_id']);

        if ($home_id == $team_id || $away_id == $team_id) {
            $isHome   = ($home_id == $team_id);
            $avv_id   = $isHome ? $away_id : $home_id;
            $avv      = array_values(array_filter($tutteLega, fn($t) => $t['id'] == $avv_id));
            $avv      = $avv[0] ?? null;
            $avv_nome = $avv ? $avv['nome'] : 'Avversario';
            $avv_ovr  = $avv ? intval($avv['ovr']) : 65;

            // Simula la performance del giocatore per questa partita
            $match_partita = simulateMatch($p, $player_skills);
            if ($match_principale === null) $match_principale = $match_partita;
            $voto_giocatore = floatval($match_partita['voto']);
            $boost = ($voto_giocatore >= 8) ? 5 : (($voto_giocatore <= 5) ? -5 : 0);
            $bonus_casa = $isHome ? 3 : -2;
            $diff  = ($team_ovr + $boost + $bonus_casa) - $avv_ovr;
            $prob  = min(80, max(20, 50 + $diff * 1.5));
            $rand  = rand(1, 100);

            if ($rand <= $prob) {
                $esito = 'V'; $punti = 3;
                $gf = rand(1,4); $gs = rand(0, max(0, $gf-1));
                $casa_label = $isHome ? '🏠' : '✈️';
                $pg = min($match_partita['gol'], $gf);
                $pa_p = min($match_partita['assist'], max(0, $gf - $pg));
                // Vittoria larga (+2 o più gol di scarto): boost morale extra
                $diff_gol = $gf - $gs;
                $match_partita['morale'] += ($diff_gol >= 3) ? 10 : ($diff_gol >= 2 ? 5 : 0);
                $msgs[] = ['esito'=>'V','label'=>$casa_label,'giornata'=>$partita['giornata'],'avv'=>$avv_nome,'gf'=>$gf,'gs'=>$gs,'punti'=>3,'isHome'=>$isHome,'player_gol'=>$pg,'player_assist'=>$pa_p,'player_voto'=>$match_partita['voto']];
            } elseif ($rand <= $prob + 15) {
                $esito = 'P'; $punti = 1;
                $gf = rand(0,2); $gs = $gf;
                $pg = min($match_partita['gol'], $gf);
                $pa_p = min($match_partita['assist'], max(0, $gf - $pg));
                // Pareggio: voto -0.3 se il giocatore ha segnato (non bastava), morale ridotto
                if ($pg > 0) {
                    $match_partita['voto'] = round(max(4.5, $match_partita['voto'] - 0.3), 1);
                }
                $match_partita['morale'] = (int)round($match_partita['morale'] * 0.6);
                $msgs[] = ['esito'=>'P','label'=>'🤝','giornata'=>$partita['giornata'],'avv'=>$avv_nome,'gf'=>$gf,'gs'=>$gs,'punti'=>1,'isHome'=>$isHome,'player_gol'=>$pg,'player_assist'=>$pa_p,'player_voto'=>$match_partita['voto']];
            } else {
                $esito = 'S'; $punti = 0;
                $gf = rand(0,1); $gs = rand(1,4);
                $pg = min($match_partita['gol'], $gf);
                $pa_p = min($match_partita['assist'], max(0, $gf - $pg));
                $diff_gol = $gs - $gf; // scarto subito
                // Voto: -0.3 base, -0.2 per ogni gol di scarto oltre 1
                $voto_pen = 0.3 + max(0, ($diff_gol - 1)) * 0.2;
                $match_partita['voto'] = round(max(4.5, $match_partita['voto'] - $voto_pen), 1);
                // Morale: penalità extra se scarto >= 2
                $morale_pen = ($diff_gol >= 2) ? rand(15, 25) : rand(5, 12);
                $match_partita['morale'] = min(0, $match_partita['morale']) - $morale_pen;
                $msgs[] = ['esito'=>'S','label'=>'💔','giornata'=>$partita['giornata'],'avv'=>$avv_nome,'gf'=>$gf,'gs'=>$gs,'punti'=>0,'isHome'=>$isHome,'player_gol'=>$pg,'player_assist'=>$pa_p,'player_voto'=>$match_partita['voto']];
            }

            $v=$esito=='V'?1:0; $pa=$esito=='P'?1:0; $s=$esito=='S'?1:0;
            $avv_punti = $esito=='S'?3:($esito=='P'?1:0);
            $avv_v=$esito=='S'?1:0; $avv_pa=$pa; $avv_s=$esito=='V'?1:0;

            $upd = $db->prepare("UPDATE classifica SET punti=punti+?,vittorie=vittorie+?,pareggi=pareggi+?,sconfitte=sconfitte+?,gol_fatti=gol_fatti+?,gol_subiti=gol_subiti+?,partite_giocate=partite_giocate+1 WHERE team_id=? AND anno=?");
            $upd->execute([$punti,$v,$pa,$s,$gf,$gs,$team_id,$anno]);
            $upd->execute([$avv_punti,$avv_v,$avv_pa,$avv_s,$gs,$gf,$avv_id,$anno]);
        } else {
            $t1 = array_values(array_filter($tutteLega, fn($t) => $t['id'] == $home_id));
            $t2 = array_values(array_filter($tutteLega, fn($t) => $t['id'] == $away_id));
            if ($t1 && $t2) {
                $r = simulaPartita($db, $t1[0], $t2[0], $lega_id, $anno);
                // Raccoglie il risultato per il feed live della giornata (altre partite della lega)
                $altre_partite[] = [
                    'giornata' => intval($partita['giornata']),
                    'home'     => $t1[0]['nome'],
                    'away'     => $t2[0]['nome'],
                    'gf'       => $r['gf1'],
                    'gs'       => $r['gs1'],
                ];
            }
        }

        $db->prepare("UPDATE calendario SET giocata=1 WHERE id=?")->execute([$partita['id']]);
    }

    simulaTutteLeLeghe($db, $lega_id, $anno, $mese);

    return ['msgs'=>$msgs,'match_principale'=>$match_principale,'bonus_soldi'=>0,'trofeo'=>0,'altre_partite'=>$altre_partite];
}

// Simula tutte le leghe tranne quella del giocatore
function simulaTutteLeLeghe($db, $lega_corrente_id, $anno, $mese) {
    $leghe = $db->query("SELECT id FROM leghe")->fetchAll();
    foreach ($leghe as $lega) {
        $lid = intval($lega['id']);
        if ($lid == $lega_corrente_id) continue;

        generaCalendario($db, $lid, $anno);

        $stmt = $db->prepare("SELECT id, nome, ovr FROM teams WHERE lega_id=?");
        $stmt->execute([$lid]);
        $squadre = $stmt->fetchAll();
        if (count($squadre) < 2) continue;

        foreach ($squadre as $t) {
            $db->prepare("INSERT IGNORE INTO classifica (team_id,lega_id,anno) VALUES(?,?,?)")
               ->execute([$t['id'], $lid, $anno]);
        }

        $stmt = $db->prepare("SELECT * FROM calendario WHERE lega_id=? AND anno=? AND mese=? AND giocata=0 ORDER BY giornata");
        $stmt->execute([$lid, $anno, $mese]);
        $partite = $stmt->fetchAll();

        foreach ($partite as $partita) {
            $t1 = array_values(array_filter($squadre, fn($t) => $t['id'] == $partita['home_id']));
            $t2 = array_values(array_filter($squadre, fn($t) => $t['id'] == $partita['away_id']));
            if ($t1 && $t2) simulaPartita($db, $t1[0], $t2[0], $lid, $anno);
            $db->prepare("UPDATE calendario SET giocata=1 WHERE id=?")->execute([$partita['id']]);
        }
    }
}

// Simula una singola partita tra due squadre e aggiorna la classifica
function simulaPartita($db, $t1, $t2, $lega_id, $anno) {
    $ovr1 = intval($t1['ovr']);
    $ovr2 = intval($t2['ovr']);
    [$gf1, $gs1, $p1, $p2, $v1, $v2, $pa1, $pa2, $s1, $s2] = _simulaEsitoForza($ovr1, $ovr2, true);

    $upd = $db->prepare("UPDATE classifica SET punti=punti+?,vittorie=vittorie+?,pareggi=pareggi+?,sconfitte=sconfitte+?,gol_fatti=gol_fatti+?,gol_subiti=gol_subiti+?,partite_giocate=partite_giocate+1 WHERE team_id=? AND anno=?");
    $upd->execute([$p1,$v1,$pa1,$s1,$gf1,$gs1,$t1['id'],$anno]);
    $upd->execute([$p2,$v2,$pa2,$s2,$gs1,$gf1,$t2['id'],$anno]);

    return ['gf1'=>$gf1, 'gs1'=>$gs1];
}

/**
 * Motore di esito partita basato sulla FORZA (ovr) delle due squadre.
 * Restituisce gol e punti realistici: le squadre forti vincono più spesso
 * E segnano di più; le deboli subiscono di più. Il fattore campo (+3 ovr
 * alla squadra di casa) è applicato quando $homeAdvantage è true.
 *
 * @return array [gf1,gs1, p1,p2, v1,v2, pa1,pa2, s1,s2]
 */
function _simulaEsitoForza($ovr1, $ovr2, $homeAdvantage = false) {
    if ($homeAdvantage) $ovr1 += 3; // vantaggio del fattore campo
    $diff = $ovr1 - $ovr2;

    // Probabilità di vittoria casa: curva più ripida del precedente (×2.2)
    // così un divario di 15 ovr pesa davvero (≈ +33%).
    $probWin  = min(85, max(12, 50 + $diff * 2.2));
    $probDraw = max(8, 26 - abs($diff) * 0.6); // più equilibrio = più pareggi
    $r = rand(1, 100);

    // Forza relativa → numero di gol attesi (squadre forti segnano di più)
    $forza1 = max(0.4, min(2.6, ($ovr1 - 45) / 18));
    $forza2 = max(0.4, min(2.6, ($ovr2 - 45) / 18));

    if ($r <= $probWin) {
        // Vittoria casa
        $gf1 = _golPesati($forza1, true);
        $gs1 = _golPesati($forza2 * 0.6, false);
        if ($gs1 >= $gf1) $gs1 = max(0, $gf1 - 1);
        $p1=3;$p2=0; $v1=1;$v2=0;$pa1=0;$pa2=0;$s1=0;$s2=1;
    } elseif ($r <= $probWin + $probDraw) {
        // Pareggio
        $base = _golPesati(($forza1 + $forza2) / 2, false);
        $gf1 = $base; $gs1 = $base;
        $p1=1;$p2=1; $v1=0;$v2=0;$pa1=1;$pa2=1;$s1=0;$s2=0;
    } else {
        // Vittoria trasferta
        $gs1 = _golPesati($forza2, true);
        $gf1 = _golPesati($forza1 * 0.6, false);
        if ($gf1 >= $gs1) $gf1 = max(0, $gs1 - 1);
        $p1=0;$p2=3; $v1=0;$v2=1;$pa1=0;$pa2=0;$s1=1;$s2=0;
    }
    return [$gf1, $gs1, $p1, $p2, $v1, $v2, $pa1, $pa2, $s1, $s2];
}

/** Estrae un numero di gol pesato sulla forza (0-5). $vincente alza il minimo. */
function _golPesati($forza, $vincente) {
    $atteso = $forza + ($vincente ? 0.8 : 0.0);
    $g = (int) round($atteso + (rand(-100, 100) / 100) * 1.1);
    return max($vincente ? 1 : 0, min(5, $g));
}

// CHAMPIONS CUP — 4 gruppi da 5
// Calendario (8 partite per squadra = 2/mese × 4 mesi):
//   Set(9): qualifica e sorteggio gironi + prima giornata
//   Ott(10): seconda giornata gironi
//   Nov(11): terza giornata gironi
//   Dic(12): quarta giornata gironi + chiusura gironi
//   Gen(1): playoff (2e vs 3e cross-gruppo, andata/ritorno)
//   Feb(2): ottavi di finale (1e vs vincitori playoff)
//   Mar(3): quarti di finale
//   Apr(4): semifinale
//   Mag(5): finale (gestita da concludiChampions)
