<?php
require_once '../config/db.php';

if (!isset($_SESSION['player_id'])) {
    echo json_encode(['error' => 'Non autenticato']); exit;
}

$player_id = $_SESSION['player_id'];
$data = json_decode(file_get_contents('php://input'), true) ?: $_POST;
$action = $data['action'] ?? $_GET['action'] ?? '';

switch ($action) {
    case 'play_month': playMonth($player_id, $data); break;
    case 'buy_struttura': buyStruttura($player_id, $data); break;
    case 'change_team': changeTeam($player_id, $data); break;
    default: echo json_encode(['error' => 'Action not found']);
}

function getPlayerData($id) {
    $db = getDB();
    $stmt = $db->prepare("SELECT p.*, t.stelle as team_stelle, t.popolarita as team_pop, t.moltiplicatore_stipendio, t.probabilita_trofeo FROM players p LEFT JOIN teams t ON p.team_id = t.id WHERE p.id = ?");
    $stmt->execute([$id]);
    return $stmt->fetch();
}

function playMonth($player_id, $data) {
    $db = getDB();
    $p = getPlayerData($player_id);
    if (!$p) { echo json_encode(['error' => 'Player non trovato']); return; }

    $azioni = $data['azioni'] ?? [];
    if (empty($azioni) || count($azioni) > 3) {
        echo json_encode(['error' => 'Scegli da 1 a 3 azioni']); return;
    }

    $risultati = [];
    $stat_changes = ['tiro'=>0,'velocita'=>0,'dribbling'=>0,'fisico'=>0,'mentalita'=>0,'popolarita'=>0,'energia'=>0,'morale'=>0];
    $infortuni = false;
    $evento_speciale = '';

    // --- PROCESS AZIONI ---
    $bonus_struttura = getBonusStruttura($p['struttura_livello']);

    foreach ($azioni as $azione) {
        switch ($azione) {
            case 'allenamento_tiro':
                $grow = rand(1,3) + $bonus_struttura['bonus_crescita'];
                $stat_changes['tiro'] += $grow;
                $stat_changes['energia'] -= rand(10,20);
                $risultati[] = "🎯 Tiro migliorato di +{$grow}";
                break;
            case 'allenamento_velocita':
                $grow = rand(1,3) + $bonus_struttura['bonus_crescita'];
                $stat_changes['velocita'] += $grow;
                $stat_changes['energia'] -= rand(10,20);
                $risultati[] = "⚡ Velocità migliorata di +{$grow}";
                break;
            case 'allenamento_fisico':
                $grow = rand(1,3) + $bonus_struttura['bonus_crescita'];
                $stat_changes['fisico'] += $grow;
                $stat_changes['energia'] -= rand(10,20);
                $risultati[] = "💪 Fisico migliorato di +{$grow}";
                break;
            case 'riposo':
                $rec = rand(20,40);
                $stat_changes['energia'] += $rec;
                $stat_changes['morale'] += rand(5,10);
                $risultati[] = "😴 Riposo: +{$rec} energia";
                break;
            case 'social':
                $pop = rand(2,8) + intval($p['team_stelle'] ?? 1);
                $stat_changes['popolarita'] += $pop;
                $stat_changes['morale'] += rand(3,8);
                $risultati[] = "📱 Attività social: +{$pop} popolarità";
                break;
            case 'allenamento_speciale':
                $rischio = rand(1,100) - $bonus_struttura['riduzione_infortuni'];
                if ($rischio > 75) {
                    $infortuni = true;
                    $stat_changes['energia'] -= rand(40,60);
                    $risultati[] = "🚨 INFORTUNIO durante allenamento speciale!";
                } else {
                    $grow = rand(3,6) + $bonus_struttura['bonus_crescita'];
                    $key = ['tiro','velocita','dribbling','fisico','mentalita'][rand(0,4)];
                    $stat_changes[$key] += $grow;
                    $risultati[] = "🔥 Allenamento speciale: +{$grow} " . ucfirst($key);
                }
                break;
            case 'dribbling':
                $grow = rand(1,3) + $bonus_struttura['bonus_crescita'];
                $stat_changes['dribbling'] += $grow;
                $stat_changes['energia'] -= rand(10,20);
                $risultati[] = "🏃 Dribbling migliorato di +{$grow}";
                break;
        }
    }

    // --- SIMULATE MATCH ---
    $match = simulateMatch($p);
    $risultati[] = "⚽ " . $match['desc'];
    $stat_changes['popolarita'] += $match['pop_gain'];
    $stat_changes['morale'] += $match['morale'];

    // --- RANDOM EVENT ---
    $event_roll = rand(1,100);
    if ($event_roll <= 10) {
        $events = [
            ['Crisi di forma improvvisa!', 'morale', -15],
            ['Sponsor importante ti contatta!', 'popolarita', 10],
            ['Il mister ti loda in conferenza stampa!', 'morale', 20],
            ['Rivalità accesa con altro attaccante!', 'morale', -5],
            ['Offerta di un club superiore!', 'morale', 15],
        ];
        $ev = $events[array_rand($events)];
        $evento_speciale = $ev[0];
        $stat_changes[$ev[1]] += $ev[2];
        $risultati[] = "🎲 EVENTO: " . $ev[0];
    }

    // Academy sponsor automatico
    if ($p['struttura_livello'] >= 4) {
        $sponsor = rand(5000, 20000);
        $match['stipendio'] += $sponsor;
        $risultati[] = "🤝 Sponsor Academy: +" . number_format($sponsor) . "€";
    }

    // --- CAP STATS ---
    $new_stats = [
        'tiro' => min(99, max(1, $p['tiro'] + $stat_changes['tiro'])),
        'velocita' => min(99, max(1, $p['velocita'] + $stat_changes['velocita'])),
        'dribbling' => min(99, max(1, $p['dribbling'] + $stat_changes['dribbling'])),
        'fisico' => min(99, max(1, $p['fisico'] + $stat_changes['fisico'])),
        'mentalita' => min(99, max(1, $p['mentalita'] + $stat_changes['mentalita'])),
        'popolarita' => min(100, max(0, $p['popolarita'] + $stat_changes['popolarita'])),
        'energia' => min(100, max(0, $p['energia'] + $stat_changes['energia'])),
        'morale' => min(100, max(0, $p['morale'] + $stat_changes['morale'])),
    ];

    // Age penalty on stats (over 32)
    if ($p['age'] >= 32) {
        $decay = ($p['age'] - 31) * 0.3;
        $new_stats['velocita'] = max(1, $new_stats['velocita'] - $decay);
        $new_stats['fisico'] = max(1, $new_stats['fisico'] - $decay);
    }

    $new_overall = intval(($new_stats['tiro'] + $new_stats['velocita'] + $new_stats['dribbling'] + $new_stats['fisico'] + $new_stats['mentalita']) / 5);
    $new_soldi = $p['soldi'] + $match['stipendio'];
    $new_gol = $p['gol_carriera'] + $match['gol'];
    $new_assist = $p['assist_carriera'] + $match['assist'];

    // Advance time
    $new_mese = $p['mese_corrente'] + 1;
    $new_anno = $p['anno_corrente'];
    $new_age = $p['age'];
    $pallone_result = null;

    if ($new_mese > 12) {
        $new_mese = 1;
        $new_anno++;
        $new_age++;
        // End of year: save season stats
        $pallone_result = calcPalloneDoro($db, $player_id, $p, $new_overall, $new_gol, $new_assist);
        $risultati[] = "📅 Nuova stagione iniziata! Età: {$new_age}";
        if ($pallone_result) $risultati[] = $pallone_result['msg'];
    }

    // Save log
    $db->prepare("INSERT INTO log_mensile (player_id, anno, mese, azione, risultato, gol, assist, voto, evento_speciale) VALUES (?,?,?,?,?,?,?,?,?)")
        ->execute([$player_id, $p['anno_corrente'], $p['mese_corrente'], implode(',', $azioni), implode("\n", $risultati), $match['gol'], $match['assist'], $match['voto'], $evento_speciale]);

    // Update player
    $db->prepare("UPDATE players SET tiro=?, velocita=?, dribbling=?, fisico=?, mentalita=?, popolarita=?, energia=?, morale=?, overall=?, soldi=?, gol_carriera=?, assist_carriera=?, mese_corrente=?, anno_corrente=?, age=? WHERE id=?")
        ->execute([$new_stats['tiro'], $new_stats['velocita'], $new_stats['dribbling'], $new_stats['fisico'], $new_stats['mentalita'], $new_stats['popolarita'], $new_stats['energia'], $new_stats['morale'], $new_overall, $new_soldi, $new_gol, $new_assist, $new_mese, $new_anno, $new_age, $player_id]);

    // Check fine carriera
    $fine_carriera = false;
    if ($new_age >= 38) {
        $fine_carriera = true;
        $epilogo = calcEpilogo($db, $player_id);
        $risultati[] = "🏁 FINE CARRIERA! " . $epilogo;
    }

    echo json_encode([
        'success' => true,
        'risultati' => $risultati,
        'match' => $match,
        'stat_changes' => $stat_changes,
        'evento_speciale' => $evento_speciale,
        'pallone_doro' => $pallone_result,
        'fine_carriera' => $fine_carriera,
        'nuovo_anno' => $new_anno !== $p['anno_corrente']
    ]);
}

function simulateMatch($p) {
    $team_stars = $p['team_stelle'] ?? 1;
    $form = ($p['morale'] + $p['energia']) / 2;
    $power = ($p['overall'] * 0.5) + ($form * 0.3) + ($team_stars * 10 * 0.2);

    $gol = 0;
    $assist = 0;
    // Probabilità gol basata su potere
    for ($i = 0; $i < 4; $i++) {
        if (rand(1,100) < $power * 0.4) $gol++;
    }
    for ($i = 0; $i < 3; $i++) {
        if (rand(1,100) < $power * 0.3) $assist++;
    }
    $voto = round(5.0 + ($gol * 0.5) + ($assist * 0.3) + (rand(-10,10) * 0.05), 1);
    $voto = max(4.0, min(10.0, $voto));

    $stipendio_base = $p['overall'] * $p['moltiplicatore_stipendio'] * 100;
    $bonus_perf = $gol * 500 + $assist * 300;
    $stipendio = $stipendio_base + $bonus_perf;

    $pop_gain = $gol * 2 + ($voto > 7 ? 3 : 0);
    $morale_change = ($voto >= 7) ? rand(5,15) : rand(-10,-2);

    $desc_options = [
        "$gol gol e $assist assist! Voto: {$voto}",
        "Partita solida: {$gol} gol, {$assist} assist. Voto {$voto}",
        "Prestazione " . ($voto >= 7 ? "stellare" : "opaca") . " con {$gol} gol. Voto {$voto}",
    ];

    return [
        'gol' => $gol,
        'assist' => $assist,
        'voto' => $voto,
        'stipendio' => round($stipendio),
        'pop_gain' => $pop_gain,
        'morale' => $morale_change,
        'desc' => $desc_options[array_rand($desc_options)]
    ];
}

function getBonusStruttura($livello) {
    $db = getDB();
    if ($livello == 0) return ['bonus_allenamento'=>0,'bonus_crescita'=>0,'riduzione_infortuni'=>0];
    $stmt = $db->prepare("SELECT * FROM strutture WHERE livello = ?");
    $stmt->execute([$livello]);
    return $stmt->fetch() ?: ['bonus_allenamento'=>0,'bonus_crescita'=>0,'riduzione_infortuni'=>0];
}

function calcPalloneDoro($db, $player_id, $p, $overall, $gol_carriera, $assist_carriera) {
    // Get this year's stats from log
    $anno = $p['anno_corrente'];
    $stmt = $db->prepare("SELECT SUM(gol) as gol, SUM(assist) as assist, AVG(voto) as voto FROM log_mensile WHERE player_id=? AND anno=?");
    $stmt->execute([$player_id, $anno]);
    $stats = $stmt->fetch();
    
    $score = ($stats['gol'] ?? 0) * 3 + ($stats['assist'] ?? 0) * 2 + ($stats['voto'] ?? 6) * 5 + $overall * 0.5 + $p['popolarita'] * 0.3;
    
    $pallone_pos = 0;
    $msg = '';
    $won = 0;

    if ($score >= 200) { $pallone_pos = 1; $msg = '🏆 HAI VINTO IL PALLONE D\'ORO!!!'; $won = 1; }
    elseif ($score >= 160) { $pallone_pos = rand(2,3); $msg = "🥈 Finalista al Pallone d'Oro (#{$pallone_pos})!"; }
    elseif ($score >= 120) { $pallone_pos = rand(4,10); $msg = "⭐ Top 10 al Pallone d'Oro!"; }
    elseif ($score >= 80) { $pallone_pos = rand(11,30); $msg = "Top 30 al Pallone d'Oro."; }
    else { $msg = "Non nominato al Pallone d'Oro quest'anno."; }

    // Save season
    $db->prepare("INSERT INTO stagioni (player_id, anno, gol, assist, partite, media_voto, pallone_doro_pos) VALUES (?,?,?,?,?,?,?)")
        ->execute([$player_id, $anno, $stats['gol']??0, $stats['assist']??0, 12, round($stats['voto']??6,2), $pallone_pos]);

    if ($won) {
        $db->prepare("UPDATE players SET palloni_doro = palloni_doro + 1 WHERE id=?")->execute([$player_id]);
    }

    return ['pos' => $pallone_pos, 'msg' => $msg, 'score' => round($score)];
}

function calcEpilogo($db, $player_id) {
    $stmt = $db->prepare("SELECT * FROM players WHERE id=?");
    $stmt->execute([$player_id]);
    $p = $stmt->fetch();

    $score = $p['palloni_doro'] * 20 + $p['trofei'] * 5 + $p['gol_carriera'] * 0.1 + $p['popolarita'];
    
    if ($score >= 80) return "Sei diventato una LEGGENDA MONDIALE! 🌟";
    if ($score >= 50) return "Grande carriera! Un Grande Bomber della storia! ⚽";
    if ($score >= 25) return "Icona nazionale, rispettato in patria. 🏴";
    return "Talento incompiuto... ma la strada è stata bella. 💫";
}

function buyStruttura($player_id, $data) {
    $db = getDB();
    $p = getPlayerData($player_id);
    $livello = intval($data['livello'] ?? 1);

    $stmt = $db->prepare("SELECT * FROM strutture WHERE livello=?");
    $stmt->execute([$livello]);
    $struttura = $stmt->fetch();

    if (!$struttura) { echo json_encode(['error' => 'Struttura non trovata']); return; }
    if ($p['struttura_livello'] >= $livello) { echo json_encode(['error' => 'Hai già questo livello o superiore']); return; }
    if ($p['struttura_livello'] < $livello - 1) { echo json_encode(['error' => 'Devi acquistare i livelli in ordine']); return; }
    if ($p['soldi'] < $struttura['costo']) { echo json_encode(['error' => 'Soldi insufficienti']); return; }

    $db->prepare("UPDATE players SET struttura_livello=?, soldi=soldi-? WHERE id=?")
        ->execute([$livello, $struttura['costo'], $player_id]);

    echo json_encode(['success' => true, 'msg' => "Hai costruito: " . $struttura['nome'] . "!"]);
}

function changeTeam($player_id, $data) {
    $db = getDB();
    $p = getPlayerData($player_id);
    $team_id = intval($data['team_id'] ?? 1);

    $stmt = $db->prepare("SELECT * FROM teams WHERE id=?");
    $stmt->execute([$team_id]);
    $team = $stmt->fetch();

    if (!$team) { echo json_encode(['error' => 'Squadra non trovata']); return; }

    // Check if player is ready for this team
    $min_overall = ($team['stelle'] - 1) * 15 + 55;
    if ($p['overall'] < $min_overall && $team['stelle'] > 1) {
        echo json_encode(['error' => "Overall troppo basso per questa squadra. Serve almeno {$min_overall}"]); return;
    }

    $db->prepare("UPDATE players SET team_id=? WHERE id=?")->execute([$team_id, $player_id]);
    echo json_encode(['success' => true, 'msg' => "Trasferito a " . $team['nome'] . "!"]);
}
