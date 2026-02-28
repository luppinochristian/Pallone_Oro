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

CREATE TABLE IF NOT EXISTS nazioni (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    bandiera VARCHAR(10) DEFAULT '🌍'
);

CREATE TABLE IF NOT EXISTS leghe (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    nazione_id INT NOT NULL,
    livello INT DEFAULT 1,
    FOREIGN KEY (nazione_id) REFERENCES nazioni(id)
);

CREATE TABLE IF NOT EXISTS teams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    stelle INT DEFAULT 1,
    popolarita INT DEFAULT 20,
    budget BIGINT DEFAULT 1000000,
    moltiplicatore_stipendio DECIMAL(5,2) DEFAULT 1.0,
    obiettivo VARCHAR(100) DEFAULT 'Salvezza',
    probabilita_trofeo INT DEFAULT 5,
    lega_id INT DEFAULT 1,
    posizione_classifica INT DEFAULT 10
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
    team_nome VARCHAR(100) DEFAULT '',
    lega_nome VARCHAR(100) DEFAULT '',
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

-- NAZIONI
INSERT IGNORE INTO nazioni (id, nome, bandiera) VALUES
(1,'Valdoria','🟦'),(2,'Rethonia','🟥'),(3,'Caldera','🟨'),(4,'Nordheim','⬜'),(5,'Solantis','🟩');

-- LEGHE
INSERT IGNORE INTO leghe (id, nome, nazione_id, livello) VALUES
(1,'Primera Valdoria',1,1),(2,'Segunda Valdoria',1,2),
(3,'Lega Suprema Rethonia',2,1),(4,'Lega Nazionale Rethonia',2,2),
(5,'Caldera Elite',3,1),(6,'Caldera Challenge',3,2),
(7,'Nordliga Premier',4,1),(8,'Nordliga Erste',4,2),
(9,'Solantis First Division',5,1),(10,'Solantis Second Division',5,2);

-- SQUADRE VALDORIA - Prima Divisione (lega 1)
INSERT IGNORE INTO teams (nome,stelle,popolarita,budget,moltiplicatore_stipendio,obiettivo,probabilita_trofeo,lega_id) VALUES
('Reale Valdoria FC',5,98,180000000,4.5,'Dominare tutto',85,1),
('Atletico Porto Sole',5,90,120000000,4.0,'Campionato',75,1),
('Dynamo Valdoria',4,80,55000000,3.2,'Campionato',55,1),
('FC Valdemonte',4,75,45000000,3.0,'Top 4',40,1),
('Sporting Las Arenas',4,70,38000000,2.8,'Top 4',35,1),
('Unione Capitale',4,65,30000000,2.6,'Top 6',25,1),
('CF Poniente',3,58,18000000,2.0,'Top 8',15,1),
('Riviera United',3,54,14000000,1.8,'Top 8',12,1),
('Estrada SC',3,50,11000000,1.7,'Meta classifica',10,1),
('Real Castillo',3,47,9000000,1.6,'Meta classifica',8,1),
('Bahia Esperanza',3,44,7500000,1.5,'Meta classifica',6,1),
('Costera Vieja',3,41,6500000,1.4,'Salvezza',5,1),
('Vientos del Sur',3,38,5500000,1.3,'Salvezza',4,1),
('FC San Dorado',3,35,4800000,1.2,'Salvezza',3,1),
('Tropicana CF',3,32,4200000,1.2,'Salvezza',3,1),
('Puerto Viejo AC',2,28,3500000,1.0,'Salvezza',2,1),
('Los Alamos FC',2,25,3000000,1.0,'Salvezza',2,1),
('CD Valera',2,22,2500000,0.9,'Salvezza',1,1),
('Serena Baja United',2,20,2200000,0.9,'Salvezza',1,1),
('Mineros FC',2,18,2000000,0.8,'Salvezza',1,1);

-- SQUADRE VALDORIA - Seconda Divisione (lega 2)
INSERT IGNORE INTO teams (nome,stelle,popolarita,budget,moltiplicatore_stipendio,obiettivo,probabilita_trofeo,lega_id) VALUES
('SD Laguna',2,30,1800000,0.8,'Promozione',5,2),
('Atletico Nuevo',2,27,1500000,0.7,'Promozione',4,2),
('CF Montana',2,24,1300000,0.7,'Top 5',3,2),
('Real Nortena',2,21,1100000,0.6,'Top 5',2,2),
('Pampero SC',2,19,950000,0.6,'Meta classifica',2,2),
('Cruz del Sur FC',1,17,800000,0.5,'Meta classifica',1,2),
('Los Pinos',1,15,700000,0.5,'Meta classifica',1,2),
('Costera Sur',1,14,650000,0.5,'Salvezza',1,2),
('FC Alondra',1,13,600000,0.4,'Salvezza',1,2),
('CD Mirador',1,12,550000,0.4,'Salvezza',1,2),
('Rancho FC',1,11,500000,0.4,'Salvezza',1,2),
('Pelicano United',1,10,450000,0.4,'Salvezza',1,2),
('Vaqueros CF',1,10,420000,0.3,'Salvezza',1,2),
('SD Torreblanca',1,9,400000,0.3,'Salvezza',1,2),
('FC Tierra',1,9,380000,0.3,'Salvezza',1,2),
('Espiga FC',1,8,350000,0.3,'Salvezza',1,2),
('Brisa Marina',1,8,330000,0.3,'Salvezza',1,2),
('Los Olivos',1,7,300000,0.3,'Salvezza',1,2),
('CD Terral',1,7,280000,0.2,'Salvezza',1,2),
('Ventisca SC',1,6,250000,0.2,'Salvezza',1,2);

-- SQUADRE RETHONIA - Prima Divisione (lega 3)
INSERT IGNORE INTO teams (nome,stelle,popolarita,budget,moltiplicatore_stipendio,obiettivo,probabilita_trofeo,lega_id) VALUES
('Reth City FC',5,96,175000000,4.3,'Dominare tutto',82,3),
('FC Rethon United',5,88,115000000,3.9,'Campionato',72,3),
('Kronos Athletic',4,78,52000000,3.1,'Campionato',52,3),
('FC Kaldera',4,73,43000000,2.9,'Top 4',38,3),
('Tempest SC',4,68,36000000,2.7,'Top 4',32,3),
('Reth Rovers',4,63,28000000,2.5,'Top 6',22,3),
('Ironstone FC',3,56,17000000,1.9,'Top 8',14,3),
('Westport United',3,52,13500000,1.8,'Top 8',11,3),
('Northgate AC',3,48,10500000,1.6,'Meta classifica',9,3),
('FC Blackmoor',3,45,8500000,1.5,'Meta classifica',7,3),
('Steelhaven CF',3,42,7000000,1.4,'Meta classifica',5,3),
('Docklands SC',3,39,6000000,1.3,'Salvezza',4,3),
('FC Ashfield',3,36,5200000,1.2,'Salvezza',3,3),
('Riverton FC',3,33,4500000,1.2,'Salvezza',3,3),
('Coldbrook United',3,30,4000000,1.1,'Salvezza',2,3),
('Greymoor AC',2,27,3300000,1.0,'Salvezza',2,3),
('Highcliff FC',2,24,2800000,0.9,'Salvezza',1,3),
('Dunwater SC',2,21,2400000,0.9,'Salvezza',1,3),
('Moorside United',2,19,2100000,0.8,'Salvezza',1,3),
('FC Stoneford',2,17,1900000,0.8,'Salvezza',1,3);

-- SQUADRE RETHONIA - Seconda Divisione (lega 4)
INSERT IGNORE INTO teams (nome,stelle,popolarita,budget,moltiplicatore_stipendio,obiettivo,probabilita_trofeo,lega_id) VALUES
('Copperfield FC',2,29,1700000,0.8,'Promozione',5,4),
('Saltbridge United',2,26,1400000,0.7,'Promozione',4,4),
('FC Brownheath',2,23,1200000,0.6,'Top 5',3,4),
('Glenport Athletic',2,20,1050000,0.6,'Top 5',2,4),
('Hillwick SC',1,18,900000,0.5,'Meta classifica',2,4),
('Ferndale FC',1,16,780000,0.5,'Meta classifica',1,4),
('Bracklow United',1,14,680000,0.4,'Salvezza',1,4),
('Redmarsh FC',1,13,620000,0.4,'Salvezza',1,4),
('FC Whitechalk',1,12,570000,0.4,'Salvezza',1,4),
('Eastfield SC',1,11,520000,0.4,'Salvezza',1,4),
('Greystone FC',1,10,470000,0.3,'Salvezza',1,4),
('Thornwick AC',1,9,430000,0.3,'Salvezza',1,4),
('FC Coldmere',1,9,400000,0.3,'Salvezza',1,4),
('Haverfield United',1,8,370000,0.3,'Salvezza',1,4),
('Dawnford FC',1,8,340000,0.3,'Salvezza',1,4),
('Irongate SC',1,7,310000,0.2,'Salvezza',1,4),
('FC Bleakwater',1,7,290000,0.2,'Salvezza',1,4),
('Woodrow United',1,6,270000,0.2,'Salvezza',1,4),
('Stokeford FC',1,6,250000,0.2,'Salvezza',1,4),
('Oakmere Athletic',1,5,230000,0.2,'Salvezza',1,4);

-- SQUADRE CALDERA - Prima Divisione (lega 5)
INSERT IGNORE INTO teams (nome,stelle,popolarita,budget,moltiplicatore_stipendio,obiettivo,probabilita_trofeo,lega_id) VALUES
('Caldera Imperiale',5,94,170000000,4.2,'Dominare tutto',80,5),
('Vulcano FC',5,86,110000000,3.8,'Campionato',70,5),
('Magma Athletic',4,76,50000000,3.0,'Campionato',50,5),
('FC Fuego',4,71,41000000,2.8,'Top 4',36,5),
('Ceniza SC',4,66,34000000,2.6,'Top 4',30,5),
('Caldera Rovers',4,61,26000000,2.4,'Top 6',20,5),
('Lava United',3,54,16000000,1.9,'Top 8',13,5),
('Obsidiana FC',3,50,13000000,1.7,'Top 8',10,5),
('FC Basalto',3,46,10000000,1.6,'Meta classifica',8,5),
('Piroclasto CF',3,43,8200000,1.5,'Meta classifica',6,5),
('Tephra SC',3,40,6800000,1.4,'Meta classifica',5,5),
('FC Escoria',3,37,5800000,1.3,'Salvezza',4,5),
('Pumice United',3,34,5000000,1.2,'Salvezza',3,5),
('Tufa FC',3,31,4300000,1.1,'Salvezza',2,5),
('Ignimbrite CF',3,28,3800000,1.1,'Salvezza',2,5),
('Riolite AC',2,25,3100000,0.9,'Salvezza',1,5),
('FC Pozzolana',2,23,2700000,0.9,'Salvezza',1,5),
('Zeolite SC',2,20,2300000,0.8,'Salvezza',1,5),
('Calcite United',2,18,2000000,0.8,'Salvezza',1,5),
('Feldspato FC',2,16,1800000,0.7,'Salvezza',1,5);

-- SQUADRE CALDERA - Seconda Divisione (lega 6)
INSERT IGNORE INTO teams (nome,stelle,popolarita,budget,moltiplicatore_stipendio,obiettivo,probabilita_trofeo,lega_id) VALUES
('Cinder FC',2,28,1600000,0.7,'Promozione',4,6),
('Scoriae United',2,25,1350000,0.6,'Promozione',3,6),
('FC Flintstone',2,22,1150000,0.6,'Top 5',3,6),
('Lapilli SC',1,19,1000000,0.5,'Top 5',2,6),
('Tuff Athletic',1,17,860000,0.5,'Meta classifica',1,6),
('Agglomerate FC',1,15,740000,0.4,'Meta classifica',1,6),
('Rhyolite United',1,13,650000,0.4,'Salvezza',1,6),
('Phonolite FC',1,12,590000,0.4,'Salvezza',1,6),
('FC Andesite',1,11,540000,0.3,'Salvezza',1,6),
('Dacite SC',1,10,490000,0.3,'Salvezza',1,6),
('Comendite FC',1,9,450000,0.3,'Salvezza',1,6),
('Trachyte AC',1,8,410000,0.3,'Salvezza',1,6),
('FC Latite',1,8,380000,0.3,'Salvezza',1,6),
('Mugearite United',1,7,350000,0.2,'Salvezza',1,6),
('Hawaiite FC',1,7,320000,0.2,'Salvezza',1,6),
('Shoshonite SC',1,6,290000,0.2,'Salvezza',1,6),
('Kenyte FC',1,6,270000,0.2,'Salvezza',1,6),
('FC Icelandite',1,5,250000,0.2,'Salvezza',1,6),
('Boninite United',1,5,230000,0.2,'Salvezza',1,6),
('Adakite SC',1,4,200000,0.2,'Salvezza',1,6);

-- SQUADRE NORDHEIM - Prima Divisione (lega 7)
INSERT IGNORE INTO teams (nome,stelle,popolarita,budget,moltiplicatore_stipendio,obiettivo,probabilita_trofeo,lega_id) VALUES
('Nord Konig FC',5,93,165000000,4.1,'Dominare tutto',78,7),
('FC Eisenheim',5,85,108000000,3.7,'Campionato',68,7),
('Sturm Nordheim',4,75,48000000,2.9,'Campionato',48,7),
('Blitzkrieger AC',4,70,40000000,2.7,'Top 4',34,7),
('Frosthaven SC',4,65,33000000,2.5,'Top 4',28,7),
('Gletschner United',4,60,25000000,2.3,'Top 6',19,7),
('Wolfpack FC',3,53,15500000,1.8,'Top 8',12,7),
('Schneeberg United',3,49,12500000,1.7,'Top 8',10,7),
('FC Waldstein',3,45,9800000,1.5,'Meta classifica',8,7),
('Eisbach CF',3,42,8000000,1.4,'Meta classifica',6,7),
('Kaltberg SC',3,39,6600000,1.3,'Meta classifica',5,7),
('FC Dunkeltal',3,36,5600000,1.2,'Salvezza',4,7),
('Nordmark Athletic',3,33,4800000,1.2,'Salvezza',3,7),
('FC Steinbach',3,30,4100000,1.1,'Salvezza',2,7),
('Graustein United',3,27,3600000,1.0,'Salvezza',2,7),
('Eisenklinge AC',2,24,2900000,0.9,'Salvezza',1,7),
('FC Nebelhain',2,22,2500000,0.8,'Salvezza',1,7),
('Sumpfwald SC',2,19,2100000,0.8,'Salvezza',1,7),
('Fichtenbach FC',2,17,1900000,0.7,'Salvezza',1,7),
('Moosbach United',2,15,1700000,0.7,'Salvezza',1,7);

-- SQUADRE NORDHEIM - Seconda Divisione (lega 8)
INSERT IGNORE INTO teams (nome,stelle,popolarita,budget,moltiplicatore_stipendio,obiettivo,probabilita_trofeo,lega_id) VALUES
('Birkental FC',2,27,1500000,0.7,'Promozione',4,8),
('Kiefernhang United',2,24,1280000,0.6,'Promozione',3,8),
('FC Erlenwies',2,21,1100000,0.6,'Top 5',3,8),
('Tannenbach SC',1,18,950000,0.5,'Top 5',2,8),
('Eschenau Athletic',1,16,820000,0.5,'Meta classifica',1,8),
('Lindenfeld FC',1,14,710000,0.4,'Meta classifica',1,8),
('FC Ahorntal',1,12,620000,0.4,'Salvezza',1,8),
('Buchenwald United',1,11,560000,0.3,'Salvezza',1,8),
('Weidenpfad SC',1,10,510000,0.3,'Salvezza',1,8),
('FC Ulmenbach',1,9,460000,0.3,'Salvezza',1,8),
('Haselnuss FC',1,8,420000,0.3,'Salvezza',1,8),
('Kastanie United',1,8,390000,0.2,'Salvezza',1,8),
('FC Nussbaum',1,7,360000,0.2,'Salvezza',1,8),
('Pflaume SC',1,7,330000,0.2,'Salvezza',1,8),
('FC Kirschblute',1,6,300000,0.2,'Salvezza',1,8),
('Apfelbach Athletic',1,6,280000,0.2,'Salvezza',1,8),
('FC Birnental',1,5,260000,0.2,'Salvezza',1,8),
('Quittenwald United',1,5,240000,0.2,'Salvezza',1,8),
('Zwetschge SC',1,4,220000,0.2,'Salvezza',1,8),
('Holunderbach FC',1,4,200000,0.1,'Salvezza',1,8);

-- SQUADRE SOLANTIS - Prima Divisione (lega 9)
INSERT IGNORE INTO teams (nome,stelle,popolarita,budget,moltiplicatore_stipendio,obiettivo,probabilita_trofeo,lega_id) VALUES
('Solantis FC',5,92,160000000,4.0,'Dominare tutto',76,9),
('Aurum Athletic',5,84,105000000,3.6,'Campionato',65,9),
('Crystalia SC',4,74,47000000,2.9,'Campionato',46,9),
('FC Luminos',4,69,39000000,2.7,'Top 4',32,9),
('Solaris United',4,64,32000000,2.5,'Top 4',27,9),
('Prism CF',4,59,24000000,2.2,'Top 6',18,9),
('Radiance FC',3,52,15000000,1.8,'Top 8',11,9),
('FC Spectra',3,48,12000000,1.7,'Top 8',9,9),
('Novus SC',3,44,9500000,1.5,'Meta classifica',7,9),
('FC Claros',3,41,7800000,1.4,'Meta classifica',6,9),
('Vivace United',3,38,6400000,1.3,'Meta classifica',4,9),
('FC Sereno',3,35,5400000,1.2,'Salvezza',3,9),
('Brillo Athletic',3,32,4600000,1.1,'Salvezza',3,9),
('FC Fulgor',3,29,3900000,1.1,'Salvezza',2,9),
('Scintilla SC',3,26,3400000,1.0,'Salvezza',1,9),
('Fulgido AC',2,23,2700000,0.9,'Salvezza',1,9),
('FC Risplende',2,21,2300000,0.8,'Salvezza',1,9),
('Sfavillante SC',2,18,2000000,0.7,'Salvezza',1,9),
('Lucente United',2,16,1800000,0.7,'Salvezza',1,9),
('Brillante FC',2,14,1600000,0.6,'Salvezza',1,9);

-- SQUADRE SOLANTIS - Seconda Divisione (lega 10)
INSERT IGNORE INTO teams (nome,stelle,popolarita,budget,moltiplicatore_stipendio,obiettivo,probabilita_trofeo,lega_id) VALUES
('Lumen FC',2,26,1450000,0.6,'Promozione',4,10),
('Photon United',2,23,1250000,0.6,'Promozione',3,10),
('FC Candela',2,20,1050000,0.5,'Top 5',2,10),
('Electrum SC',1,17,910000,0.5,'Top 5',2,10),
('FC Aurite',1,15,790000,0.4,'Meta classifica',1,10),
('Iridite Athletic',1,13,680000,0.4,'Meta classifica',1,10),
('FC Argente',1,11,590000,0.3,'Salvezza',1,10),
('Platino United',1,10,540000,0.3,'Salvezza',1,10),
('Titanio SC',1,9,490000,0.3,'Salvezza',1,10),
('FC Zinco',1,8,445000,0.3,'Salvezza',1,10),
('Rame Athletic',1,8,405000,0.2,'Salvezza',1,10),
('FC Nichel',1,7,370000,0.2,'Salvezza',1,10),
('Cobalto United',1,7,340000,0.2,'Salvezza',1,10),
('FC Cromo',1,6,310000,0.2,'Salvezza',1,10),
('Manganese SC',1,6,285000,0.2,'Salvezza',1,10),
('Vanadio FC',1,5,260000,0.2,'Salvezza',1,10),
('FC Tungsteno',1,5,240000,0.2,'Salvezza',1,10),
('Molibdeno United',1,4,220000,0.1,'Salvezza',1,10),
('FC Silicio',1,4,200000,0.1,'Salvezza',1,10),
('Arsenico SC',1,3,180000,0.1,'Salvezza',1,10);

-- STRUTTURE
INSERT IGNORE INTO strutture (livello, nome, costo, bonus_allenamento, bonus_crescita, riduzione_infortuni, descrizione) VALUES
(1,'Campetto Base',50000,1,0,0,'+1 allenamento bonus al mese'),
(2,'Centro Moderno',200000,2,2,5,'+2 crescita stats, -5% rischio infortuni'),
(3,'Centro High-Tech',600000,3,20,10,'+20% crescita, recupero energia migliorato'),
(4,'Academy Personale',1500000,5,35,20,'Staff completo, crescita +35%, sponsor automatici');

-- ========================
-- CLASSIFICA (aggiornata ogni mese)
-- ========================
CREATE TABLE IF NOT EXISTS classifica (
    id INT AUTO_INCREMENT PRIMARY KEY,
    team_id INT NOT NULL,
    lega_id INT NOT NULL,
    anno INT NOT NULL,
    punti INT DEFAULT 0,
    vittorie INT DEFAULT 0,
    pareggi INT DEFAULT 0,
    sconfitte INT DEFAULT 0,
    gol_fatti INT DEFAULT 0,
    gol_subiti INT DEFAULT 0,
    partite_giocate INT DEFAULT 0,
    UNIQUE KEY uniq_team_anno (team_id, anno),
    FOREIGN KEY (team_id) REFERENCES teams(id),
    FOREIGN KEY (lega_id) REFERENCES leghe(id)
);

-- ========================
-- CHAMPIONS CUP
-- ========================
CREATE TABLE IF NOT EXISTS champions_cup (
    id INT AUTO_INCREMENT PRIMARY KEY,
    anno INT NOT NULL,
    team_id INT NOT NULL,
    fase ENUM('gironi','quarti','semifinale','finale','vincitore') DEFAULT 'gironi',
    eliminato TINYINT DEFAULT 0,
    UNIQUE KEY uniq_team_champions (team_id, anno),
    FOREIGN KEY (team_id) REFERENCES teams(id)
);

-- ========================
-- OVR SQUADRE (aggiunto alla tabella teams)
-- ========================
ALTER TABLE teams ADD COLUMN IF NOT EXISTS ovr INT DEFAULT 60;

-- Aggiorna OVR in base alle stelle
UPDATE teams SET ovr = CASE
    WHEN stelle = 5 THEN FLOOR(88 + RAND()*8)
    WHEN stelle = 4 THEN FLOOR(76 + RAND()*8)
    WHEN stelle = 3 THEN FLOOR(66 + RAND()*6)
    WHEN stelle = 2 THEN FLOOR(58 + RAND()*6)
    ELSE FLOOR(50 + RAND()*6)
END;
