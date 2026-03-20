<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Auth-Token');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

// ─────────────────────────────────────────────
//  CONFIGURAZIONE — inserisci la tua API key di Stability AI
//  Ottienila su: https://platform.stability.ai/account/keys
// ─────────────────────────────────────────────
define('STABILITY_API_KEY', 'sk-vtJKkJEG6822zAGZLgj65tTFCnndRrDpk15Q3iRdl27SSlJB');
define('STABILITY_MODEL',   'stable-diffusion-xl-1024-v1-0');

$data   = json_decode(file_get_contents('php://input'), true) ?? [];
$prompt = trim($data['prompt'] ?? $_GET['prompt'] ?? '');

if (!$prompt) {
    echo json_encode(['error' => 'Prompt mancante']); exit;
}

$cleanPrompt = preg_replace('/[^\w\s,àáâãäåæçèéêëìíîïðñòóôõöùúûüýÿÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖÙÚÛÜÝ\-\.\']/u', '', $prompt);
$cleanPrompt = mb_substr($cleanPrompt, 0, 300);

$fullPrompt     = "cartoon portrait illustration of a football soccer player, {$cleanPrompt}, stylized digital art, bold colors, dark background, golden accents, sports uniform, confident pose, detailed face, high quality, no text, no watermark";
$negativePrompt = "realistic photo, blurry, low quality, text, watermark, extra limbs, deformed";

$payload = json_encode([
    'text_prompts' => [
        ['text' => $fullPrompt,     'weight' => 1.0],
        ['text' => $negativePrompt, 'weight' => -1.0],
    ],
    'cfg_scale'    => 7,
    'height'       => 512,
    'width'        => 512,
    'samples'      => 1,
    'steps'        => 30,
    'style_preset' => 'comic-book',
]);

$ch = curl_init('https://api.stability.ai/v1/generation/' . STABILITY_MODEL . '/text-to-image');
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $payload,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER     => [
        'Content-Type: application/json',
        'Accept: application/json',
        'Authorization: Bearer ' . STABILITY_API_KEY,
    ],
    CURLOPT_TIMEOUT => 60,
]);

$response = curl_exec($ch);
$httpCode  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    $err = json_decode($response, true);
    echo json_encode(['error' => 'Stability AI error: ' . ($err['message'] ?? $httpCode)]);
    exit;
}

$result = json_decode($response, true);
$base64 = $result['artifacts'][0]['base64'] ?? null;

if (!$base64) {
    echo json_encode(['error' => 'Nessuna immagine generata']); exit;
}

echo json_encode([
    'success' => true,
    'url'     => 'data:image/png;base64,' . $base64,
    'prompt'  => $cleanPrompt,
]);
