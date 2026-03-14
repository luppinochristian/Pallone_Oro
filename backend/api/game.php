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

    // --- INFORTUNI REALI: blocca azioni fisiche se infortunato o energia = 0 ---
    $infortuni_mesi  = intval($p['infortuni_mesi'] ?? 0);
    $energia_attuale = intval($p['energia'] ?? 0);
    $azioni_fisiche  = ['allenamento_tiro','allenamento_velocita','dribbling',
                        'allenamento_fisico','allenamento_speciale'];
    if ($infortuni_mesi > 0 || $energia_attuale === 0) {
        foreach ($azioni as $az) {
            if (in_array($az, $azioni_fisiche)) {
                if ($infortuni_mesi > 0) {
                    echo json_encode(['error' => "Sei infortunato ({$infortuni_mesi} mes" . ($infortuni_mesi === 1 ? 'e' : 'i') . " rimanenti). Puoi solo riposare, allenarti mentalmente o fare attività social."]);
                } else {
                    echo json_encode(['error' => "Energia a zero! Riposati prima di allenarti fisicamente."]);
                }
                return;
            }
        }
    }

    $risultati     = [];
    $sc            = ['tiro'=>0,'velocita'=>0,'dribbling'=>0,'fisico'=>0,'mentalita'=>0,'popolarita'=>0,'energia'=>0,'morale'=>0];
    $evento_speciale = '';
    $bonus         = getBonusStruttura($p['struttura_livello']);

    // Rischio infortuni da bassa energia: base 0%, sale fino a 40% a energia=1
    // Fisico alto riduce il rischio: ogni 10 punti di fisico sopra 60 = -3%
    // Struttura riduce ulteriormente tramite riduzione_infortuni
    $fisico_val       = intval($p['fisico'] ?? 60);
    $riduzione_fisico = max(0, ($fisico_val - 60) / 10 * 3); // 0-19.5% in base al fisico
    $pct_rischio_energia = function($en) use ($riduzione_fisico, $bonus) {
        if ($en >= 30) return 0; // nessun rischio sopra 30
        // Da 29 a 1: rischio cresce linearmente da 5% a 40%
        $base = 5 + (29 - $en) * (35 / 28);
        return max(0, $base - $riduzione_fisico - ($bonus['riduzione_infortuni'] ?? 0));
    };

    // --- ALLENAMENTI ---
    foreach ($azioni as $azione) {
        // Controlla rischio infortuni da energia bassa (prima del switch)
        if (in_array($azione, $azioni_fisiche) && $azione !== 'allenamento_speciale') {
            $en_corrente = intval($p['energia'] ?? 0) + $sc['energia']; // tiene conto energia già spesa
            $rischio_en  = $pct_rischio_energia($en_corrente);
            if ($rischio_en > 0 && rand(1, 100) <= $rischio_en) {
                $durata = 1;
                $infortuni_mesi = $durata;
                $sc['energia'] -= rand(20, 35);
                $risultati[] = "🚨 INFORTUNIO per stanchezza! Energia troppo bassa ({$en_corrente}%). Fuori 1 mese!";
                continue; // salta l'allenamento, già infortunato
            }
        }
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
            case 'allenamento_mentalita':
                $g = rand(1,3) + $bonus['bonus_crescita'];
                $sc['mentalita'] += $g; $sc['energia'] -= rand(8,15);
                $sc['morale'] += rand(3,7); // allenare la testa migliora anche l'umore
                $risultati[] = "🧠 Mentalità migliorata +{$g}"; break;
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
                    $durata_infortunio = rand(1,2);
                    $infortuni_mesi = $durata_infortunio; // verrà salvato sotto
                    $risultati[] = "🚨 INFORTUNIO! Sarai fuori per {$durata_infortunio} mes" . ($durata_infortunio === 1 ? 'e' : 'i') . "!";
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

    // --- SIMULAZIONE GIORNATA DI LEGA (con partite del giocatore) ---
    $player_skills = getPlayerSkills($db, $player_id);
    $lega_result = simulaGiornataLega($db, $p, $player_skills);
    $lega_msgs = $lega_result['msgs'] ?? [];

    // Usa il match "principale" (primo match del giocatore) per stipendio/morale/popolarità
    $match = $lega_result['match_principale'] ?? simulateMatch($p, $player_skills);
    $risultati[]    = "⚽ ".$match['desc'];
    $sc['popolarita'] += $match['pop_gain'];
    $sc['morale']     += $match['morale'];
    // lega_msgs inviati separatamente nel JSON

    // --- NOTIZIE DINAMICHE ---
    generaNotizieDinamiche($db, $player_id, $p, $match, $lega_result, $player_skills);

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
    if ($p['struttura_livello'] >= 7) {
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

    // Wraparound dicembre → gennaio
    if ($new_mese > 12) $new_mese = 1;

    // --- FINE STAGIONE: giugno (6) → settembre (9) nuova stagione ---
    // La stagione va da settembre a giugno. Dopo giugno si avanza anno e si salta a settembre.
    if ($p['mese_corrente'] == 6) {
        $new_mese = 9; // inizio nuova stagione
        $new_anno++; $new_age++;

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

        // Reset uso trasferimento per nuova stagione
        $db->prepare("UPDATE players SET trasferimento_anno=0 WHERE id=?")->execute([$player_id]);
        // Genera subito il calendario della nuova stagione per la lega del giocatore
        generaCalendario($db, $p['lega_id'], $new_anno);
    }

    // Gestione infortuni: decrementa se era già infortunato, mantieni se appena avvenuto
    $prev_infortuni = intval($p['infortuni_mesi'] ?? 0);
    if ($prev_infortuni > 0 && $infortuni_mesi === $prev_infortuni) {
        // Nessun nuovo infortunio → decrementa
        $new_infortuni = max(0, $prev_infortuni - 1);
        if ($new_infortuni === 0) $risultati[] = "✅ Recupero completato! Sei di nuovo in piena forma.";
    } elseif ($infortuni_mesi > 0 && $prev_infortuni === 0) {
        // Nuovo infortunio appena avvenuto → mantieni i mesi
        $new_infortuni = $infortuni_mesi;
    } else {
        $new_infortuni = 0;
    }

    // Salva una riga per ogni partita giocata nel mese
    $stmt_log = $db->prepare("INSERT INTO log_mensile (player_id,anno,mese,azione,risultato,gol,assist,voto,evento_speciale,avv) VALUES(?,?,?,?,?,?,?,?,?,?)");
    foreach ($lega_msgs as $lm) {
        $stmt_log->execute([
            $player_id,
            $p['anno_corrente'],
            $p['mese_corrente'],
            implode(',', $azioni),
            '', // risultato allenamenti solo nel riepilogo
            intval($lm['player_gol']   ?? 0),
            intval($lm['player_assist'] ?? 0),
            floatval($lm['player_voto'] ?? 6.0),
            '', // evento speciale solo nel riepilogo
            strval($lm['avv'] ?? ''),
        ]);
    }
    // Riga riepilogo mensile (allenamenti + eventi, gol=0 così non altera le best query)
    if (empty($lega_msgs)) {
        // Nessuna partita (es. mese di pausa): salva comunque un record con i dati del match simulato
        $stmt_log->execute([$player_id,$p['anno_corrente'],$p['mese_corrente'],implode(',',$azioni),implode("\n",$risultati),$match['gol'],$match['assist'],$match['voto'],$evento_speciale,'']);
    } else {
        // Salva riepilogo allenamenti/eventi separato (non conta nelle best-match query grazie ad avv='__riepilogo')
        $stmt_log->execute([$player_id,$p['anno_corrente'],$p['mese_corrente'],implode(',',$azioni),implode("\n",$risultati),0,0,0.0,$evento_speciale,'__riepilogo']);
    }

    // Aggiorna giocatore
    $db->prepare("UPDATE players SET tiro=?,velocita=?,dribbling=?,fisico=?,mentalita=?,popolarita=?,energia=?,morale=?,overall=?,soldi=?,gol_carriera=?,assist_carriera=?,trofei=?,mese_corrente=?,anno_corrente=?,age=?,infortuni_mesi=? WHERE id=?")
       ->execute([$ns['tiro'],$ns['velocita'],$ns['dribbling'],$ns['fisico'],$ns['mentalita'],$ns['popolarita'],$ns['energia'],$ns['morale'],$new_overall,$new_soldi,$new_gol,$new_assist,$new_trofei,$new_mese,$new_anno,$new_age,$new_infortuni,$player_id]);

    $fine_carriera = false;
    if ($new_age >= 38) {
        $fine_carriera = true;
        $risultati[] = "🏁 FINE CARRIERA! ".calcEpilogo($db,$player_id);
    }

    echo json_encode([
        'success'       => true,
        'risultati'     => $risultati,
        'match'         => $match,
        'lega_msgs'     => $lega_msgs,
        'pallone_doro'  => $pallone_result,
        'promozione'    => $promozione_msg,
        'fine_carriera' => $fine_carriera,
        'nuovo_anno'    => ($new_anno !== $p['anno_corrente']),
        'infortuni_mesi'=> $new_infortuni,
    ]);
}

// ============================================================
// CALENDARIO: genera andata+ritorno per una lega (34 giornate per 18 squadre)
// Distribuisce le giornate nei 10 mesi di stagione (set→giu)
// ============================================================
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
    $turno_size = $matches_per_round; // partite per giornata
    foreach ($tutti as $idx => $match) {
        $turno_idx = (int)floor($idx / $turno_size);
        $turni[$turno_idx][] = $match;
    }
    $totTurni = count($turni); // es. 34 turni per 18 squadre

    // Distribuzione equa: $perMese turni per mese, ultimi mesi prendono il resto
    $perMese = (int)floor($totTurni / $numMesi);
    $resto   = $totTurni % $numMesi;

    $ins = $db->prepare("INSERT OR IGNORE INTO calendario (lega_id,anno,giornata,mese,home_id,away_id) VALUES(?,?,?,?,?,?)");
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

// ============================================================
// SIMULA LE PARTITE DEL MESE per la lega del giocatore
// Returns la partita del giocatore e aggiorna la classifica
// ============================================================
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
        // Calendario malformato: elimina e rigenera
        $db->prepare("DELETE FROM calendario WHERE lega_id=? AND anno=?")->execute([$lega_id, $anno]);
        generaCalendario($db, $lega_id, $anno);
    }

    // Assicura record classifica per tutta la lega
    $stmt = $db->prepare("SELECT id, nome, ovr FROM teams WHERE lega_id=?");
    $stmt->execute([$lega_id]);
    $tutteLega = $stmt->fetchAll();
    foreach ($tutteLega as $t) {
        $db->prepare("INSERT OR IGNORE INTO classifica (team_id,lega_id,anno) VALUES(?,?,?)")
           ->execute([$t['id'], $lega_id, $anno]);
    }

    // Partite del mese corrente per questa lega
    $stmt = $db->prepare("SELECT * FROM calendario WHERE lega_id=? AND anno=? AND mese=? AND giocata=0 ORDER BY giornata");
    $stmt->execute([$lega_id, $anno, $mese]);
    $partiteMese = $stmt->fetchAll();

    $msgs = [];

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
            if ($t1 && $t2) simulaPartita($db, $t1[0], $t2[0], $lega_id, $anno);
        }

        $db->prepare("UPDATE calendario SET giocata=1 WHERE id=?")->execute([$partita['id']]);
    }

    simulaTutteLeLeghe($db, $lega_id, $anno, $mese);

    return ['msgs'=>$msgs,'match_principale'=>$match_principale,'bonus_soldi'=>0,'trofeo'=>0];
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
            $db->prepare("INSERT OR IGNORE INTO classifica (team_id,lega_id,anno) VALUES(?,?,?)")
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
// ============================================================
function simulaChampions($db, $p) {
    $anno    = $p['anno_corrente'];
    $mese    = $p['mese_corrente'];
    $team_id = $p['team_id'];

    // Settembre: qualifica + sorteggio + prima giornata
    if ($mese == 9) {
        qualificaChampions($db, $anno);
        $stmt = $db->prepare("SELECT * FROM champions_cup WHERE team_id=? AND anno=?");
        $stmt->execute([$team_id, $anno]);
        $record = $stmt->fetch();
        if (!$record) return null;
        return simulaGiornataGruppo($db, $p, $record, $anno, $mese);
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
        return simulaGiornataGruppo($db, $p, $record, $anno, $mese);
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

    return null;
}

// Simula Champions per NPC quando il giocatore non partecipa
function _simulaChampionsNPCOnly($db, $anno, $mese, $skip_team_id) {
    if (in_array($mese, [9, 10, 11, 12])) {
        $gruppi = $db->prepare("SELECT DISTINCT gruppo FROM champions_cup WHERE anno=? AND gruppo IS NOT NULL");
        $gruppi->execute([$anno]);
        foreach ($gruppi->fetchAll() as $gr) {
            _simulaGiornataGruppoNPC($db, $anno, $gr['gruppo'], $mese, $skip_team_id);
        }
    } elseif ($mese == 1) {
        _simulaPlayoffNPC($db, $anno, $skip_team_id);
    } elseif ($mese == 2) {
        _simulaFaseNPC($db, $anno, 'ottavi', 'quarti', $skip_team_id);
    } elseif ($mese == 3) {
        _simulaFaseNPC($db, $anno, 'quarti', 'semifinale', $skip_team_id);
    } elseif ($mese == 4) {
        _simulaFaseNPC($db, $anno, 'semifinale', 'finale', $skip_team_id);
    }
}

function _simulaGiornataGruppoNPC($db, $anno, $gruppo, $mese, $skip_team_id) {
    $stmt = $db->prepare("SELECT cc.team_id, t.ovr FROM champions_cup cc JOIN teams t ON cc.team_id=t.id WHERE cc.anno=? AND cc.gruppo=? AND cc.team_id!=? ORDER BY cc.team_id");
    $stmt->execute([$anno, $gruppo, $skip_team_id]);
    $squadre = $stmt->fetchAll();
    if (count($squadre) < 2) return;

    // Distribuisce 4 mesi × 2 partite NPC su coppie distinte
    $tutte_coppie = [[0,1],[2,3],[0,2],[1,3]];
    $idx_mese = [9=>0, 10=>1, 11=>2, 12=>3];
    $base = ($idx_mese[$mese] ?? 0) * 2;
    $coppie = array_slice($tutte_coppie, $base % 4, 2);

    foreach ($coppie as [$ia, $ib]) {
        if (!isset($squadre[$ia]) || !isset($squadre[$ib])) continue;
        [$gf, $gs, $p1] = _simulaMatchGruppo(intval($squadre[$ia]['ovr']), intval($squadre[$ib]['ovr']));
        $p2 = ($p1 === 3 ? 0 : ($p1 === 1 ? 1 : 3));
        $v1=$p1===3?1:0; $pa1=$p1===1?1:0; $s1=$p1===0?1:0;
        $v2=$p2===3?1:0; $pa2=$p2===1?1:0; $s2=$p2===0?1:0;
        $db->prepare("UPDATE champions_cup SET punti_gruppo=punti_gruppo+?,vittorie_gruppo=vittorie_gruppo+?,pareggi_gruppo=pareggi_gruppo+?,sconfitte_gruppo=sconfitte_gruppo+?,gol_fatti_gruppo=gol_fatti_gruppo+?,gol_subiti_gruppo=gol_subiti_gruppo+?,partite_gruppo=partite_gruppo+1 WHERE team_id=? AND anno=?")
           ->execute([$p1,$v1,$pa1,$s1,$gf,$gs,$squadre[$ia]['team_id'],$anno]);
        $db->prepare("UPDATE champions_cup SET punti_gruppo=punti_gruppo+?,vittorie_gruppo=vittorie_gruppo+?,pareggi_gruppo=pareggi_gruppo+?,sconfitte_gruppo=sconfitte_gruppo+?,gol_fatti_gruppo=gol_fatti_gruppo+?,gol_subiti_gruppo=gol_subiti_gruppo+?,partite_gruppo=partite_gruppo+1 WHERE team_id=? AND anno=?")
           ->execute([$p2,$v2,$pa2,$s2,$gs,$gf,$squadre[$ib]['team_id'],$anno]);
    }
    if ($mese == 12) {
        _chiudiGironeSoloNPC($db, $anno, $gruppo, $skip_team_id);
    }
}

function _chiudiGironeSoloNPC($db, $anno, $gruppo, $skip_team_id) {
    $stmt = $db->prepare("SELECT cc.team_id FROM champions_cup cc WHERE cc.anno=? AND cc.gruppo=? AND cc.team_id!=? ORDER BY cc.punti_gruppo DESC, (cc.gol_fatti_gruppo-cc.gol_subiti_gruppo) DESC");
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
        $stmt = $db->prepare("SELECT c.team_id, t.ovr FROM classifica c JOIN teams t ON c.team_id=t.id WHERE c.lega_id=? AND c.anno=? ORDER BY c.punti DESC, (c.gol_fatti-c.gol_subiti) DESC LIMIT 4");
        $stmt->execute([$lega['id'], $anno]);
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
        $db->prepare("INSERT OR IGNORE INTO champions_cup (anno,team_id,fase,gruppo) VALUES(?,?,'gironi',?)")
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

    // 4 mesi × 2 partite diverse: mesi [9,10,11,12] → offset [0,2,4,6]
    $offset_map = [9=>0, 10=>2, 11=>4, 12=>6];
    $offset = $offset_map[$mese] ?? 0;
    $partite_da_giocare = min(2, count($avversari));

    $gol_fatti = 0; $gol_subiti = 0; $punti = 0; $partite_giocate = 0;
    $vittorie = 0; $pareggi = 0; $sconfitte = 0;
    $msgs_partite = [];
    $avversari_ids_giocati = [];

    for ($i = 0; $i < $partite_da_giocare; $i++) {
        $avv = $avversari[($offset + $i) % count($avversari)];
        $avv_ovr = intval($avv['ovr']);
        [$gf, $gs, $pt] = _simulaMatchGruppo($team_ovr, $avv_ovr);
        $gol_fatti += $gf; $gol_subiti += $gs; $punti += $pt; $partite_giocate++;
        if ($pt === 3) $vittorie++; elseif ($pt === 1) $pareggi++; else $sconfitte++;
        $pt_avv = ($pt === 3 ? 0 : ($pt === 1 ? 1 : 3));
        $v_avv=$pt_avv===3?1:0; $pa_avv=$pt_avv===1?1:0; $s_avv=$pt_avv===0?1:0;
        $db->prepare("UPDATE champions_cup SET punti_gruppo=punti_gruppo+?,vittorie_gruppo=vittorie_gruppo+?,pareggi_gruppo=pareggi_gruppo+?,sconfitte_gruppo=sconfitte_gruppo+?,gol_fatti_gruppo=gol_fatti_gruppo+?,gol_subiti_gruppo=gol_subiti_gruppo+?,partite_gruppo=partite_gruppo+1 WHERE team_id=? AND anno=?")
           ->execute([$pt_avv,$v_avv,$pa_avv,$s_avv,$gs,$gf,$avv['team_id'],$anno]);
        $msgs_partite[] = "Gruppo {$gruppo}: {$gf}-{$gs}";
        $avversari_ids_giocati[] = $avv['team_id'];
    }

    $db->prepare("UPDATE champions_cup SET punti_gruppo=punti_gruppo+?,vittorie_gruppo=vittorie_gruppo+?,pareggi_gruppo=pareggi_gruppo+?,sconfitte_gruppo=sconfitte_gruppo+?,gol_fatti_gruppo=gol_fatti_gruppo+?,gol_subiti_gruppo=gol_subiti_gruppo+?,partite_gruppo=partite_gruppo+? WHERE team_id=? AND anno=?")
       ->execute([$punti,$vittorie,$pareggi,$sconfitte,$gol_fatti,$gol_subiti,$partite_giocate,$team_id,$anno]);

    // NPC round-robin: coppie che non includono avversari già giocati dal giocatore
    $tutte_coppie_npc = [[0,1],[2,3],[0,2],[1,3],[0,3],[1,2]];
    $base_npc = ($offset_map[$mese] ?? 0);
    $coppie_candidate = array_slice($tutte_coppie_npc, $base_npc % count($tutte_coppie_npc), 2);
    $npc = array_values(array_filter($tutte_squadre, fn($t) => $t['team_id'] != $team_id));
    foreach ($coppie_candidate as [$ia, $ib]) {
        if (!isset($npc[$ia]) || !isset($npc[$ib])) continue;
        if (in_array($npc[$ia]['team_id'], $avversari_ids_giocati) ||
            in_array($npc[$ib]['team_id'], $avversari_ids_giocati)) continue;
        [$gf1,$gs1,$p1] = _simulaMatchGruppo(intval($npc[$ia]['ovr']), intval($npc[$ib]['ovr']));
        $p2=($p1===3?0:($p1===1?1:3));
        $v1=$p1===3?1:0;$pa1=$p1===1?1:0;$s1=$p1===0?1:0;
        $v2=$p2===3?1:0;$pa2=$p2===1?1:0;$s2=$p2===0?1:0;
        $db->prepare("UPDATE champions_cup SET punti_gruppo=punti_gruppo+?,vittorie_gruppo=vittorie_gruppo+?,pareggi_gruppo=pareggi_gruppo+?,sconfitte_gruppo=sconfitte_gruppo+?,gol_fatti_gruppo=gol_fatti_gruppo+?,gol_subiti_gruppo=gol_subiti_gruppo+?,partite_gruppo=partite_gruppo+1 WHERE team_id=? AND anno=?")
           ->execute([$p1,$v1,$pa1,$s1,$gf1,$gs1,$npc[$ia]['team_id'],$anno]);
        $db->prepare("UPDATE champions_cup SET punti_gruppo=punti_gruppo+?,vittorie_gruppo=vittorie_gruppo+?,pareggi_gruppo=pareggi_gruppo+?,sconfitte_gruppo=sconfitte_gruppo+?,gol_fatti_gruppo=gol_fatti_gruppo+?,gol_subiti_gruppo=gol_subiti_gruppo+?,partite_gruppo=partite_gruppo+1 WHERE team_id=? AND anno=?")
           ->execute([$p2,$v2,$pa2,$s2,$gs1,$gf1,$npc[$ib]['team_id'],$anno]);
    }

    if ($mese == 12) {
        return chiudiGirone($db, $p, $record, $anno, $gruppo);
    }

    $esito = $punti >= 4 ? "🏆" : ($punti >= 2 ? "🤝" : "💔");
    return "{$esito} Champions Gr.{$gruppo}: " . implode(', ', $msgs_partite) . " ({$punti}pt)";
}

// Simula una partita di gruppo: restituisce [gol_fatti, gol_subiti, punti_squadra1]
function _simulaMatchGruppo($ovr1, $ovr2) {
    $diff = $ovr1 - $ovr2;
    $prob = min(75, max(25, 50 + $diff * 1.2));
    $r    = rand(1, 100);
    if ($r <= $prob) {
        $gf = rand(1, 4); $gs = rand(0, max(0, $gf - 1)); $pt = 3;
    } elseif ($r <= $prob + 15) {
        $gf = rand(0, 2); $gs = $gf; $pt = 1;
    } else {
        $gs = rand(1, 4); $gf = rand(0, max(0, $gs - 1)); $pt = 0;
    }
    return [$gf, $gs, $pt];
}

function chiudiGirone($db, $p, $record, $anno, $gruppo) {
    $team_id = $p['team_id'];
    $stmt = $db->prepare("SELECT cc.team_id, cc.punti_gruppo, cc.gol_fatti_gruppo, cc.gol_subiti_gruppo FROM champions_cup cc WHERE cc.anno=? AND cc.gruppo=? ORDER BY cc.punti_gruppo DESC, (cc.gol_fatti_gruppo-cc.gol_subiti_gruppo) DESC");
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
    $prob     = min(75, max(30, $prob_base + ($team_ovr - 70) * 0.5));
    $avanza   = rand(1, 100) <= $prob;

    // Playoff: le 2e sfidano le 3e cross-gruppo
    if ($fase_corrente === 'playoff' || $fase_corrente === 'playoff_3') {
        _simulaPlayoffNPC($db, $p['anno_corrente'], $p['team_id']);
    } else {
        _simulaFaseNPC($db, $p['anno_corrente'], $fase_corrente, $fase_successiva, $p['team_id']);
    }

    if ($avanza) {
        $db->prepare("UPDATE champions_cup SET fase=? WHERE team_id=? AND anno=?")
           ->execute([$fase_successiva, $p['team_id'], $p['anno_corrente']]);
        $labels = ['playoff'=>'Playoff','ottavi'=>'Ottavi','quarti'=>'Quarti','semifinale'=>'Semifinale','finale'=>'Finale'];
        return "🏆 Champions Cup — {$label_fase}: avanza agli/ai " . ($labels[$fase_successiva] ?? $fase_successiva) . "!";
    } else {
        $db->prepare("UPDATE champions_cup SET eliminato=1 WHERE team_id=? AND anno=?")
           ->execute([$p['team_id'], $p['anno_corrente']]);
        return "💔 Champions Cup — Eliminato in {$label_fase}.";
    }
}

// Simula playoff tra 2e e 3e classificate (cross-gruppo: A2 vs B3, B2 vs C3, C2 vs D3, D2 vs A3)
function _simulaPlayoffNPC($db, $anno, $skip_team_id) {
    $seconde = $db->prepare("SELECT cc.team_id, cc.gruppo, t.ovr FROM champions_cup cc JOIN teams t ON cc.team_id=t.id WHERE cc.anno=? AND cc.fase='playoff' AND cc.eliminato=0 AND cc.team_id!=? ORDER BY cc.gruppo");
    $seconde->execute([$anno, $skip_team_id]);
    $s = $seconde->fetchAll();

    $terze = $db->prepare("SELECT cc.team_id, cc.gruppo, t.ovr FROM champions_cup cc JOIN teams t ON cc.team_id=t.id WHERE cc.anno=? AND cc.fase='playoff_3' AND cc.eliminato=0 ORDER BY cc.gruppo");
    $terze->execute([$anno]);
    $t_arr = $terze->fetchAll();

    // Cross-gruppo: ordina e accoppia 2a[i] vs 3a[(i+1)%n]
    $n = min(count($s), count($t_arr));
    for ($i = 0; $i < $n; $i++) {
        $squadra2 = $s[$i];
        $squadra3 = $t_arr[($i + 1) % $n];
        $ovr2 = intval($squadra2['ovr']); $ovr3 = intval($squadra3['ovr']);
        $prob = min(75, max(25, 55 + ($ovr2 - $ovr3) * 0.5)); // 2a ha leggero vantaggio
        if (rand(1, 100) <= $prob) {
            $db->prepare("UPDATE champions_cup SET fase='ottavi' WHERE team_id=? AND anno=?")->execute([$squadra2['team_id'],$anno]);
            $db->prepare("UPDATE champions_cup SET eliminato=1 WHERE team_id=? AND anno=?")->execute([$squadra3['team_id'],$anno]);
        } else {
            $db->prepare("UPDATE champions_cup SET fase='ottavi' WHERE team_id=? AND anno=?")->execute([$squadra3['team_id'],$anno]);
            $db->prepare("UPDATE champions_cup SET eliminato=1 WHERE team_id=? AND anno=?")->execute([$squadra2['team_id'],$anno]);
        }
    }
    // Elimina tutte le playoff_3 rimaste senza match
    $db->prepare("UPDATE champions_cup SET eliminato=1 WHERE anno=? AND fase='playoff_3' AND eliminato=0")->execute([$anno]);
}

function _simulaFaseNPC($db, $anno, $fase_corrente, $fase_successiva, $skip_team_id) {
    $stmt = $db->prepare("SELECT cc.team_id, t.ovr FROM champions_cup cc JOIN teams t ON cc.team_id=t.id WHERE cc.anno=? AND cc.fase=? AND cc.eliminato=0 AND cc.team_id!=?");
    $stmt->execute([$anno, $fase_corrente, $skip_team_id]);
    $npc = $stmt->fetchAll();
    foreach ($npc as $t) {
        $prob = min(75, max(25, 50 + (intval($t['ovr']) - 70) * 0.5));
        if (rand(1, 100) <= $prob) {
            $db->prepare("UPDATE champions_cup SET fase=? WHERE team_id=? AND anno=?")->execute([$fase_successiva, $t['team_id'], $anno]);
        } else {
            $db->prepare("UPDATE champions_cup SET eliminato=1 WHERE team_id=? AND anno=?")->execute([$t['team_id'], $anno]);
        }
    }
}

function concludiChampions($db, $p, $player_id) {
    $anno = $p['anno_corrente']; $team_id = $p['team_id'];
    $msgs = []; $soldi = 0; $trofei = 0;

    _simulaFaseNPC($db, $anno, 'finale', 'vincitore', $team_id);

    $stmt = $db->prepare("SELECT * FROM champions_cup WHERE team_id=? AND anno=?");
    $stmt->execute([$team_id, $anno]);
    $record = $stmt->fetch();
    if (!$record || $record['eliminato']) return ['messaggi'=>$msgs,'soldi'=>$soldi,'trofei'=>$trofei];
    if ($record['fase'] == 'finale') {
        $prob = min(70, max(30, 50 + (intval($p['team_ovr'] ?? 65) - 70) * 0.5));
        if (rand(1,100) <= $prob) {
            $db->prepare("UPDATE champions_cup SET fase='vincitore' WHERE team_id=? AND anno=?")->execute([$team_id,$anno]);
            $db->prepare("UPDATE players SET trofei=trofei+1 WHERE id=?")->execute([$player_id]);
            $msgs[] = "🏆🌟 LA TUA SQUADRA HA VINTO LA CHAMPIONS CUP!!! +€500,000!";
            $soldi += 500000; $trofei += 1;
        } else {
            $db->prepare("UPDATE champions_cup SET eliminato=1 WHERE team_id=? AND anno=?")->execute([$team_id,$anno]);
            $msgs[] = "💔 Sconfitta in finale di Champions Cup.";
            $msgs[] = "💰 Bonus finalista Champions: +€100,000";
            $soldi += 100000;
        }
    }
    return ['messaggi'=>$msgs,'soldi'=>$soldi,'trofei'=>$trofei];
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
        5=>['bonus_stipendio'=>0.75,'bonus_offerte'=>7,'bonus_ovr_sconto'=>15.0],
    ];
    return $agenti[$ag['livello']] ?? ['bonus_stipendio'=>0,'bonus_offerte'=>0,'bonus_ovr_sconto'=>0];
}

function generaNotizia($db, $player_id, $anno, $mese, $titolo, $testo, $tipo='info') {
    $db->prepare("INSERT INTO notizie (player_id,anno,mese,titolo,testo,tipo) VALUES(?,?,?,?,?,?)")
       ->execute([$player_id, $anno, $mese, $titolo, $testo, $tipo]);
}

function generaNotizieDinamiche($db, $player_id, $p, $match, $lega_result, $player_skills = []) {
    $anno    = $p['anno_corrente'];
    $mese    = $p['mese_corrente'];
    $nome    = $p['player_name'];
    $overall = intval($p['overall']);
    $pop     = intval($p['popolarita']);
    $morale  = intval($p['morale']);
    $energia = intval($p['energia']);
    $stelle  = intval($p['team_stelle'] ?? 1);
    $team    = $p['team_nome_full'] ?? $p['team_nome'] ?? 'la squadra';
    $notizie = [];

    // Dati aggregati su tutte le partite del mese
    $partite = $lega_result['msgs'] ?? [];
    $n_partite = count($partite);
    $tot_gol   = array_sum(array_column($partite, 'player_gol'));
    $tot_assist = array_sum(array_column($partite, 'player_assist'));
    $voti      = array_column($partite, 'player_voto');
    $voto_medio = $n_partite > 0 ? round(array_sum($voti) / $n_partite, 1) : floatval($match['voto']);
    $vittorie  = count(array_filter($partite, fn($m) => $m['esito'] === 'V'));
    $pareggi   = count(array_filter($partite, fn($m) => $m['esito'] === 'P'));
    $sconfitte = count(array_filter($partite, fn($m) => $m['esito'] === 'S'));

    // Partita migliore (per gol)
    $best_match = null;
    foreach ($partite as $pm) {
        if ($best_match === null || intval($pm['player_gol']) > intval($best_match['player_gol'])) {
            $best_match = $pm;
        }
    }
    // Usa comunque il match principale per gol_type e dati individuali
    $gol    = $match['gol'];
    $assist = $match['assist'];
    $voto   = $match['voto'];
    $gol_type = $match['gol_type'] ?? null;

    // ── 1. NOTIZIE SULLE PARTITE (una per ogni partita del mese) ─────────
    foreach ($partite as $pm) {
        $avv    = $pm['avv'];
        $gf     = intval($pm['gf']);
        $gs     = intval($pm['gs']);
        $pgol   = intval($pm['player_gol']);
        $passist = intval($pm['player_assist']);
        $pvoto  = floatval($pm['player_voto']);
        $esito  = $pm['esito'];
        $giornata = $pm['giornata'];
        $casa   = $pm['isHome'] ? 'in casa' : 'in trasferta';

        if ($esito === 'V') {
            if ($pgol >= 3) {
                $titoli = ["🎩 Hat-trick decisivo!", "🔥 Tripletta devastante!", "🎩 Tre gol, tre punti!"];
                $testi = [
                    "{$nome} firma una tripletta {$casa} contro {$avv} ({$gf}-{$gs}). Voto {$pvoto}. Standing ovation del pubblico — il mister lo abbraccia a fine gara.",
                    "Hat-trick di {$nome} contro {$avv} alla G{$giornata}: {$gf}-{$gs}. Voto {$pvoto}. 'Non mi fermo mai finché c'è da segnare' — le sue parole nello spogliatoio.",
                    "Tripletta strepitosa: {$nome} trascina {$team} {$casa} contro {$avv} ({$gf}-{$gs}). Voto {$pvoto}. I social esplodono. I top club guardano.",
                ];
                $notizie[] = [$titoli[rand(0,2)], $testi[rand(0,2)], 'positivo'];
            } elseif ($pgol >= 2) {
                $titoli = ["⚽⚽ Doppietta!", "⚽ Ancora in doppia cifra", "⚽⚽ Due reti preziose"];
                $testi = [
                    "{$nome} firma una doppietta {$casa} contro {$avv}: {$gf}-{$gs}. Voto {$pvoto}. Quando è in giornata non c'è difesa che tenga.",
                    "Due gol di {$nome} regalano i tre punti a {$team} contro {$avv} ({$gf}-{$gs}). Voto {$pvoto}. 'Era una partita difficile, sono soddisfatto'.",
                    "Doppietta {$casa} contro {$avv} ({$gf}-{$gs}): {$nome} scala la classifica marcatori. Voto {$pvoto}. Il mister: 'È il nostro uomo chiave'.",
                ];
                $notizie[] = [$titoli[rand(0,2)], $testi[rand(0,2)], 'positivo'];
            } elseif ($pgol >= 1 && $passist >= 1) {
                $titoli = ["🎯 Gol e assist: prestazione totale", "⭐ Decisivo su tutti i fronti", "🎯 Il tuttofare del {$team}"];
                $testi = [
                    "{$nome} firma gol e assist nel {$gf}-{$gs} {$casa} contro {$avv}. Voto {$pvoto}. Coinvolto in quasi ogni azione pericolosa. Dominante.",
                    "Vittoria {$casa} contro {$avv} ({$gf}-{$gs}): {$nome} con un gol e un assist è l'MVP assoluto. Voto {$pvoto}. 'Quando è in questo stato non si ferma'.",
                    "Gol, assist e vittoria: {$nome} regala una gioia piena ai tifosi contro {$avv} ({$gf}-{$gs}). Voto {$pvoto}. Prestazione da manuale.",
                ];
                $notizie[] = [$titoli[rand(0,2)], $testi[rand(0,2)], 'positivo'];
            } elseif ($pgol >= 1) {
                $titoli = ["⚽ Il gol della vittoria", "⚽ Segna ancora {$nome}!", "⚽ Rete decisiva"];
                $testi = [
                    "Il gol di {$nome} vale tre punti {$casa} contro {$avv} ({$gf}-{$gs}). Voto {$pvoto}. 'Ci tenevamo molto a questa vittoria' — nello spogliatoio.",
                    "{$nome} trova la rete contro {$avv} ({$gf}-{$gs}). Voto {$pvoto}. La sua rete sblocca la partita e {$team} non si ferma più.",
                    "Ancora a segno: {$nome} non sbaglia davanti alla porta e regala la vittoria contro {$avv} ({$gf}-{$gs}). Voto {$pvoto}.",
                ];
                if ($gol_type && isset($gol_type['desc'])) {
                    $testi[] = "Che prodezza di {$nome} contro {$avv} ({$gf}-{$gs}): segna {$gol_type['desc']}. Voto {$pvoto}. Il pubblico in piedi.";
                }
                $notizie[] = [$titoli[rand(0,2)], $testi[rand(0, count($testi)-1)], 'positivo'];
            } elseif ($passist >= 1) {
                $titoli = ["🎯 Assist d'oro", "🎯 Il regista della vittoria", "🎯 Decisivo senza segnare"];
                $testi = [
                    "{$nome} non segna ma il suo assist vale oro: {$team} batte {$avv} {$gf}-{$gs}. Voto {$pvoto}. 'Chi fa assist è bravo quanto chi segna'.",
                    "È l'assist di {$nome} a spaccare la partita contro {$avv} ({$gf}-{$gs}). Voto {$pvoto}. Visione di gioco sopra la media.",
                    "Servizio perfetto di {$nome} per il {$gf}-{$gs} {$casa} contro {$avv}. Voto {$pvoto}. Il mister lo loda davanti a tutta la squadra.",
                ];
                $notizie[] = [$titoli[rand(0,2)], $testi[rand(0,2)], 'positivo'];
            } elseif ($pvoto >= 7.5) {
                $titoli = ["👍 Vittoria e buona prestazione", "🏟️ Tre punti e voto alto", "✅ Solido nella vittoria"];
                $testi = [
                    "{$team} vince {$casa} contro {$avv} ({$gf}-{$gs}): {$nome} fa la sua parte con una prestazione ordinata. Voto {$pvoto}. 'Bene così'.",
                    "Vittoria meritata contro {$avv} ({$gf}-{$gs}): {$nome} contribuisce senza brillare nei numeri, ma il voto {$pvoto} racconta una storia diversa.",
                    "Tre punti {$casa} contro {$avv} ({$gf}-{$gs}). {$nome} è nella lista dei migliori in campo. Voto {$pvoto}. Il mister sorride.",
                ];
                $notizie[] = [$titoli[rand(0,2)], $testi[rand(0,2)], 'positivo'];
            } else {
                $titoli = ["🏟️ Vittoria di squadra", "✅ Tre punti conquistati", "🏟️ {$team} vince, {$nome} c'è"];
                $testi = [
                    "{$team} porta a casa i tre punti contro {$avv} ({$gf}-{$gs}). Per {$nome} una partita di sacrificio. Voto {$pvoto}. Il gruppo è l'importante.",
                    "Vittoria {$casa} contro {$avv} ({$gf}-{$gs}) ma {$nome} non incide come vorrebbe. Voto {$pvoto}. Deve fare di più per restare titolare.",
                    "Tre punti {$casa} contro {$avv} ({$gf}-{$gs}). {$nome} ancora a secco, voto {$pvoto}. 'Non mi accontento mai dei risultati di squadra senza contribuire'.",
                ];
                $notizie[] = [$titoli[rand(0,2)], $testi[rand(0,2)], 'info'];
            }
        } elseif ($esito === 'P') {
            if ($pgol >= 1) {
                $titoli = ["🤝 Pareggio, ma {$nome} segna", "⚽ Gol non basta: si divide", "🤝 Un punto con la firma di {$nome}"];
                $testi = [
                    "{$nome} segna contro {$avv} ma {$team} non riesce a vincere: finisce {$gf}-{$gs}. Voto {$pvoto}. 'Mi aspettavo di più da noi come squadra'.",
                    "La rete di {$nome} non basta: {$team} e {$avv} si dividono il punto ({$gf}-{$gs}). Voto {$pvoto}. Almeno lui ci ha messo la firma.",
                    "Pareggio {$casa} contro {$avv} ({$gf}-{$gs}): {$nome} segna ma il risultato lascia l'amaro in bocca. Voto {$pvoto}.",
                ];
                $notizie[] = [$titoli[rand(0,2)], $testi[rand(0,2)], 'info'];
            } elseif ($pvoto >= 7.0) {
                $titoli = ["🤝 Un punto che ha il sapore di qualcosa in più", "🤝 Pareggio a testa alta", "🤝 Punto guadagnato"];
                $testi = [
                    "Si ferma sul pareggio {$casa} contro {$avv} ({$gf}-{$gs}), ma {$nome} non è in discussione: voto {$pvoto}. Ha fatto tutto il possibile.",
                    "{$team} pareggia contro {$avv} ({$gf}-{$gs}): tra i migliori in campo c'è {$nome}, voto {$pvoto}. 'Questo punto ci servirà, vedremo'.",
                    "Pareggio {$casa} contro {$avv} ({$gf}-{$gs}). {$nome} con voto {$pvoto} è il migliore dei suoi. Ci ha provato fino all'ultimo.",
                ];
                $notizie[] = [$titoli[rand(0,2)], $testi[rand(0,2)], 'info'];
            } else {
                $titoli = ["🤝 Pareggio amaro", "😐 Un punto ma che delusione", "🤝 Meritavamo di più"];
                $testi = [
                    "Pareggio indigesto {$casa} contro {$avv} ({$gf}-{$gs}). {$nome} sparisce dai radar: voto {$pvoto}. Deve ritrovarsi.",
                    "{$team} non va oltre il pari contro {$avv} ({$gf}-{$gs}): {$nome} sotto tono, voto {$pvoto}. 'Dobbiamo fare meglio, sono il primo a saperlo'.",
                    "Un punto {$casa} contro {$avv} ({$gf}-{$gs}) ma {$nome} non convince: voto {$pvoto}. Il mister a fine partita parla chiaro nello spogliatoio.",
                ];
                $notizie[] = [$titoli[rand(0,2)], $testi[rand(0,2)], 'negativo'];
            }
        } else { // Sconfitta
            $scarto = $gs - $gf;
            if ($pgol >= 1) {
                $titoli = ["😔 Gol ma sconfitta", "💔 Non basta il gol di {$nome}", "⚽ Segna, ma la squadra cade"];
                $testi = [
                    "{$nome} segna ma non è abbastanza: {$team} perde {$casa} contro {$avv} {$gf}-{$gs}. Voto {$pvoto}. 'Dobbiamo lavorare molto di più'.",
                    "La rete di {$nome} è un gol della bandiera: {$team} esce sconfitto contro {$avv} ({$gf}-{$gs}). Voto {$pvoto}. Serata difficile.",
                    "Sconfitta {$casa} contro {$avv} ({$gf}-{$gs}): almeno {$nome} risponde presente con un gol. Voto {$pvoto}. Non è abbastanza, ma la voglia c'è.",
                ];
                $notizie[] = [$titoli[rand(0,2)], $testi[rand(0,2)], 'negativo'];
            } elseif ($scarto >= 3) {
                $titoli = ["💔 Batosta pesante", "💔 Serata da dimenticare", "📉 Crollo inaspettato"];
                $testi = [
                    "Notte buia {$casa}: {$avv} travolge {$team} {$gs}-{$gf}. {$nome} sparisce dal campo, voto {$pvoto}. Il mister: 'Dobbiamo ritrovarci'.",
                    "Sconfitta pesante contro {$avv} ({$gf}-{$gs}). {$nome} irriconoscibile: voto {$pvoto}. Una prestazione da cancellare dalla memoria.",
                    "{$team} crolla {$casa} contro {$avv} ({$gf}-{$gs}). {$nome} è uno dei peggiori in campo: voto {$pvoto}. Urge una reazione immediata.",
                ];
                $notizie[] = [$titoli[rand(0,2)], $testi[rand(0,2)], 'negativo'];
            } elseif ($pvoto >= 6.5) {
                $titoli = ["💔 Sconfitta di misura", "😤 Persi ma a testa alta", "💔 L'impegno c'era, il risultato no"];
                $testi = [
                    "{$team} perde di misura contro {$avv} ({$gf}-{$gs}), ma {$nome} non è in colpa: voto {$pvoto}. Ha lottato fino al fischio finale.",
                    "Sconfitta {$casa} contro {$avv} ({$gf}-{$gs}): {$nome} con voto {$pvoto} è tra i migliori ma non basta. La squadra deve crescere.",
                    "Il {$gf}-{$gs} {$casa} contro {$avv} brucia. {$nome} ci ha messo tutto: voto {$pvoto}. 'La prestazione c'era, mancava il gol'.",
                ];
                $notizie[] = [$titoli[rand(0,2)], $testi[rand(0,2)], 'negativo'];
            } else {
                $titoli = ["💔 Sconfitta e prestazione opaca", "📉 Momento difficile", "💔 Serata no su tutti i fronti"];
                $testi = [
                    "Doppia delusione {$casa}: {$team} perde contro {$avv} ({$gf}-{$gs}) e {$nome} è tra i più deludenti. Voto {$pvoto}. Urge svolta.",
                    "Sconfitta {$casa} contro {$avv} ({$gf}-{$gs}): {$nome} sotto le aspettative, voto {$pvoto}. Il mister chiede di più in conferenza.",
                    "Una serata da dimenticare in ogni senso: {$team} ko contro {$avv} ({$gf}-{$gs}), {$nome} assente: voto {$pvoto}. Tifosi delusi.",
                ];
                $notizie[] = [$titoli[rand(0,2)], $testi[rand(0,2)], 'negativo'];
            }
        }
    }

    // ── 2. NOTIZIA RIEPILOGATIVA DEL MESE (se più di una partita) ───────
    if ($n_partite > 1) {
        $record = "{$vittorie}V {$pareggi}P {$sconfitte}S";
        if ($vittorie === $n_partite) {
            $notizie[] = ["🔥 Mese perfetto!", "{$nome} e {$team} vincono tutte le {$n_partite} partite del mese ({$record}). Totale: {$tot_gol} gol e {$tot_assist} assist. Voto medio {$voto_medio}. Un mese straordinario.", 'positivo'];
        } elseif ($vittorie >= 2 && $sconfitte === 0) {
            $notizie[] = ["📈 Mese senza sconfitte", "Nessuna sconfitta per {$team} in questo mese ({$record}). {$nome} firma {$tot_gol} gol e {$tot_assist} assist. Voto medio {$voto_medio}. Il campionato prende una piega interessante.", 'positivo'];
        } elseif ($sconfitte === $n_partite) {
            $notizie[] = ["📉 Mese difficile", "{$team} non riesce a vincere nessuna delle {$n_partite} partite ({$record}). {$nome} totalizza {$tot_gol} gol e {$tot_assist} assist, voto medio {$voto_medio}. Serve una reazione.", 'negativo'];
        } elseif ($tot_gol >= 4) {
            $notizie[] = ["⚽ Un mese prolifico", "{$tot_gol} gol e {$tot_assist} assist in {$n_partite} partite: {$nome} è in grande forma offensiva. Record del mese: {$record}. Voto medio {$voto_medio}.", 'positivo'];
        } else {
            $notizie[] = ["📊 Bilancio mensile", "{$nome} chiude il mese con {$tot_gol} gol e {$tot_assist} assist in {$n_partite} partite ({$record}). Voto medio {$voto_medio}. C'è ancora margine di crescita.", 'info'];
        }
    }

    // ── 3. NOTIZIE CONTESTUALI (sempre generate, 2-3 extra) ─────────────
    {
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
        if ($mese == 9) {
            $random_news[] = ["📅 Nuova stagione, nuovi obiettivi", "{$nome} si presenta al raduno carico: 'Quest'anno voglio portare la squadra più in alto possibile. Ho lavorato duramente'.", 'info'];
        } elseif ($mese == 1) {
            $random_news[] = ["📊 Bilancio di metà stagione", "A metà campionato {$nome} è tra i migliori della lega. I numeri parlano per lui.", 'info'];
        } elseif ($mese == 6) {
            $random_news[] = ["🏁 Fine stagione", "Si chiude la stagione per {$nome}: mesi di progressi, gol e soddisfazioni. 'Sono pronto per fare ancora meglio'.", 'info'];
        }

        // Notizie curiose/umane (sempre disponibili)
        $umane = [
            ["🎙️ Microfono aperto", "{$nome} ai microfoni: 'Il calcio è sacrificio, ma quando sento il boato dello stadio capisco perché lo faccio'.", 'info'],
            ["🎓 Esempio fuori dal campo", "{$nome} ha visitato una scuola della città. 'I bambini sono il futuro del calcio. Voglio essere un modello positivo per loro'.", 'positivo'],
            ["🍕 La vita del campione", "Reportage sul quotidiano di {$nome}: allenamenti duri, dieta ferrea, e il segreto del suo successo. 'La costanza è tutto'.", 'info'],
            ["🤝 Leader silenzioso", "I compagni di squadra descrivono {$nome} come il 'collante dello spogliatoio': sempre presente, sempre positivo.", 'positivo'],
            ["🔢 Il numero parla", "La statistica della settimana: {$nome} è tra i top-3 della lega per incisività offensiva. I numeri non mentono.", 'info'],
            ["🗺️ Sogni di gloria", "Intervista esclusiva: '{$nome} ha ancora tanta fame. Non è qui per accontentarsi', dice il suo procuratore.", 'info'],
            ["🏋️ Lavoro extra", "Lo staff tecnico conferma: {$nome} resta in campo dopo ogni allenamento a perfezionare il tiro. 'Un professionista esemplare'.", 'positivo'],
        ];
        $random_news[] = $umane[rand(0, count($umane)-1)];

        // Scegli sempre 2 notizie contestuali
        if (!empty($random_news)) {
            shuffle($random_news);
            $notizie[] = $random_news[0];
            if (count($random_news) > 1) {
                $notizie[] = $random_news[1];
            }
        }
    }

    // ── 4. NOTIZIA EVENTO SPECIALE (70% probabilità) ─────────────────
    if (rand(1,100) <= 70) {
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
            ["📣 La stampa parla di te", "Tre testate sportive diverse citano {$nome} nell'analisi del turno. 'Un giocatore che non si può ignorare', scrive il più autorevole.", 'positivo'],
            ["🧠 Il mister in conferenza", "Domanda sulla classifica, risposta che riguarda {$nome}: 'Se lui è in condizione, possiamo battere chiunque'. Il mister non ha dubbi.", 'positivo'],
            ["🎰 Quote in discesa", "Le agenzie di scommesse hanno abbassato le quote scudetto del {$team} dopo le ultime prestazioni. {$nome} è indicato come il fattore X.", 'info'],
        ];
        $notizie[] = $eventi[rand(0, count($eventi)-1)];
    }

    // Inserisci tutte le notizie
    foreach ($notizie as $n) {
        generaNotizia($db, $player_id, $anno, $mese, $n[0], $n[1], $n[2]);
    }
}

// ============================================================
function getPlayerSkills($db, $player_id) {
    try {
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
        $stmt = $db->prepare("SELECT skill_id, level FROM skill_boosts WHERE player_id=? AND level > 0");
        $stmt->execute([$player_id]);
        $skills = [];
        foreach ($stmt->fetchAll() as $row) {
            $skills[$row['skill_id']] = intval($row['level']);
        }
        return $skills;
    } catch (Exception $e) {
        return [];
    }
}

function getGolType($p, $skills) {
    // Build pool of possible gol types based on unlocked skills
    // Each entry: [type_key, weight, description_template]
    $pool = [];
    $nome = $p['player_name'];

    // Base types always available
    $pool[] = ['base_dx', 10, null]; // handled separately

    // Tiro potente (tiro_potente >= 1)
    if (isset($skills['tiro_potente'])) {
        $w = $skills['tiro_potente'] >= 2 ? 25 : 15;
        $pool[] = ['tiro_potente', $w, [
            "con un tiro potentissimo che ha bucato il portiere",
            "con una cannonata da fuori area impossibile da fermare",
            "con un destro/sinistro di potenza pazzesca da dentro l'area"
        ]];
    }
    // Tiro a giro / trivella (tiro_giro >= 1)
    if (isset($skills['tiro_giro'])) {
        $w = $skills['tiro_giro'] >= 2 ? 22 : 14;
        $pool[] = ['tiro_giro', $w, [
            "con un tiro angolato a giro sul secondo palo",
            "con una trivella sul palo lontano, traiettoria imprendibile",
            "con un tiro a giro all'incrocio dei pali di rara bellezza"
        ]];
    }
    // Colpo di testa (colpo_testa >= 1)
    if (isset($skills['colpo_testa'])) {
        $w = $skills['colpo_testa'] >= 2 ? 20 : 12;
        $pool[] = ['colpo_testa', $w, [
            "di testa, saltando sopra a tutti i difensori sul cross",
            "con un colpo di testa imperioso che non ha lasciato scampo",
            "di testa su corner, dominando il difensore in elevazione"
        ]];
    }
    // Turbo / velocista -> gol in velocità
    if (isset($skills['turbo']) || isset($skills['velocista'])) {
        $w = isset($skills['turbo']) ? 20 : 12;
        $pool[] = ['velocita', $w, [
            "con uno scatto fulmineo che ha bruciato la difesa in velocità",
            "dopo aver seminato tre difensori in ripartenza fulminante",
            "con una corsa velocissima e un tiro a botta sicura"
        ]];
    }
    // Gol di Rabona (gol_rabona >= 1)
    if (isset($skills['gol_rabona'])) {
        $pool[] = ['rabona', 18, [
            "con una RABONA da urlo che ha lasciato tutti di stucco!",
            "con una rabona leggendaria: il pubblico è esploso in un boato!"
        ]];
    }
    // Istinto del goleador
    if (isset($skills['istinto'])) {
        $pool[] = ['istinto', 15, [
            "con il suo istinto da goleador puro: palla sul piede, gol",
            "trovandosi nel posto giusto al momento giusto — istinto puro"
        ]];
    }
    // Da punizione (freddezza >= 2)
    if (isset($skills['freddezza']) && $skills['freddezza'] >= 2) {
        $pool[] = ['punizione', 14, [
            "con un gol direttamente da calcio di punizione, potente e angolato",
            "da punizione, superando la barriera con un tiro preciso come un laser"
        ]];
    }

    // Weighted random
    $total = array_sum(array_column($pool, 1));
    $rand = rand(1, $total);
    $cum = 0;
    foreach ($pool as $entry) {
        $cum += $entry[1];
        if ($rand <= $cum) {
            if ($entry[0] === 'base_dx' || $entry[2] === null) return null; // use default
            $descs = $entry[2];
            return ['type' => $entry[0], 'desc' => $descs[rand(0, count($descs)-1)]];
        }
    }
    return null;
}

function simulateMatch($p, $skills = []) {
    $team_stars = intval($p['team_stelle'] ?? 1);
    $form  = ($p['morale'] + $p['energia']) / 2;

    // Bonus piede forte/debole
    $piede_forte = intval($p['piede_forte'] ?? 3);
    $piede_debole = intval($p['piede_debole'] ?? 2);
    $livello_skill = intval($p['livello_skill'] ?? 2);
    $piede_bonus = ($piede_forte / 5) * 5; // up to +5 bonus to power

    $power = ($p['overall']*0.5) + ($form*0.3) + ($team_stars*10*0.2) + $piede_bonus;
    $gol=0; $assist=0;
    for ($i=0;$i<4;$i++) if (rand(1,100)<$power*0.4) $gol++;
    for ($i=0;$i<3;$i++) if (rand(1,100)<$power*0.3) $assist++;

    // Formula voto corretta:
    // - Base 5.5 (non 5.0): un professionista parte da "sufficiente"
    // - Gol vale +0.8 (era +0.5): segna 2 gol → almeno 7 garantito
    // - Assist vale +0.4 (era +0.3)
    // - Rumore casuale ridotto (±0.56) così non azzera mai una doppietta
    // - OVR alto = leggero bonus costanza; bassa forma = bias negativo
    $ovr_factor  = ($p['overall'] - 50) / 75.0; // 0.0–1.0
    $noise       = rand(-8, 8) * 0.07;
    if ($form < 50) $noise -= 0.3; // penalità se forma scarsa
    $voto = round(5.5 + $gol*1.0 + $assist*0.6 + $noise + $ovr_factor*0.5, 1);
    $voto = max(4.5, min(10.0, $voto));
    $stipendio = $p['overall']*$p['moltiplicatore_stipendio']*100+$gol*1500+$assist*800;
    $pop_gain  = $gol*5+$assist*2+($voto>7?5:0);
    $morale    = ($voto>=7)?rand(10,25):rand(-8,0);
    $descs = ["{$gol} gol e {$assist} assist! Voto: {$voto}","Prestazione ".($voto>=7?"stellare":"opaca")." – {$gol} gol. Voto {$voto}"];

    // Determine gol type for news
    $gol_type = null;
    if ($gol > 0 && !empty($skills)) {
        $gol_type = getGolType($p, $skills);
    }

    return ['gol'=>$gol,'assist'=>$assist,'voto'=>$voto,'stipendio'=>round($stipendio),'pop_gain'=>$pop_gain,'morale'=>$morale,'desc'=>$descs[rand(0,1)],'gol_type'=>$gol_type];
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

    // Un solo trasferimento per stagione
    if ((int)($p['trasferimento_anno'] ?? 0) >= 1) {
        echo json_encode(['error' => 'Hai già effettuato un trasferimento questa stagione.']);
        return;
    }

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
    $db->prepare("UPDATE players SET team_id=?, trasferimento_anno=1 WHERE id=?")->execute([$team_id,$player_id]);
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

    // ── Aggiorna piede_forte / piede_debole / livello_skill in base alle skill sbloccate ──
    // Conta quante skill offensive del tiro/fisico sono sbloccate e a che livello
    $stmt_all = $db->prepare("SELECT skill_id, level FROM skill_boosts WHERE player_id=? AND level > 0");
    $stmt_all->execute([$player_id]);
    $all_skills = [];
    foreach ($stmt_all->fetchAll() as $row) $all_skills[$row['skill_id']] = intval($row['level']);

    // Piede forte: base 3/5. Sale con tiro_potente (lv2->4, lv3->5) o tiro_giro lv2
    $piede_forte = 3;
    if (isset($all_skills['tiro_potente'])) {
        if ($all_skills['tiro_potente'] >= 3) $piede_forte = 5;
        elseif ($all_skills['tiro_potente'] >= 2) $piede_forte = 4;
    }
    if (isset($all_skills['tiro_giro']) && $all_skills['tiro_giro'] >= 2) $piede_forte = max($piede_forte, 5);
    if (isset($all_skills['gol_rabona'])) $piede_forte = 5;

    // Piede debole: base 2/5. Sale con fredezza lv2->3, lv3->4; istinto lv2->5
    $piede_debole = 2;
    if (isset($all_skills['freddezza'])) {
        if ($all_skills['freddezza'] >= 3) $piede_debole = 4;
        elseif ($all_skills['freddezza'] >= 2) $piede_debole = 3;
    }
    if (isset($all_skills['istinto']) && $all_skills['istinto'] >= 2) $piede_debole = max($piede_debole, 5);

    // Livello skill: conta skill_id sbloccate
    $num_skills = count($all_skills);
    if ($num_skills >= 10) $livello_skill = 5;
    elseif ($num_skills >= 7) $livello_skill = 4;
    elseif ($num_skills >= 4) $livello_skill = 3;
    elseif ($num_skills >= 2) $livello_skill = 2;
    else $livello_skill = 2;

    $db->prepare("UPDATE players SET piede_forte=?, piede_debole=?, livello_skill=? WHERE id=?")
       ->execute([$piede_forte, $piede_debole, $livello_skill, $player_id]);

    echo json_encode([
        'success'      => true,
        'delta'        => $delta,
        'new_val'      => $newStat,
        'new_overall'  => $newOverall,
        'stat'         => $stat,
        'piede_forte'  => $piede_forte,
        'piede_debole' => $piede_debole,
        'livello_skill'=> $livello_skill,
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
