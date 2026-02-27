<?php
require_once '../config/db.php';

$raw = file_get_contents('php://input');
$data = json_decode($raw, true) ?: [];
$action = $data['action'] ?? $_GET['action'] ?? $_POST['action'] ?? '';

switch ($action) {
    case 'register': doRegister($data); break;
    case 'login':    doLogin($data);    break;
    case 'logout':   doLogout($data);   break;
    case 'check':    doCheck();         break;
    default: echo json_encode(['error' => 'Azione non trovata: ' . $action]);
}

function doRegister($data) {
    $db = getDB();
    $username    = trim($data['username'] ?? '');
    $password    = $data['password'] ?? '';
    $player_name = trim($data['player_name'] ?? '');
    $gender      = $data['gender'] ?? 'male';
    $nationality = $data['nationality'] ?? 'Italy';
    $age         = intval($data['age'] ?? 17);

    if (!$username || !$password || !$player_name) {
        echo json_encode(['error' => 'Compila tutti i campi']); return;
    }
    if ($age < 16 || $age > 19) {
        echo json_encode(['error' => 'Età non valida (16-19)']); return;
    }

    $overall = rand(60, 70);

    try {
        $stmt = $db->prepare("INSERT INTO players 
            (username, password, player_name, gender, nationality, age, overall, tiro, velocita, dribbling, fisico, mentalita) 
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?)");
        $stmt->execute([
            $username,
            password_hash($password, PASSWORD_DEFAULT),
            $player_name,
            $gender,
            $nationality,
            $age,
            $overall,
            rand(55,70), rand(55,70), rand(55,70), rand(55,70), rand(55,70)
        ]);
        $player_id = (int)$db->lastInsertId();
        $token = createToken($db, $player_id);
        echo json_encode(['success' => true, 'token' => $token, 'player_id' => $player_id]);
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) {
            echo json_encode(['error' => 'Username già in uso']);
        } else {
            echo json_encode(['error' => 'Errore DB: ' . $e->getMessage()]);
        }
    }
}

function doLogin($data) {
    $db = getDB();
    $username = trim($data['username'] ?? '');
    $password = $data['password'] ?? '';

    if (!$username || !$password) {
        echo json_encode(['error' => 'Inserisci username e password']); return;
    }

    $stmt = $db->prepare("SELECT * FROM players WHERE username = ?");
    $stmt->execute([$username]);
    $player = $stmt->fetch();

    if ($player && password_verify($password, $player['password'])) {
        $token = createToken($db, $player['id']);
        unset($player['password']);
        echo json_encode(['success' => true, 'token' => $token, 'player' => $player]);
    } else {
        echo json_encode(['error' => 'Username o password non corretti']);
    }
}

function doLogout($data) {
    $token = getToken();
    if ($token) {
        $db = getDB();
        $db->prepare("DELETE FROM auth_tokens WHERE token = ?")->execute([$token]);
    }
    echo json_encode(['success' => true]);
}

function doCheck() {
    $player_id = getAuthPlayerId();
    if ($player_id) {
        echo json_encode(['logged' => true, 'player_id' => $player_id]);
    } else {
        echo json_encode(['logged' => false]);
    }
}

function createToken($db, $player_id) {
    // Elimina token vecchi di questo utente
    $db->prepare("DELETE FROM auth_tokens WHERE player_id = ?")->execute([$player_id]);
    $token = generateToken();
    $expires = date('Y-m-d H:i:s', strtotime('+30 days'));
    $db->prepare("INSERT INTO auth_tokens (player_id, token, expires_at) VALUES (?,?,?)")
       ->execute([$player_id, $token, $expires]);
    return $token;
}
