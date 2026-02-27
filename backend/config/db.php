<?php
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', 'root');
define('DB_NAME', 'golden_striker');

function getDB() {
    static $pdo = null;
    if ($pdo === null) {
        try {
            $pdo = new PDO(
                "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
                DB_USER,
                DB_PASS,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
                ]
            );
        } catch (PDOException $e) {
            http_response_code(500);
            die(json_encode(['error' => 'DB connection failed: ' . $e->getMessage()]));
        }
    }
    return $pdo;
}

// CORS - necessario per Codespaces
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Auth-Token');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Legge il token da header o parametri
function getToken() {
    $headers = [];
    foreach ($_SERVER as $k => $v) {
        if (strpos($k, 'HTTP_') === 0) {
            $key = str_replace('_', '-', substr($k, 5));
            $headers[$key] = $v;
        }
    }
    if (!empty($headers['X-AUTH-TOKEN'])) return $headers['X-AUTH-TOKEN'];
    if (!empty($_GET['token'])) return $_GET['token'];
    
    // Dal body JSON
    $raw = file_get_contents('php://input');
    if ($raw) {
        $body = json_decode($raw, true);
        if (!empty($body['token'])) return $body['token'];
    }
    return null;
}

function getAuthPlayerId() {
    $token = getToken();
    if (!$token) return null;
    $db = getDB();
    $stmt = $db->prepare("SELECT player_id FROM auth_tokens WHERE token = ? AND expires_at > NOW()");
    $stmt->execute([$token]);
    $row = $stmt->fetch();
    return $row ? (int)$row['player_id'] : null;
}

function generateToken() {
    return bin2hex(random_bytes(32));
}
