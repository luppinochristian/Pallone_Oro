<?php
require_once '../config/db.php';

$player_id = getAuthPlayerId();
if (!$player_id) { echo json_encode(['error' => 'Non autenticato']); exit; }

$raw    = file_get_contents('php://input');
$data   = json_decode($raw, true) ?: [];
$action = $data['action'] ?? $_GET['action'] ?? '';

// =====================================================
// DEFINISCI AGENTI PRIMA DELLO SWITCH (fix "risposta non valida")
// =====================================================
if (!defined('AGENTI')) {
    define('AGENTI', [
        1 => ['nome'=>'Marco Ferretti',    'costo'=>15000,  'costo_up'=>30000,  'bonus_stipendio'=>0.10,'bonus_ovr_sconto'=>2.5,  'pop_richiesta'=>0,  'descr'=>'Agente locale. +10% stipendio, -2.5% OVR richiesto per trasferimenti.'],
        2 => ['nome'=>'Carlos Mendez',     'costo'=>40000,  'costo_up'=>80000,  'bonus_stipendio'=>0.20,'bonus_ovr_sconto'=>5.0,  'pop_richiesta'=>25, 'descr'=>'Agente internazionale. +20% stipendio, -5% OVR. Sblocca a 25 popolarità.'],
        3 => ['nome'=>'James Whitfield',   'costo'=>100000, 'costo_up'=>180000, 'bonus_stipendio'=>0.35,'bonus_ovr_sconto'=>7.5,  'pop_richiesta'=>50, 'descr'=>'Agente top europeo. +35% stipendio, -7.5% OVR. Sblocca a 50 popolarità.'],
        4 => ['nome'=>'Alexandre Dupont',  'costo'=>250000, 'costo_up'=>0,      'bonus_stipendio'=>0.50,'bonus_ovr_sconto'=>10.0, 'pop_richiesta'=>75, 'descr'=>'Super-agente. +50% stipendio, -10% OVR. Solo per star: 75 popolarità.'],
    ]);
}

switch ($action) {
    case 'get':     getAgente($player_id);           break;
    case 'assumi':  assumiAgente($player_id, $data);  break;
    case 'upgrade': upgradeAgente($player_id);        break;
    default: echo json_encode(['error' => 'Azione non trovata']);
}

function getAgente($player_id) {
    $db   = getDB();
    $stmt = $db->prepare("SELECT a.*, p.popolarita, p.soldi FROM agente a JOIN players p ON a.player_id=p.id WHERE a.player_id=?");
    $stmt->execute([$player_id]);
    $ag   = $stmt->fetch();

    if (!$ag) {
        $stmt2 = $db->prepare("SELECT popolarita, soldi FROM players WHERE id=?");
        $stmt2->execute([$player_id]);
        $p = $stmt2->fetch();
        echo json_encode([
            'livello'    => 0,
            'nome'       => null,
            'agenti'     => AGENTI,
            'popolarita' => (int)($p['popolarita'] ?? 0),
            'soldi'      => (float)($p['soldi'] ?? 0),
        ]);
        return;
    }
    echo json_encode(array_merge($ag, [
        'agenti' => AGENTI,
        'info'   => AGENTI[$ag['livello']] ?? null,
    ]));
}

function assumiAgente($player_id, $data) {
    $db      = getDB();
    $livello = intval($data['livello'] ?? 1);
    if (!isset(AGENTI[$livello])) { echo json_encode(['error'=>'Agente non valido']); return; }

    $info = AGENTI[$livello];
    $stmt = $db->prepare("SELECT soldi, popolarita, anno_corrente, mese_corrente FROM players WHERE id=?");
    $stmt->execute([$player_id]);
    $player = $stmt->fetch();

    if ($player['popolarita'] < $info['pop_richiesta']) {
        echo json_encode(['error'=>"Popolarità insufficiente. Serve almeno {$info['pop_richiesta']} (hai {$player['popolarita']})"]); return;
    }

    $stmt = $db->prepare("SELECT livello FROM agente WHERE player_id=?");
    $stmt->execute([$player_id]);
    $existing = $stmt->fetch();
    if ($existing && $existing['livello'] >= $livello) {
        echo json_encode(['error'=>'Hai già un agente di livello uguale o superiore']); return;
    }

    $costo = $info['costo'];
    if ($existing && $existing['livello'] > 0) {
        $costo = AGENTI[$existing['livello']]['costo_up'] ?? $info['costo'];
    }

    if ($player['soldi'] < $costo) {
        echo json_encode(['error'=>'Soldi insufficienti. Servono €'.number_format($costo)]); return;
    }

    $db->prepare("UPDATE players SET soldi=soldi-? WHERE id=?")->execute([$costo, $player_id]);

    if ($existing) {
        $db->prepare("UPDATE agente SET livello=?,nome=?,acquistato_anno=? WHERE player_id=?")
           ->execute([$livello, $info['nome'], $player['anno_corrente'], $player_id]);
    } else {
        $db->prepare("INSERT INTO agente (player_id,livello,nome,acquistato_anno) VALUES(?,?,?,?)")
           ->execute([$player_id, $livello, $info['nome'], $player['anno_corrente']]);
    }

    $db->prepare("INSERT INTO notizie (player_id,anno,mese,titolo,testo,tipo) VALUES(?,?,?,?,?,?)")
       ->execute([$player_id, $player['anno_corrente'], $player['mese_corrente'],
           "🤝 Nuovo agente: {$info['nome']}",
           "Hai ingaggiato {$info['nome']} come agente. +".intval($info['bonus_stipendio']*100)."% stipendio ogni mese e -".$info['bonus_ovr_sconto']."% OVR richiesto per i trasferimenti.",
           'agente'
       ]);

    echo json_encode(['success'=>true, 'msg'=>"Hai ingaggiato {$info['nome']}!"]);
}

function upgradeAgente($player_id) {
    $db   = getDB();
    $stmt = $db->prepare("SELECT * FROM agente WHERE player_id=?");
    $stmt->execute([$player_id]);
    $ag   = $stmt->fetch();
    if (!$ag) { echo json_encode(['error'=>'Non hai ancora un agente']); return; }
    $next = $ag['livello'] + 1;
    if (!isset(AGENTI[$next])) { echo json_encode(['error'=>'Hai già il massimo livello']); return; }
    assumiAgente($player_id, ['livello' => $next]);
}
