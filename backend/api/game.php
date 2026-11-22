<?php
/**
 * ============================================================
 * game.php — Motore di gioco principale
 * ============================================================
 * Il file più grande del progetto. Gestisce tutta la logica
 * di simulazione mensile della carriera del giocatore:
 *
 *  - play_month: avanza di un mese (allenamento, partite, notizie,
 *                infortuni, morale, stipendio, Pallone d'Oro, epilogo)
 *  - buy_struttura: acquisto strutture di allenamento
 *  - change_team: trasferimento tra squadre
 *  - apply_skill_boost: sblocco abilità dall'Albero delle Abilità
 *  - get_skill_boosts: recupero abilità attive del giocatore
 *
 * Funzioni chiave:
 *  - simulaGiornataLega(): simula tutte le partite di campionato del mese
 *  - simulaChampions(): gestisce la Champions Cup (gironi → finale)
 *  - generaNotizieDinamiche(): genera 400+ template di notizie bilingue
 *  - calcPalloneDoro(): calcola l'assegnazione del Pallone d'Oro
 *  - checkPromozioneRetrocessione(): promozione/retrocessione a fine anno
 *
 * Tutte le notizie sono bilingue (IT/EN) tramite le funzioni _tn() e _tna().
 * La lingua viene letta dall'header HTTP X-Lang inviato dal frontend.
 * ============================================================
 */
require_once '../config/db.php';

// Logica di gioco suddivisa per dominio in backend/engine/
require_once __DIR__ . '/../engine/news.php';
require_once __DIR__ . '/../engine/league.php';
require_once __DIR__ . '/../engine/champions.php';
require_once __DIR__ . '/../engine/season_end.php';
require_once __DIR__ . '/../engine/player_sim.php';
require_once __DIR__ . '/../engine/career.php';

// Cattura errori fatali e restituisce JSON invece di HTML
set_exception_handler(function($e) {
    http_response_code(500);
    echo json_encode(['error' => 'Errore server: ' . $e->getMessage() . ' (L.' . $e->getLine() . ')']);
    exit;
});
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    throw new ErrorException($errstr, 0, $errno, $errfile, $errline);
});

$player_id = getAuthPlayerId();
if (!$player_id) { echo json_encode(['error' => t('Non autenticato','Not authenticated', 'Nicht angemeldet.', 'No autenticado.')]); exit; }

$data = _getCachedBody();
$action = $data['action'] ?? $_GET['action'] ?? '';

switch ($action) {
    case 'play_month':      playMonth($player_id, $data);      break;
    case 'buy_struttura':   buyStruttura($player_id, $data);   break;
    case 'change_team':     changeTeam($player_id, $data);     break;
    case 'apply_skill_boost': applySkillBoost($player_id, $data); break;
    case 'get_skill_boosts':  getSkillBoosts($player_id);         break;
    default: echo json_encode(['error' => t('Azione non trovata','Action not found', 'Aktion nicht gefunden.', 'Acción no encontrada.')]);
}

function getPlayerData($id) {
    $db = getDB();
    $stmt = $db->prepare("
        SELECT p.*, t.stelle as team_stelle, t.popolarita as team_pop,
               t.moltiplicatore_stipendio, t.probabilita_trofeo,
               t.lega_id, t.nome as team_nome_full, t.ovr as team_ovr,
               l.nome as lega_nome, l.livello as lega_livello, l.nazione_id,
               n.nome as nazione_nome
        FROM players p
        LEFT JOIN teams t ON p.team_id = t.id
        LEFT JOIN leghe l ON t.lega_id = l.id
        LEFT JOIN nazioni n ON l.nazione_id = n.id
        WHERE p.id = ?
    ");
    $stmt->execute([$id]);
    return $stmt->fetch();
}

function playMonth($player_id, $data) {
    $db  = getDB();
    $p   = getPlayerData($player_id);
    if (!$p) { echo json_encode(['error' => t('Giocatore non trovato','Player not found', 'Spieler nicht gefunden.', 'Jugador no encontrado.')]); return; }

    // --- GUARD 1: carriera già conclusa (ritiro a 38 anni) -------------------
    // Impedisce di continuare a "giocare" dopo il ritiro.
    if (intval($p['age']) >= RETIRE_AGE) {
        echo json_encode([
            'error' => t('La tua carriera è terminata. Inizia una nuova carriera per continuare a giocare.',
                         'Your career is over. Start a new career to keep playing.',
                         'Deine Karriere ist beendet. Starte eine neue Karriere, um weiterzuspielen.',
                         'Tu carrera ha terminado. Inicia una nueva carrera para seguir jugando.'),
            'fine_carriera' => true,
            'career_summary' => buildCareerSummary($db, $player_id),
        ]);
        return;
    }

    // --- GUARD 2: rate limiting / anti-replay -------------------------------
    // Evita che play_month venga chiamato in loop programmaticamente: ogni mese
    // può essere giocato una sola volta. Confronta l'ultimo log salvato con il
    // mese/anno corrente del giocatore.
    $stmt = $db->prepare("SELECT anno, mese, created_at FROM log_mensile
                          WHERE player_id=? ORDER BY id DESC LIMIT 1");
    $stmt->execute([$player_id]);
    $ultimo = $stmt->fetch();
    if ($ultimo) {
        // Se l'ultimo log è dello stesso mese/anno del giocatore, il mese è già
        // stato giocato ma il salvataggio dell'avanzamento non è ancora visibile
        // (doppio invio / spam): blocca la ripetizione.
        if (intval($ultimo['anno']) === intval($p['anno_corrente'])
            && intval($ultimo['mese']) === intval($p['mese_corrente'])) {
            echo json_encode(['error' => t('Hai già giocato questo mese. Attendi l\'aggiornamento.',
                                           'You already played this month. Please wait for the update.',
                                           'Du hast diesen Monat bereits gespielt. Bitte warte auf die Aktualisierung.',
                                           'Ya has jugado este mes. Espera la actualización.')]);
            return;
        }
        // Throttle minimo: non più di una chiamata ogni 2 secondi (anti-spam).
        if (!empty($ultimo['created_at'])) {
            $elapsed = time() - strtotime($ultimo['created_at']);
            if ($elapsed >= 0 && $elapsed < 2) {
                echo json_encode(['error' => t('Troppe richieste. Riprova tra un istante.',
                                               'Too many requests. Try again in a moment.',
                                               'Zu viele Anfragen. Versuche es gleich erneut.',
                                               'Demasiadas solicitudes. Inténtalo de nuevo en un momento.')]);
                return;
            }
        }
    }

    $azioni = $data['azioni'] ?? [];
    if (empty($azioni) || count($azioni) > 3) {
        echo json_encode(['error' => t('Scegli da 1 a 3 azioni','Choose 1 to 3 actions', 'Wähle 1 bis 3 Aktionen.', 'Elige de 1 a 3 acciones.')]); return;
    }

    // --- INFORTUNI REALI: blocca azioni fisiche se infortunato o energia = 0 ---
    $infortuni_mesi  = intval($p['infortuni_mesi'] ?? 0);
    $energia_attuale = intval($p['energia'] ?? 0);
    $azioni_fisiche  = ['allenamento_tiro','allenamento_velocita','dribbling',
                        'allenamento_fisico','allenamento_speciale'];
    if ($infortuni_mesi > 0 || $energia_attuale === 0) {
        foreach ($azioni as $az) {
            if (in_array($az, $azioni_fisiche)) {
                if ($infortuni_mesi > 0) {
                    echo json_encode(['error' => t("Sei infortunato ({$infortuni_mesi} mes" . ($infortuni_mesi === 1 ? 'e' : 'i') . " rimanenti). Puoi solo riposare, allenarti mentalmente o fare attività social.", "You are injured ({$infortuni_mesi} month" . ($infortuni_mesi === 1 ? '' : 's') . " remaining). You can only rest, train mentally or do social activities.")]);
                } else {
                    echo json_encode(['error' => t('Energia a zero! Riposati prima di allenarti fisicamente.','Energy at zero! Rest before doing physical training.', 'Energie auf null! Ruhe dich aus, bevor du körperlich trainierst.', '¡Energía a cero! Descansa antes de entrenar físicamente.')]);
                }
                return;
            }
        }
    }

    $risultati     = [];
    $sc            = ['tiro'=>0,'velocita'=>0,'dribbling'=>0,'fisico'=>0,'mentalita'=>0,'popolarita'=>0,'energia'=>0,'morale'=>0];
    $evento_speciale = '';
    $bonus         = getBonusStruttura($p['struttura_livello']);

    // Rischio infortuni da bassa energia: base 0%, sale fino a 40% a energia=1
    // Fisico alto riduce il rischio: ogni 10 punti di fisico sopra 60 = -3%
    // Struttura riduce ulteriormente tramite riduzione_infortuni
    $fisico_val       = intval($p['fisico'] ?? 60);
    $riduzione_fisico = max(0, ($fisico_val - 60) / 10 * 3); // 0-19.5% in base al fisico
    $pct_rischio_energia = function($en) use ($riduzione_fisico, $bonus) {
        if ($en >= 30) return 0; // nessun rischio sopra 30
        // Da 29 a 1: rischio cresce linearmente da 5% a 40%
        $base = 5 + (29 - $en) * (35 / 28);
        return max(0, $base - $riduzione_fisico - ($bonus['riduzione_infortuni'] ?? 0));
    };

    // --- ALLENAMENTI ---
    foreach ($azioni as $azione) {
        // Se un infortunio è appena avvenuto in questa sessione, interrompi le azioni fisiche rimanenti
        if ($infortuni_mesi > intval($p['infortuni_mesi'] ?? 0) && in_array($azione, $azioni_fisiche)) {
            continue;
        }
        // Controlla rischio infortuni da energia bassa (prima del switch)
        if (in_array($azione, $azioni_fisiche) && $azione !== 'allenamento_speciale') {
            $en_corrente = max(0, intval($p['energia'] ?? 0) + $sc['energia']); // tiene conto energia già spesa, clampato a 0
            $rischio_en  = $pct_rischio_energia($en_corrente);
            if ($rischio_en > 0 && rand(1, 100) <= $rischio_en) {
                $durata = 1;
                $infortuni_mesi = $durata;
                $sc['energia'] -= rand(20, 35);
                $en_display = max(0, $en_corrente);
                $risultati[] = t("🚨 INFORTUNIO per stanchezza! Energia troppo bassa ({$en_display}%). Fuori 1 mese!","🚨 INJURY from fatigue! Energy too low ({$en_display}%). Out for 1 month!","🚨 VERLETZUNG durch Erschöpfung! Energie zu niedrig ({$en_display}%). 1 Monat aus!","🚨 LESIÓN por cansancio! Energía demasiado baja ({$en_display}%). ¡Fuera 1 mes!");
                continue; // salta l'allenamento, già infortunato
            }
        }
        switch ($azione) {
            case 'allenamento_tiro':
                $g = rand(1,3) + $bonus['bonus_crescita'] + intval(round(($bonus['bonus_allenamento'] ?? 0) / 2));
                $sc['tiro'] += $g; $sc['energia'] -= rand(10,20);
                $risultati[] = t("🎯 Tiro migliorato +{$g}","🎯 Shooting improved +{$g}","🎯 Schuss verbessert +{$g}","🎯 Disparo mejorado +{$g}"); break;
            case 'allenamento_velocita':
                $g = rand(1,3) + $bonus['bonus_crescita'] + intval(round(($bonus['bonus_allenamento'] ?? 0) / 2));
                $sc['velocita'] += $g; $sc['energia'] -= rand(10,20);
                $risultati[] = t("⚡ Velocità migliorata +{$g}","⚡ Speed improved +{$g}","⚡ Geschwindigkeit verbessert +{$g}","⚡ Velocidad mejorada +{$g}"); break;
            case 'dribbling':
                $g = rand(1,3) + $bonus['bonus_crescita'] + intval(round(($bonus['bonus_allenamento'] ?? 0) / 2));
                $sc['dribbling'] += $g; $sc['energia'] -= rand(10,20);
                $risultati[] = t("🏃 Dribbling migliorato +{$g}","🏃 Dribbling improved +{$g}","🏃 Dribbling verbessert +{$g}","🏃 Regate mejorado +{$g}"); break;
            case 'allenamento_fisico':
                $g = rand(1,3) + $bonus['bonus_crescita'] + intval(round(($bonus['bonus_allenamento'] ?? 0) / 2));
                $sc['fisico'] += $g; $sc['energia'] -= rand(10,20);
                $risultati[] = t("💪 Fisico migliorato +{$g}","💪 Physical improved +{$g}","💪 Körperkraft verbessert +{$g}","💪 Físico mejorado +{$g}"); break;
            case 'allenamento_mentalita':
                $g = rand(1,3) + $bonus['bonus_crescita'] + intval(round(($bonus['bonus_allenamento'] ?? 0) / 2));
                $sc['mentalita'] += $g; $sc['energia'] -= rand(8,15);
                $sc['morale'] += rand(3,7); // allenare la testa migliora anche l'umore
                $risultati[] = t("🧠 Mentalità migliorata +{$g}","🧠 Mental improved +{$g}","🧠 Mentalität verbessert +{$g}","🧠 Mentalidad mejorada +{$g}"); break;
            case 'riposo':
                $r = rand(20,40);
                $sc['energia'] += $r; $sc['morale'] += rand(5,10);
                $risultati[] = t("😴 Riposo: +{$r} energia","😴 Rest: +{$r} energy","😴 Ruhe: +{$r} Energie","😴 Descanso: +{$r} energía"); break;
            case 'social':
                $pop = rand(2,8) + intval($p['team_stelle'] ?? 1);
                $sc['popolarita'] += $pop; $sc['morale'] += rand(3,8);
                $risultati[] = t("📱 Social: +{$pop} popolarità","📱 Social: +{$pop} popularity","📱 Social: +{$pop} Popularität","📱 Social: +{$pop} popularidad"); break;
            case 'allenamento_speciale':
                $rischio = rand(1,100) - $bonus['riduzione_infortuni'];
                if ($rischio > 75) {
                    $sc['energia'] -= rand(40,60);
                    $durata_infortunio = rand(1,2);
                    $infortuni_mesi = $durata_infortunio; // verrà salvato sotto
                    $risultati[] = t(
                        "🚨 INFORTUNIO! Sarai fuori per {$durata_infortunio} " . ($durata_infortunio === 1 ? "mese" : "mesi") . "!",
                        "🚨 INJURY! Out for {$durata_infortunio} month" . ($durata_infortunio === 1 ? "" : "s") . "!",
                        "🚨 VERLETZUNG! Du fehlst {$durata_infortunio} Monat" . ($durata_infortunio === 1 ? "" : "e") . "!",
                        "🚨 ¡LESIÓN! Fuera {$durata_infortunio} " . ($durata_infortunio === 1 ? "mes" : "meses") . "!"
                    );
                } else {
                    $g    = rand(3,6) + $bonus['bonus_crescita'];
                    $keys = ['tiro','velocita','dribbling','fisico','mentalita'];
                    $k    = $keys[rand(0,4)];
                    $sc[$k] += $g;
                    $statLabel = [
                        'tiro'      => t('Tiro','Shooting','Schuss','Disparo'),
                        'velocita'  => t('Velocità','Speed','Geschwindigkeit','Velocidad'),
                        'dribbling' => t('Dribbling','Dribbling','Dribbling','Regate'),
                        'fisico'    => t('Fisico','Physical','Körper','Físico'),
                        'mentalita' => t('Mentalità','Mental','Mentalität','Mentalidad'),
                    ][$k] ?? ucfirst($k);
                    $risultati[] = t("🔥 Allenamento speciale: +{$g} {$statLabel}","🔥 Special training: +{$g} {$statLabel}","🔥 Spezialtraining: +{$g} {$statLabel}","🔥 Entrenamiento especial: +{$g} {$statLabel}");
                }
                break;
        }
    }

    // --- AGENTE BONUS ---
    $agent_bonus = getAgentBonus($db, $player_id);

    // --- SIMULAZIONE GIORNATA DI LEGA (con partite del giocatore) ---
    $player_skills = getPlayerSkills($db, $player_id);
    $lega_result = simulaGiornataLega($db, $p, $player_skills);
    $lega_msgs = $lega_result['msgs'] ?? [];
    $altre_partite = $lega_result['altre_partite'] ?? [];

    // --- RISCHIO INFORTUNIO IN PARTITA ---------------------------------------
    // Oltre agli infortuni da allenamento, ora c'è un rischio reale durante le
    // partite del mese. Probabilità di base 6%, ridotta da fisico alto e dalla
    // struttura medica, aumentata da energia bassa. Solo se non già infortunato.
    if ($infortuni_mesi === 0) {
        $n_partite_mese = count($lega_result['msgs'] ?? []);
        if ($n_partite_mese > 0) {
            $en_ora      = max(0, intval($p['energia'] ?? 60) + $sc['energia']);
            $rischio_match = 6.0;                                   // base 6%
            $rischio_match += max(0, (50 - $en_ora) * 0.18);        // +fino a ~9% con energia bassa
            $rischio_match -= max(0, ($fisico_val - 60) / 10 * 1.5);// fisico alto protegge
            $rischio_match -= ($bonus['riduzione_infortuni'] ?? 0) * 0.35; // staff medico protegge
            $rischio_match  = max(1.0, min(20.0, $rischio_match));  // tra 1% e 20%
            if (rand(1, 1000) <= $rischio_match * 10) {
                $durata_match = (rand(1, 100) <= 70) ? 1 : 2;       // 70% 1 mese, 30% 2 mesi
                $infortuni_mesi = $durata_match;
                $sc['morale'] -= rand(8, 16);
                $tipo_inf = [
                    t('stiramento muscolare','muscle strain','Muskelzerrung','distensión muscular'),
                    t('contusione alla caviglia','ankle knock','Knöchelprellung','golpe en el tobillo'),
                    t('affaticamento al flessore','hamstring fatigue','Oberschenkelermüdung','fatiga en el isquiotibial'),
                ][rand(0,2)];
                $risultati[] = t(
                    "🚑 INFORTUNIO IN PARTITA ({$tipo_inf}): salterai {$durata_match} " . ($durata_match === 1 ? "mese" : "mesi") . "!",
                    "🚑 MATCH INJURY ({$tipo_inf}): you'll miss {$durata_match} month" . ($durata_match === 1 ? "" : "s") . "!",
                    "🚑 SPIELVERLETZUNG ({$tipo_inf}): du fehlst {$durata_match} Monat" . ($durata_match === 1 ? "" : "e") . "!",
                    "🚑 LESIÓN EN PARTIDO ({$tipo_inf}): te perderás {$durata_match} " . ($durata_match === 1 ? "mes" : "meses") . "!"
                );
            }
        }
    }

    // Usa il match "principale" (primo match del giocatore) per stipendio/morale/popolarità
    $match = $lega_result['match_principale'] ?? simulateMatch($p, $player_skills);
    $risultati[]    = "⚽ ".$match['desc'];
    $sc['popolarita'] += $match['pop_gain'];
    $sc['morale']     += $match['morale'];
    // lega_msgs inviati separatamente nel JSON

    // --- NOTIZIE DINAMICHE ---
    generaNotizieDinamiche($db, $player_id, $p, $match, $lega_result, $player_skills);

    // --- CHAMPIONS CUP (se qualificata) ---
    $champions_result = simulaChampions($db, $p);
    if ($champions_result) $risultati[] = $champions_result;

    // --- EVENTO CASUALE (10%) ---
    if (rand(1,100) <= 10) {
        $events = [
            [t('Crisi di forma improvvisa!','Sudden form crisis!','Plötzliche Formkrise!','¡Crisis de forma repentina!'),             'morale',    -15],
            [t('Sponsor importante ti contatta!','Important sponsor contacts you!','Wichtiger Sponsor kontaktiert dich!','¡Un patrocinador importante te contacta!'), 'popolarita', 10],
            [t('Il mister ti loda in conferenza stampa!','The coach praises you in the press conference!','Der Trainer lobt dich auf der Pressekonferenz!','¡El entrenador te elogia en la rueda de prensa!'), 'morale', 20],
            [t('Rivalità con un altro attaccante!','Rivalry with another striker!','Rivalität mit einem anderen Stürmer!','¡Rivalidad con otro delantero!'), 'morale', -5],
            [t('Offerta da un top club!','Offer from a top club!','Angebot von einem Topklub!','¡Oferta de un club top!'), 'morale', 15],
        ];
        $ev = $events[array_rand($events)];
        $evento_speciale = $ev[0];
        $sc[$ev[1]] += $ev[2];
        $risultati[] = t("🎲 EVENTO: ","🎲 EVENT: ","🎲 EREIGNIS: ","🎲 EVENTO: ").$ev[0];
    }

    // Sponsor academy
    if ($p['struttura_livello'] >= 7) {
        $sp = rand(5000,20000);
        $match['stipendio'] += $sp;
        $risultati[] = t("🤝 Sponsor Academy: +€","🤝 Academy Sponsor: +€","🤝 Academy-Sponsor: +€","🤝 Patrocinador Academia: +€").number_format($sp);
    }

    // --- CALCOLA NUOVE STATS ---
    $ns = [
        'tiro'       => min(125,max(1,$p['tiro']      +$sc['tiro'])),
        'velocita'   => min(125,max(1,$p['velocita']  +$sc['velocita'])),
        'dribbling'  => min(125,max(1,$p['dribbling'] +$sc['dribbling'])),
        'fisico'     => min(125,max(1,$p['fisico']    +$sc['fisico'])),
        'mentalita'  => min(125,max(1,$p['mentalita'] +$sc['mentalita'])),
        'popolarita' => min(100,max(0,$p['popolarita']+$sc['popolarita'])),
        'energia'    => min(100,max(0,$p['energia']  +$sc['energia'])),
        'morale'     => min(100,max(0,$p['morale']   +$sc['morale'])),
    ];
    if ($p['age'] >= 32) {
        $decay = ($p['age']-31)*0.3;
        $ns['velocita'] = max(1,$ns['velocita']-$decay);
        $ns['fisico']   = max(1,$ns['fisico']  -$decay);
    }

    $new_overall = intval(($ns['tiro']+$ns['velocita']+$ns['dribbling']+$ns['fisico']+$ns['mentalita'])/5); // max 125
    $bonus_soldi   = $lega_result['bonus_soldi'] ?? 0;
    $stipendio_agente = round($match['stipendio'] * ($agent_bonus['bonus_stipendio'] ?? 0));
    $new_soldi = $p['soldi'] + $match['stipendio'] + $bonus_soldi + $stipendio_agente;
    if ($stipendio_agente > 0) {
        $risultati[] = t("🤝 Bonus agente: +€","🤝 Agent bonus: +€","🤝 Agentenbonus: +€","🤝 Bono de agente: +€").number_format($stipendio_agente);
    }
    $new_gol     = $p['gol_carriera']    + $match['gol'];
    $new_assist  = $p['assist_carriera'] + $match['assist'];
    $new_trofei  = $p['trofei']          + ($lega_result['trofeo'] ?? 0);

    // Guard: correggi mese fuori stagione (7-8 = luglio/agosto, non dovrebbero esistere)
    $mese_corrente_safe = $p['mese_corrente'];
    if ($mese_corrente_safe === 7 || $mese_corrente_safe === 8) $mese_corrente_safe = 9;

    $new_mese  = $mese_corrente_safe + 1;
    $new_anno  = $p['anno_corrente'];
    $new_age   = $p['age'];
    $new_infortuni    = intval($p['infortuni_mesi'] ?? 0); // inizializzazione sicura — verrà sovrascritta dai blocchi sotto
    $pallone_result   = null;
    $promozione_msg   = null;
    $champ_finale     = ['messaggi' => [], 'soldi' => 0, 'trofei' => 0, 'champions_win' => false];

    // Wraparound dicembre → gennaio
    if ($new_mese > 12) $new_mese = 1;

    // --- FINE STAGIONE: giugno (6) → settembre (9) nuova stagione ---
    // La stagione va da settembre a giugno. Dopo giugno si avanza anno e si salta a settembre.
    if ($mese_corrente_safe == 6) {
        $new_mese = 9; // inizio nuova stagione
        $new_anno++; $new_age++;

        // Idempotency guard: skip year-end rewards if already processed for this anno
        $year_already_processed = $db->prepare("SELECT id FROM stagioni WHERE player_id=? AND anno=?");
        $year_already_processed->execute([$player_id, $p['anno_corrente']]);
        $anno_gia_chiuso = (bool)$year_already_processed->fetch();

        if (!$anno_gia_chiuso) {
            // Pallone d'Oro
            $pallone_result = calcPalloneDoro($db, $player_id, $p, $new_overall, $new_gol, $new_assist);
            $risultati[] = t("📅 Nuova stagione! Età: {$new_age}","📅 New season! Age: {$new_age}","📅 Neue Saison! Alter: {$new_age}","📅 ¡Nueva temporada! Edad: {$new_age}");
            if ($pallone_result) $risultati[] = $pallone_result['msg'];

            // Premi di fine anno (campionato)
            $premi = calcPremiCampionato($db, $p, $player_id);
            foreach ($premi['messaggi'] as $m) $risultati[] = $m;
            $new_soldi  += $premi['soldi'];
            $new_trofei += $premi['trofei'];

            // Champions Cup finale
            $champ_finale = concludiChampions($db, $p, $player_id);
            foreach ($champ_finale['messaggi'] as $m) $risultati[] = $m;
            $new_soldi  += $champ_finale['soldi'];
            $new_trofei += $champ_finale['trofei'];
        } else {
            // Anno già processato: skip premi, solo avanza stagione
            $risultati[] = t("📅 Nuova stagione! Età: {$new_age}","📅 New season! Age: {$new_age}","📅 Neue Saison! Alter: {$new_age}","📅 ¡Nueva temporada! Edad: {$new_age}");
            $champ_finale = ['messaggi'=>[],'soldi'=>0,'trofei'=>0,'champions_win'=>false];
        }

        // Promozione / Retrocessione
        $promo = checkPromozioneRetrocessione($db, $player_id, $p, $new_overall);
        if ($promo) {
            $promozione_msg = $promo['msg'];
            $risultati[]    = $promo['msg'];
            if (!empty($promo['new_team_id'])) {
                $db->prepare("UPDATE players SET team_id=? WHERE id=?")->execute([$promo['new_team_id'],$player_id]);
            }
        }

        // Reset energia e morale per la nuova stagione (settembre)
        if (isset($ns['energia']) && $ns['energia'] < 70) {
            $ns['energia'] = min(100, $ns['energia'] + 30); // parziale recupero
        }
        if (isset($ns['morale']) && $ns['morale'] < 60) {
            $ns['morale'] = min(100, $ns['morale'] + 20); // boost di inizio stagione
        }
        // Reset infortuni a inizio nuova stagione (guarigione estiva)
        $new_infortuni = 0;

        // Reset uso trasferimento per nuova stagione
        $db->prepare("UPDATE players SET trasferimento_anno=0 WHERE id=?")->execute([$player_id]);
        // Reset flag Champions Cup premio per nuova stagione
        $db->prepare("UPDATE players SET champions_premio_pagato=0 WHERE id=?")->execute([$player_id]);
        // Genera il calendario per la lega corretta (potrebbe essere cambiata dopo promozione/retrocessione)
        $new_team_row = $db->prepare("SELECT t.lega_id FROM players p JOIN teams t ON p.team_id=t.id WHERE p.id=?");
        $new_team_row->execute([$player_id]);
        $new_lega_row = $new_team_row->fetch();
        $lega_for_calendar = $new_lega_row ? intval($new_lega_row['lega_id']) : intval($p['lega_id']);
        generaCalendario($db, $lega_for_calendar, $new_anno);
    }

    // Gestione infortuni: decrementa se era già infortunato, mantieni se appena avvenuto
    // Se è inizio nuova stagione, $new_infortuni è già stato azzerato nel blocco year-end
    if ($new_mese !== 9) { // non sovrascrivere il reset estivo
        $prev_infortuni = intval($p['infortuni_mesi'] ?? 0);
        if ($prev_infortuni > 0 && $infortuni_mesi === $prev_infortuni) {
            // Nessun nuovo infortunio questo mese → decrementa di 1
            $new_infortuni = max(0, $prev_infortuni - 1);
            if ($new_infortuni === 0) $risultati[] = t("✅ Recupero completato! Sei di nuovo in piena forma.","✅ Recovery complete! You are back to full fitness.","✅ Genesung abgeschlossen! Du bist wieder in Topform.","✅ ¡Recuperación completa! Estás de vuelta al 100%.");
        } elseif ($infortuni_mesi > $prev_infortuni) {
            // Nuovo infortunio (o più grave) → prendi il valore più alto
            $new_infortuni = $infortuni_mesi;
        } else {
            $new_infortuni = 0;
        }
    }

    // Salva una riga per ogni partita giocata nel mese
    $stmt_log = $db->prepare("INSERT INTO log_mensile (player_id,anno,mese,azione,risultato,gol,assist,voto,evento_speciale,avv,esito,gf,gs,giornata,competizione) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
    foreach ($lega_msgs as $lm) {
        $stmt_log->execute([
            $player_id,
            $p['anno_corrente'],
            $p['mese_corrente'],
            implode(',', $azioni),
            '', // risultato allenamenti solo nel riepilogo
            intval($lm['player_gol']   ?? 0),
            intval($lm['player_assist'] ?? 0),
            floatval($lm['player_voto'] ?? 6.0),
            '', // evento speciale solo nel riepilogo
            strval($lm['avv'] ?? ''),
            strval($lm['esito'] ?? ''),
            intval($lm['gf'] ?? 0),
            intval($lm['gs'] ?? 0),
            intval($lm['giornata'] ?? 0),
            'lega',
        ]);
    }
    // Riga riepilogo mensile (allenamenti + eventi, gol=0 così non altera le best query)
    if (empty($lega_msgs)) {
        // Nessuna partita (es. mese di pausa): salva comunque un record con i dati del match simulato
        $stmt_log->execute([$player_id,$p['anno_corrente'],$p['mese_corrente'],implode(',',$azioni),implode("\n",$risultati),$match['gol'],$match['assist'],$match['voto'],$evento_speciale,'','',0,0,0,'lega']);
    } else {
        // Salva riepilogo allenamenti/eventi separato (non conta nelle best-match query grazie ad avv='__riepilogo')
        $stmt_log->execute([$player_id,$p['anno_corrente'],$p['mese_corrente'],implode(',',$azioni),implode("\n",$risultati),0,0,0.0,$evento_speciale,'__riepilogo','',0,0,0,'lega']);
    }

    // Aggiorna giocatore
    $db->prepare("UPDATE players SET tiro=?,velocita=?,dribbling=?,fisico=?,mentalita=?,popolarita=?,energia=?,morale=?,overall=?,soldi=?,gol_carriera=?,assist_carriera=?,trofei=?,mese_corrente=?,anno_corrente=?,age=?,infortuni_mesi=? WHERE id=?")
       ->execute([$ns['tiro'],$ns['velocita'],$ns['dribbling'],$ns['fisico'],$ns['mentalita'],$ns['popolarita'],$ns['energia'],$ns['morale'],$new_overall,$new_soldi,$new_gol,$new_assist,$new_trofei,$new_mese,$new_anno,$new_age,$new_infortuni,$player_id]);

    $fine_carriera = false;
    $career_summary = null;
    if ($new_age >= RETIRE_AGE) {
        $fine_carriera = true;
        $career_summary = buildCareerSummary($db, $player_id);
        $risultati[] = t("🏁 FINE CARRIERA! ","🏁 CAREER OVER! ","🏁 KARRIEREENDE! ","🏁 ¡FIN DE CARRERA! ")
                     . $career_summary['titolo'] . ' ' . $career_summary['emoji'];
    }

    echo json_encode([
        'success'       => true,
        'risultati'     => $risultati,
        'match'         => $match,
        'lega_msgs'     => $lega_msgs,
        'altre_partite' => $altre_partite,
        'pallone_doro'  => $pallone_result,
        'promozione'    => $promozione_msg,
        'fine_carriera' => $fine_carriera,
        'career_summary'=> $career_summary,
        'nuovo_anno'    => ($new_anno !== $p['anno_corrente']),
        'infortuni_mesi'=> $new_infortuni,
        'champions_win' => $champ_finale['champions_win'] ?? false,
    ]);
}

// NOTIZIE PARTITA AVANZATE — Libreria completa di 200+ template
// Contiene: notizie di gol con stile, notizie tattiche, 
// notizie meteorologiche, notizie arbitrali, notizie del mister

