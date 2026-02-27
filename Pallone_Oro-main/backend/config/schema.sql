CREATE DATABASE IF NOT EXISTS golden_striker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE golden_striker;

CREATE TABLE IF NOT EXISTS players (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    player_name VARCHAR(100) NOT NULL,
    gender ENUM('male','female') DEFAULT 'male',
    nationality VARCHAR(100) DEFAULT 'Italy',
    age INT DEFAULT 16,
    overall INT DEFAULT 65,
    tiro INT DEFAULT 60,
    velocita INT DEFAULT 60,
    dribbling INT DEFAULT 60,
    fisico INT DEFAULT 60,
    mentalita INT DEFAULT 60,
    popolarita INT DEFAULT 10,
    energia INT DEFAULT 100,
    morale INT DEFAULT 75,
    soldi DECIMAL(15,2) DEFAULT 5000.00,
    gol_carriera INT DEFAULT 0,
    assist_carriera INT DEFAULT 0,
    palloni_doro INT DEFAULT 0,
    trofei INT DEFAULT 0,
    struttura_livello INT DEFAULT 0,
    team_id INT DEFAULT 1,
    mese_corrente INT DEFAULT 1,
    anno_corrente INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auth_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    player_id INT NOT NULL,
    token VARCHAR(64) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS teams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    stelle INT DEFAULT 1,
    popolarita INT DEFAULT 20,
    budget BIGINT DEFAULT 1000000,
    moltiplicatore_stipendio DECIMAL(5,2) DEFAULT 1.0,
    obiettivo VARCHAR(100) DEFAULT 'Salvezza',
    probabilita_trofeo INT DEFAULT 5
);

CREATE TABLE IF NOT EXISTS stagioni (
    id INT AUTO_INCREMENT PRIMARY KEY,
    player_id INT NOT NULL,
    anno INT NOT NULL,
    gol INT DEFAULT 0,
    assist INT DEFAULT 0,
    partite INT DEFAULT 0,
    media_voto DECIMAL(4,2) DEFAULT 6.0,
    trofei_vinti INT DEFAULT 0,
    pallone_doro_pos INT DEFAULT 0,
    stipendio_totale DECIMAL(15,2) DEFAULT 0,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS log_mensile (
    id INT AUTO_INCREMENT PRIMARY KEY,
    player_id INT NOT NULL,
    anno INT NOT NULL,
    mese INT NOT NULL,
    azione VARCHAR(200),
    risultato TEXT,
    gol INT DEFAULT 0,
    assist INT DEFAULT 0,
    voto DECIMAL(4,2) DEFAULT 6.0,
    evento_speciale VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS strutture (
    livello INT PRIMARY KEY,
    nome VARCHAR(100),
    costo INT,
    bonus_allenamento INT DEFAULT 0,
    bonus_crescita INT DEFAULT 0,
    riduzione_infortuni INT DEFAULT 0,
    descrizione TEXT
);

-- Teams data
INSERT IGNORE INTO teams (nome, stelle, popolarita, budget, moltiplicatore_stipendio, obiettivo, probabilita_trofeo) VALUES
('Atletico Riviera', 1, 15, 500000, 0.8, 'Salvezza', 2),
('FC Monteforte', 2, 30, 2000000, 1.2, 'Playoff', 10),
('Sporting Centrale', 3, 50, 8000000, 1.8, 'Top 4', 25),
('Dynamo Capitale', 4, 75, 30000000, 2.5, 'Campionato', 50),
('Global FC', 5, 100, 150000000, 4.0, 'Tutto', 80);

-- Strutture data
INSERT IGNORE INTO strutture (livello, nome, costo, bonus_allenamento, bonus_crescita, riduzione_infortuni, descrizione) VALUES
(1, 'Campetto Base', 50000, 1, 0, 0, '+1 allenamento bonus al mese'),
(2, 'Centro Moderno', 200000, 2, 2, 5, '+2 crescita stats, -5% rischio infortuni'),
(3, 'Centro High-Tech', 600000, 3, 20, 10, '+20% crescita, recupero energia migliorato'),
(4, 'Academy Personale', 1500000, 5, 35, 20, 'Staff completo, crescita +35%, sponsor automatici');
