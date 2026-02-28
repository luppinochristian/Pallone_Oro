<?php
require_once '../config/db.php';

$player_id = getAuthPlayerId();
if (!$player_id) {
    echo json_encode(['error' => 'Non autenticato']); exit;
}

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'get':       getPlayer($player_id);  break;
    case 'teams':     getTeams();             break;
    case 'leghe':     getLeghe();             break;
    case 'log':       getLog($player_id);     break;
    case 'season':    getSeason($player_id);  break;
    case 'strutture': getStrutture();         break;
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
