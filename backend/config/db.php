<?php
// SQLite — funziona subito, zero configurazione
define('DB_PATH', __DIR__ . '/../../golden_striker.sqlite');

function getDB() {
    static $pdo = null;
    if ($pdo === null) {
        try {
            $pdo = new PDO('sqlite:' . DB_PATH, null, null, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]);
            $pdo->exec('PRAGMA journal_mode=WAL;');
            $pdo->exec('PRAGMA foreign_keys=ON;');
            initSchema($pdo);
        } catch (PDOException $e) {
            http_response_code(500);
            die(json_encode(['error' => 'Errore database: ' . $e->getMessage()]));
        }
    }
    return $pdo;
}

function initSchema($pdo) {
    $pdo->exec("CREATE TABLE IF NOT EXISTS players (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        player_name TEXT NOT NULL,
        gender TEXT DEFAULT 'male',
        nationality TEXT DEFAULT 'Italy',
        age INTEGER DEFAULT 16,
        overall INTEGER DEFAULT 65,
        tiro INTEGER DEFAULT 60,
        velocita INTEGER DEFAULT 60,
        dribbling INTEGER DEFAULT 60,
        fisico INTEGER DEFAULT 60,
        mentalita INTEGER DEFAULT 60,
        popolarita INTEGER DEFAULT 10,
        energia INTEGER DEFAULT 100,
        morale INTEGER DEFAULT 75,
        soldi REAL DEFAULT 5000.00,
        gol_carriera INTEGER DEFAULT 0,
        assist_carriera INTEGER DEFAULT 0,
        palloni_doro INTEGER DEFAULT 0,
        trofei INTEGER DEFAULT 0,
        struttura_livello INTEGER DEFAULT 0,
        team_id INTEGER DEFAULT 1,
        mese_corrente INTEGER DEFAULT 1,
        anno_corrente INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS auth_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_id INTEGER NOT NULL,
        token TEXT NOT NULL UNIQUE,
        expires_at TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS teams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        stelle INTEGER DEFAULT 1,
        popolarita INTEGER DEFAULT 20,
        budget INTEGER DEFAULT 1000000,
        moltiplicatore_stipendio REAL DEFAULT 1.0,
        obiettivo TEXT DEFAULT 'Salvezza',
        probabilita_trofeo INTEGER DEFAULT 5
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS stagioni (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_id INTEGER NOT NULL,
        anno INTEGER NOT NULL,
        gol INTEGER DEFAULT 0,
        assist INTEGER DEFAULT 0,
        partite INTEGER DEFAULT 0,
        media_voto REAL DEFAULT 6.0,
        trofei_vinti INTEGER DEFAULT 0,
        pallone_doro_pos INTEGER DEFAULT 0,
        stipendio_totale REAL DEFAULT 0,
        FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS log_mensile (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_id INTEGER NOT NULL,
        anno INTEGER NOT NULL,
        mese INTEGER NOT NULL,
        azione TEXT,
        risultato TEXT,
        gol INTEGER DEFAULT 0,
        assist INTEGER DEFAULT 0,
        voto REAL DEFAULT 6.0,
        evento_speciale TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS strutture (
        livello INTEGER PRIMARY KEY,
        nome TEXT,
        costo INTEGER,
        bonus_allenamento INTEGER DEFAULT 0,
        bonus_crescita INTEGER DEFAULT 0,
        riduzione_infortuni INTEGER DEFAULT 0,
        descrizione TEXT
    )");

    // Inserisci teams se non esistono
    $count = $pdo->query("SELECT COUNT(*) as c FROM teams")->fetch();
    if ($count['c'] == 0) {
        $pdo->exec("INSERT INTO teams (nome, stelle, popolarita, budget, moltiplicatore_stipendio, obiettivo, probabilita_trofeo) VALUES
            ('Atletico Riviera', 1, 15, 500000, 0.8, 'Salvezza', 2),
            ('FC Monteforte', 2, 30, 2000000, 1.2, 'Playoff', 10),
            ('Sporting Centrale', 3, 50, 8000000, 1.8, 'Top 4', 25),
            ('Dynamo Capitale', 4, 75, 30000000, 2.5, 'Campionato', 50),
            ('Global FC', 5, 100, 150000000, 4.0, 'Tutto', 80)
        ");
    }

    // Inserisci strutture se non esistono
    $count = $pdo->query("SELECT COUNT(*) as c FROM strutture")->fetch();
    if ($count['c'] == 0) {
        $pdo->exec("INSERT INTO strutture (livello, nome, costo, bonus_allenamento, bonus_crescita, riduzione_infortuni, descrizione) VALUES
            (1, 'Campetto Base', 50000, 1, 0, 0, '+1 allenamento bonus al mese'),
            (2, 'Centro Moderno', 200000, 2, 2, 5, '+2 crescita stats, -5% rischio infortuni'),
            (3, 'Centro High-Tech', 600000, 3, 20, 10, '+20% crescita, recupero energia migliorato'),
            (4, 'Academy Personale', 1500000, 5, 35, 20, 'Staff completo, crescita +35%, sponsor automatici')
        ");
    }
}

// CORS
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Auth-Token');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

function getToken() {
    foreach ($_SERVER as $k => $v) {
        if (strpos($k, 'HTTP_') === 0) {
            $key = str_replace('_', '-', substr($k, 5));
            if ($key === 'X-AUTH-TOKEN') return $v;
        }
    }
    if (!empty($_GET['token'])) return $_GET['token'];
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
    $stmt = $db->prepare("SELECT player_id FROM auth_tokens WHERE token = ? AND expires_at > datetime('now')");
    $stmt->execute([$token]);
    $row  = $stmt->fetch();
    return $row ? (int)$row['player_id'] : null;
}

function generateToken() {
    return bin2hex(random_bytes(32));
}
