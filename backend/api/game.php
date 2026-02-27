<?php
require_once '../config/db.php';

$player_id = getAuthPlayerId();
if (!$player_id) { echo json_encode(['error' => 'Non autenticato']); exit; }

$raw  = file_get_contents('php://input');
$data = json_decode($raw, true) ?: [];
$action = $data['action'] ?? $_GET['action'] ?? '';

switch ($action) {
    case 'play_month':    playMonth($player_id, $data);    break;
    case 'buy_struttura': buyStruttura($player_id, $data); break;
    case 'change_team':   changeTeam($player_id, $data);   break;
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
        'tiro'       => min(99,max(1,$p['tiro']      +$sc['tiro'])),
        'velocita'   => min(99,max(1,$p['velocita']  +$sc['velocita'])),
        'dribbling'  => min(99,max(1,$p['dribbling'] +$sc['dribbling'])),
        'fisico'     => min(99,max(1,$p['fisico']    +$sc['fisico'])),
        'mentalita'  => min(99,max(1,$p['mentalita'] +$sc['mentalita'])),
        'popolarita' => min(100,max(0,$p['popolarita']+$sc['popolarita'])),
        'energia'    => min(100,max(0,$p['energia']  +$sc['energia'])),
        'morale'     => min(100,max(0,$p['morale']   +$sc['morale'])),
    ];
    if ($p['age'] >= 32) {
        $decay = ($p['age']-31)*0.3;
        $ns['velocita'] = max(1,$ns['velocita']-$decay);
        $ns['fisico']   = max(1,$ns['fisico']  -$decay);
    }

    $new_overall = intval(($ns['tiro']+$ns['velocita']+$ns['dribbling']+$ns['fisico']+$ns['mentalita'])/5);
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
// SIMULAZIONE GIORNATA DI LEGA
// ============================================================
function simulaGiornataLega($db, $p, $match) {
    $team_id  = $p['team_id'];
    $lega_id  = $p['lega_id'];
    $anno     = $p['anno_corrente'];
    $team_ovr = intval($p['team_ovr'] ?? 65);

    // Prendi tutte le squadre della lega (avversari)
    $stmt = $db->prepare("SELECT id, nome, ovr FROM teams WHERE lega_id=? AND id!=?");
    $stmt->execute([$lega_id, $team_id]);
    $avversari = $stmt->fetchAll();

    // Assicura che il record classifica esista
    $db->prepare("INSERT OR IGNORE INTO classifica (team_id,lega_id,anno) VALUES(?,?,?)")
       ->execute([$team_id,$lega_id,$anno]);

    // Partita della tua squadra: usa il voto del giocatore per influenzare
    $voto_giocatore = floatval($match['voto']);
    $boost = ($voto_giocatore >= 8) ? 5 : (($voto_giocatore <= 5) ? -5 : 0);

    // Scegli un avversario casuale
    if (empty($avversari)) return ['msg'=>null,'bonus_soldi'=>0,'trofeo'=>0];
    $avv = $avversari[array_rand($avversari)];
    $avv_ovr = intval($avv['ovr'] ?? 65);

    // Calcola probabilità vittoria (basata su OVR)
    $diff    = ($team_ovr + $boost) - $avv_ovr;
    $prob_vit = min(80, max(20, 50 + $diff * 1.5));
    $rand     = rand(1,100);

    if ($rand <= $prob_vit) {
        $esito = 'V'; $punti = 3;
        $gf = rand(1,4); $gs = rand(0,2);
        $msg = "🏟️ La tua squadra vince {$gf}-{$gs} contro {$avv['nome']}! (+3 punti)";
    } elseif ($rand <= $prob_vit + 15) {
        $esito = 'P'; $punti = 1;
        $gf = rand(0,2); $gs = $gf;
        $msg = "🤝 Pareggio {$gf}-{$gs} contro {$avv['nome']}. (+1 punto)";
    } else {
        $esito = 'S'; $punti = 0;
        $gf = rand(0,2); $gs = rand(1,4);
        $msg = "💔 Sconfitta {$gf}-{$gs} contro {$avv['nome']}.";
    }

    // Aggiorna classifica tua squadra
    $v = ($esito=='V') ? 1 : 0;
    $par = ($esito=='P') ? 1 : 0;
    $s = ($esito=='S') ? 1 : 0;
    $db->prepare("UPDATE classifica SET punti=punti+?,vittorie=vittorie+?,pareggi=pareggi+?,sconfitte=sconfitte+?,gol_fatti=gol_fatti+?,gol_subiti=gol_subiti+?,partite_giocate=partite_giocate+1 WHERE team_id=? AND anno=?")
       ->execute([$punti,$v,$par,$s,$gf,$gs,$team_id,$anno]);

    // Simula anche le partite delle altre squadre tra di loro
    simulaAltrePartite($db, $lega_id, $anno, $team_id, $avversari);

    return ['msg'=>$msg,'bonus_soldi'=>0,'trofeo'=>0];
}

function simulaAltrePartite($db, $lega_id, $anno, $skip_id, $avversari) {
    // Shuffle e abbina le squadre rimanenti
    $altri = array_filter($avversari, fn($a) => $a['id'] != $skip_id);
    $altri = array_values($altri);
    shuffle($altri);

    for ($i = 0; $i + 1 < count($altri); $i += 2) {
        $t1 = $altri[$i]; $t2 = $altri[$i+1];
        $diff = intval($t1['ovr']) - intval($t2['ovr']);
        $prob = min(80, max(20, 50 + $diff * 1.5));
        $r    = rand(1,100);

        if ($r <= $prob)            { $p1=3;$p2=0; $v1=1;$v2=0;$pa1=0;$pa2=0;$s1=0;$s2=1; $gf1=rand(1,4);$gs1=rand(0,2); }
        elseif ($r <= $prob + 15)   { $p1=1;$p2=1; $v1=0;$v2=0;$pa1=1;$pa2=1;$s1=0;$s2=0; $gf1=rand(0,2);$gs1=$gf1; }
        else                        { $p1=0;$p2=3; $v1=0;$v2=1;$pa1=0;$pa2=0;$s1=1;$s2=0; $gf1=rand(0,2);$gs1=rand(1,4); }

        foreach ([[$t1['id'],$p1,$v1,$pa1,$s1,$gf1,$gs1],[$t2['id'],$p2,$v2,$pa2,$s2,$gs1,$gf1]] as [$tid,$pts,$v,$pa,$s,$gf,$gs]) {
            $db->prepare("INSERT OR IGNORE INTO classifica (team_id,lega_id,anno) VALUES(?,?,?)")->execute([$tid,$lega_id,$anno]);
            $db->prepare("UPDATE classifica SET punti=punti+?,vittorie=vittorie+?,pareggi=pareggi+?,sconfitte=sconfitte+?,gol_fatti=gol_fatti+?,gol_subiti=gol_subiti+?,partite_giocate=partite_giocate+1 WHERE team_id=? AND anno=?")
               ->execute([$pts,$v,$pa,$s,$gf,$gs,$tid,$anno]);
        }
    }
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

    if ($lega_livello == 2 && $perf_score >= 85) {
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
    if ($lega_livello == 1 && $perf_score < 55 && $overall < 72) {
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
    $anno = $p['anno_corrente'];
    $mese = $p['mese_corrente'];
    $gol  = $match['gol'];
    $voto = $match['voto'];
    $rand = rand(1,100);

    $notizie = [];

    // Notizie basate su prestazione
    if ($gol >= 3) {
        $notizie[] = ["🔥 Hat-trick devastante!", "Con {$gol} gol in una sola partita, {$p['player_name']} si conferma il giocatore più in forma della lega. I top club iniziano a osservare.", 'positivo'];
    } elseif ($voto >= 9.0) {
        $notizie[] = ["⭐ Prestazione stellare", "{$p['player_name']} incanta con un voto di {$voto}. Il tecnico lo elogia in conferenza: 'È il nostro trascinatore'.", 'positivo'];
    } elseif ($voto <= 4.5) {
        $notizie[] = ["📉 Serata no per {$p['player_name']}", "Una prestazione deludente con voto {$voto} fa discutere. L'allenatore: 'Dobbiamo rivedere certe cose'.", 'negativo'];
    }

    // Notizie casuali (20% di probabilità)
    if ($rand <= 20) {
        $overall = $p['overall'];
        $pop     = $p['popolarita'];
        $random_news = [];

        if ($overall >= 80 && $pop >= 60) {
            $random_news[] = ["🗞️ Interesse dalla stampa internazionale", "Diversi media europei iniziano a parlare di {$p['player_name']} come uno dei talenti più seguiti del momento.", 'info'];
            $random_news[] = ["💼 Voci di mercato", "Secondo fonti vicine al club, alcuni agenti stanno sondando il terreno per {$p['player_name']}. Nessuna offerta ufficiale ancora.", 'mercato'];
        }
        if ($p['team_stelle'] >= 4) {
            $random_news[] = ["🏆 Pressione da campionato", "Con la squadra in lotta per il titolo, la stampa punta i riflettori su {$p['player_name']}: 'La differenza la farà lui'.", 'info'];
        }
        if ($p['morale'] >= 85) {
            $random_news[] = ["😄 Spogliatoio blindato", "{$p['player_name']} parla della sua felicità in squadra: 'Questo ambiente mi dà energia ogni giorno'. Il morale vola.", 'positivo'];
        }
        if ($p['energia'] <= 30) {
            $random_news[] = ["😓 Segnali di stanchezza", "Il fisioterapista del club lancia l'allarme: {$p['player_name']} sembra sotto stress fisico. Necessario un periodo di recupero.", 'negativo'];
        }
        if (!empty($random_news)) {
            $news = $random_news[array_rand($random_news)];
            $notizie[] = $news;
        }
    }

    // Notizia lega (vittoria importante)
    if ($lega_result && strpos($lega_result['msg'] ?? '', 'vince') !== false) {
        if ($gol >= 2) {
            $notizie[] = ["⚽ Decisivo nella vittoria", "{$p['player_name']} trascina la squadra alla vittoria con i suoi gol. La classifica sorride.", 'positivo'];
        }
    }

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
    if ($score>=200)     {$pallone_pos=1;          $msg="🏆 HAI VINTO IL PALLONE D'ORO!!!";$won=1;}
    elseif ($score>=160) {$pallone_pos=rand(2,3);  $msg="🥈 Finalista al Pallone d'Oro (#{$pallone_pos})!";}
    elseif ($score>=120) {$pallone_pos=rand(4,10); $msg="⭐ Top 10 al Pallone d'Oro!";}
    elseif ($score>=80)  {$pallone_pos=rand(11,30);$msg="Top 30 al Pallone d'Oro.";}
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

    $min_overall = ($team['stelle']-1)*15+55;

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
