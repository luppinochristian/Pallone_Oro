<?php
require_once '../config/db.php';

if (!isset($_SESSION['player_id'])) {
    echo json_encode(['error' => 'Non autenticato']); exit;
}

$player_id = $_SESSION['player_id'];
$action = $_GET['action'] ?? $_POST['action'] ?? '';

switch ($action) {
    case 'get': getPlayer($player_id); break;
    case 'teams': getTeams(); break;
    case 'log': getLog($player_id); break;
    case 'season': getSeason($player_id); break;
    case 'strutture': getStrutture(); break;
    default: echo json_encode(['error' => 'Action not found']);
}

function getPlayer($id) {
    $db = getDB();
    $stmt = $db->prepare("SELECT p.*, t.nome as team_nome, t.stelle as team_stelle, t.popolarita as team_pop, t.moltiplicatore_stipendio FROM players p LEFT JOIN teams t ON p.team_id = t.id WHERE p.id = ?");
    $stmt->execute([$id]);
    $p = $stmt->fetch();
    if ($p) { unset($p['password']); echo json_encode($p); }
    else echo json_encode(['error' => 'Player not found']);
}

function getTeams() {
    $db = getDB();
    $stmt = $db->query("SELECT * FROM teams ORDER BY stelle");
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
    $stmt = $db->prepare("SELECT * FROM stagioni WHERE player_id = ? ORDER BY anno DESC LIMIT 5");
    $stmt->execute([$id]);
    echo json_encode($stmt->fetchAll());
}

function getStrutture() {
    $db = getDB();
    echo json_encode($db->query("SELECT * FROM strutture ORDER BY livello")->fetchAll());
}
