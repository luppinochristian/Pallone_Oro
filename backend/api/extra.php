<?php
require_once '../config/db.php';

$player_id = getAuthPlayerId();
if (!$player_id) { echo json_encode(['error' => 'Non autenticato']); exit; }

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'notizie':    getNotizie($player_id);         break;
    case 'leggi':      leggiNotizie($player_id);       break;
    case 'obiettivi':  getObiettivi($player_id);       break;
    default: echo json_encode(['error' => 'Azione non trovata']);
}

function getNotizie($player_id) {
    $db   = getDB();
    $stmt = $db->prepare("SELECT * FROM notizie WHERE player_id=? ORDER BY id DESC LIMIT 20");
    $stmt->execute([$player_id]);
    $notizie = $stmt->fetchAll();
    $unread  = $db->prepare("SELECT COUNT(*) as c FROM notizie WHERE player_id=? AND letto=0");
    $unread->execute([$player_id]);
    echo json_encode(['notizie'=>$notizie, 'unread'=>$unread->fetch()['c']]);
}

function leggiNotizie($player_id) {
    $db = getDB();
    $db->prepare("UPDATE notizie SET letto=1 WHERE player_id=?")->execute([$player_id]);
    echo json_encode(['success'=>true]);
}

function getObiettivi($player_id) {
    $db   = getDB();
    $stmt = $db->prepare("SELECT soldi,anno_corrente FROM players WHERE id=?");
    $stmt->execute([$player_id]);
    $p    = $stmt->fetch();

    // Crea obiettivi se non esistono per questo anno
    $anno = $p['anno_corrente'];
    $stmt = $db->prepare("SELECT COUNT(*) as c FROM obiettivi WHERE player_id=? AND anno=?");
    $stmt->execute([$player_id, $anno]);
    if ($stmt->fetch()['c'] == 0) creaObiettivi($db, $player_id, $anno);

    // Aggiorna progressi
    aggiornaProgressi($db, $player_id, $anno);

    $stmt = $db->prepare("SELECT * FROM obiettivi WHERE player_id=? AND anno=? ORDER BY completato ASC, id ASC");
    $stmt->execute([$player_id, $anno]);
    echo json_encode($stmt->fetchAll());
}

function creaObiettivi($db, $player_id, $anno) {
    // Prendi stats giocatore per tarare difficoltà
    $stmt = $db->prepare("SELECT overall, gol_carriera FROM players WHERE id=?");
    $stmt->execute([$player_id]);
    $p = $stmt->fetch();
    $ov = intval($p['overall']);

    $obiettivi = [
        // Gol stagionali (scala con overall)
        ['gol_stagione', 'Segna '.max(5, intval($ov/5)).' gol in stagione', max(5, intval($ov/5)), 0, max(5000, $ov*500), 10],
        // Assist stagionali
        ['assist_stagione', 'Fornisci '.max(3, intval($ov/7)).' assist in stagione', max(3, intval($ov/7)), 0, max(3000, $ov*300), 8],
        // Voto medio
        ['media_voto', 'Mantieni una media voto ≥ 7.0', 70, 0, 20000, 15],
        // Overall
        ['overall', 'Raggiungi Overall '.min(99, $ov+8), min(99, $ov+8), 0, max(10000, ($ov+8)*200), 5],
        // Popolarità
        ['popolarita', 'Raggiungi 50 di popolarità', 50, 0, 8000, 10],
    ];

    $stmt = $db->prepare("INSERT INTO obiettivi (player_id,anno,tipo,descrizione,target,progresso,completato,premio_soldi,premio_morale) VALUES(?,?,?,?,?,0,0,?,?)");
    foreach ($obiettivi as $ob) {
        $stmt->execute([$player_id, $anno, $ob[0], $ob[1], $ob[2], $ob[4], $ob[5]]);
    }
}

function aggiornaProgressi($db, $player_id, $anno) {
    $stmt = $db->prepare("SELECT * FROM players WHERE id=?");
    $stmt->execute([$player_id]);
    $p = $stmt->fetch();

    $stmt = $db->prepare("SELECT SUM(gol) as gol, SUM(assist) as assist, AVG(voto)*10 as voto FROM log_mensile WHERE player_id=? AND anno=?");
    $stmt->execute([$player_id, $anno]);
    $stats = $stmt->fetch();

    $progressi = [
        'gol_stagione'   => intval($stats['gol']    ?? 0),
        'assist_stagione'=> intval($stats['assist']  ?? 0),
        'media_voto'     => intval($stats['voto']    ?? 60),
        'overall'        => intval($p['overall']),
        'popolarita'     => intval($p['popolarita']),
    ];

    $stmt = $db->prepare("SELECT * FROM obiettivi WHERE player_id=? AND anno=? AND completato=0");
    $stmt->execute([$player_id, $anno]);
    $obiettivi = $stmt->fetchAll();

    foreach ($obiettivi as $ob) {
        $prog = $progressi[$ob['tipo']] ?? 0;
        $db->prepare("UPDATE obiettivi SET progresso=? WHERE id=?")->execute([$prog, $ob['id']]);

        if ($prog >= $ob['target']) {
            $db->prepare("UPDATE obiettivi SET completato=1,progresso=? WHERE id=?")->execute([$ob['target'], $ob['id']]);
            // Premio
            $db->prepare("UPDATE players SET soldi=soldi+?, morale=MIN(100,morale+?) WHERE id=?")
               ->execute([$ob['premio_soldi'], $ob['premio_morale'], $player_id]);
            // Notizia
            $db->prepare("INSERT INTO notizie (player_id,anno,mese,titolo,testo,tipo) VALUES(?,?,?,?,?,?)")
               ->execute([$player_id, $anno, $p['mese_corrente'],
                   "🎯 Obiettivo completato!",
                   "Hai completato l'obiettivo: \"{$ob['descrizione']}\". Premio: +€".number_format($ob['premio_soldi'])." e +{$ob['premio_morale']} morale!",
                   'obiettivo'
               ]);
        }
    }
}
