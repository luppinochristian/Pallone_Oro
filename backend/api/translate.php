<?php
/**
 * ============================================================
 * translate.php — Proxy per traduzione notizie via Anthropic API
 * ============================================================
 * Riceve array di notizie dal frontend e le traduce usando
 * l'API Anthropic claude-sonnet-4-20250514, aggiungendo
 * la API key server-side (sicura, non esposta al browser).
 *
 * POST body JSON:
 *   { "news": [ { "id", "titolo", "testo" }, ... ] }
 *
 * Response JSON:
 *   [ { "id", "titolo", "testo" }, ... ]
 * ============================================================
 */
require_once '../config/db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Auth-Token, X-Lang, X-Career-Id');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

// ── Leggi API Key da variabile d'ambiente (imposta nel server) ──
// Su server di produzione: export ANTHROPIC_API_KEY="sk-ant-..."
// In sviluppo locale: puoi metterla qui direttamente (non committare!)
$apiKey = getenv('ANTHROPIC_API_KEY');

if (!$apiKey) {
    // Fallback: leggi da file .env nella root del progetto (non nella cartella pubblica)
    $envFile = __DIR__ . '/../../.env';
    if (file_exists($envFile)) {
        foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
            if (strpos(trim($line), '#') === 0) continue;
            if (strpos($line, 'ANTHROPIC_API_KEY=') === 0) {
                $apiKey = trim(substr($line, strlen('ANTHROPIC_API_KEY=')));
                break;
            }
        }
    }
}

if (!$apiKey) {
    http_response_code(503);
    echo json_encode(['error' => 'Translation service not configured. Set ANTHROPIC_API_KEY env var.']);
    exit;
}

// ── Autenticazione: solo utenti loggati possono tradurre ──
$authId = getAuthAccountId();
if (!$authId) {
    // Permetti anche in modalità guest (player_id null è ok per la traduzione)
    // Ma blocca richieste senza token valido del tutto
    $token = getToken();
    if (!$token) {
        http_response_code(401);
        echo json_encode(['error' => 'Not authenticated']);
        exit;
    }
}

// ── Leggi payload ──
$body = _getCachedBody();
$news = $body['news'] ?? [];

if (!is_array($news) || empty($news)) {
    echo json_encode([]);
    exit;
}

// Limita a 10 notizie per batch per sicurezza
$news = array_slice($news, 0, 10);

// ── Prepara payload per Anthropic ──
$payload = array_map(fn($n) => [
    'id'     => $n['id']     ?? null,
    'titolo' => $n['titolo'] ?? '',
    'testo'  => $n['testo']  ?? '',
], $news);

$requestBody = [
    'model'      => 'claude-haiku-4-5-20251001', // Haiku: più veloce e economico per traduzioni
    'max_tokens' => 2000,
    'system'     => 'You are a football game news translator. Translate Italian football news to English. Keep emojis. Keep player names, team names and city names as-is. Return ONLY a JSON array with the same structure: [{id, titolo, testo}]. No markdown, no backticks, no explanation.',
    'messages'   => [[
        'role'    => 'user',
        'content' => 'Translate these football news items from Italian to English: ' . json_encode($payload, JSON_UNESCAPED_UNICODE),
    ]],
];

// ── Chiama Anthropic API ──
$ch = curl_init('https://api.anthropic.com/v1/messages');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => json_encode($requestBody),
    CURLOPT_HTTPHEADER     => [
        'Content-Type: application/json',
        'x-api-key: ' . $apiKey,
        'anthropic-version: 2023-06-01',
    ],
    CURLOPT_TIMEOUT        => 30,
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlErr  = curl_error($ch);
curl_close($ch);

if ($curlErr || $httpCode !== 200) {
    // Fallback: ritorna le notizie originali non tradotte
    echo json_encode($news);
    exit;
}

$data = json_decode($response, true);
$text = '';
foreach ($data['content'] ?? [] as $block) {
    if ($block['type'] === 'text') { $text .= $block['text']; break; }
}

// Pulisci eventuali backtick di markdown
$text = preg_replace('/^```(?:json)?\s*/m', '', $text);
$text = preg_replace('/\s*```$/m', '', $text);
$text = trim($text);

$translated = json_decode($text, true);

if (!is_array($translated)) {
    // JSON parsing fallita: ritorna originali
    echo json_encode($news);
    exit;
}

// Merge: usa traduzione se disponibile, altrimenti originale
$result = [];
$translatedById = [];
foreach ($translated as $t) {
    if (isset($t['id'])) $translatedById[$t['id']] = $t;
}

foreach ($news as $n) {
    $id = $n['id'] ?? null;
    if ($id !== null && isset($translatedById[$id])) {
        $result[] = array_merge($n, [
            'titolo' => $translatedById[$id]['titolo'] ?? $n['titolo'],
            'testo'  => $translatedById[$id]['testo']  ?? $n['testo'],
        ]);
    } else {
        $result[] = $n;
    }
}

echo json_encode($result, JSON_UNESCAPED_UNICODE);
