<?php
/**
 * engine/champions.php — Champions Cup: gironi, eliminazione diretta, conclusione
 * Estratto da api/game.php (refactor): nessuna logica modificata.
 */

function simulaChampions($db, $p) {
    $lang    = getLang();
    $anno    = $p['anno_corrente'];
    $mese    = $p['mese_corrente'];
    $team_id = $p['team_id'];

    // Settembre: qualifica + sorteggio + prima giornata
    if ($mese == 9) {
        qualificaChampions($db, $anno);
        $stmt = $db->prepare("SELECT * FROM champions_cup WHERE team_id=? AND anno=?");
        $stmt->execute([$team_id, $anno]);
        $record = $stmt->fetch();
        if (!$record) {
            _simulaChampionsNPCOnly($db, $anno, $mese, $team_id);
            return null;
        }
        $result = simulaGiornataGruppo($db, $p, $record, $anno, $mese);
        // Simula anche gli altri gruppi NPC
        $gruppi = $db->prepare("SELECT DISTINCT gruppo FROM champions_cup WHERE anno=? AND gruppo IS NOT NULL AND gruppo != ?");
        $gruppi->execute([$anno, $record['gruppo']]);
        foreach ($gruppi->fetchAll() as $gr) {
            _simulaGiornataGruppoNPC($db, $anno, $gr['gruppo'], $mese, $team_id);
        }
        return $result;
    }

    $stmt = $db->prepare("SELECT * FROM champions_cup WHERE team_id=? AND anno=?");
    $stmt->execute([$team_id, $anno]);
    $record = $stmt->fetch();

    // Giocatore non in Champions o eliminato: simula comunque le NPC
    if (!$record || $record['eliminato']) {
        _simulaChampionsNPCOnly($db, $anno, $mese, $team_id);
        return null;
    }

    // Gironi: settembre-dicembre
    if (in_array($mese, [9, 10, 11, 12]) && $record['fase'] == 'gironi') {
        $result = simulaGiornataGruppo($db, $p, $record, $anno, $mese);
        // Simula anche gli altri gruppi NPC (escludi il gruppo del giocatore)
        $gruppi = $db->prepare("SELECT DISTINCT gruppo FROM champions_cup WHERE anno=? AND gruppo IS NOT NULL AND gruppo != ?");
        $gruppi->execute([$anno, $record['gruppo']]);
        foreach ($gruppi->fetchAll() as $gr) {
            _simulaGiornataGruppoNPC($db, $anno, $gr['gruppo'], $mese, $team_id);
        }
        return $result;
    }
    // Playoff (2e vs 3e): gennaio
    if ($mese == 1 && $record['fase'] == 'playoff') {
        return simulaFaseChampions($db, $p, $record, 'playoff', 'ottavi', 52, 'Playoff');
    }
    // Playoff (3e vs 2e): gennaio — il giocatore è terzo classificato
    if ($mese == 1 && $record['fase'] == 'playoff_3') {
        return simulaFaseChampions($db, $p, $record, 'playoff_3', 'ottavi', 48, 'Playoff');
    }
    // Ottavi: febbraio
    if ($mese == 2 && $record['fase'] == 'ottavi') {
        return simulaFaseChampions($db, $p, $record, 'ottavi', 'quarti', 55, 'Ottavi di Finale');
    }
    // Quarti: marzo
    if ($mese == 3 && $record['fase'] == 'quarti') {
        return simulaFaseChampions($db, $p, $record, 'quarti', 'semifinale', 60, 'Quarti di Finale');
    }
    // Semifinale: aprile
    if ($mese == 4 && $record['fase'] == 'semifinale') {
        return simulaFaseChampions($db, $p, $record, 'semifinale', 'finale', 65, 'Semifinale');
    }
    // Finale: maggio
    if ($mese == 5 && $record['fase'] == 'finale') {
        return simulaFaseChampions($db, $p, $record, 'finale', 'vincitore', 68, 'Finale');
    }

    return null;
}

// Simula Champions per NPC quando il giocatore non partecipa
function _simulaChampionsNPCOnly($db, $anno, $mese, $skip_team_id) {
    // Settembre: assicura che i gironi vengano creati anche senza il giocatore
    if ($mese == 9) qualificaChampions($db, $anno);

    if (in_array($mese, [9, 10, 11, 12])) {
        $gruppi = $db->prepare("SELECT DISTINCT gruppo FROM champions_cup WHERE anno=? AND gruppo IS NOT NULL");
        $gruppi->execute([$anno]);
        foreach ($gruppi->fetchAll() as $gr) {
            _simulaGiornataGruppoNPC($db, $anno, $gr['gruppo'], $mese, $skip_team_id);
        }
    } elseif ($mese == 1) {
        _simulaPlayoffNPC($db, $anno, $skip_team_id);
    } elseif ($mese == 2) {
        // Risolvi playoff ancora aperti prima degli ottavi
        _simulaPlayoffNPC($db, $anno, $skip_team_id);
        _simulaFaseNPC($db, $anno, 'ottavi', 'quarti', $skip_team_id);
    } elseif ($mese == 3) {
        _simulaFaseNPC($db, $anno, 'quarti', 'semifinale', $skip_team_id);
    } elseif ($mese == 4) {
        _simulaFaseNPC($db, $anno, 'semifinale', 'finale', $skip_team_id);
    } elseif ($mese == 5) {
        _simulaFaseNPC($db, $anno, 'finale', 'vincitore', $skip_team_id);
    }
}

function _simulaGiornataGruppoNPC($db, $anno, $gruppo, $mese, $skip_team_id) {
    // 5 squadre NPC (S0..S4). S0 fa da perno (2 partite/mese).
    // S1..S4: 2 vs S0 + 6 NPC-NPC = 8 totali ✓. S0: 2/mese × 4 = 8 ✓
    // Stesso schema del gruppo col giocatore (P=S0, N0..N3=S1..S4):
    // Perno(S0) gioca: Set(S1,S2) Ott(S3,S4) Nov(S1,S2) Dic(S3,S4)
    // NPC-NPC (3/mese, round-robin A+R tra S1..S4 in 4 mesi):
    // Set: S3-S4, S3-S1, S2-S4  Ott: S1-S2, S1-S4, S2-S3
    // Nov: S4-S3, S1-S3, S4-S2  Dic: S2-S1, S4-S1, S3-S2

    $stmt = $db->prepare("SELECT cc.team_id, t.ovr FROM champions_cup cc JOIN teams t ON cc.team_id=t.id WHERE cc.anno=? AND cc.gruppo=? ORDER BY cc.team_id");
    $stmt->execute([$anno, $gruppo]);
    $sq = $stmt->fetchAll();
    if (count($sq) < 5) return;

    // indici assoluti in $sq: S0=0, S1=1, S2=2, S3=3, S4=4
    $full_schedule = [
        9  => [[0,1],[0,2],  [3,4],[3,1],[2,4]],
        10 => [[0,3],[0,4],  [1,2],[1,4],[2,3]],
        11 => [[0,1],[0,2],  [4,3],[1,3],[4,2]],
        12 => [[0,3],[0,4],  [2,1],[4,1],[3,2]],
    ];

    foreach ($full_schedule[$mese] ?? [[0,1],[2,3],[1,4]] as [$ia, $ib]) {
        if (!isset($sq[$ia]) || !isset($sq[$ib])) continue;
        [$gf, $gs, $p1] = _simulaMatchGruppo(intval($sq[$ia]['ovr']), intval($sq[$ib]['ovr']));
        $p2 = ($p1===3?0:($p1===1?1:3));
        $v1=$p1===3?1:0; $pa1=$p1===1?1:0; $s1=$p1===0?1:0;
        $v2=$p2===3?1:0; $pa2=$p2===1?1:0; $s2=$p2===0?1:0;
        $db->prepare("UPDATE champions_cup SET punti_gruppo=punti_gruppo+?,vittorie_gruppo=vittorie_gruppo+?,pareggi_gruppo=pareggi_gruppo+?,sconfitte_gruppo=sconfitte_gruppo+?,gol_fatti_gruppo=gol_fatti_gruppo+?,gol_subiti_gruppo=gol_subiti_gruppo+?,partite_gruppo=partite_gruppo+1 WHERE team_id=? AND anno=?")
           ->execute([$p1,$v1,$pa1,$s1,$gf,$gs,$sq[$ia]['team_id'],$anno]);
        $db->prepare("UPDATE champions_cup SET punti_gruppo=punti_gruppo+?,vittorie_gruppo=vittorie_gruppo+?,pareggi_gruppo=pareggi_gruppo+?,sconfitte_gruppo=sconfitte_gruppo+?,gol_fatti_gruppo=gol_fatti_gruppo+?,gol_subiti_gruppo=gol_subiti_gruppo+?,partite_gruppo=partite_gruppo+1 WHERE team_id=? AND anno=?")
           ->execute([$p2,$v2,$pa2,$s2,$gs,$gf,$sq[$ib]['team_id'],$anno]);
    }
    if ($mese == 12) {
        _chiudiGironeSoloNPC($db, $anno, $gruppo, $skip_team_id);
    }
}

function _chiudiGironeSoloNPC($db, $anno, $gruppo, $skip_team_id) {
    $stmt = $db->prepare("SELECT cc.team_id FROM champions_cup cc WHERE cc.anno=? AND cc.gruppo=? AND cc.team_id!=? ORDER BY cc.punti_gruppo DESC, (cc.gol_fatti_gruppo-cc.gol_subiti_gruppo) DESC, cc.gol_fatti_gruppo DESC, cc.vittorie_gruppo DESC");
    $stmt->execute([$anno, $gruppo, $skip_team_id]);
    $classifica = $stmt->fetchAll();
    foreach ($classifica as $i => $r) {
        $pos = $i + 1;
        $db->prepare("UPDATE champions_cup SET posizione_gruppo=? WHERE team_id=? AND anno=?")->execute([$pos, $r['team_id'], $anno]);
        if ($i === 0) {
            $db->prepare("UPDATE champions_cup SET fase='ottavi' WHERE team_id=? AND anno=?")->execute([$r['team_id'],$anno]);
        } elseif ($i === 1) {
            $db->prepare("UPDATE champions_cup SET fase='playoff' WHERE team_id=? AND anno=?")->execute([$r['team_id'],$anno]);
        } elseif ($i === 2) {
            $db->prepare("UPDATE champions_cup SET fase='playoff_3' WHERE team_id=? AND anno=?")->execute([$r['team_id'],$anno]);
        } else {
            $db->prepare("UPDATE champions_cup SET eliminato=1 WHERE team_id=? AND anno=?")->execute([$r['team_id'],$anno]);
        }
    }
}

function qualificaChampions($db, $anno) {
    $stmt = $db->prepare("SELECT COUNT(*) as n FROM champions_cup WHERE anno=?");
    $stmt->execute([$anno]);
    if ($stmt->fetch()['n'] > 0) return;

    $tutte = [];
    $leghe = $db->query("SELECT id FROM leghe WHERE livello=1")->fetchAll();
    foreach ($leghe as $lega) {
        // Usa l'anno precedente: la qualifica si basa sui risultati del campionato appena concluso
        $anno_class = $anno - 1;
        $stmt = $db->prepare("SELECT c.team_id, t.ovr FROM classifica c JOIN teams t ON c.team_id=t.id WHERE c.lega_id=? AND c.anno=? ORDER BY c.punti DESC, (c.gol_fatti-c.gol_subiti) DESC, c.gol_fatti DESC, c.vittorie DESC LIMIT 4");
        $stmt->execute([$lega['id'], $anno_class]);
        $top4 = $stmt->fetchAll();
        if (empty($top4)) {
            $stmt2 = $db->prepare("SELECT id as team_id, ovr FROM teams WHERE lega_id=? ORDER BY stelle DESC, ovr DESC LIMIT 4");
            $stmt2->execute([$lega['id']]);
            $top4 = $stmt2->fetchAll();
        }
        foreach ($top4 as $t) $tutte[] = $t;
    }
    if (empty($tutte)) return;

    usort($tutte, fn($a,$b) => intval($b['ovr']) - intval($a['ovr']));
    $gruppi = ['A', 'B', 'C', 'D'];
    $tutte = array_slice($tutte, 0, 20);
    foreach ($tutte as $i => $t) {
        $db->prepare("INSERT IGNORE INTO champions_cup (anno,team_id,fase,gruppo) VALUES(?,?,'gironi',?)")
           ->execute([$anno, $t['team_id'], $gruppi[$i % 4]]);
    }
}

function simulaGiornataGruppo($db, $p, $record, $anno, $mese) {
    $team_id  = $p['team_id'];
    $gruppo   = $record['gruppo'];
    $team_ovr = intval($p['team_ovr'] ?? 65);

    $stmt = $db->prepare("SELECT cc.team_id, t.ovr FROM champions_cup cc JOIN teams t ON cc.team_id=t.id WHERE cc.anno=? AND cc.gruppo=? ORDER BY cc.team_id");
    $stmt->execute([$anno, $gruppo]);
    $tutte_squadre = $stmt->fetchAll();
    if (count($tutte_squadre) < 2) return null;

    $avversari = array_values(array_filter($tutte_squadre, fn($t) => $t['team_id'] != $team_id));
    $n_avv = count($avversari); // 4 NPC: N0..N3

    // Calendario bilanciato: ogni squadra 8 partite totali (4 avversari x A+R).
    // 5 match/mese: P gioca 2 vs NPC + 3 match NPC-NPC.
    // P affronta ogni NPC esattamente 2 volte. Ogni NPC fa 2 vsP + 6 NPC-NPC = 8. OK
    //
    // P vs NPC:  Set(N0,N1)  Ott(N2,N3)  Nov(N0,N1 ritorno)  Dic(N2,N3 ritorno)
    //
    // NPC-NPC (round-robin A+R tra N0..N3, 3 match/mese x 4 mesi = 12 = 6coppie x2):
    // Set(9):  N2-N3, N2-N0, N1-N3
    // Ott(10): N0-N1, N0-N3, N1-N2
    // Nov(11): N3-N2, N0-N2, N3-N1  (ritorni Set)
    // Dic(12): N1-N0, N3-N0, N2-N1  (ritorni Ott)
    $player_schedule = [
        9  => [0, 1],
        10 => [2, 3],
        11 => [0, 1],
        12 => [2, 3],
    ];
    $npc_schedule = [
        9  => [[2,3],[2,0],[1,3]],
        10 => [[0,1],[0,3],[1,2]],
        11 => [[3,2],[0,2],[3,1]],
        12 => [[1,0],[3,0],[2,1]],
    ];

    $avv_idx_list = $player_schedule[$mese] ?? [0, 1];
    $gol_fatti = 0; $gol_subiti = 0; $punti = 0; $partite_giocate = 0;
    $vittorie = 0; $pareggi = 0; $sconfitte = 0;
    $msgs = [];

    // --- 2 Partite del giocatore ---
    foreach ($avv_idx_list as $idx) {
        if (!isset($avversari[$idx % $n_avv])) continue;
        $avv = $avversari[$idx % $n_avv];
        [$gf, $gs, $pt] = _simulaMatchGruppo($team_ovr, intval($avv['ovr']));
        $gol_fatti += $gf; $gol_subiti += $gs; $punti += $pt; $partite_giocate++;
        if ($pt === 3) $vittorie++; elseif ($pt === 1) $pareggi++; else $sconfitte++;
        $pt_avv = ($pt === 3 ? 0 : ($pt === 1 ? 1 : 3));
        $v_avv=$pt_avv===3?1:0; $pa_avv=$pt_avv===1?1:0; $s_avv=$pt_avv===0?1:0;
        $db->prepare("UPDATE champions_cup SET punti_gruppo=punti_gruppo+?,vittorie_gruppo=vittorie_gruppo+?,pareggi_gruppo=pareggi_gruppo+?,sconfitte_gruppo=sconfitte_gruppo+?,gol_fatti_gruppo=gol_fatti_gruppo+?,gol_subiti_gruppo=gol_subiti_gruppo+?,partite_gruppo=partite_gruppo+1 WHERE team_id=? AND anno=?")
           ->execute([$pt_avv,$v_avv,$pa_avv,$s_avv,$gs,$gf,$avv['team_id'],$anno]);
        $msgs[] = "{$gf}-{$gs}";
    }

    // Aggiorna giocatore in blocco
    $db->prepare("UPDATE champions_cup SET punti_gruppo=punti_gruppo+?,vittorie_gruppo=vittorie_gruppo+?,pareggi_gruppo=pareggi_gruppo+?,sconfitte_gruppo=sconfitte_gruppo+?,gol_fatti_gruppo=gol_fatti_gruppo+?,gol_subiti_gruppo=gol_subiti_gruppo+?,partite_gruppo=partite_gruppo+? WHERE team_id=? AND anno=?")
       ->execute([$punti,$vittorie,$pareggi,$sconfitte,$gol_fatti,$gol_subiti,$partite_giocate,$team_id,$anno]);

    // --- 3 Partite NPC vs NPC ---
    foreach ($npc_schedule[$mese] ?? [] as [$ia, $ib]) {
        if (!isset($avversari[$ia % $n_avv]) || !isset($avversari[$ib % $n_avv])) continue;
        [$gf1,$gs1,$p1] = _simulaMatchGruppo(intval($avversari[$ia % $n_avv]['ovr']), intval($avversari[$ib % $n_avv]['ovr']));
        $p2=($p1===3?0:($p1===1?1:3));
        $v1=$p1===3?1:0;$pa1=$p1===1?1:0;$s1=$p1===0?1:0;
        $v2=$p2===3?1:0;$pa2=$p2===1?1:0;$s2=$p2===0?1:0;
        $db->prepare("UPDATE champions_cup SET punti_gruppo=punti_gruppo+?,vittorie_gruppo=vittorie_gruppo+?,pareggi_gruppo=pareggi_gruppo+?,sconfitte_gruppo=sconfitte_gruppo+?,gol_fatti_gruppo=gol_fatti_gruppo+?,gol_subiti_gruppo=gol_subiti_gruppo+?,partite_gruppo=partite_gruppo+1 WHERE team_id=? AND anno=?")
           ->execute([$p1,$v1,$pa1,$s1,$gf1,$gs1,$avversari[$ia % $n_avv]['team_id'],$anno]);
        $db->prepare("UPDATE champions_cup SET punti_gruppo=punti_gruppo+?,vittorie_gruppo=vittorie_gruppo+?,pareggi_gruppo=pareggi_gruppo+?,sconfitte_gruppo=sconfitte_gruppo+?,gol_fatti_gruppo=gol_fatti_gruppo+?,gol_subiti_gruppo=gol_subiti_gruppo+?,partite_gruppo=partite_gruppo+1 WHERE team_id=? AND anno=?")
           ->execute([$p2,$v2,$pa2,$s2,$gs1,$gf1,$avversari[$ib % $n_avv]['team_id'],$anno]);
    }

    if ($mese == 12) {
        return chiudiGirone($db, $p, $record, $anno, $gruppo);
    }

    $esito = $punti >= 6 ? "🏆" : ($punti >= 2 ? "🤝" : "💔");
    return "{$esito} Champions Gr.{$gruppo}: " . implode(', ', $msgs) . " ({$punti}pt)";
}

// Simula una partita di gruppo: restituisce [gol_fatti, gol_subiti, punti_squadra1]
function _simulaMatchGruppo($ovr1, $ovr2) {
    // Usa il motore di forza condiviso (senza fattore campo: gironi neutri).
    $res = _simulaEsitoForza($ovr1, $ovr2, false);
    // res = [gf1,gs1,p1,p2,...]; restituiamo nel formato atteso [gf,gs,pt]
    return [$res[0], $res[1], $res[2]];
}

function chiudiGirone($db, $p, $record, $anno, $gruppo) {
    $team_id = $p['team_id'];
    $stmt = $db->prepare("SELECT cc.team_id, cc.punti_gruppo, cc.gol_fatti_gruppo, cc.gol_subiti_gruppo FROM champions_cup cc WHERE cc.anno=? AND cc.gruppo=? ORDER BY cc.punti_gruppo DESC, (cc.gol_fatti_gruppo-cc.gol_subiti_gruppo) DESC, cc.gol_fatti_gruppo DESC, cc.vittorie_gruppo DESC");
    $stmt->execute([$anno, $gruppo]);
    $classifica_gruppo = $stmt->fetchAll();

    foreach ($classifica_gruppo as $i => $r) {
        $pos = $i + 1;
        $db->prepare("UPDATE champions_cup SET posizione_gruppo=? WHERE team_id=? AND anno=?")->execute([$pos, $r['team_id'], $anno]);
        if ($i === 0) {
            $db->prepare("UPDATE champions_cup SET fase='ottavi' WHERE team_id=? AND anno=?")->execute([$r['team_id'],$anno]);
        } elseif ($i === 1) {
            $db->prepare("UPDATE champions_cup SET fase='playoff' WHERE team_id=? AND anno=?")->execute([$r['team_id'],$anno]);
        } elseif ($i === 2) {
            // Terza classificata → playoff_3 (attende la 2a di un altro gruppo)
            $db->prepare("UPDATE champions_cup SET fase='playoff_3' WHERE team_id=? AND anno=?")->execute([$r['team_id'],$anno]);
        } else {
            $db->prepare("UPDATE champions_cup SET eliminato=1 WHERE team_id=? AND anno=?")->execute([$r['team_id'],$anno]);
        }
    }

    $pos = 0;
    foreach ($classifica_gruppo as $i => $r) {
        if ($r['team_id'] == $team_id) { $pos = $i + 1; break; }
    }

    if ($pos === 1)     return "🏆 Champions - 1° Gr.{$gruppo}! Agli Ottavi di Finale!";
    elseif ($pos === 2) return "🤝 Champions - 2° Gr.{$gruppo}. Playoff per gli Ottavi!";
    elseif ($pos === 3) return "⚡ Champions - 3° Gr.{$gruppo}. Playoff per gli Ottavi!";
    else                return "💔 Champions - Eliminato gironi (Gr.{$gruppo}, {$pos}° posto).";
}

function simulaFaseChampions($db, $p, $record, $fase_corrente, $fase_successiva, $prob_base, $label_fase) {
    $team_ovr = intval($p['team_ovr'] ?? 65);
    $anno     = $p['anno_corrente'];
    $team_id  = $p['team_id'];
    $gruppo   = $record['gruppo'];
    $pos      = intval($record['posizione_gruppo']);

    // Playoff: il giocatore affronta il suo avversario cross-gruppo specifico
    if ($fase_corrente === 'playoff' || $fase_corrente === 'playoff_3') {
        // Mappa accoppiamenti: A2→C3, B2→D3, C2→A3, D2→B3 (e viceversa)
        $pairings = ['A'=>['opp_gruppo'=>'C','opp_pos'=>3,'own_pos'=>2],
                     'B'=>['opp_gruppo'=>'D','opp_pos'=>3,'own_pos'=>2],
                     'C'=>['opp_gruppo'=>'A','opp_pos'=>3,'own_pos'=>2],
                     'D'=>['opp_gruppo'=>'B','opp_pos'=>3,'own_pos'=>2]];
        // Se il giocatore è terzo, il suo avversario è la seconda del suo gruppo speculare
        if ($pos === 3) {
            // A3→C2, B3→D2, C3→A2, D3→B2 (coerente con _simulaPlayoffNPC)
            $info = $pairings[$gruppo] ?? null;
            if ($info) $info['opp_pos'] = 2; // terzo sfida una seconda
        } else {
            $info = $pairings[$gruppo] ?? null;
        }
        // Trova OVR avversario per calibrare la probabilità
        $avv_ovr = 70; // default
        if ($info) {
            $stmt = $db->prepare("SELECT t.ovr FROM champions_cup cc JOIN teams t ON cc.team_id=t.id WHERE cc.anno=? AND cc.gruppo=? AND cc.posizione_gruppo=? LIMIT 1");
            $stmt->execute([$anno, $info['opp_gruppo'], $info['opp_pos']]);
            $avv = $stmt->fetch();
            if ($avv) $avv_ovr = intval($avv['ovr']);
        }
        $prob = min(80, max(20, 50 + ($team_ovr - $avv_ovr) * 0.8));
        _simulaPlayoffNPC($db, $anno, $team_id);
    } else {
        // Se il giocatore è agli ottavi, processa anche i playoff NPC rimasti
        if ($fase_corrente === 'ottavi') {
            _simulaPlayoffNPC($db, $anno, $team_id);
        }
        $prob = min(75, max(30, $prob_base + ($team_ovr - 70) * 0.5));
        _simulaFaseNPC($db, $anno, $fase_corrente, $fase_successiva, $team_id);
    }

    $avanza = rand(1, 100) <= $prob;
    if ($avanza) {
        $db->prepare("UPDATE champions_cup SET fase=? WHERE team_id=? AND anno=?")
           ->execute([$fase_successiva, $team_id, $anno]);
        $labels = ['playoff'=>'Playoff','ottavi'=>'Ottavi','quarti'=>'Quarti','semifinale'=>'Semifinale','finale'=>'Finale','vincitore'=>'Champions Cup 🏆'];
        if ($fase_successiva === 'vincitore') {
            return "🏆🌟 Champions Cup — {$label_fase}: HAI VINTO LA CHAMPIONS CUP! Il premio sarà assegnato a fine stagione.";
        }
        return "🏆 Champions Cup — {$label_fase}: avanza agli/ai " . ($labels[$fase_successiva] ?? $fase_successiva) . "!";
    } else {
        $db->prepare("UPDATE champions_cup SET eliminato=1 WHERE team_id=? AND anno=?")
           ->execute([$team_id, $anno]);
        return "💔 Champions Cup — Eliminato in {$label_fase}.";
    }
}

// Simula playoff: accoppiamenti fissi cross-gruppo
// A2 vs C3, B2 vs D3, C2 vs A3, D2 vs B3
function _simulaPlayoffNPC($db, $anno, $skip_team_id) {
    // Carica tutte le seconde e terze (escludi il giocatore)
    $stmt = $db->prepare("SELECT cc.team_id, cc.gruppo, cc.posizione_gruppo, t.ovr FROM champions_cup cc JOIN teams t ON cc.team_id=t.id WHERE cc.anno=? AND cc.fase IN ('playoff','playoff_3') AND cc.eliminato=0 AND cc.team_id!=?");
    $stmt->execute([$anno, $skip_team_id]);
    $teams = $stmt->fetchAll();

    // Indicizza per gruppo e posizione
    $by_gruppo_pos = [];
    foreach ($teams as $t) {
        $by_gruppo_pos[$t['gruppo']][$t['posizione_gruppo']] = $t;
    }

    // Accoppiamenti fissi: A2 vs C3, B2 vs D3, C2 vs A3, D2 vs B3
    $matches = [
        ['A', 2, 'C', 3],
        ['B', 2, 'D', 3],
        ['C', 2, 'A', 3],
        ['D', 2, 'B', 3],
    ];

    $processati = [];
    foreach ($matches as [$g2, $p2, $g3, $p3]) {
        $sq2 = $by_gruppo_pos[$g2][$p2] ?? null;
        $sq3 = $by_gruppo_pos[$g3][$p3] ?? null;
        if (!$sq2 || !$sq3) continue;
        if (in_array($sq2['team_id'], $processati) || in_array($sq3['team_id'], $processati)) continue;

        $prob = min(88, max(12, 50 + (intval($sq2['ovr']) - intval($sq3['ovr'])) * 1.4));
        if (rand(1, 100) <= $prob) {
            $db->prepare("UPDATE champions_cup SET fase='ottavi' WHERE team_id=? AND anno=?")->execute([$sq2['team_id'], $anno]);
            $db->prepare("UPDATE champions_cup SET eliminato=1 WHERE team_id=? AND anno=?")->execute([$sq3['team_id'], $anno]);
        } else {
            $db->prepare("UPDATE champions_cup SET fase='ottavi' WHERE team_id=? AND anno=?")->execute([$sq3['team_id'], $anno]);
            $db->prepare("UPDATE champions_cup SET eliminato=1 WHERE team_id=? AND anno=?")->execute([$sq2['team_id'], $anno]);
        }
        $processati[] = $sq2['team_id'];
        $processati[] = $sq3['team_id'];
    }
    // Elimina eventuali playoff rimasti senza match
    $db->prepare("UPDATE champions_cup SET eliminato=1 WHERE anno=? AND fase IN ('playoff','playoff_3') AND eliminato=0 AND team_id!=?")->execute([$anno, $skip_team_id]);
}

function _simulaFaseNPC($db, $anno, $fase_corrente, $fase_successiva, $skip_team_id) {
    $stmt = $db->prepare("SELECT cc.team_id, t.ovr FROM champions_cup cc JOIN teams t ON cc.team_id=t.id WHERE cc.anno=? AND cc.fase=? AND cc.eliminato=0 AND cc.team_id!=? ORDER BY t.ovr DESC");
    $stmt->execute([$anno, $fase_corrente, $skip_team_id]);
    $npc = $stmt->fetchAll();
    // Accoppia in coppie ordinate per OVR: 1° vs 2°, 3° vs 4°, ecc.
    // Garantisce che esattamente metà delle squadre avanzi
    for ($i = 0; $i + 1 < count($npc); $i += 2) {
        $sq1 = $npc[$i]; $sq2 = $npc[$i + 1];
        $prob = min(88, max(12, 50 + (intval($sq1['ovr']) - intval($sq2['ovr'])) * 1.4));
        if (rand(1, 100) <= $prob) {
            $db->prepare("UPDATE champions_cup SET fase=? WHERE team_id=? AND anno=?")->execute([$fase_successiva, $sq1['team_id'], $anno]);
            $db->prepare("UPDATE champions_cup SET eliminato=1 WHERE team_id=? AND anno=?")->execute([$sq2['team_id'], $anno]);
        } else {
            $db->prepare("UPDATE champions_cup SET fase=? WHERE team_id=? AND anno=?")->execute([$fase_successiva, $sq2['team_id'], $anno]);
            $db->prepare("UPDATE champions_cup SET eliminato=1 WHERE team_id=? AND anno=?")->execute([$sq1['team_id'], $anno]);
        }
    }
    // Squadra dispari rimasta (caso anomalo): eliminata
    if (count($npc) % 2 === 1) {
        $last = $npc[count($npc) - 1];
        $db->prepare("UPDATE champions_cup SET eliminato=1 WHERE team_id=? AND anno=?")->execute([$last['team_id'], $anno]);
    }
}

function concludiChampions($db, $p, $player_id) {
    $anno = $p['anno_corrente']; $team_id = $p['team_id'];
    $msgs = []; $soldi = 0; $trofei = 0; $champions_win = false;

    // A giugno risolvi eventuali NPC rimasti in finale (non processati a maggio)
    _simulaFaseNPC($db, $anno, 'finale', 'vincitore', $team_id);

    $stmt = $db->prepare("SELECT * FROM champions_cup WHERE team_id=? AND anno=?");
    $stmt->execute([$team_id, $anno]);
    $record = $stmt->fetch();
    if (!$record || $record['eliminato']) return ['messaggi'=>$msgs,'soldi'=>$soldi,'trofei'=>$trofei,'champions_win'=>false];

    // Fallback: se il giocatore è ancora in 'semifinale' o 'finale' (non processato a maggio)
    // Nel gioco la 'semifinale' PHP è la vera finale (solo 2 squadre rimaste dopo i quarti)
    if ($record['fase'] == 'semifinale') {
        $prob = min(70, max(30, 50 + (intval($p['team_ovr'] ?? 65) - 70) * 0.5));
        if (rand(1,100) <= $prob) {
            $db->prepare("UPDATE champions_cup SET fase='vincitore' WHERE team_id=? AND anno=?")->execute([$team_id,$anno]);
            $msgs[] = _tn("🏆🌟 LA TUA SQUADRA HA VINTO LA CHAMPIONS CUP!!! +€500,000!","🏆🌟 YOUR TEAM WON THE CHAMPIONS CUP!!! +€500,000!","🏆🌟 DEIN TEAM HAT DEN CHAMPIONS CUP GEWONNEN!!! +€500.000!","🏆🌟 ¡TU EQUIPO HA GANADO LA COPA DE CAMPEONES!!! +€500.000!");
            $soldi += 500000; $trofei += 1; $champions_win = true;
        } else {
            $db->prepare("UPDATE champions_cup SET eliminato=1 WHERE team_id=? AND anno=?")->execute([$team_id,$anno]);
            $msgs[] = _tn("💔 Sconfitta in finale di Champions Cup.","💔 Defeat in the Champions Cup final.","💔 Niederlage im Champions-Cup-Finale.","💔 Derrota en la final de la Copa de Campeones.");
            $msgs[] = _tn("💰 Bonus finalista Champions: +€100,000","💰 Champions finalist bonus: +€100,000","💰 Champions-Finalist-Bonus: +€100.000","💰 Bono finalista Champions: +€100.000");
            $soldi += 100000;
        }
        return ['messaggi'=>$msgs,'soldi'=>$soldi,'trofei'=>$trofei,'champions_win'=>$champions_win];
    }
    if ($record['fase'] == 'finale') {
        $prob = min(70, max(30, 50 + (intval($p['team_ovr'] ?? 65) - 70) * 0.5));
        if (rand(1,100) <= $prob) {
            $db->prepare("UPDATE champions_cup SET fase='vincitore' WHERE team_id=? AND anno=?")->execute([$team_id,$anno]);
            $msgs[] = _tn("🏆🌟 LA TUA SQUADRA HA VINTO LA CHAMPIONS CUP!!! +€500,000!","🏆🌟 YOUR TEAM WON THE CHAMPIONS CUP!!! +€500,000!","🏆🌟 DEIN TEAM HAT DEN CHAMPIONS CUP GEWONNEN!!! +€500.000!","🏆🌟 ¡TU EQUIPO HA GANADO LA COPA DE CAMPEONES!!! +€500.000!");
            $soldi += 500000; $trofei += 1; $champions_win = true;
        } else {
            $db->prepare("UPDATE champions_cup SET eliminato=1 WHERE team_id=? AND anno=?")->execute([$team_id,$anno]);
            $msgs[] = _tn("💔 Sconfitta in finale di Champions Cup.","💔 Defeat in the Champions Cup final.","💔 Niederlage im Champions-Cup-Finale.","💔 Derrota en la final de la Copa de Campeones.");
            $msgs[] = _tn("💰 Bonus finalista Champions: +€100,000","💰 Champions finalist bonus: +€100,000","💰 Champions-Finalist-Bonus: +€100.000","💰 Bono finalista Champions: +€100.000");
            $soldi += 100000;
        }
    } elseif ($record['fase'] == 'vincitore') {
        // Già vinto a maggio (caso normale): assegna premio qui a giugno UNA SOLA VOLTA
        // Controlla se il premio è già stato pagato (evita double-award)
        $premio_stmt = $db->prepare("SELECT champions_premio_pagato FROM players WHERE id=?");
        $premio_stmt->execute([$player_id]);
        $gia_pagato = intval(($premio_stmt->fetch()['champions_premio_pagato'] ?? 0));
        if (!$gia_pagato) {
            $msgs[] = _tn("🏆🌟 LA TUA SQUADRA HA VINTO LA CHAMPIONS CUP!!! +€500,000!","🏆🌟 YOUR TEAM WON THE CHAMPIONS CUP!!! +€500,000!","🏆🌟 DEIN TEAM HAT DEN CHAMPIONS CUP GEWONNEN!!! +€500.000!","🏆🌟 ¡TU EQUIPO HA GANADO LA COPA DE CAMPEONES!!! +€500.000!");
            $soldi += 500000; $trofei += 1; $champions_win = true;
            $db->prepare("UPDATE players SET champions_premio_pagato=1 WHERE id=?")->execute([$player_id]);
        }
    }
    return ['messaggi'=>$msgs,'soldi'=>$soldi,'trofei'=>$trofei,'champions_win'=>$champions_win];
}

