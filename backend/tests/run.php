<?php
/**
 * ============================================================
 * tests/run.php — test automatici del motore di gioco
 * ============================================================
 * Esecuzione (dalla cartella backend/):
 *     php tests/run.php
 * Non richiede database: testa funzioni pure e regole di gioco.
 * Esce con codice 1 se almeno un test fallisce.
 * ============================================================
 */
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../engine/league.php';
require_once __DIR__ . '/../engine/news.php';
require_once __DIR__ . '/../engine/player_sim.php';

$passed = 0;
$failed = [];

function check(string $name, bool $ok, string $detail = ''): void {
    global $passed, $failed;
    if ($ok) { $passed++; return; }
    $failed[] = $name . ($detail !== '' ? " ({$detail})" : '');
}

// ── Regole di gioco ─────────────────────────────────────────────
check('retire_age è 38', RETIRE_AGE === 38);
check('stelle_ovr_map copre 1..5 stelle', array_keys(STELLE_OVR_MAP) === [1,2,3,4,5]);
check('stelle_ovr_map crescente',
    STELLE_OVR_MAP[1] < STELLE_OVR_MAP[2] && STELLE_OVR_MAP[2] < STELLE_OVR_MAP[3]
    && STELLE_OVR_MAP[3] < STELLE_OVR_MAP[4] && STELLE_OVR_MAP[4] < STELLE_OVR_MAP[5]);
check('min_overall_floor <= minimo stelle', MIN_OVERALL_FLOOR <= STELLE_OVR_MAP[1]);
$public = getPublicGameRules();
check('rules pubblici contengono le chiavi attese',
    array_keys($public) === ['retire_age','stelle_ovr_map','min_overall_floor','overall_max']);
check('rules pubblici non contengono segreti', !isset($public['password']) && !isset($public['token']));

// ── OTP ──────────────────────────────────────────────────────────
$otpOk = true; $otpLen = true;
for ($i = 0; $i < 2000; $i++) {
    $c = generateOtpCode();
    if (!preg_match('/^\d{6}$/', $c)) $otpOk = false;
    if (strlen($c) !== 6) $otpLen = false;
}
check('OTP: sempre 6 cifre', $otpOk);
check('OTP: lunghezza 6', $otpLen);
check('OTP: costante di tentativi > 0', OTP_MAX_ATTEMPTS > 0);

// ── Motore partite ───────────────────────────────────────────────
// Invariante: punti, gol e risultato devono essere coerenti.
$incoerenti = 0;
for ($i = 0; $i < 3000; $i++) {
    [$gf,$gs,$p1,$p2] = _simulaEsitoForza(rand(55,120), rand(55,120), (bool)rand(0,1));
    if ($p1 === 3 && !($gf > $gs)) $incoerenti++;
    if ($p2 === 3 && !($gs > $gf)) $incoerenti++;
    if ($p1 === 1 && !($gf === $gs)) $incoerenti++;
    if ($gf < 0 || $gs < 0 || $gf > 9 || $gs > 9) $incoerenti++;
}
check('partita: punti e gol coerenti', $incoerenti === 0, "$incoerenti casi incoerenti");

// Squadra molto più forte deve vincere più spesso (5000 campioni)
$wins = 0; $losses = 0; $n = 5000;
for ($i = 0; $i < $n; $i++) {
    [, , $p1, $p2] = _simulaEsitoForza(100, 60, false);
    if ($p1 === 3) $wins++;
    if ($p2 === 3) $losses++;
}
check('partita: squadra forte vince più spesso', $wins > $losses * 2, "vittorie=$wins sconfitte=$losses");

// Simulazione prestazione giocatore
$stats = ['gol'=>0,'assist'=>0];
$badRange = false;
for ($i = 0; $i < 1000; $i++) {
    $r = simulateMatch([
        'overall'=>70,'morale'=>60,'energia'=>80,'team_stelle'=>3,
        'piede_forte'=>3,'popolarita'=>50,'age'=>25,'moltiplicatore_stipendio'=>1.5,
    ]);
    if (!is_array($r) || !isset($r['gol'])) { $badRange = true; break; }
}
check('simulateMatch: restituisce un array con gol', !$badRange);

// ── Aspetto: barba e baffi ─────────────────────────────────────
check('barba: stili ammessi', FACIAL_HAIR_STYLES === ['none','stubble','goatee','beard','mustache']);
require_once __DIR__ . '/i18n_scan.php';
check('traduzioni server: ogni t() ha it/en/de/es', scanI18nIssues(__DIR__ . '/..') === [], implode('; ', array_slice(scanI18nIssues(__DIR__ . '/..'), 0, 3)));
check('barba: valore valido invariato', normalizeFacialHair('beard') === 'beard');
check('barba: valore sconosciuto -> none', normalizeFacialHair('<script>') === 'none');
check('barba: campo mancante -> none', normalizeFacialHair(null) === 'none');
check('barba: tipo errato -> none', normalizeFacialHair(['beard']) === 'none');
check('barba: confronto stretto (1 non è un stile)', normalizeFacialHair(1) === 'none');
check('sopracciglia: valore valido invariato', normalizeEyebrowStyle('arched') === 'arched');
check('sopracciglia: valore sconosciuto -> standard', normalizeEyebrowStyle('<b>') === 'standard');
check('sopracciglia: campo mancante -> standard', normalizeEyebrowStyle(null) === 'standard');
check('lentiggini: true/"1"/1 -> 1', normalizeFreckles(true) === 1 && normalizeFreckles('1') === 1 && normalizeFreckles(1) === 1);
check('lentiggini: false/"0"/mancante -> 0', normalizeFreckles(false) === 0 && normalizeFreckles('0') === 0 && normalizeFreckles(null) === 0);
check('maglia: colore ammesso invariato', normalizeKitColor('#C62828') === '#c62828');
check('maglia: colore fuori lista -> null', normalizeKitColor('#123456') === null);
check('maglia: valore non stringa -> null', normalizeKitColor(['#c62828']) === null);
check('maglia: CSS injection -> null', normalizeKitColor('red;background:url(x)') === null);
check('lentiggini: stringa arbitraria -> 0', normalizeFreckles('yes please') === 0);

// ── Pulizia: nessun riferimento all'AI nel backend ─────────────
check('AI: endpoint ai_avatar.php rimosso', !file_exists(__DIR__ . '/../api/ai_avatar.php'));
$hits = [];
foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator(__DIR__ . '/..')) as $f) {
    if (!$f->isFile() || $f->getExtension() !== 'php') continue;
    if (preg_match('#/(migrations|tests)/#', $f->getPathname())) continue; // storico migrazioni e questo file
    if (preg_match('/ai_avatar|ai_prompt|has_ai_avatar/', file_get_contents($f->getPathname()))) $hits[] = $f->getFilename();
}
check('AI: nessun riferimento nel codice backend', $hits === [], implode(',', $hits));

// ── Output ───────────────────────────────────────────────────────
echo "Test superati: {$passed}\n";
if ($failed) {
    echo "Test falliti: " . count($failed) . "\n";
    foreach ($failed as $f) echo "  - {$f}\n";
    exit(1);
}
echo "Tutti i test sono passati.\n";
exit(0);
