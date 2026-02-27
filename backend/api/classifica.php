<?php
require_once '../config/db.php';

$player_id = getAuthPlayerId();
if (!$player_id) { echo json_encode(['error' => 'Non autenticato']); exit; }

$action = $_GET['action'] ?? '';
switch ($action) {
    case 'get':          getClassifica();                   break;
    case 'champions':    getChampions();                    break;
    default: echo json_encode(['error' => 'Azione non trovata']);
}

function getClassifica() {
    $db = getDB();
    $lega_id = intval($_GET['lega_id'] ?? 0);
    $anno    = intval($_GET['anno'] ?? 0);

    if (!$lega_id || !$anno) {
        echo json_encode(['error' => 'Parametri mancanti']); return;
    }

    // Assicura che tutte le squadre della lega abbiano un record
    initClassifica($db, $lega_id, $anno);

    $stmt = $db->prepare("
        SELECT c.*, t.nome as team_nome, t.stelle, t.ovr,
               (c.gol_fatti - c.gol_subiti) as diff_reti
        FROM classifica c
        JOIN teams t ON c.team_id = t.id
        WHERE c.lega_id = ? AND c.anno = ?
        ORDER BY c.punti DESC, diff_reti DESC, c.gol_fatti DESC
    ");
    $stmt->execute([$lega_id, $anno]);
    $rows = $stmt->fetchAll();

    // Aggiungi posizione
    foreach ($rows as $i => &$r) {
        $r['posizione'] = $i + 1;
    }
    echo json_encode($rows);
}

function initClassifica($db, $lega_id, $anno) {
    $stmt = $db->prepare("SELECT id FROM teams WHERE lega_id = ?");
    $stmt->execute([$lega_id]);
    $teams = $stmt->fetchAll();
    foreach ($teams as $t) {
        $db->prepare("INSERT IGNORE INTO classifica (team_id, lega_id, anno) VALUES (?,?,?)")
           ->execute([$t['id'], $lega_id, $anno]);
    }
}

function getChampions() {
    $db = getDB();
    $anno = intval($_GET['anno'] ?? 0);
    if (!$anno) { echo json_encode(['error' => 'Anno mancante']); return; }

    $stmt = $db->prepare("
        SELECT cc.*, t.nome as team_nome, t.stelle, t.ovr,
               l.nome as lega_nome, n.nome as nazione_nome, n.bandiera
        FROM champions_cup cc
        JOIN teams t ON cc.team_id = t.id
        JOIN leghe l ON t.lega_id = l.id
        JOIN nazioni n ON l.nazione_id = n.id
        WHERE cc.anno = ?
        ORDER BY FIELD(cc.fase,'vincitore','finale','semifinale','quarti','gironi'), t.ovr DESC
    ");
    $stmt->execute([$anno]);
    echo json_encode($stmt->fetchAll());
}
