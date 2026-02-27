<?php
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', 'root');   // ← cambia se la tua password è diversa (es. '' per nessuna password)
define('DB_NAME', 'golden_striker');

function getDB() {
    static $pdo = null;
    if ($pdo === null) {

        // Controlla che il driver pdo_mysql sia caricato
        if (!extension_loaded('pdo_mysql')) {
            http_response_code(500);
            die(json_encode([
                'error' => 'Driver PHP pdo_mysql mancante. Esegui: sudo apt install php' . PHP_MAJOR_VERSION . '.' . PHP_MINOR_VERSION . '-mysql  poi riavvia il server.'
            ]));
        }

        // Prova prima con la password configurata, poi senza
        $passwords = [DB_PASS, '', 'root'];
        $lastError = '';
        foreach (array_unique($passwords) as $pwd) {
            try {
                $pdo = new PDO(
                    "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
                    DB_USER,
                    $pwd,
                    [
                        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                        PDO::ATTR_TIMEOUT            => 5,
                    ]
                );
                return $pdo; // connessione riuscita
            } catch (PDOException $e) {
                $lastError = $e->getMessage();
                $pdo = null;
            }
        }

        // Tutte le password fallite → messaggio chiaro
        http_response_code(500);
        die(json_encode([
            'error' => 'Connessione al database fallita. ' .
                       'Assicurati che MySQL sia attivo (sudo service mysql start) ' .
                       'e che il database esista (bash start.sh). ' .
                       'Errore: ' . $lastError
        ]));
    }
    return $pdo;
}

// CORS — necessario per sviluppo locale e Codespaces
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Auth-Token');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ─── Token auth ──────────────────────────────────────────────────────────────
function getToken() {
    foreach ($_SERVER as $k => $v) {
        if (strpos($k, 'HTTP_') === 0) {
            $key = str_replace('_', '-', substr($k, 5));
            if ($key === 'X-AUTH-TOKEN') return $v;
        }
    }
    if (!empty($_GET['token']))  return $_GET['token'];
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
    $db   = getDB();
    $stmt = $db->prepare("SELECT player_id FROM auth_tokens WHERE token = ? AND expires_at > NOW()");
    $stmt->execute([$token]);
    $row  = $stmt->fetch();
    return $row ? (int)$row['player_id'] : null;
}

function generateToken() {
    return bin2hex(random_bytes(32));
}
