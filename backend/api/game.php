<?php
require_once '../config/db.php';

$player_id = getAuthPlayerId();
if (!$player_id) { echo json_encode(['error' => 'Non autenticato']); exit; }

$raw  = file_get_contents('php://input');
$data = json_decode($raw, true) ?: [];
$action = $data['action'] ?? $_GET['action'] ?? '';

switch ($action) {
    case 'play_month':      playMonth($player_id, $data);      break;
    case 'buy_struttura':   buyStruttura($player_id, $data);   break;
    case 'change_team':     changeTeam($player_id, $data);     break;
    case 'apply_skill_boost': applySkillBoost($player_id, $data); break;
    case 'get_skill_boosts':  getSkillBoosts($player_id);         break;
    default: echo json_encode(['error' => 'Azione non trovata']);
}

// ============================================================
function getPlayerData($id) {
    $db = getDB();
    $stmt = $db->prepare("
        SELECT p.*, t.stelle as team_stelle, t.popolarita as team_pop,
               t.moltiplicatore_stipendio, t.probabilita_trofeo,
               t.lega_id, t.nome as team_nome_full, t.ovr as team_ovr,
               l.nome as lega_nome, l.livello as lega_livello, l.nazione_id,
               n.nome as nazione_nome
        FROM players p
        LEFT JOIN teams t ON p.team_id = t.id
        LEFT JOIN leghe l ON t.lega_id = l.id
        LEFT JOIN nazioni n ON l.nazione_id = n.id
        WHERE p.id = ?
    ");
    $stmt->execute([$id]);
    return $stmt->fetch();
}

// ============================================================
function playMonth($player_id, $data) {
    $db  = getDB();
    $p   = getPlayerData($player_id);
    if (!$p) { echo json_encode(['error' => 'Giocatore non trovato']); return; }

    $azioni = $data['azioni'] ?? [];
    if (empty($azioni) || count($azioni) > 3) {
        echo json_encode(['error' => 'Scegli da 1 a 3 azioni']); return;
    }

    $risultati     = [];
    $sc            = ['tiro'=>0,'velocita'=>0,'dribbling'=>0,'fisico'=>0,'mentalita'=>0,'popolarita'=>0,'energia'=>0,'morale'=>0];
    $evento_speciale = '';
    $bonus         = getBonusStruttura($p['struttura_livello']);

    // --- ALLENAMENTI ---
    foreach ($azioni as $azione) {
        switch ($azione) {
            case 'allenamento_tiro':
                $g = rand(1,3) + $bonus['bonus_crescita'];
                $sc['tiro'] += $g; $sc['energia'] -= rand(10,20);
                $risultati[] = "🎯 Tiro migliorato +{$g}"; break;
            case 'allenamento_velocita':
                $g = rand(1,3) + $bonus['bonus_crescita'];
                $sc['velocita'] += $g; $sc['energia'] -= rand(10,20);
                $risultati[] = "⚡ Velocità migliorata +{$g}"; break;
            case 'dribbling':
                $g = rand(1,3) + $bonus['bonus_crescita'];
                $sc['dribbling'] += $g; $sc['energia'] -= rand(10,20);
                $risultati[] = "🏃 Dribbling migliorato +{$g}"; break;
            case 'allenamento_fisico':
                $g = rand(1,3) + $bonus['bonus_crescita'];
                $sc['fisico'] += $g; $sc['energia'] -= rand(10,20);
                $risultati[] = "💪 Fisico migliorato +{$g}"; break;
            case 'riposo':
                $r = rand(20,40);
                $sc['energia'] += $r; $sc['morale'] += rand(5,10);
                $risultati[] = "😴 Riposo: +{$r} energia"; break;
            case 'social':
                $pop = rand(2,8) + intval($p['team_stelle'] ?? 1);
                $sc['popolarita'] += $pop; $sc['morale'] += rand(3,8);
                $risultati[] = "📱 Social: +{$pop} popolarità"; break;
            case 'allenamento_speciale':
                $rischio = rand(1,100) - $bonus['riduzione_infortuni'];
                if ($rischio > 75) {
                    $sc['energia'] -= rand(40,60);
                    $risultati[] = "🚨 INFORTUNIO durante allenamento speciale!";
                } else {
                    $g    = rand(3,6) + $bonus['bonus_crescita'];
                    $keys = ['tiro','velocita','dribbling','fisico','mentalita'];
                    $k    = $keys[rand(0,4)];
                    $sc[$k] += $g;
                    $risultati[] = "🔥 Allenamento speciale: +{$g} ".ucfirst($k);
                }
                break;
        }
    }

    // --- AGENTE BONUS ---
    $agent_bonus = getAgentBonus($db, $player_id);

    // --- PARTITA PERSONALE ---
    $match = simulateMatch($p);
    $risultati[]    = "⚽ ".$match['desc'];
    $sc['popolarita'] += $match['pop_gain'];
    $sc['morale']     += $match['morale'];

    // --- SIMULAZIONE GIORNATA DI LEGA ---
    $lega_result = simulaGiornataLega($db, $p, $match);
    if ($lega_result['msg']) $risultati[] = $lega_result['msg'];

    // --- NOTIZIE DINAMICHE ---
    generaNotizieDinamiche($db, $player_id, $p, $match, $lega_result);

    // --- CHAMPIONS CUP (se qualificata) ---
    $champions_result = simulaChampions($db, $p);
    if ($champions_result) $risultati[] = $champions_result;

    // --- EVENTO CASUALE (10%) ---
    if (rand(1,100) <= 10) {
        $events = [
            ['Crisi di forma improvvisa!',             'morale',    -15],
            ['Sponsor importante ti contatta!',        'popolarita', 10],
            ['Il mister ti loda in conferenza stampa!','morale',     20],
            ['Rivalità con un altro attaccante!',      'morale',     -5],
            ['Offerta da un top club!',                'morale',     15],
        ];
        $ev = $events[array_rand($events)];
        $evento_speciale = $ev[0];
        $sc[$ev[1]] += $ev[2];
        $risultati[] = "🎲 EVENTO: ".$ev[0];
    }

    // Sponsor academy
    if ($p['struttura_livello'] >= 4) {
        $sp = rand(5000,20000);
        $match['stipendio'] += $sp;
        $risultati[] = "🤝 Sponsor Academy: +€".number_format($sp);
    }

    // --- CALCOLA NUOVE STATS ---
    $ns = [
        'tiro'       => min(125,max(1,$p['tiro']      +$sc['tiro'])),
        'velocita'   => min(125,max(1,$p['velocita']  +$sc['velocita'])),
        'dribbling'  => min(125,max(1,$p['dribbling'] +$sc['dribbling'])),
        'fisico'     => min(125,max(1,$p['fisico']    +$sc['fisico'])),
        'mentalita'  => min(125,max(1,$p['mentalita'] +$sc['mentalita'])),
        'popolarita' => min(100,max(0,$p['popolarita']+$sc['popolarita'])),
        'energia'    => min(100,max(0,$p['energia']  +$sc['energia'])),
        'morale'     => min(100,max(0,$p['morale']   +$sc['morale'])),
    ];
    if ($p['age'] >= 32) {
        $decay = ($p['age']-31)*0.3;
        $ns['velocita'] = max(1,$ns['velocita']-$decay);
        $ns['fisico']   = max(1,$ns['fisico']  -$decay);
    }

    $new_overall = intval(($ns['tiro']+$ns['velocita']+$ns['dribbling']+$ns['fisico']+$ns['mentalita'])/5); // max 125
    $bonus_soldi   = $lega_result['bonus_soldi'] ?? 0;
    $stipendio_agente = round($match['stipendio'] * ($agent_bonus['bonus_stipendio'] ?? 0));
    $new_soldi = $p['soldi'] + $match['stipendio'] + $bonus_soldi + $stipendio_agente;
    if ($stipendio_agente > 0) {
        $risultati[] = "🤝 Bonus agente: +€".number_format($stipendio_agente);
    }
    $new_gol     = $p['gol_carriera']    + $match['gol'];
    $new_assist  = $p['assist_carriera'] + $match['assist'];
    $new_trofei  = $p['trofei']          + ($lega_result['trofeo'] ?? 0);

    $new_mese  = $p['mese_corrente'] + 1;
    $new_anno  = $p['anno_corrente'];
    $new_age   = $p['age'];
    $pallone_result   = null;
    $promozione_msg   = null;
    $premi_fine_anno  = [];

    // --- FINE ANNO ---
    if ($new_mese > 12) {
        $new_mese = 1; $new_anno++; $new_age++;

        // Pallone d'Oro
        $pallone_result = calcPalloneDoro($db, $player_id, $p, $new_overall, $new_gol, $new_assist);
        $risultati[] = "📅 Nuova stagione! Età: {$new_age}";
        if ($pallone_result) $risultati[] = $pallone_result['msg'];

        // Premi di fine anno (campionato)
        $premi = calcPremiCampionato($db, $p, $player_id);
        foreach ($premi['messaggi'] as $m) $risultati[] = $m;
        $new_soldi  += $premi['soldi'];
        $new_trofei += $premi['trofei'];

        // Champions Cup finale
        $champ_finale = concludiChampions($db, $p, $player_id);
        foreach ($champ_finale['messaggi'] as $m) $risultati[] = $m;
        $new_soldi  += $champ_finale['soldi'];
        $new_trofei += $champ_finale['trofei'];

        // Promozione / Retrocessione
        $promo = checkPromozioneRetrocessione($db, $player_id, $p, $new_overall);
        if ($promo) {
            $promozione_msg = $promo['msg'];
            $risultati[]    = $promo['msg'];
            if (!empty($promo['new_team_id'])) {
                $db->prepare("UPDATE players SET team_id=? WHERE id=?")->execute([$promo['new_team_id'],$player_id]);
            }
        }
    }

    // Salva log
    $db->prepare("INSERT INTO log_mensile (player_id,anno,mese,azione,risultato,gol,assist,voto,evento_speciale) VALUES(?,?,?,?,?,?,?,?,?)")
       ->execute([$player_id,$p['anno_corrente'],$p['mese_corrente'],implode(',',$azioni),implode("\n",$risultati),$match['gol'],$match['assist'],$match['voto'],$evento_speciale]);

    // Aggiorna giocatore
    $db->prepare("UPDATE players SET tiro=?,velocita=?,dribbling=?,fisico=?,mentalita=?,popolarita=?,energia=?,morale=?,overall=?,soldi=?,gol_carriera=?,assist_carriera=?,trofei=?,mese_corrente=?,anno_corrente=?,age=? WHERE id=?")
       ->execute([$ns['tiro'],$ns['velocita'],$ns['dribbling'],$ns['fisico'],$ns['mentalita'],$ns['popolarita'],$ns['energia'],$ns['morale'],$new_overall,$new_soldi,$new_gol,$new_assist,$new_trofei,$new_mese,$new_anno,$new_age,$player_id]);

    $fine_carriera = false;
    if ($new_age >= 38) {
        $fine_carriera = true;
        $risultati[] = "🏁 FINE CARRIERA! ".calcEpilogo($db,$player_id);
    }

    echo json_encode([
        'success'       => true,
        'risultati'     => $risultati,
        'match'         => $match,
        'pallone_doro'  => $pallone_result,
        'promozione'    => $promozione_msg,
        'fine_carriera' => $fine_carriera,
        'nuovo_anno'    => ($new_anno !== $p['anno_corrente']),
    ]);
}

// ============================================================
// SIMULAZIONE GIORNATA DI LEGA (lega del giocatore)
// ============================================================
function simulaGiornataLega($db, $p, $match) {
    $team_id  = $p['team_id'];
    $lega_id  = $p['lega_id'];
    $anno     = $p['anno_corrente'];
    $team_ovr = intval($p['team_ovr'] ?? 65);

    // Tutte le squadre della lega
    $stmt = $db->prepare("SELECT id, nome, ovr FROM teams WHERE lega_id=?");
    $stmt->execute([$lega_id]);
    $tutteLega = $stmt->fetchAll();

    // Assicura record classifica per tutta la lega
    foreach ($tutteLega as $t) {
        $db->prepare("INSERT OR IGNORE INTO classifica (team_id,lega_id,anno) VALUES(?,?,?)")
           ->execute([$t['id'], $lega_id, $anno]);
    }

    // Avversari (escludi il giocatore)
    $avversari = array_filter($tutteLega, fn($t) => $t['id'] != $team_id);
    $avversari = array_values($avversari);

    if (empty($avversari)) return ['msg'=>null,'bonus_soldi'=>0,'trofeo'=>0];

    // Partita della squadra del giocatore
    $voto_giocatore = floatval($match['voto']);
    $boost = ($voto_giocatore >= 8) ? 5 : (($voto_giocatore <= 5) ? -5 : 0);

    $avv     = $avversari[array_rand($avversari)];
    $avv_ovr = intval($avv['ovr'] ?? 65);
    $diff    = ($team_ovr + $boost) - $avv_ovr;
    $prob    = min(80, max(20, 50 + $diff * 1.5));
    $rand    = rand(1, 100);

    if ($rand <= $prob) {
        $esito = 'V'; $punti = 3;
        $gf = rand(1,4); $gs = rand(0,2);
        $msg = "🏟️ La tua squadra vince {$gf}-{$gs} contro {$avv['nome']}! (+3 punti)";
    } elseif ($rand <= $prob + 15) {
        $esito = 'P'; $punti = 1;
        $gf = rand(0,2); $gs = $gf;
        $msg = "🤝 Pareggio {$gf}-{$gs} contro {$avv['nome']}. (+1 punto)";
    } else {
        $esito = 'S'; $punti = 0;
        $gf = rand(0,2); $gs = rand(1,4);
        $msg = "💔 Sconfitta {$gf}-{$gs} contro {$avv['nome']}.";
    }

    $v  = ($esito=='V') ? 1 : 0;
    $pa = ($esito=='P') ? 1 : 0;
    $s  = ($esito=='S') ? 1 : 0;
    $db->prepare("UPDATE classifica SET punti=punti+?,vittorie=vittorie+?,pareggi=pareggi+?,sconfitte=sconfitte+?,gol_fatti=gol_fatti+?,gol_subiti=gol_subiti+?,partite_giocate=partite_giocate+1 WHERE team_id=? AND anno=?")
       ->execute([$punti,$v,$pa,$s,$gf,$gs,$team_id,$anno]);

    // Simula le altre partite nella lega del giocatore
    simulaGiornataInLega($db, $lega_id, $anno, $team_id, $avversari, $avv['id']);

    // Simula tutte le altre leghe
    simulaTutteLeLeghe($db, $lega_id, $anno);

    return ['msg'=>$msg,'bonus_soldi'=>0,'trofeo'=>0];
}

// Simula una giornata in una lega specifica (esclude la partita già giocata)
function simulaGiornataInLega($db, $lega_id, $anno, $skip_id1, $avversari, $skip_id2 = null) {
    // Rimuovi le squadre già impegnate
    $altri = array_filter($avversari, fn($a) => $a['id'] != $skip_id1 && $a['id'] != $skip_id2);
    $altri = array_values($altri);
    shuffle($altri);

    for ($i = 0; $i + 1 < count($altri); $i += 2) {
        $t1 = $altri[$i];
        $t2 = $altri[$i+1];
        simulaPartita($db, $t1, $t2, $lega_id, $anno);
    }
}

// Simula tutte le leghe tranne quella del giocatore
function simulaTutteLeLeghe($db, $lega_corrente_id, $anno) {
    // Prendi tutte le leghe
    $stmt = $db->query("SELECT id FROM leghe");
    $leghe = $stmt->fetchAll();

    foreach ($leghe as $lega) {
        $lid = intval($lega['id']);
        if ($lid == $lega_corrente_id) continue; // già simulata sopra

        // Prendi squadre di questa lega
        $stmt = $db->prepare("SELECT id, nome, ovr FROM teams WHERE lega_id=?");
        $stmt->execute([$lid]);
        $squadre = $stmt->fetchAll();

        if (count($squadre) < 2) continue;

        // Assicura record classifica
        foreach ($squadre as $t) {
            $db->prepare("INSERT OR IGNORE INTO classifica (team_id,lega_id,anno) VALUES(?,?,?)")
               ->execute([$t['id'], $lid, $anno]);
        }

        // Abbina e simula
        shuffle($squadre);
        for ($i = 0; $i + 1 < count($squadre); $i += 2) {
            simulaPartita($db, $squadre[$i], $squadre[$i+1], $lid, $anno);
        }
    }
}

// Simula una singola partita tra due squadre e aggiorna la classifica
function simulaPartita($db, $t1, $t2, $lega_id, $anno) {
    $diff = intval($t1['ovr']) - intval($t2['ovr']);
    $prob = min(80, max(20, 50 + $diff * 1.5));
    $r    = rand(1, 100);

    if ($r <= $prob) {
        $p1=3;$p2=0; $v1=1;$v2=0;$pa1=0;$pa2=0;$s1=0;$s2=1;
        $gf1=rand(1,4);$gs1=rand(0,2);
    } elseif ($r <= $prob + 15) {
        $p1=1;$p2=1; $v1=0;$v2=0;$pa1=1;$pa2=1;$s1=0;$s2=0;
        $gf1=rand(0,2);$gs1=$gf1;
    } else {
        $p1=0;$p2=3; $v1=0;$v2=1;$pa1=0;$pa2=0;$s1=1;$s2=0;
        $gf1=rand(0,2);$gs1=rand(1,4);
    }

    $upd = $db->prepare("UPDATE classifica SET punti=punti+?,vittorie=vittorie+?,pareggi=pareggi+?,sconfitte=sconfitte+?,gol_fatti=gol_fatti+?,gol_subiti=gol_subiti+?,partite_giocate=partite_giocate+1 WHERE team_id=? AND anno=?");
    $upd->execute([$p1,$v1,$pa1,$s1,$gf1,$gs1,$t1['id'],$anno]);
    $upd->execute([$p2,$v2,$pa2,$s2,$gs1,$gf1,$t2['id'],$anno]);
}

// ============================================================
// CHAMPIONS CUP
// ============================================================
function simulaChampions($db, $p) {
    $anno    = $p['anno_corrente'];
    $mese    = $p['mese_corrente'];
    $team_id = $p['team_id'];

    // Controlla se la squadra è in Champions
    $stmt = $db->prepare("SELECT * FROM champions_cup WHERE team_id=? AND anno=?");
    $stmt->execute([$team_id,$anno]);
    $record = $stmt->fetch();

    // Mese 1: qualifica le top-4 di ogni prima divisione (se non già fatto)
    if ($mese == 1) {
        qualificaChampions($db, $anno);
        // Rileggi
        $stmt->execute([$team_id,$anno]);
        $record = $stmt->fetch();
        if ($record) return "🏆 Champions Cup: la tua squadra è qualificata alla fase a gironi!";
        return null;
    }

    if (!$record || $record['eliminato']) return null;

    // Fase a gironi: mesi 2-6
    if ($mese >= 2 && $mese <= 6 && $record['fase'] == 'gironi') {
        return simulaFaseChampions($db, $p, $record, 'gironi', 'quarti', 7, 55);
    }
    // Quarti: mesi 7-8
    if ($mese >= 7 && $mese <= 8 && $record['fase'] == 'quarti') {
        return simulaFaseChampions($db, $p, $record, 'quarti', 'semifinale', 9, 60);
    }
    // Semifinale: mesi 9-10
    if ($mese >= 9 && $mese <= 10 && $record['fase'] == 'semifinale') {
        return simulaFaseChampions($db, $p, $record, 'semifinale', 'finale', 11, 65);
    }

    return null;
}

function qualificaChampions($db, $anno) {
    // Evita doppie qualifiche
    $stmt = $db->prepare("SELECT COUNT(*) as n FROM champions_cup WHERE anno=?");
    $stmt->execute([$anno]);
    if ($stmt->fetch()['n'] > 0) return;

    // Top 4 di ogni lega di primo livello
    $leghe = $db->query("SELECT id FROM leghe WHERE livello=1")->fetchAll();
    foreach ($leghe as $lega) {
        $stmt = $db->prepare("
            SELECT c.team_id FROM classifica c
            WHERE c.lega_id=? AND c.anno=?
            ORDER BY c.punti DESC, (c.gol_fatti-c.gol_subiti) DESC
            LIMIT 4
        ");
        $stmt->execute([$lega['id'],$anno]);
        $top4 = $stmt->fetchAll();

        // Se non ci sono dati classifica, prendi le top 4 per stelle/ovr
        if (empty($top4)) {
            $stmt = $db->prepare("SELECT id as team_id FROM teams WHERE lega_id=? ORDER BY stelle DESC, ovr DESC LIMIT 4");
            $stmt->execute([$lega['id']]);
            $top4 = $stmt->fetchAll();
        }

        foreach ($top4 as $t) {
            $db->prepare("INSERT OR IGNORE INTO champions_cup (anno,team_id,fase) VALUES(?,?,'gironi')")
               ->execute([$anno,$t['team_id']]);
        }
    }
}

function simulaFaseChampions($db, $p, $record, $fase_corrente, $fase_successiva, $mese_avanzamento, $prob_base) {
    if ($p['mese_corrente'] != $mese_avanzamento) return null;

    $team_ovr  = intval($p['team_ovr'] ?? 65);
    $prob      = min(75, max(30, $prob_base + ($team_ovr - 70) * 0.5));
    $avanza    = rand(1,100) <= $prob;

    if ($avanza) {
        $db->prepare("UPDATE champions_cup SET fase=? WHERE team_id=? AND anno=?")
           ->execute([$fase_successiva,$p['team_id'],$p['anno_corrente']]);
        $labels = ['quarti'=>'Quarti di Finale','semifinale'=>'Semifinale','finale'=>'Finale'];
        return "🏆 Champions Cup: la tua squadra avanza ai ".($labels[$fase_successiva] ?? $fase_successiva)."!";
    } else {
        $db->prepare("UPDATE champions_cup SET eliminato=1 WHERE team_id=? AND anno=?")
           ->execute([$p['team_id'],$p['anno_corrente']]);
        return "💔 Champions Cup: la tua squadra è eliminata nella fase ".ucfirst($fase_corrente).".";
    }
}

function concludiChampions($db, $p, $player_id) {
    $anno    = $p['anno_corrente'];
    $team_id = $p['team_id'];
    $msg_list = []; $soldi = 0; $trofei = 0;

    $stmt = $db->prepare("SELECT * FROM champions_cup WHERE team_id=? AND anno=?");
    $stmt->execute([$team_id,$anno]);
    $record = $stmt->fetch();
    if (!$record || $record['eliminato']) return ['messaggi'=>$msg_list,'soldi'=>$soldi,'trofei'=>$trofei];

    if ($record['fase'] == 'finale') {
        $team_ovr = intval($p['team_ovr'] ?? 65);
        $prob     = min(70, max(30, 50 + ($team_ovr - 70) * 0.5));
        if (rand(1,100) <= $prob) {
            $db->prepare("UPDATE champions_cup SET fase='vincitore' WHERE team_id=? AND anno=?")->execute([$team_id,$anno]);
            $db->prepare("UPDATE players SET trofei=trofei+1 WHERE id=?")->execute([$player_id]);
            $msg_list[] = "🏆🌟 LA TUA SQUADRA HA VINTO LA CHAMPIONS CUP!!! Bonus: +€500,000!";
            $soldi  += 500000;
            $trofei += 1;
        } else {
            $db->prepare("UPDATE champions_cup SET eliminato=1 WHERE team_id=? AND anno=?")->execute([$team_id,$anno]);
            $msg_list[] = "💔 Sconfitta in finale di Champions Cup. Ma che stagione!";
            $soldi += 100000;
            $msg_list[] = "💰 Bonus finalista Champions: +€100,000";
        }
    }
    return ['messaggi'=>$msg_list,'soldi'=>$soldi,'trofei'=>$trofei];
}

// ============================================================
// PREMI CAMPIONATO A FINE ANNO
// ============================================================
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
        ORDER BY c.punti DESC, diff DESC
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
        $db->prepare("UPDATE players SET trofei=trofei+1 WHERE id=?")->execute([$player_id]);
        $msg_list[] = "🏆 CAMPIONI! La tua squadra ha vinto il campionato! +€".number_format($premio);
        $soldi  += $premio; $trofei += 1;
    } elseif ($pos <= 3) {
        $premio = ($lega_livello == 1) ? 100000 : 30000;
        $msg_list[] = "🥉 Podio in campionato (#{$pos})! +€".number_format($premio);
        $soldi += $premio;
    } elseif ($pos <= 4 && $lega_livello == 1) {
        $msg_list[] = "⭐ Top 4 in Prima Divisione: qualificato alla Champions Cup!";
    } elseif ($pos >= count($classifica) - 2 && count($classifica) >= 10) {
        $msg_list[] = "⚠️ La tua squadra ha chiuso nelle ultime posizioni. Rischio retrocessione!";
    }

    return ['messaggi'=>$msg_list,'soldi'=>$soldi,'trofei'=>$trofei];
}

// ============================================================
// PROMOZIONE / RETROCESSIONE
// ============================================================
function checkPromozioneRetrocessione($db, $player_id, $p, $overall) {
    $lega_id      = intval($p['lega_id'] ?? 0);
    $lega_livello = intval($p['lega_livello'] ?? 1);
    $nazione_id   = intval($p['nazione_id'] ?? 1);
    if (!$lega_id) return null;

    $stmt = $db->prepare("SELECT SUM(gol) as gol, AVG(voto) as voto FROM log_mensile WHERE player_id=? AND anno=?");
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
            if ($sq) return ['tipo'=>'promozione','msg'=>"🚀 PROMOZIONE! Sei salito in Prima Divisione: ".$sq['nome'],'new_team_id'=>$sq['id']];
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
            if ($sq) return ['tipo'=>'retrocessione','msg'=>"📉 RETROCESSIONE in Seconda Divisione: ".$sq['nome'],'new_team_id'=>$sq['id']];
        }
    }
    return null;
}

// ============================================================
// AGENTE & NOTIZIE
// ============================================================
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
    ];
    return $agenti[$ag['livello']] ?? ['bonus_stipendio'=>0,'bonus_offerte'=>0,'bonus_ovr_sconto'=>0];
}

function generaNotizia($db, $player_id, $anno, $mese, $titolo, $testo, $tipo='info') {
    $db->prepare("INSERT INTO notizie (player_id,anno,mese,titolo,testo,tipo) VALUES(?,?,?,?,?,?)")
       ->execute([$player_id, $anno, $mese, $titolo, $testo, $tipo]);
}

function generaNotizieDinamiche($db, $player_id, $p, $match, $lega_result) {
    $anno    = $p['anno_corrente'];
    $mese    = $p['mese_corrente'];
    $gol     = $match['gol'];
    $assist  = $match['assist'];
    $voto    = $match['voto'];
    $nome    = $p['player_name'];
    $overall = intval($p['overall']);
    $pop     = intval($p['popolarita']);
    $morale  = intval($p['morale']);
    $energia = intval($p['energia']);
    $stelle  = intval($p['team_stelle'] ?? 1);
    $team    = $p['team_nome_full'] ?? $p['team_nome'] ?? 'la squadra';
    $notizie = [];

    // ── 1. NOTIZIA DI PRESTAZIONE (sempre generata) ──────────────────
    if ($gol >= 4) {
        $notizie[] = ["🔥🔥 Poker di gol!", "{$nome} è incontenibile: 4 reti in una sola partita! Voto {$voto}. I social esplodono e i top club già telefonano.", 'positivo'];
    } elseif ($gol >= 3) {
        $frasi = [
            "Con la sua tripletta {$nome} ha fatto impazzire il pubblico. Voto {$voto}. 'È il più forte che abbia mai allenato' — parole del mister.",
            "{$nome} firma un hat-trick da sogno. Voto {$voto}. Tre gol, tre applausi, standing ovation finale.",
            "Notte magica per {$nome}: tripletta e voto {$voto}. Il match-winner assoluto del turno."
        ];
        $notizie[] = ["🎩 Hat-trick!", $frasi[rand(0,2)], 'positivo'];
    } elseif ($gol >= 2) {
        $frasi = [
            "{$nome} segna una doppietta e trascina {$team} alla vittoria. Voto {$voto}. La classifica marcatori lo sorride.",
            "Due gol pesantissimi di {$nome}. Voto {$voto}. 'Quando è in giornata non lo ferma nessuno', dice il capitano.",
        ];
        $notizie[] = ["⚽⚽ Doppietta!", $frasi[rand(0,1)], 'positivo'];
    } elseif ($gol >= 1 && $assist >= 1) {
        $notizie[] = ["🎯 Gol e assist", "{$nome} è ovunque: un gol e un assist questa settimana. Voto {$voto}. Prestazione completa.", 'positivo'];
    } elseif ($gol >= 1) {
        $frasi = [
            "Il gol di {$nome} decide la partita. Voto {$voto}. 'Il mio lavoro è fare gol, e oggi l'ho fatto' — le sue parole.",
            "{$nome} segna ancora. Voto {$voto}. La sua media gol è tra le migliori della lega.",
            "Un gol importante per {$nome}. Voto {$voto}. La rete vale oro per la classifica."
        ];
        $notizie[] = ["⚽ Ancora in gol", $frasi[rand(0,2)], 'positivo'];
    } elseif ($assist >= 2) {
        $notizie[] = ["🎪 Il regista invisibile", "{$nome} distribisce gioco: {$assist} assist e voto {$voto}. 'Non si vedono nella tabella marcatori, ma sono fondamentali' — commento tecnico.", 'positivo'];
    } elseif ($voto >= 9.0) {
        $frasi = [
            "Una prestazione semplicemente straordinaria di {$nome}. Voto {$voto}. Sembrava giocare a un livello diverso da tutti.",
            "{$nome} fa una cosa sola: spettacolo. Voto {$voto}. Ogni tocco di palla era un capolavoro.",
            "Voto {$voto} per {$nome}: uno di quei match che si raccontano per anni."
        ];
        $notizie[] = ["⭐ Prestazione da fenomeno", $frasi[rand(0,2)], 'positivo'];
    } elseif ($voto >= 7.5) {
        $frasi = [
            "{$nome} conferma il suo momento di forma con un'altra buona prestazione. Voto {$voto}.",
            "Solidità e qualità: {$nome} firma un'altra performance positiva. Voto {$voto}.",
            "Continua la striscia positiva di {$nome}. Voto {$voto}. Il mister sorride."
        ];
        $notizie[] = ["👍 Buona prestazione", $frasi[rand(0,2)], 'info'];
    } elseif ($voto >= 6.0 && $voto < 7.5) {
        $frasi = [
            "{$nome} fa il suo nella vittoria della squadra. Voto {$voto}. Niente di spettacolare, ma solido.",
            "Una partita sufficiente per {$nome}. Voto {$voto}. Può fare di meglio.",
            "{$nome} contribuisce senza brillare. Voto {$voto}. Il lavoro sporco è importante."
        ];
        $notizie[] = ["📋 Prestazione ordinata", $frasi[rand(0,2)], 'info'];
    } elseif ($voto <= 4.5) {
        $frasi = [
            "Una serata da dimenticare per {$nome}. Voto {$voto}. L'allenatore: 'Bisogna resettare e ripartire'.",
            "{$nome} sembra lontano dalla forma migliore. Voto {$voto}. I tifosi fischiano.",
            "Partita no per {$nome}. Voto {$voto}. 'Può capitare, l'importante è rispondere sul campo' — le sue parole post-partita."
        ];
        $notizie[] = ["📉 Serata difficile", $frasi[rand(0,2)], 'negativo'];
    } else {
        $frasi = [
            "{$nome} non brilla ma la squadra porta a casa il risultato. Voto {$voto}.",
            "Prestazione al di sotto delle aspettative per {$nome}. Voto {$voto}. Da rivedere.",
        ];
        $notizie[] = ["😐 Sotto tono", $frasi[rand(0,1)], 'negativo'];
    }

    // ── 2. NOTIZIA DI LEGA (sempre se rilevante) ─────────────────────
    $legaMsg = $lega_result['msg'] ?? '';
    if (strpos($legaMsg, 'vince') !== false || strpos($legaMsg, 'V') !== false) {
        if ($gol >= 2) {
            $notizie[] = ["🏟️ Decisivo nel 3 punti", "{$nome} è il migliore in campo: i suoi gol regalano la vittoria a {$team}. La classifica migliora.", 'positivo'];
        } elseif ($voto >= 7.0) {
            $notizie[] = ["🏟️ Vittoria firmata", "{$team} vince e {$nome} c'è. Voto {$voto}. La classifica ringrazia.", 'positivo'];
        }
    } elseif (strpos($legaMsg, 'Pareggio') !== false || strpos($legaMsg, 'Pareggio') !== false) {
        if ($voto >= 7.0) {
            $notizie[] = ["🤝 Punto guadagnato", "Pareggio per {$team} ma {$nome} salva la faccia con una prestazione positiva. Voto {$voto}.", 'info'];
        }
    }

    // ── 3. NOTIZIE CONTESTUALI (60% probabilità — 3 volte più frequente) ─
    if (rand(1,100) <= 60) {
        $random_news = [];

        // Basate su overall
        if ($overall >= 110) {
            $random_news[] = ["🌍 Icona mondiale", "{$nome} è nella top-5 mondiale. Sondaggio di France Football: 'Sta dominando il calcio di questo decennio'.", 'positivo'];
            $random_news[] = ["💎 Offerta da favola", "Un club misterioso avrebbe presentato un'offerta monstre per {$nome}. Il club: 'Non è in vendita a nessun prezzo'.", 'mercato'];
        } elseif ($overall >= 95) {
            $random_news[] = ["🌟 Candidato Pallone d'Oro", "La stampa internazionale inizia a fare i nomi per il Pallone d'Oro: {$nome} è tra i favoriti.", 'positivo'];
            $random_news[] = ["📺 Intervista esclusiva", "{$nome} parla in esclusiva: 'Il mio sogno è vincere tutto con questa maglia. E ci stiamo avvicinando'.", 'info'];
        } elseif ($overall >= 80) {
            $random_news[] = ["🗞️ Interesse internazionale", "Media europei iniziano a seguire {$nome}. 'Un giocatore da tenere d'occhio nei prossimi mesi'.", 'info'];
            $random_news[] = ["💼 Scout in tribuna", "Diversi osservatori di top club erano sugli spalti ieri. Il bersaglio? Quasi certamente {$nome}.", 'mercato'];
            $random_news[] = ["📈 Valutazione record", "L'agenzia Transfermarkt ha aggiornato la valutazione di {$nome}: nuovo massimo in carriera.", 'positivo'];
        } elseif ($overall >= 65) {
            $random_news[] = ["🔭 Talento emergente", "Il portale specializzato lo inserisce tra i 'prospect da seguire': {$nome} sta bruciando le tappe.", 'info'];
        }

        // Basate su popolarità
        if ($pop >= 90) {
            $random_news[] = ["📱 Fenomeno social", "{$nome} è il calciatore più discusso online questa settimana: milioni di like e condivisioni per il suo ultimo gol.", 'positivo'];
            $random_news[] = ["👕 Maglia sold out", "La maglia con il numero di {$nome} è esaurita in tutti i negozi. Il merchandising non riesce a stare al passo.", 'positivo'];
        } elseif ($pop >= 70) {
            $random_news[] = ["❤️ Beniamino del pubblico", "I tifosi di {$team} hanno eletto {$nome} come giocatore preferito della stagione. Grande affetto dalla curva.", 'positivo'];
        }

        // Basate su morale
        if ($morale >= 90) {
            $random_news[] = ["😄 Un campione felice", "{$nome} in conferenza: 'Sono nel momento migliore della mia carriera. Voglio continuare così'. Sorrisi e ambizione.", 'positivo'];
        } elseif ($morale <= 35) {
            $random_news[] = ["😤 Tensione nello spogliatoio", "Voci di frizione tra {$nome} e la dirigenza. Il giocatore: 'No comment'. Si naviga a vista.", 'negativo'];
            $random_news[] = ["🌧️ Momento difficile", "{$nome} sta attraversando un periodo complicato. L'entourage: 'Ha bisogno di ritrovare serenità e continuità'.", 'negativo'];
        }

        // Basate su energia
        if ($energia <= 25) {
            $random_news[] = ["🏥 Allarme fisico", "Il medico del club trattiene {$nome} dagli allenamenti extra: 'Deve recuperare, rischiamo un infortunio serio'.", 'negativo'];
        } elseif ($energia >= 90) {
            $random_news[] = ["💪 Una macchina da guerra", "{$nome} non si ferma mai. Il preparatore atletico: 'Non ho mai visto nessuno con questa energia a fine stagione'.", 'positivo'];
        }

        // Basate su stelle squadra
        if ($stelle >= 4) {
            $random_news[] = ["🏆 Stagione cruciale", "La dirigenza ha indicato {$nome} come la chiave per il titolo. 'Se sta bene lui, stiamo bene tutti'.", 'info'];
            $random_news[] = ["💰 Rinnovo in vista", "Il club vuole blindare {$nome}: pronto un rinnovo di contratto con ingaggio nettamente superiore.", 'positivo'];
        } elseif ($stelle <= 2) {
            $random_news[] = ["🚀 Troppo forte per questa lega?", "Gli osservatori sono unanimi: {$nome} ha superato il livello del campionato. Il grande salto è questione di tempo.", 'info'];
        }

        // Notizie stagionali (basate sul mese)
        if ($mese == 1) {
            $random_news[] = ["📅 Nuova stagione, nuovi obiettivi", "{$nome} si presenta al raduno carico: 'Quest'anno voglio portare la squadra più in alto possibile. Ho lavorato duramente'. ", 'info'];
        } elseif ($mese == 6) {
            $random_news[] = ["📊 Bilancio di metà stagione", "A metà campionato {$nome} è tra i migliori della lega. I numeri parlano per lui.", 'info'];
        } elseif ($mese == 12) {
            $random_news[] = ["🎄 Un anno di crescita", "Fine stagione per {$nome}: un anno di progressi, gol e soddisfazioni. 'Sono pronto per fare ancora meglio'.", 'info'];
        }

        // Notizie curiose/umane (sempre disponibili)
        $umane = [
            ["🎙️ Microfono aperto", "{$nome} ai microfoni: 'Il calcio è sacrificio, ma quando sento il boato dello stadio capisco perché lo faccio'. Parole che arrivano al cuore.", 'info'],
            ["🎓 Esempio fuori dal campo", "{$nome} ha visitato una scuola della città. 'I bambini sono il futuro del calcio. Voglio essere un modello positivo per loro'.", 'positivo'],
            ["🍕 La vita del campione", "Reportage sul quotidiano di {$nome}: allenamenti duri, dieta ferrea, e il segreto del suo successo. 'La costanza è tutto'.", 'info'],
            ["🤝 Leader silenzioso", "I compagni di squadra descrivono {$nome} come il 'collante dello spogliatoio': sempre presente, sempre positivo.", 'positivo'],
            ["🔢 Il numero parla", "La statistica della settimana: {$nome} è tra i top-3 della lega per incisività offensiva. I numeri non mentono.", 'info'],
        ];
        $random_news[] = $umane[rand(0, count($umane)-1)];

        // Scegli fino a 2 notizie contestuali
        if (!empty($random_news)) {
            shuffle($random_news);
            $notizie[] = $random_news[0];
            if (count($random_news) > 1 && rand(1,100) <= 40) {
                $notizie[] = $random_news[1];
            }
        }
    }

    // ── 4. NOTIZIA EVENTO SPECIALE (40% probabilità) ─────────────────
    if (rand(1,100) <= 40) {
        $eventi = [
            ["🎲 Colpo di scena in campionato", "Risultati a sorpresa nell'ultimo turno. {$nome} e {$team} devono restare concentrati: la classifica è ancora aperta.", 'info'],
            ["🌦️ Derby in arrivo", "Si avvicina il derby locale. L'ambiente è elettrico e {$nome} è il giocatore più atteso dai tifosi.", 'info'],
            ["🔄 Mercato di riparazione", "Si apre la sessione invernale. Il nome di {$nome} circola nei corridoi dei top club europei.", 'mercato'],
            ["🏋️ Allenamento intensivo", "Il mister ha intensificato i carichi di lavoro. {$nome} è tra i più diligenti: 'Voglio arrivare al top della forma'.", 'info'],
            ["🌍 Nazionale", "Il ct della Nazionale ha osservato {$nome} di persona. Una convocazione potrebbe essere vicina.", 'positivo'],
            ["📰 Copertina", "{$nome} finisce in copertina sul principale quotidiano sportivo. Foto in grande e titolo: 'Il futuro del calcio'.", 'positivo'],
            ["🎁 Sponsor nuovo", "Un importante brand sportivo ha proposto a {$nome} un accordo di sponsorizzazione. L'entourage sta valutando.", 'info'],
            ["💬 Conferenza stampa", "In conferenza {$nome} risponde alle domande sul suo futuro: 'Sto benissimo qui, voglio vincere con questa squadra'.", 'info'],
            ["🩺 Check medico", "Controllo di routine per {$nome}: tutto ok secondo lo staff medico. 'È in perfetta forma fisica'.", 'info'],
            ["🔥 Rivalità accesa", "Cresce la rivalità con un altro top player della lega. I media adorano questo duello. Chi sarà il migliore a fine anno?", 'info'],
        ];
        $notizie[] = $eventi[rand(0, count($eventi)-1)];
    }

    // Inserisci tutte le notizie
    foreach ($notizie as $n) {
        generaNotizia($db, $player_id, $anno, $mese, $n[0], $n[1], $n[2]);
    }
}

// ============================================================
function simulateMatch($p) {
    $team_stars = intval($p['team_stelle'] ?? 1);
    $form  = ($p['morale'] + $p['energia']) / 2;
    $power = ($p['overall']*0.5) + ($form*0.3) + ($team_stars*10*0.2);
    $gol=0; $assist=0;
    for ($i=0;$i<4;$i++) if (rand(1,100)<$power*0.4) $gol++;
    for ($i=0;$i<3;$i++) if (rand(1,100)<$power*0.3) $assist++;
    $voto = round(5.0+$gol*0.5+$assist*0.3+rand(-10,10)*0.05,1);
    $voto = max(4.0,min(10.0,$voto));
    $stipendio = $p['overall']*$p['moltiplicatore_stipendio']*100+$gol*500+$assist*300;
    $pop_gain  = $gol*2+($voto>7?3:0);
    $morale    = ($voto>=7)?rand(5,15):rand(-10,-2);
    $descs = ["{$gol} gol e {$assist} assist! Voto: {$voto}","Prestazione ".($voto>=7?"stellare":"opaca")." – {$gol} gol. Voto {$voto}"];
    return ['gol'=>$gol,'assist'=>$assist,'voto'=>$voto,'stipendio'=>round($stipendio),'pop_gain'=>$pop_gain,'morale'=>$morale,'desc'=>$descs[rand(0,1)]];
}

function getBonusStruttura($livello) {
    if (!$livello) return ['bonus_allenamento'=>0,'bonus_crescita'=>0,'riduzione_infortuni'=>0];
    $db = getDB();
    $stmt = $db->prepare("SELECT * FROM strutture WHERE livello=?");
    $stmt->execute([$livello]);
    return $stmt->fetch() ?: ['bonus_allenamento'=>0,'bonus_crescita'=>0,'riduzione_infortuni'=>0];
}

function calcPalloneDoro($db, $player_id, $p, $overall, $gol_carriera, $assist_carriera) {
    $anno = $p['anno_corrente'];
    $stmt = $db->prepare("SELECT SUM(gol) as gol,SUM(assist) as assist,AVG(voto) as voto FROM log_mensile WHERE player_id=? AND anno=?");
    $stmt->execute([$player_id,$anno]);
    $stats = $stmt->fetch();
    $lega_bonus = (intval($p['lega_livello']??2)==1)?20:0;
    $score = ($stats['gol']??0)*3+($stats['assist']??0)*2+($stats['voto']??6)*5+$overall*0.5+$p['popolarita']*0.3+$lega_bonus;
    $pallone_pos=0;$msg='';$won=0;
    if ($score>=220)     {$pallone_pos=1;          $msg="🏆 HAI VINTO IL PALLONE D'ORO!!!";$won=1;}
    elseif ($score>=175) {$pallone_pos=rand(2,3);  $msg="🥈 Finalista al Pallone d'Oro (#{$pallone_pos})!";}
    elseif ($score>=130) {$pallone_pos=rand(4,10); $msg="⭐ Top 10 al Pallone d'Oro!";}
    elseif ($score>=90)  {$pallone_pos=rand(11,30);$msg="Top 30 al Pallone d'Oro.";}
    else                 {$msg="Non nominato al Pallone d'Oro quest'anno.";}
    $db->prepare("INSERT INTO stagioni (player_id,anno,gol,assist,partite,media_voto,pallone_doro_pos,team_nome,lega_nome) VALUES(?,?,?,?,?,?,?,?,?)")
       ->execute([$player_id,$anno,$stats['gol']??0,$stats['assist']??0,12,round($stats['voto']??6,2),$pallone_pos,$p['team_nome_full']??'',$p['lega_nome']??'']);
    if ($won) $db->prepare("UPDATE players SET palloni_doro=palloni_doro+1 WHERE id=?")->execute([$player_id]);
    return ['pos'=>$pallone_pos,'msg'=>$msg,'score'=>round($score)];
}

function calcEpilogo($db, $player_id) {
    $stmt = $db->prepare("SELECT * FROM players WHERE id=?");
    $stmt->execute([$player_id]);
    $p = $stmt->fetch();
    $score = $p['palloni_doro']*20+$p['trofei']*5+$p['gol_carriera']*0.1+$p['popolarita'];
    if ($score>=80) return "Sei una LEGGENDA MONDIALE! 🌟";
    if ($score>=50) return "Grande carriera! Un Grande Bomber! ⚽";
    if ($score>=25) return "Icona nazionale, rispettato in patria. 🏴";
    return "Talento incompiuto... ma la strada è stata bella. 💫";
}

function buyStruttura($player_id, $data) {
    $db = getDB();
    $p  = getPlayerData($player_id);
    $livello = intval($data['livello']??1);
    $stmt = $db->prepare("SELECT * FROM strutture WHERE livello=?"); $stmt->execute([$livello]);
    $struttura = $stmt->fetch();
    if (!$struttura)                         {echo json_encode(['error'=>'Struttura non trovata']);return;}
    if ($p['struttura_livello']>=$livello)   {echo json_encode(['error'=>'Hai già questo livello']);return;}
    if ($p['struttura_livello']<$livello-1)  {echo json_encode(['error'=>'Acquista prima il livello precedente']);return;}
    if ($p['soldi']<$struttura['costo'])     {echo json_encode(['error'=>'Soldi insufficienti']);return;}
    $db->prepare("UPDATE players SET struttura_livello=?,soldi=soldi-? WHERE id=?")->execute([$livello,$struttura['costo'],$player_id]);
    echo json_encode(['success'=>true,'msg'=>"Costruito: ".$struttura['nome']."!"]);
}

function changeTeam($player_id, $data) {
    $db = getDB();
    $p  = getPlayerData($player_id);
    $team_id = intval($data['team_id']??1);
    $stmt = $db->prepare("SELECT t.*,l.livello as lega_livello FROM teams t JOIN leghe l ON t.lega_id=l.id WHERE t.id=?");
    $stmt->execute([$team_id]);
    $team = $stmt->fetch();
    if (!$team) {echo json_encode(['error'=>'Squadra non trovata']);return;}

    // Scala adattata al nuovo cap 125: 1*=55 2*=75 3*=90 4*=105 5*=120
    $stelle_map = [1=>55, 2=>75, 3=>90, 4=>105, 5=>120];
    $min_overall = $stelle_map[$team['stelle']] ?? 55;

    // Applica sconto OVR agente
    $agent = getAgentBonus($db, $player_id);
    $sconto = $agent['bonus_ovr_sconto'] ?? 0;
    $min_overall_scontato = max(55, intval($min_overall * (1 - $sconto/100)));

    if ($p['overall'] < $min_overall_scontato && $team['stelle'] > 1) {
        $msg_sconto = $sconto > 0 ? " (ridotto da {$min_overall} grazie all'agente -".$sconto."%)" : "";
        echo json_encode(['error'=>"Overall insufficiente. Serve almeno {$min_overall_scontato}{$msg_sconto}"]);
        return;
    }
    $db->prepare("UPDATE players SET team_id=? WHERE id=?")->execute([$team_id,$player_id]);
    echo json_encode(['success'=>true,'msg'=>"Trasferito a ".$team['nome']."!"]);
}

// ============================================================
// SKILL TREE BOOST FUNCTIONS
// ============================================================

/**
 * Applica il boost di una skill alle stat del giocatore nel DB.
 * Logica: ogni skill ha un boost TOTALE per livello (boostPerLv = [2,4,7]).
 * Il DB tiene traccia del boost già applicato per skill (skill_boosts.amount = boost totale attuale).
 * La differenza (nuovo_totale - vecchio_totale) viene applicata alla stat.
 * Così si può chiamare N volte senza duplicare i boost.
 *
 * data: { skill_id, stat, total_boost, level }
 */
function applySkillBoost($player_id, $data) {
    $db        = getDB();
    $skill_id  = trim($data['skill_id'] ?? '');
    $stat      = trim($data['stat']     ?? '');
    $new_total = intval($data['total_boost'] ?? 0); // boost TOTALE al livello corrente
    $level     = intval($data['level']  ?? 1);

    $allowed = ['tiro','velocita','dribbling','fisico','mentalita'];
    if (!in_array($stat, $allowed)) {
        echo json_encode(['error' => "Stat non valida: $stat"]); return;
    }
    if (empty($skill_id)) {
        echo json_encode(['error' => 'skill_id mancante']); return;
    }
    if ($new_total < 0 || $new_total > 50) {
        echo json_encode(['error' => "Boost fuori range: $new_total"]); return;
    }

    // Crea tabella se non esiste
    $db->exec("CREATE TABLE IF NOT EXISTS skill_boosts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_id INTEGER NOT NULL,
        skill_id TEXT NOT NULL,
        stat TEXT NOT NULL,
        amount INTEGER NOT NULL DEFAULT 0,
        level INTEGER NOT NULL DEFAULT 0,
        applied_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(player_id, skill_id),
        FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
    )");

    // Leggi boost precedente già applicato per questa skill
    $stmt = $db->prepare("SELECT amount FROM skill_boosts WHERE player_id=? AND skill_id=?");
    $stmt->execute([$player_id, $skill_id]);
    $existing = $stmt->fetch();
    $old_total = $existing ? intval($existing['amount']) : 0;

    $delta = $new_total - $old_total; // quanto aggiungere (può essere 0 se già applicato)

    // Leggi stat corrente del giocatore
    $stmt2 = $db->prepare("SELECT tiro, velocita, dribbling, fisico, mentalita FROM players WHERE id=?");
    $stmt2->execute([$player_id]);
    $p = $stmt2->fetch();
    if (!$p) { echo json_encode(['error' => 'Giocatore non trovato']); return; }

    $currentStat = intval($p[$stat]);
    $newStat     = min(125, max(1, $currentStat + $delta));

    // Ricalcola overall
    $statMap = ['tiro'=>$p['tiro'],'velocita'=>$p['velocita'],'dribbling'=>$p['dribbling'],'fisico'=>$p['fisico'],'mentalita'=>$p['mentalita']];
    $statMap[$stat] = $newStat;
    $newOverall = intval(array_sum($statMap) / 5);

    // Aggiorna giocatore solo se c'è un delta reale
    if ($delta !== 0) {
        $db->prepare("UPDATE players SET {$stat}=?, overall=? WHERE id=?")
           ->execute([$newStat, $newOverall, $player_id]);
    }

    // Salva/aggiorna il boost applicato per questa skill
    $db->prepare("INSERT OR REPLACE INTO skill_boosts (player_id, skill_id, stat, amount, level) VALUES (?,?,?,?,?)")
       ->execute([$player_id, $skill_id, $stat, $new_total, $level]);

    echo json_encode([
        'success'     => true,
        'delta'       => $delta,
        'new_val'     => $newStat,
        'new_overall' => $newOverall,
        'stat'        => $stat,
    ]);
}

/**
 * Restituisce tutti i boost skill applicati per questo giocatore.
 * Usato dal frontend per sincronizzare lo stato.
 */
function getSkillBoosts($player_id) {
    $db = getDB();
    $db->exec("CREATE TABLE IF NOT EXISTS skill_boosts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_id INTEGER NOT NULL,
        skill_id TEXT NOT NULL,
        stat TEXT NOT NULL,
        amount INTEGER NOT NULL DEFAULT 0,
        level INTEGER NOT NULL DEFAULT 0,
        applied_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(player_id, skill_id),
        FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
    )");
    $stmt = $db->prepare("SELECT skill_id, stat, amount, level FROM skill_boosts WHERE player_id=?");
    $stmt->execute([$player_id]);
    $rows = $stmt->fetchAll();
    $boosts = [];
    foreach ($rows as $r) {
        $boosts[$r['skill_id']] = [
            'stat'   => $r['stat'],
            'amount' => intval($r['amount']), // boost totale applicato
            'level'  => intval($r['level']),
        ];
    }
    echo json_encode(['success'=>true, 'boosts'=>$boosts]);
}
