<?php
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

    // --- TABELLE BASE ---
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

    $pdo->exec("CREATE TABLE IF NOT EXISTS nazioni (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        bandiera TEXT DEFAULT '🌍'
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS leghe (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        nazione_id INTEGER NOT NULL,
        livello INTEGER DEFAULT 1,
        FOREIGN KEY (nazione_id) REFERENCES nazioni(id)
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS teams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        stelle INTEGER DEFAULT 1,
        popolarita INTEGER DEFAULT 20,
        budget INTEGER DEFAULT 1000000,
        moltiplicatore_stipendio REAL DEFAULT 1.0,
        obiettivo TEXT DEFAULT 'Salvezza',
        probabilita_trofeo INTEGER DEFAULT 5,
        lega_id INTEGER DEFAULT 1,
        ovr INTEGER DEFAULT 60,
        FOREIGN KEY (lega_id) REFERENCES leghe(id)
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
        team_nome TEXT DEFAULT '',
        lega_nome TEXT DEFAULT '',
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

    $pdo->exec("CREATE TABLE IF NOT EXISTS classifica (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        team_id INTEGER NOT NULL,
        lega_id INTEGER NOT NULL,
        anno INTEGER NOT NULL,
        punti INTEGER DEFAULT 0,
        vittorie INTEGER DEFAULT 0,
        pareggi INTEGER DEFAULT 0,
        sconfitte INTEGER DEFAULT 0,
        gol_fatti INTEGER DEFAULT 0,
        gol_subiti INTEGER DEFAULT 0,
        partite_giocate INTEGER DEFAULT 0,
        UNIQUE(team_id, anno),
        FOREIGN KEY (team_id) REFERENCES teams(id),
        FOREIGN KEY (lega_id) REFERENCES leghe(id)
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS champions_cup (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        anno INTEGER NOT NULL,
        team_id INTEGER NOT NULL,
        fase TEXT DEFAULT 'gironi',
        eliminato INTEGER DEFAULT 0,
        UNIQUE(team_id, anno),
        FOREIGN KEY (team_id) REFERENCES teams(id)
    )");

    // --- POPOLA DATI SE VUOTI ---
    $nCount = $pdo->query("SELECT COUNT(*) as c FROM nazioni")->fetch()['c'];
    if ($nCount == 0) {
        seedData($pdo);
    }

    $sCount = $pdo->query("SELECT COUNT(*) as c FROM strutture")->fetch()['c'];
    if ($sCount == 0) {
        $pdo->exec("INSERT INTO strutture (livello,nome,costo,bonus_allenamento,bonus_crescita,riduzione_infortuni,descrizione) VALUES
            (1,'Campetto Base',50000,1,0,0,'+1 allenamento bonus al mese'),
            (2,'Centro Moderno',200000,2,2,5,'+2 crescita stats, -5% rischio infortuni'),
            (3,'Centro High-Tech',600000,3,20,10,'+20% crescita, recupero energia migliorato'),
            (4,'Academy Personale',1500000,5,35,20,'Staff completo, crescita +35%, sponsor automatici')
        ");
    }
}

function seedData($pdo) {
    // NAZIONI
    $pdo->exec("INSERT INTO nazioni (id,nome,bandiera) VALUES
        (1,'Valdoria','🟦'),(2,'Rethonia','🟥'),(3,'Caldera','🟨'),
        (4,'Nordheim','⬜'),(5,'Solantis','🟩')
    ");

    // LEGHE
    $pdo->exec("INSERT INTO leghe (id,nome,nazione_id,livello) VALUES
        (1,'Primera Valdoria',1,1),(2,'Segunda Valdoria',1,2),
        (3,'Lega Suprema Rethonia',2,1),(4,'Lega Nazionale Rethonia',2,2),
        (5,'Caldera Elite',3,1),(6,'Caldera Challenge',3,2),
        (7,'Nordliga Premier',4,1),(8,'Nordliga Erste',4,2),
        (9,'Solantis First Division',5,1),(10,'Solantis Second Division',5,2)
    ");

    // SQUADRE — inserite a blocchi per leggibilità
    $teams = [
        // Valdoria Prima (lega 1) stelle 3-5
        ['Reale Valdoria FC',5,98,180000000,4.5,'Dominare tutto',85,1,94],
        ['Atletico Porto Sole',5,90,120000000,4.0,'Campionato',75,1,91],
        ['Dynamo Valdoria',4,80,55000000,3.2,'Campionato',55,1,83],
        ['FC Valdemonte',4,75,45000000,3.0,'Top 4',40,1,80],
        ['Sporting Las Arenas',4,70,38000000,2.8,'Top 4',35,1,78],
        ['Unione Capitale',4,65,30000000,2.6,'Top 6',25,1,76],
        ['CF Poniente',3,58,18000000,2.0,'Top 8',15,1,71],
        ['Riviera United',3,54,14000000,1.8,'Top 8',12,1,70],
        ['Estrada SC',3,50,11000000,1.7,'Meta classifica',10,1,69],
        ['Real Castillo',3,47,9000000,1.6,'Meta classifica',8,1,68],
        ['Bahia Esperanza',3,44,7500000,1.5,'Meta classifica',6,1,67],
        ['Costera Vieja',3,41,6500000,1.4,'Salvezza',5,1,66],
        ['Vientos del Sur',3,38,5500000,1.3,'Salvezza',4,1,65],
        ['FC San Dorado',3,35,4800000,1.2,'Salvezza',3,1,64],
        ['Tropicana CF',3,32,4200000,1.2,'Salvezza',3,1,63],
        ['Puerto Viejo AC',2,28,3500000,1.0,'Salvezza',2,1,61],
        ['Los Alamos FC',2,25,3000000,1.0,'Salvezza',2,1,60],
        ['CD Valera',2,22,2500000,0.9,'Salvezza',1,1,59],
        ['Serena Baja United',2,20,2200000,0.9,'Salvezza',1,1,58],
        ['Mineros FC',2,18,2000000,0.8,'Salvezza',1,1,57],
        // Valdoria Seconda (lega 2) stelle 1-2
        ['SD Laguna',2,30,1800000,0.8,'Promozione',5,2,62],
        ['Atletico Nuevo',2,27,1500000,0.7,'Promozione',4,2,61],
        ['CF Montana',2,24,1300000,0.7,'Top 5',3,2,60],
        ['Real Nortena',2,21,1100000,0.6,'Top 5',2,2,59],
        ['Pampero SC',2,19,950000,0.6,'Meta classifica',2,2,58],
        ['Cruz del Sur FC',1,17,800000,0.5,'Meta classifica',1,2,56],
        ['Los Pinos',1,15,700000,0.5,'Meta classifica',1,2,55],
        ['Costera Sur',1,14,650000,0.5,'Salvezza',1,2,54],
        ['FC Alondra',1,13,600000,0.4,'Salvezza',1,2,53],
        ['CD Mirador',1,12,550000,0.4,'Salvezza',1,2,53],
        ['Rancho FC',1,11,500000,0.4,'Salvezza',1,2,52],
        ['Pelicano United',1,10,450000,0.4,'Salvezza',1,2,52],
        ['Vaqueros CF',1,10,420000,0.3,'Salvezza',1,2,51],
        ['SD Torreblanca',1,9,400000,0.3,'Salvezza',1,2,51],
        ['FC Tierra',1,9,380000,0.3,'Salvezza',1,2,50],
        ['Espiga FC',1,8,350000,0.3,'Salvezza',1,2,50],
        ['Brisa Marina',1,8,330000,0.3,'Salvezza',1,2,49],
        ['Los Olivos',1,7,300000,0.3,'Salvezza',1,2,49],
        ['CD Terral',1,7,280000,0.2,'Salvezza',1,2,48],
        ['Ventisca SC',1,6,250000,0.2,'Salvezza',1,2,48],
        // Rethonia Prima (lega 3)
        ['Reth City FC',5,96,175000000,4.3,'Dominare tutto',82,3,93],
        ['FC Rethon United',5,88,115000000,3.9,'Campionato',72,3,90],
        ['Kronos Athletic',4,78,52000000,3.1,'Campionato',52,3,82],
        ['FC Kaldera',4,73,43000000,2.9,'Top 4',38,3,79],
        ['Tempest SC',4,68,36000000,2.7,'Top 4',32,3,77],
        ['Reth Rovers',4,63,28000000,2.5,'Top 6',22,3,75],
        ['Ironstone FC',3,56,17000000,1.9,'Top 8',14,3,71],
        ['Westport United',3,52,13500000,1.8,'Top 8',11,3,70],
        ['Northgate AC',3,48,10500000,1.6,'Meta classifica',9,3,69],
        ['FC Blackmoor',3,45,8500000,1.5,'Meta classifica',7,3,68],
        ['Steelhaven CF',3,42,7000000,1.4,'Meta classifica',5,3,67],
        ['Docklands SC',3,39,6000000,1.3,'Salvezza',4,3,66],
        ['FC Ashfield',3,36,5200000,1.2,'Salvezza',3,3,65],
        ['Riverton FC',3,33,4500000,1.2,'Salvezza',3,3,64],
        ['Coldbrook United',3,30,4000000,1.1,'Salvezza',2,3,63],
        ['Greymoor AC',2,27,3300000,1.0,'Salvezza',2,3,61],
        ['Highcliff FC',2,24,2800000,0.9,'Salvezza',1,3,60],
        ['Dunwater SC',2,21,2400000,0.9,'Salvezza',1,3,59],
        ['Moorside United',2,19,2100000,0.8,'Salvezza',1,3,58],
        ['FC Stoneford',2,17,1900000,0.8,'Salvezza',1,3,57],
        // Rethonia Seconda (lega 4)
        ['Copperfield FC',2,29,1700000,0.8,'Promozione',5,4,62],
        ['Saltbridge United',2,26,1400000,0.7,'Promozione',4,4,61],
        ['FC Brownheath',2,23,1200000,0.6,'Top 5',3,4,59],
        ['Glenport Athletic',2,20,1050000,0.6,'Top 5',2,4,58],
        ['Hillwick SC',1,18,900000,0.5,'Meta classifica',2,4,57],
        ['Ferndale FC',1,16,780000,0.5,'Meta classifica',1,4,56],
        ['Bracklow United',1,14,680000,0.4,'Salvezza',1,4,55],
        ['Redmarsh FC',1,13,620000,0.4,'Salvezza',1,4,54],
        ['FC Whitechalk',1,12,570000,0.4,'Salvezza',1,4,53],
        ['Eastfield SC',1,11,520000,0.4,'Salvezza',1,4,53],
        ['Greystone FC',1,10,470000,0.3,'Salvezza',1,4,52],
        ['Thornwick AC',1,9,430000,0.3,'Salvezza',1,4,51],
        ['FC Coldmere',1,9,400000,0.3,'Salvezza',1,4,51],
        ['Haverfield United',1,8,370000,0.3,'Salvezza',1,4,50],
        ['Dawnford FC',1,8,340000,0.3,'Salvezza',1,4,50],
        ['Irongate SC',1,7,310000,0.2,'Salvezza',1,4,49],
        ['FC Bleakwater',1,7,290000,0.2,'Salvezza',1,4,49],
        ['Woodrow United',1,6,270000,0.2,'Salvezza',1,4,48],
        ['Stokeford FC',1,6,250000,0.2,'Salvezza',1,4,48],
        ['Oakmere Athletic',1,5,230000,0.2,'Salvezza',1,4,47],
        // Caldera Prima (lega 5)
        ['Caldera Imperiale',5,94,170000000,4.2,'Dominare tutto',80,5,92],
        ['Vulcano FC',5,86,110000000,3.8,'Campionato',70,5,89],
        ['Magma Athletic',4,76,50000000,3.0,'Campionato',50,5,81],
        ['FC Fuego',4,71,41000000,2.8,'Top 4',36,5,79],
        ['Ceniza SC',4,66,34000000,2.6,'Top 4',30,5,77],
        ['Caldera Rovers',4,61,26000000,2.4,'Top 6',20,5,75],
        ['Lava United',3,54,16000000,1.9,'Top 8',13,5,71],
        ['Obsidiana FC',3,50,13000000,1.7,'Top 8',10,5,70],
        ['FC Basalto',3,46,10000000,1.6,'Meta classifica',8,5,69],
        ['Piroclasto CF',3,43,8200000,1.5,'Meta classifica',6,5,68],
        ['Tephra SC',3,40,6800000,1.4,'Meta classifica',5,5,67],
        ['FC Escoria',3,37,5800000,1.3,'Salvezza',4,5,66],
        ['Pumice United',3,34,5000000,1.2,'Salvezza',3,5,65],
        ['Tufa FC',3,31,4300000,1.1,'Salvezza',2,5,64],
        ['Ignimbrite CF',3,28,3800000,1.1,'Salvezza',2,5,63],
        ['Riolite AC',2,25,3100000,0.9,'Salvezza',1,5,61],
        ['FC Pozzolana',2,23,2700000,0.9,'Salvezza',1,5,60],
        ['Zeolite SC',2,20,2300000,0.8,'Salvezza',1,5,59],
        ['Calcite United',2,18,2000000,0.8,'Salvezza',1,5,58],
        ['Feldspato FC',2,16,1800000,0.7,'Salvezza',1,5,57],
        // Caldera Seconda (lega 6)
        ['Cinder FC',2,28,1600000,0.7,'Promozione',4,6,62],
        ['Scoriae United',2,25,1350000,0.6,'Promozione',3,6,61],
        ['FC Flintstone',2,22,1150000,0.6,'Top 5',3,6,60],
        ['Lapilli SC',1,19,1000000,0.5,'Top 5',2,6,58],
        ['Tuff Athletic',1,17,860000,0.5,'Meta classifica',1,6,57],
        ['Agglomerate FC',1,15,740000,0.4,'Meta classifica',1,6,56],
        ['Rhyolite United',1,13,650000,0.4,'Salvezza',1,6,55],
        ['Phonolite FC',1,12,590000,0.4,'Salvezza',1,6,54],
        ['FC Andesite',1,11,540000,0.3,'Salvezza',1,6,53],
        ['Dacite SC',1,10,490000,0.3,'Salvezza',1,6,53],
        ['Comendite FC',1,9,450000,0.3,'Salvezza',1,6,52],
        ['Trachyte AC',1,8,410000,0.3,'Salvezza',1,6,51],
        ['FC Latite',1,8,380000,0.3,'Salvezza',1,6,51],
        ['Mugearite United',1,7,350000,0.2,'Salvezza',1,6,50],
        ['Hawaiite FC',1,7,320000,0.2,'Salvezza',1,6,50],
        ['Shoshonite SC',1,6,290000,0.2,'Salvezza',1,6,49],
        ['Kenyte FC',1,6,270000,0.2,'Salvezza',1,6,49],
        ['FC Icelandite',1,5,250000,0.2,'Salvezza',1,6,48],
        ['Boninite United',1,5,230000,0.2,'Salvezza',1,6,48],
        ['Adakite SC',1,4,200000,0.2,'Salvezza',1,6,47],
        // Nordheim Prima (lega 7)
        ['Nord Konig FC',5,93,165000000,4.1,'Dominare tutto',78,7,92],
        ['FC Eisenheim',5,85,108000000,3.7,'Campionato',68,7,89],
        ['Sturm Nordheim',4,75,48000000,2.9,'Campionato',48,7,81],
        ['Blitzkrieger AC',4,70,40000000,2.7,'Top 4',34,7,79],
        ['Frosthaven SC',4,65,33000000,2.5,'Top 4',28,7,77],
        ['Gletschner United',4,60,25000000,2.3,'Top 6',19,7,75],
        ['Wolfpack FC',3,53,15500000,1.8,'Top 8',12,7,71],
        ['Schneeberg United',3,49,12500000,1.7,'Top 8',10,7,70],
        ['FC Waldstein',3,45,9800000,1.5,'Meta classifica',8,7,69],
        ['Eisbach CF',3,42,8000000,1.4,'Meta classifica',6,7,68],
        ['Kaltberg SC',3,39,6600000,1.3,'Meta classifica',5,7,67],
        ['FC Dunkeltal',3,36,5600000,1.2,'Salvezza',4,7,66],
        ['Nordmark Athletic',3,33,4800000,1.2,'Salvezza',3,7,65],
        ['FC Steinbach',3,30,4100000,1.1,'Salvezza',2,7,64],
        ['Graustein United',3,27,3600000,1.0,'Salvezza',2,7,63],
        ['Eisenklinge AC',2,24,2900000,0.9,'Salvezza',1,7,61],
        ['FC Nebelhain',2,22,2500000,0.8,'Salvezza',1,7,60],
        ['Sumpfwald SC',2,19,2100000,0.8,'Salvezza',1,7,59],
        ['Fichtenbach FC',2,17,1900000,0.7,'Salvezza',1,7,58],
        ['Moosbach United',2,15,1700000,0.7,'Salvezza',1,7,57],
        // Nordheim Seconda (lega 8)
        ['Birkental FC',2,27,1500000,0.7,'Promozione',4,8,62],
        ['Kiefernhang United',2,24,1280000,0.6,'Promozione',3,8,61],
        ['FC Erlenwies',2,21,1100000,0.6,'Top 5',3,8,59],
        ['Tannenbach SC',1,18,950000,0.5,'Top 5',2,8,58],
        ['Eschenau Athletic',1,16,820000,0.5,'Meta classifica',1,8,57],
        ['Lindenfeld FC',1,14,710000,0.4,'Meta classifica',1,8,56],
        ['FC Ahorntal',1,12,620000,0.4,'Salvezza',1,8,55],
        ['Buchenwald United',1,11,560000,0.3,'Salvezza',1,8,54],
        ['Weidenpfad SC',1,10,510000,0.3,'Salvezza',1,8,53],
        ['FC Ulmenbach',1,9,460000,0.3,'Salvezza',1,8,52],
        ['Haselnuss FC',1,8,420000,0.3,'Salvezza',1,8,51],
        ['Kastanie United',1,8,390000,0.2,'Salvezza',1,8,51],
        ['FC Nussbaum',1,7,360000,0.2,'Salvezza',1,8,50],
        ['Pflaume SC',1,7,330000,0.2,'Salvezza',1,8,50],
        ['FC Kirschblute',1,6,300000,0.2,'Salvezza',1,8,49],
        ['Apfelbach Athletic',1,6,280000,0.2,'Salvezza',1,8,49],
        ['FC Birnental',1,5,260000,0.2,'Salvezza',1,8,48],
        ['Quittenwald United',1,5,240000,0.2,'Salvezza',1,8,48],
        ['Zwetschge SC',1,4,220000,0.2,'Salvezza',1,8,47],
        ['Holunderbach FC',1,4,200000,0.1,'Salvezza',1,8,46],
        // Solantis Prima (lega 9)
        ['Solantis FC',5,92,160000000,4.0,'Dominare tutto',76,9,91],
        ['Aurum Athletic',5,84,105000000,3.6,'Campionato',65,9,88],
        ['Crystalia SC',4,74,47000000,2.9,'Campionato',46,9,80],
        ['FC Luminos',4,69,39000000,2.7,'Top 4',32,9,78],
        ['Solaris United',4,64,32000000,2.5,'Top 4',27,9,76],
        ['Prism CF',4,59,24000000,2.2,'Top 6',18,9,74],
        ['Radiance FC',3,52,15000000,1.8,'Top 8',11,9,71],
        ['FC Spectra',3,48,12000000,1.7,'Top 8',9,9,70],
        ['Novus SC',3,44,9500000,1.5,'Meta classifica',7,9,69],
        ['FC Claros',3,41,7800000,1.4,'Meta classifica',6,9,68],
        ['Vivace United',3,38,6400000,1.3,'Meta classifica',4,9,67],
        ['FC Sereno',3,35,5400000,1.2,'Salvezza',3,9,66],
        ['Brillo Athletic',3,32,4600000,1.1,'Salvezza',3,9,65],
        ['FC Fulgor',3,29,3900000,1.1,'Salvezza',2,9,64],
        ['Scintilla SC',3,26,3400000,1.0,'Salvezza',1,9,63],
        ['Fulgido AC',2,23,2700000,0.9,'Salvezza',1,9,61],
        ['FC Risplende',2,21,2300000,0.8,'Salvezza',1,9,60],
        ['Sfavillante SC',2,18,2000000,0.7,'Salvezza',1,9,59],
        ['Lucente United',2,16,1800000,0.7,'Salvezza',1,9,58],
        ['Brillante FC',2,14,1600000,0.6,'Salvezza',1,9,57],
        // Solantis Seconda (lega 10)
        ['Lumen FC',2,26,1450000,0.6,'Promozione',4,10,62],
        ['Photon United',2,23,1250000,0.6,'Promozione',3,10,61],
        ['FC Candela',2,20,1050000,0.5,'Top 5',2,10,59],
        ['Electrum SC',1,17,910000,0.5,'Top 5',2,10,58],
        ['FC Aurite',1,15,790000,0.4,'Meta classifica',1,10,57],
        ['Iridite Athletic',1,13,680000,0.4,'Meta classifica',1,10,56],
        ['FC Argente',1,11,590000,0.3,'Salvezza',1,10,55],
        ['Platino United',1,10,540000,0.3,'Salvezza',1,10,54],
        ['Titanio SC',1,9,490000,0.3,'Salvezza',1,10,53],
        ['FC Zinco',1,8,445000,0.3,'Salvezza',1,10,52],
        ['Rame Athletic',1,8,405000,0.2,'Salvezza',1,10,52],
        ['FC Nichel',1,7,370000,0.2,'Salvezza',1,10,51],
        ['Cobalto United',1,7,340000,0.2,'Salvezza',1,10,51],
        ['FC Cromo',1,6,310000,0.2,'Salvezza',1,10,50],
        ['Manganese SC',1,6,285000,0.2,'Salvezza',1,10,50],
        ['Vanadio FC',1,5,260000,0.2,'Salvezza',1,10,49],
        ['FC Tungsteno',1,5,240000,0.2,'Salvezza',1,10,49],
        ['Molibdeno United',1,4,220000,0.1,'Salvezza',1,10,48],
        ['FC Silicio',1,4,200000,0.1,'Salvezza',1,10,47],
        ['Arsenico SC',1,3,180000,0.1,'Salvezza',1,10,46],
    ];

    $stmt = $pdo->prepare("INSERT INTO teams (nome,stelle,popolarita,budget,moltiplicatore_stipendio,obiettivo,probabilita_trofeo,lega_id,ovr) VALUES (?,?,?,?,?,?,?,?,?)");
    foreach ($teams as $t) {
        $stmt->execute($t);
    }
}

// CORS
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Auth-Token');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200); exit;
}

function getToken() {
    foreach ($_SERVER as $k => $v) {
        if (strpos($k,'HTTP_')===0) {
            $key = str_replace('_','-',substr($k,5));
            if ($key==='X-AUTH-TOKEN') return $v;
        }
    }
    if (!empty($_GET['token'])) return $_GET['token'];
    $raw = file_get_contents('php://input');
    if ($raw) { $body=json_decode($raw,true); if (!empty($body['token'])) return $body['token']; }
    return null;
}

function getAuthPlayerId() {
    $token = getToken();
    if (!$token) return null;
    $db   = getDB();
    $stmt = $db->prepare("SELECT player_id FROM auth_tokens WHERE token=? AND expires_at > datetime('now')");
    $stmt->execute([$token]);
    $row  = $stmt->fetch();
    return $row ? (int)$row['player_id'] : null;
}

function generateToken() {
    return bin2hex(random_bytes(32));
}
