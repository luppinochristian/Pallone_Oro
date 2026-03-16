<?php
require_once '../config/db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Auth-Token');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

$raw  = file_get_contents('php://input');
$data = json_decode($raw, true) ?: [];
$action = $data['action'] ?? $_GET['action'] ?? '';

switch ($action) {
    case 'generate': generateAvatar($data); break;
    default: echo json_encode(['error' => 'Azione non trovata']);
}

function generateAvatar($data) {
    $userPrompt = trim($data['prompt'] ?? '');
    if (!$userPrompt) {
        echo json_encode(['error' => 'Prompt mancante']); return;
    }

    // Prompt completo ottimizzato per avatar calciatore
    $fullPrompt = "football player portrait, {$userPrompt}, cartoon style, flat colors, clean background, square format, face closeup";
    $seed       = rand(1, 99999);
    $encoded    = urlencode($fullPrompt);
    $url        = "https://image.pollinations.ai/prompt/{$encoded}?width=256&height=256&nologo=true&seed={$seed}";

    // Fetch lato server (evita CORS)
    $ctx = stream_context_create([
        'http' => [
            'method'  => 'GET',
            'timeout' => 30,
            'header'  => "User-Agent: GoldenStriker/1.0\r\n",
            'ignore_errors' => true,
        ],
        'ssl' => [
            'verify_peer'      => false,
            'verify_peer_name' => false,
        ],
    ]);

    $imgData = @file_get_contents($url, false, $ctx);

    if ($imgData === false || strlen($imgData) < 1000) {
        // Fallback: prova senza SSL verify tramite curl se disponibile
        if (function_exists('curl_init')) {
            $ch = curl_init($url);
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT        => 30,
                CURLOPT_SSL_VERIFYPEER => false,
                CURLOPT_SSL_VERIFYHOST => false,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_USERAGENT      => 'GoldenStriker/1.0',
            ]);
            $imgData = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if (!$imgData || $httpCode !== 200 || strlen($imgData) < 1000) {
                echo json_encode(['error' => 'Generazione fallita. Controlla la connessione internet del server.']);
                return;
            }
        } else {
            echo json_encode(['error' => 'Impossibile raggiungere il servizio AI. Controlla la connessione internet del server.']);
            return;
        }
    }

    // Converti in base64 data URL
    $mimeType = 'image/jpeg';
    // Controlla magic bytes per PNG
    if (str_starts_with($imgData, "\x89PNG")) $mimeType = 'image/png';
    $base64 = base64_encode($imgData);
    $dataUrl = "data:{$mimeType};base64,{$base64}";

    echo json_encode(['success' => true, 'data_url' => $dataUrl]);
}
