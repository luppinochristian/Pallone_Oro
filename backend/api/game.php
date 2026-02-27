<?php
require_once '../config/db.php';

$player_id = getAuthPlayerId();
if (!$player_id) {
    echo json_encode(['error' => 'Non autenticato']); exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true) ?: [];
$action = $data['action'] ?? $_GET['action'] ?? '';

switch ($action) {
    case 'play_month':    playMonth($player_id, $data);   break;
    case 'buy_struttura': buyStruttura($player_id, $data); break;
    case 'change_team':   changeTeam($player_id, $data);  break;
    default: echo json_encode(['error' => 'Azione non trovata']);
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
    if (!$p) { echo json_encode(['error' => 'Giocatore non trovato']); return; }

    $azioni = $data['azioni'] ?? [];
    if (empty($azioni) || count($azioni) > 3) {
        echo json_encode(['error' => 'Scegli da 1 a 3 azioni']); return;
    }

    $risultati = [];
    $sc = ['tiro'=>0,'velocita'=>0,'dribbling'=>0,'fisico'=>0,'mentalita'=>0,'popolarita'=>0,'energia'=>0,'morale'=>0];
    $evento_speciale = '';

    $bonus = getBonusStruttura($p['struttura_livello']);

    foreach ($azioni as $azione) {
        switch ($azione) {
            case 'allenamento_tiro':
                $g = rand(1,3) + $bonus['bonus_crescita'];
                $sc['tiro'] += $g; $sc['energia'] -= rand(10,20);
                $risultati[] = "🎯 Tiro migliorato +{$g}";
                break;
            case 'allenamento_velocita':
                $g = rand(1,3) + $bonus['bonus_crescita'];
                $sc['velocita'] += $g; $sc['energia'] -= rand(10,20);
                $risultati[] = "⚡ Velocità migliorata +{$g}";
                break;
            case 'dribbling':
                $g = rand(1,3) + $bonus['bonus_crescita'];
                $sc['dribbling'] += $g; $sc['energia'] -= rand(10,20);
                $risultati[] = "🏃 Dribbling migliorato +{$g}";
                break;
            case 'allenamento_fisico':
                $g = rand(1,3) + $bonus['bonus_crescita'];
                $sc['fisico'] += $g; $sc['energia'] -= rand(10,20);
                $risultati[] = "💪 Fisico migliorato +{$g}";
                break;
            case 'riposo':
                $r = rand(20,40);
                $sc['energia'] += $r; $sc['morale'] += rand(5,10);
                $risultati[] = "😴 Riposo: +{$r} energia";
                break;
            case 'social':
                $pop = rand(2,8) + intval($p['team_stelle'] ?? 1);
                $sc['popolarita'] += $pop; $sc['morale'] += rand(3,8);
                $risultati[] = "📱 Social: +{$pop} popolarità";
                break;
            case 'allenamento_speciale':
                $rischio = rand(1,100) - $bonus['riduzione_infortuni'];
                if ($rischio > 75) {
                    $sc['energia'] -= rand(40,60);
                    $risultati[] = "🚨 INFORTUNIO durante allenamento speciale!";
                } else {
                    $g = rand(3,6) + $bonus['bonus_crescita'];
                    $keys = ['tiro','velocita','dribbling','fisico','mentalita'];
                    $k = $keys[rand(0,4)];
                    $sc[$k] += $g;
                    $risultati[] = "🔥 Allenamento speciale: +" . $g . " " . ucfirst($k);
                }
                break;
        }
    }

    // Partita simulata
    $match = simulateMatch($p);
    $risultati[] = "⚽ " . $match['desc'];
    $sc['popolarita'] += $match['pop_gain'];
    $sc['morale']     += $match['morale'];

    // Evento casuale (10%)
    if (rand(1,100) <= 10) {
        $events = [
            ['Crisi di forma improvvisa!',            'morale',    -15],
            ['Sponsor importante ti contatta!',        'popolarita', 10],
            ['Il mister ti loda in conferenza stampa!','morale',     20],
            ['Rivalità con un altro attaccante!',      'morale',     -5],
            ['Offerta da un top club!',                'morale',     15],
        ];
        $ev = $events[array_rand($events)];
        $evento_speciale = $ev[0];
        $sc[$ev[1]] += $ev[2];
        $risultati[] = "🎲 EVENTO: " . $ev[0];
    }

    // Sponsor academy automatico
    if ($p['struttura_livello'] >= 4) {
        $sp = rand(5000,20000);
        $match['stipendio'] += $sp;
        $risultati[] = "🤝 Sponsor Academy: +€" . number_format($sp);
    }

    // Applica e limita stats
    $ns = [
        'tiro'       => min(99, max(1, $p['tiro']       + $sc['tiro'])),
        'velocita'   => min(99, max(1, $p['velocita']   + $sc['velocita'])),
        'dribbling'  => min(99, max(1, $p['dribbling']  + $sc['dribbling'])),
        'fisico'     => min(99, max(1, $p['fisico']      + $sc['fisico'])),
        'mentalita'  => min(99, max(1, $p['mentalita']  + $sc['mentalita'])),
        'popolarita' => min(100,max(0, $p['popolarita'] + $sc['popolarita'])),
        'energia'    => min(100,max(0, $p['energia']    + $sc['energia'])),
        'morale'     => min(100,max(0, $p['morale']     + $sc['morale'])),
    ];

    // Decadimento dopo 32 anni
    if ($p['age'] >= 32) {
        $decay = ($p['age'] - 31) * 0.3;
        $ns['velocita'] = max(1, $ns['velocita'] - $decay);
        $ns['fisico']   = max(1, $ns['fisico']   - $decay);
    }

    $new_overall = intval(($ns['tiro']+$ns['velocita']+$ns['dribbling']+$ns['fisico']+$ns['mentalita'])/5);
    $new_soldi   = $p['soldi'] + $match['stipendio'];
    $new_gol     = $p['gol_carriera']   + $match['gol'];
    $new_assist  = $p['assist_carriera']+ $match['assist'];

    $new_mese  = $p['mese_corrente'] + 1;
    $new_anno  = $p['anno_corrente'];
    $new_age   = $p['age'];
    $pallone_result = null;

    if ($new_mese > 12) {
        $new_mese = 1;
        $new_anno++;
        $new_age++;
        $pallone_result = calcPalloneDoro($db, $player_id, $p, $new_overall, $new_gol, $new_assist);
        $risultati[] = "📅 Nuova stagione! Età: {$new_age}";
        if ($pallone_result) $risultati[] = $pallone_result['msg'];
    }

    // Salva log
    $db->prepare("INSERT INTO log_mensile (player_id,anno,mese,azione,risultato,gol,assist,voto,evento_speciale) VALUES(?,?,?,?,?,?,?,?,?)")
       ->execute([$player_id,$p['anno_corrente'],$p['mese_corrente'],implode(',',$azioni),implode("\n",$risultati),$match['gol'],$match['assist'],$match['voto'],$evento_speciale]);

    // Aggiorna giocatore
    $db->prepare("UPDATE players SET tiro=?,velocita=?,dribbling=?,fisico=?,mentalita=?,popolarita=?,energia=?,morale=?,overall=?,soldi=?,gol_carriera=?,assist_carriera=?,mese_corrente=?,anno_corrente=?,age=? WHERE id=?")
       ->execute([$ns['tiro'],$ns['velocita'],$ns['dribbling'],$ns['fisico'],$ns['mentalita'],$ns['popolarita'],$ns['energia'],$ns['morale'],$new_overall,$new_soldi,$new_gol,$new_assist,$new_mese,$new_anno,$new_age,$player_id]);

    $fine_carriera = false;
    if ($new_age >= 38) {
        $fine_carriera = true;
        $epilogo = calcEpilogo($db, $player_id);
        $risultati[] = "🏁 FINE CARRIERA! " . $epilogo;
    }

    echo json_encode([
        'success'        => true,
        'risultati'      => $risultati,
        'match'          => $match,
        'pallone_doro'   => $pallone_result,
        'fine_carriera'  => $fine_carriera,
        'nuovo_anno'     => ($new_anno !== $p['anno_corrente']),
    ]);
}

function simulateMatch($p) {
    $team_stars = intval($p['team_stelle'] ?? 1);
    $form  = ($p['morale'] + $p['energia']) / 2;
    $power = ($p['overall'] * 0.5) + ($form * 0.3) + ($team_stars * 10 * 0.2);

    $gol = 0; $assist = 0;
    for ($i=0;$i<4;$i++) if (rand(1,100) < $power*0.4) $gol++;
    for ($i=0;$i<3;$i++) if (rand(1,100) < $power*0.3) $assist++;

    $voto = round(5.0 + $gol*0.5 + $assist*0.3 + rand(-10,10)*0.05, 1);
    $voto = max(4.0, min(10.0, $voto));

    $stipendio = $p['overall'] * $p['moltiplicatore_stipendio'] * 100 + $gol*500 + $assist*300;
    $pop_gain  = $gol*2 + ($voto > 7 ? 3 : 0);
    $morale    = ($voto >= 7) ? rand(5,15) : rand(-10,-2);

    $descs = [
        "{$gol} gol e {$assist} assist! Voto: {$voto}",
        "Prestazione " . ($voto>=7?"stellare":"opaca") . " – {$gol} gol. Voto {$voto}",
    ];
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
    $stmt = $db->prepare("SELECT SUM(gol) as gol, SUM(assist) as assist, AVG(voto) as voto FROM log_mensile WHERE player_id=? AND anno=?");
    $stmt->execute([$player_id,$anno]);
    $stats = $stmt->fetch();

    $score = ($stats['gol']??0)*3 + ($stats['assist']??0)*2 + ($stats['voto']??6)*5 + $overall*0.5 + $p['popolarita']*0.3;
    $pallone_pos = 0; $msg = ''; $won = 0;

    if ($score >= 200)      { $pallone_pos=1;           $msg="🏆 HAI VINTO IL PALLONE D'ORO!!!"; $won=1; }
    elseif ($score >= 160)  { $pallone_pos=rand(2,3);   $msg="🥈 Finalista al Pallone d'Oro (#{$pallone_pos})!"; }
    elseif ($score >= 120)  { $pallone_pos=rand(4,10);  $msg="⭐ Top 10 al Pallone d'Oro!"; }
    elseif ($score >= 80)   { $pallone_pos=rand(11,30); $msg="Top 30 al Pallone d'Oro."; }
    else                    { $msg="Non nominato al Pallone d'Oro quest'anno."; }

    $db->prepare("INSERT INTO stagioni (player_id,anno,gol,assist,partite,media_voto,pallone_doro_pos) VALUES(?,?,?,?,?,?,?)")
       ->execute([$player_id,$anno,$stats['gol']??0,$stats['assist']??0,12,round($stats['voto']??6,2),$pallone_pos]);

    if ($won) $db->prepare("UPDATE players SET palloni_doro=palloni_doro+1 WHERE id=?")->execute([$player_id]);
    return ['pos'=>$pallone_pos,'msg'=>$msg,'score'=>round($score)];
}

function calcEpilogo($db, $player_id) {
    $stmt = $db->prepare("SELECT * FROM players WHERE id=?");
    $stmt->execute([$player_id]);
    $p = $stmt->fetch();
    $score = $p['palloni_doro']*20 + $p['trofei']*5 + $p['gol_carriera']*0.1 + $p['popolarita'];
    if ($score >= 80) return "Sei una LEGGENDA MONDIALE! 🌟";
    if ($score >= 50) return "Grande carriera! Un Grande Bomber! ⚽";
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

    if (!$struttura)                          { echo json_encode(['error'=>'Struttura non trovata']); return; }
    if ($p['struttura_livello'] >= $livello)  { echo json_encode(['error'=>'Hai già questo livello']); return; }
    if ($p['struttura_livello'] < $livello-1) { echo json_encode(['error'=>'Acquista prima il livello precedente']); return; }
    if ($p['soldi'] < $struttura['costo'])    { echo json_encode(['error'=>'Soldi insufficienti']); return; }

    $db->prepare("UPDATE players SET struttura_livello=?,soldi=soldi-? WHERE id=?")
       ->execute([$livello,$struttura['costo'],$player_id]);
    echo json_encode(['success'=>true,'msg'=>"Costruito: ".$struttura['nome']."!"]);
}

function changeTeam($player_id, $data) {
    $db = getDB();
    $p = getPlayerData($player_id);
    $team_id = intval($data['team_id'] ?? 1);
    $stmt = $db->prepare("SELECT * FROM teams WHERE id=?");
    $stmt->execute([$team_id]);
    $team = $stmt->fetch();
    if (!$team) { echo json_encode(['error'=>'Squadra non trovata']); return; }

    $min_overall = ($team['stelle']-1)*15+55;
    if ($p['overall'] < $min_overall && $team['stelle'] > 1) {
        echo json_encode(['error'=>"Overall insufficiente. Serve almeno {$min_overall}"]); return;
    }
    $db->prepare("UPDATE players SET team_id=? WHERE id=?")->execute([$team_id,$player_id]);
    echo json_encode(['success'=>true,'msg'=>"Trasferito a ".$team['nome']."!"]);
}
