<?php
require_once '../config/db.php';

$action = $_GET['action'] ?? '';

// Alcune azioni non richiedono player_id
if (in_array($action, ['leghe', 'teams'])) {
    switch ($action) {
        case 'teams': getTeams(); break;
        case 'leghe': getLeghe(); break;
    }
    exit;
}

$player_id = getAuthPlayerId();
if (!$player_id) {
    echo json_encode(['error' => 'Non autenticato']); exit;
}
if ($player_id < 0) {
    echo json_encode(['error' => 'Seleziona una carriera']); exit;
}

switch ($action) {
    case 'get':       getPlayer($player_id);  break;
    case 'teams':     getTeams();             break;
    case 'leghe':     getLeghe();             break;
    case 'log':       getLog($player_id);     break;
    case 'season':    getSeason($player_id);  break;
    case 'strutture': getStrutture();         break;
    case 'calendario': getCalendario($player_id); break;
    case 'season_detail': getSeasonDetail($player_id); break;
    case 'update_appearance': updateAppearance($player_id); break;
    default: echo json_encode(['error' => 'Azione non trovata']);
}

function getPlayer($id) {
    $db = getDB();
    $stmt = $db->prepare("
        SELECT p.*, t.nome as team_nome, t.stelle as team_stelle, t.popolarita as team_pop,
               t.moltiplicatore_stipendio, t.lega_id,
               l.nome as lega_nome, l.livello as lega_livello,
               n.nome as nazione_nome, n.bandiera as nazione_bandiera
        FROM players p
        LEFT JOIN teams t ON p.team_id = t.id
        LEFT JOIN leghe l ON t.lega_id = l.id
        LEFT JOIN nazioni n ON l.nazione_id = n.id
        WHERE p.id = ?
    ");
    $stmt->execute([$id]);
    $p = $stmt->fetch();
    if ($p) { unset($p['password']); echo json_encode($p); }
    else echo json_encode(['error' => 'Giocatore non trovato']);
}

function getLeghe() {
    $db = getDB();
    $leghe = $db->query("
        SELECT l.*, n.nome as nazione_nome, n.bandiera,
               COUNT(t.id) as num_squadre
        FROM leghe l
        JOIN nazioni n ON l.nazione_id = n.id
        LEFT JOIN teams t ON t.lega_id = l.id
        GROUP BY l.id
        ORDER BY n.id, l.livello
    ")->fetchAll();
    echo json_encode($leghe);
}

function getTeams() {
    $db = getDB();
    $lega_id = intval($_GET['lega_id'] ?? 0);
    if ($lega_id > 0) {
        $stmt = $db->prepare("
            SELECT t.*, l.nome as lega_nome, l.livello as lega_livello,
                   n.nome as nazione_nome, n.bandiera
            FROM teams t
            JOIN leghe l ON t.lega_id = l.id
            JOIN nazioni n ON l.nazione_id = n.id
            WHERE t.lega_id = ?
            ORDER BY t.stelle DESC, t.popolarita DESC
        ");
        $stmt->execute([$lega_id]);
    } else {
        $stmt = $db->query("
            SELECT t.*, l.nome as lega_nome, l.livello as lega_livello,
                   n.nome as nazione_nome, n.bandiera
            FROM teams t
            JOIN leghe l ON t.lega_id = l.id
            JOIN nazioni n ON l.nazione_id = n.id
            ORDER BY n.id, l.livello, t.stelle DESC
        ");
    }
    echo json_encode($stmt->fetchAll());
}

function getLog($id) {
    $db = getDB();
    $stmt = $db->prepare("SELECT * FROM log_mensile WHERE player_id = ? ORDER BY anno DESC, mese DESC LIMIT 30");
    $stmt->execute([$id]);
    echo json_encode($stmt->fetchAll());
}

function getSeason($id) {
    $db = getDB();
    $stmt = $db->prepare("SELECT * FROM stagioni WHERE player_id = ? ORDER BY anno DESC LIMIT 15");
    $stmt->execute([$id]);
    echo json_encode($stmt->fetchAll());
}

function getStrutture() {
    $db = getDB();
    echo json_encode($db->query("SELECT * FROM strutture ORDER BY livello")->fetchAll());
}

function updateAppearance($player_id) {
    $db   = getDB();
    $raw  = file_get_contents('php://input');
    $data = json_decode($raw, true) ?: [];
    $allowed_hair   = ['short_black','short_brown','short_blonde','short_red','long_black','long_brown','long_blonde','afro_black','afro_brown','bald','curly_black','curly_brown'];
    $allowed_skin   = ['light','medium_light','medium','medium_dark','dark'];
    $allowed_eyes   = ['brown','blue','green','hazel','gray'];
    $hair  = in_array($data['skin_hair']  ?? '', $allowed_hair)  ? $data['skin_hair']  : null;
    $skin  = in_array($data['skin_color'] ?? '', $allowed_skin)  ? $data['skin_color'] : null;
    $eye   = in_array($data['eye_color']  ?? '', $allowed_eyes)  ? $data['eye_color']  : null;
    $updates = [];
    $params  = [];
    if ($hair) { $updates[] = 'skin_hair=?';  $params[] = $hair; }
    if ($skin) { $updates[] = 'skin_color=?'; $params[] = $skin; }
    if ($eye)  { $updates[] = 'eye_color=?';  $params[] = $eye;  }
    if ($updates) {
        $params[] = $player_id;
        $db->prepare("UPDATE players SET ".implode(',',$updates)." WHERE id=?")->execute($params);
    }
    echo json_encode(['success'=>true]);
}

function getSeasonDetail($player_id) {
    $db  = getDB();
    $anno = intval($_GET['anno'] ?? 0);
    if (!$anno) { echo json_encode(['error' => 'Anno mancante']); return; }

    // Gol e assist totali dell'anno
    $stmt = $db->prepare("SELECT SUM(gol) as gol, SUM(assist) as assist, COUNT(*) as mesi FROM log_mensile WHERE player_id=? AND anno=?");
    $stmt->execute([$player_id, $anno]);
    $totals = $stmt->fetch();

    // Partita con più gol
    $stmt = $db->prepare("SELECT * FROM log_mensile WHERE player_id=? AND anno=? ORDER BY gol DESC, voto DESC LIMIT 1");
    $stmt->execute([$player_id, $anno]);
    $best_gol = $stmt->fetch();

    // Partita con più assist
    $stmt = $db->prepare("SELECT * FROM log_mensile WHERE player_id=? AND anno=? ORDER BY assist DESC, voto DESC LIMIT 1");
    $stmt->execute([$player_id, $anno]);
    $best_assist = $stmt->fetch();

    // Partita con voto più alto
    $stmt = $db->prepare("SELECT * FROM log_mensile WHERE player_id=? AND anno=? ORDER BY voto DESC LIMIT 1");
    $stmt->execute([$player_id, $anno]);
    $best_voto = $stmt->fetch();

    // Trofei: campionato (dalla tabella stagioni) e champions (dalla tabella champions_cup)
    $stmt = $db->prepare("SELECT s.*, t.lega_id, l.livello as lega_livello, l.nome as lega_nome FROM stagioni s LEFT JOIN players p ON p.id=s.player_id LEFT JOIN teams t ON p.team_id=t.id LEFT JOIN leghe l ON t.lega_id=l.id WHERE s.player_id=? AND s.anno=? LIMIT 1");
    $stmt->execute([$player_id, $anno]);
    $stagione = $stmt->fetch();

    // Champions vinta
    $stmt = $db->prepare("SELECT cc.fase FROM champions_cup cc JOIN players p ON p.team_id=cc.team_id WHERE p.id=? AND cc.anno=? AND cc.fase='vincitore' AND cc.eliminato=0 LIMIT 1");
    $stmt->execute([$player_id, $anno]);
    $champions_win = $stmt->fetch();

    // Campionato vinto (pos 1 nella classifica)
    $campionato_vinto = null;
    if ($stagione && $stagione['pallone_doro_pos'] !== null) {
        // Usa la lega_nome dalla stagione
        $stmt = $db->prepare("SELECT c.team_id, l.nome as lega_nome, l.livello FROM classifica c JOIN leghe l ON c.lega_id=l.id JOIN players p ON p.team_id=c.team_id WHERE p.id=? AND c.anno=? ORDER BY c.punti DESC LIMIT 1");
        $stmt->execute([$player_id, $anno]);
        $class_pos = $stmt->fetch();
        if ($class_pos) {
            $stmt2 = $db->prepare("SELECT COUNT(*) as rank_pos FROM classifica c2 WHERE c2.lega_id=(SELECT lega_id FROM classifica WHERE team_id=? AND anno=?) AND c2.anno=? AND c2.punti > (SELECT punti FROM classifica WHERE team_id=? AND anno=?)");
            $stmt2->execute([$class_pos['team_id'], $anno, $anno, $class_pos['team_id'], $anno]);
            $rank = $stmt2->fetch();
            $pos = intval($rank['rank_pos'] ?? 0) + 1;
            if ($pos === 1) {
                $campionato_vinto = ['lega_nome' => $stagione['lega_nome'] ?? $class_pos['lega_nome'], 'livello' => $class_pos['livello'] ?? 1];
            }
        }
    }

    // Helper: cerca avversario nel calendario per il mese del log
    $getAvv = function($log) use ($db, $player_id) {
        if (!$log) return null;
        $stmt = $db->prepare("
            SELECT CASE WHEN c.home_id = p.team_id THEN ta.nome ELSE th.nome END as avversario
            FROM calendario c
            JOIN players p ON p.id=?
            JOIN teams th ON c.home_id=th.id
            JOIN teams ta ON c.away_id=ta.id
            WHERE c.anno=? AND c.mese=? AND (c.home_id=p.team_id OR c.away_id=p.team_id)
            LIMIT 1
        ");
        $stmt->execute([$player_id, $log['anno'], $log['mese']]);
        $row = $stmt->fetch();
        return $row ? $row['avversario'] : null;
    };
    if ($best_gol)    $best_gol['avversario']   = $getAvv($best_gol);
    if ($best_assist) $best_assist['avversario'] = $getAvv($best_assist);
    if ($best_voto)   $best_voto['avversario']   = $getAvv($best_voto);

    echo json_encode([
        'anno'         => $anno,
        'gol'          => intval($totals['gol'] ?? 0),
        'assist'       => intval($totals['assist'] ?? 0),
        'mesi'         => intval($totals['mesi'] ?? 0),
        'best_gol'     => $best_gol ?: null,
        'best_assist'  => $best_assist ?: null,
        'best_voto'    => $best_voto ?: null,
        'champions_win'=> $champions_win ? true : false,
        'campionato_vinto' => $campionato_vinto,
        'pallone_doro_pos' => $stagione ? intval($stagione['pallone_doro_pos']) : 0,
    ]);
}

function getCalendario($player_id) {
    $db = getDB();
    $p  = $db->prepare("SELECT team_id, anno_corrente, mese_corrente, lega_id FROM players p LEFT JOIN teams t ON p.team_id=t.id WHERE p.id=?");
    $p->execute([$player_id]);
    $player = $p->fetch();
    if (!$player) { echo json_encode([]); return; }

    $lega_id = $player['lega_id'];
    $anno    = $player['anno_corrente'];

    // Recupera tutte le partite del calendario con i nomi delle squadre
    $stmt = $db->prepare("
        SELECT c.*, 
               th.nome as home_nome, ta.nome as away_nome,
               th.ovr as home_ovr, ta.ovr as away_ovr
        FROM calendario c
        JOIN teams th ON c.home_id = th.id
        JOIN teams ta ON c.away_id = ta.id
        WHERE c.lega_id=? AND c.anno=?
        ORDER BY c.giornata
    ");
    $stmt->execute([$lega_id, $anno]);
    $partite = $stmt->fetchAll();

    echo json_encode([
        'partite'  => $partite,
        'team_id'  => $player['team_id'],
        'mese'     => $player['mese_corrente'],
        'anno'     => $anno
    ]);
}
