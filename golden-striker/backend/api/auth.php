<?php
require_once '../config/db.php';

$action = $_POST['action'] ?? $_GET['action'] ?? '';

switch ($action) {
    case 'register':
        register();
        break;
    case 'login':
        login();
        break;
    case 'logout':
        $_SESSION = [];
        session_destroy();
        echo json_encode(['success' => true]);
        break;
    case 'check':
        if (isset($_SESSION['player_id'])) {
            echo json_encode(['logged' => true, 'player_id' => $_SESSION['player_id']]);
        } else {
            echo json_encode(['logged' => false]);
        }
        break;
    default:
        echo json_encode(['error' => 'Action not found']);
}

function register() {
    $db = getDB();
    $data = json_decode(file_get_contents('php://input'), true) ?: $_POST;
    
    $username = trim($data['username'] ?? '');
    $password = $data['password'] ?? '';
    $player_name = trim($data['player_name'] ?? '');
    $gender = $data['gender'] ?? 'male';
    $nationality = $data['nationality'] ?? 'Italy';
    $age = intval($data['age'] ?? 17);

    if (!$username || !$password || !$player_name) {
        echo json_encode(['error' => 'Dati mancanti']); return;
    }
    if ($age < 16 || $age > 19) { echo json_encode(['error' => 'Età non valida (16-19)']); return; }

    // Random starting stats
    $overall = rand(60, 70);
    $stats = [
        'tiro' => rand(55, 70),
        'velocita' => rand(55, 70),
        'dribbling' => rand(55, 70),
        'fisico' => rand(55, 70),
        'mentalita' => rand(55, 70),
    ];

    try {
        $stmt = $db->prepare("INSERT INTO players (username, password, player_name, gender, nationality, age, overall, tiro, velocita, dribbling, fisico, mentalita) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)");
        $stmt->execute([
            $username, password_hash($password, PASSWORD_DEFAULT), $player_name,
            $gender, $nationality, $age, $overall,
            $stats['tiro'], $stats['velocita'], $stats['dribbling'], $stats['fisico'], $stats['mentalita']
        ]);
        $player_id = $db->lastInsertId();
        $_SESSION['player_id'] = $player_id;
        echo json_encode(['success' => true, 'player_id' => $player_id]);
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) {
            echo json_encode(['error' => 'Username già in uso']);
        } else {
            echo json_encode(['error' => $e->getMessage()]);
        }
    }
}

function login() {
    $db = getDB();
    $data = json_decode(file_get_contents('php://input'), true) ?: $_POST;
    $username = trim($data['username'] ?? '');
    $password = $data['password'] ?? '';

    if (!$username || !$password) { echo json_encode(['error' => 'Dati mancanti']); return; }

    $stmt = $db->prepare("SELECT * FROM players WHERE username = ?");
    $stmt->execute([$username]);
    $player = $stmt->fetch();

    if ($player && password_verify($password, $player['password'])) {
        $_SESSION['player_id'] = $player['id'];
        unset($player['password']);
        echo json_encode(['success' => true, 'player' => $player]);
    } else {
        echo json_encode(['error' => 'Credenziali non valide']);
    }
}
