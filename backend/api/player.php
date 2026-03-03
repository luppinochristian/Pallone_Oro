<?php
require_once '../config/db.php';

$player_id = getAuthPlayerId();
if (!$player_id) {
    echo json_encode(['error' => 'Non autenticato']); exit;
}
if ($player_id < 0) {
    // Account autenticato ma nessuna carriera selezionata
    echo json_encode(['error' => 'Seleziona una carriera']); exit;
}

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'get':       getPlayer($player_id);  break;
    case 'teams':     getTeams();             break;
    case 'leghe':     getLeghe();             break;
    case 'log':       getLog($player_id);     break;
    case 'season':    getSeason($player_id);  break;
    case 'strutture': getStrutture();         break;
    case 'calendario': getCalendario($player_id); break;
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
    if ($hair) $db->prepare("UPDATE players SET skin_hair=? WHERE id=?")->execute([$hair, $player_id]);
    if ($skin) $db->prepare("UPDATE players SET skin_color=? WHERE id=?")->execute([$skin, $player_id]);
    if ($eye)  $db->prepare("UPDATE players SET eye_color=? WHERE id=?")->execute([$eye, $player_id]);
    echo json_encode(['success'=>true]);
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
