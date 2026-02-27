<?php
require_once '../config/db.php';

$player_id = getAuthPlayerId();
if (!$player_id) { echo json_encode(['error' => 'Non autenticato']); exit; }

$raw    = file_get_contents('php://input');
$data   = json_decode($raw, true) ?: [];
$action = $data['action'] ?? $_GET['action'] ?? '';

switch ($action) {
    case 'get':      getAgente($player_id);          break;
    case 'assumi':   assumiAgente($player_id, $data); break;
    case 'upgrade':  upgradeAgente($player_id);       break;
    default: echo json_encode(['error' => 'Azione non trovata']);
}

// =====================================================
define('AGENTI', [
    1 => ['nome'=>'Marco Ferretti',   'costo'=>15000,  'costo_up'=>40000,  'bonus_stipendio'=>0.10, 'bonus_offerte'=>1, 'descr'=>'Agente locale. Negozia un piccolo bonus stipendio.'],
    2 => ['nome'=>'Carlos Mendez',    'costo'=>40000,  'costo_up'=>100000, 'bonus_stipendio'=>0.20, 'bonus_offerte'=>2, 'descr'=>'Agente internazionale. Porta offerte da squadre straniere.'],
    3 => ['nome'=>'James Whitfield',  'costo'=>100000, 'costo_up'=>250000, 'bonus_stipendio'=>0.35, 'bonus_offerte'=>3, 'descr'=>'Agente top. Massimizza lo stipendio e trova i migliori club.'],
    4 => ['nome'=>'Alexandre Dupont', 'costo'=>250000, 'costo_up'=>0,      'bonus_stipendio'=>0.50, 'bonus_offerte'=>5, 'descr'=>'Super-agente. Tratta con i top club europei, +50% stipendio.'],
]);

function getAgente($player_id) {
    $db   = getDB();
    $stmt = $db->prepare("SELECT * FROM agente WHERE player_id=?");
    $stmt->execute([$player_id]);
    $ag   = $stmt->fetch();
    if (!$ag) { echo json_encode(['livello'=>0,'nome'=>null,'agenti'=>AGENTI]); return; }
    echo json_encode(array_merge($ag, ['agenti'=>AGENTI, 'info'=>AGENTI[$ag['livello']] ?? null]));
}

function assumiAgente($player_id, $data) {
    $db      = getDB();
    $livello = intval($data['livello'] ?? 1);
    if (!isset(AGENTI[$livello])) { echo json_encode(['error'=>'Agente non valido']); return; }

    $info   = AGENTI[$livello];
    $p      = $db->prepare("SELECT soldi FROM players WHERE id=?")->execute([$player_id]);
    $player = $db->prepare("SELECT soldi,anno_corrente FROM players WHERE id=?")->execute([$player_id]) ? null : null;
    $stmt   = $db->prepare("SELECT soldi,anno_corrente FROM players WHERE id=?");
    $stmt->execute([$player_id]);
    $player = $stmt->fetch();

    if ($player['soldi'] < $info['costo']) {
        echo json_encode(['error'=>'Soldi insufficienti. Servono €'.number_format($info['costo'])]); return;
    }

    // Controlla se ha già un agente
    $stmt = $db->prepare("SELECT * FROM agente WHERE player_id=?");
    $stmt->execute([$player_id]);
    $existing = $stmt->fetch();

    if ($existing && $existing['livello'] >= $livello) {
        echo json_encode(['error'=>'Hai già un agente di livello uguale o superiore']); return;
    }

    $db->prepare("UPDATE players SET soldi=soldi-? WHERE id=?")->execute([$info['costo'], $player_id]);

    if ($existing) {
        $db->prepare("UPDATE agente SET livello=?,nome=?,acquistato_anno=? WHERE player_id=?")
           ->execute([$livello, $info['nome'], $player['anno_corrente'], $player_id]);
    } else {
        $db->prepare("INSERT INTO agente (player_id,livello,nome,acquistato_anno) VALUES(?,?,?,?)")
           ->execute([$player_id, $livello, $info['nome'], $player['anno_corrente']]);
    }

    // Genera notizia
    generaNotizia($db, $player_id, $player['anno_corrente'], 1,
        "Nuovo agente: {$info['nome']}!",
        "Hai ingaggiato {$info['nome']} come tuo agente personale. Con la sua esperienza, il tuo stipendio aumenterà del ".($info['bonus_stipendio']*100)."% e riceverai più offerte dai club.",
        'agente'
    );

    echo json_encode(['success'=>true, 'msg'=>"Hai ingaggiato {$info['nome']} come agente!"]);
}

function upgradeAgente($player_id) {
    $db   = getDB();
    $stmt = $db->prepare("SELECT * FROM agente WHERE player_id=?");
    $stmt->execute([$player_id]);
    $ag   = $stmt->fetch();

    if (!$ag) { echo json_encode(['error'=>'Non hai ancora un agente']); return; }
    $next = $ag['livello'] + 1;
    if (!isset(AGENTI[$next])) { echo json_encode(['error'=>'Hai già il massimo livello']); return; }

    $info = AGENTI[$next];
    $prev_costo = AGENTI[$ag['livello']]['costo_up'];

    $stmt = $db->prepare("SELECT soldi,anno_corrente FROM players WHERE id=?");
    $stmt->execute([$player_id]);
    $player = $stmt->fetch();

    if ($player['soldi'] < $prev_costo) {
        echo json_encode(['error'=>'Soldi insufficienti. Servono €'.number_format($prev_costo)]); return;
    }

    $db->prepare("UPDATE players SET soldi=soldi-? WHERE id=?")->execute([$prev_costo, $player_id]);
    $db->prepare("UPDATE agente SET livello=?,nome=?,acquistato_anno=? WHERE player_id=?")
       ->execute([$next, $info['nome'], $player['anno_corrente'], $player_id]);

    generaNotizia($db, $player_id, $player['anno_corrente'], 1,
        "Agente promosso: {$info['nome']}",
        "Il tuo nuovo agente {$info['nome']} aprirà porte che prima erano chiuse. Stipendio +".($info['bonus_stipendio']*100)."%, {$info['bonus_offerte']} offerte bonus al mese.",
        'agente'
    );

    echo json_encode(['success'=>true, 'msg'=>"Agente aggiornato: {$info['nome']}!"]);
}

function generaNotizia($db, $player_id, $anno, $mese, $titolo, $testo, $tipo='info') {
    $db->prepare("INSERT INTO notizie (player_id,anno,mese,titolo,testo,tipo) VALUES(?,?,?,?,?,?)")
       ->execute([$player_id, $anno, $mese, $titolo, $testo, $tipo]);
}
