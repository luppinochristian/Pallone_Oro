<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Auth-Token');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

$data      = json_decode(file_get_contents('php://input'), true) ?? [];
$prompt    = trim($data['prompt'] ?? $_GET['prompt'] ?? '');

if (!$prompt) {
    echo json_encode(['error' => 'Prompt mancante']); exit;
}

// Pulisci il prompt mantenendo lettere accentate italiane
$cleanPrompt = preg_replace('/[^\p{L}\p{N}\s,.\'\-]/u', '', $prompt);
$cleanPrompt = mb_substr(trim($cleanPrompt), 0, 400);

$fullPrompt = 'cartoon portrait of a football soccer player, '
    . $cleanPrompt
    . ', stylized comic book art, bold colors, dark background, golden accents, '
    . 'sports uniform, confident expression, detailed face, high quality, no text, no watermark';

$seed   = rand(1, 999999);
$url    = 'https://image.pollinations.ai/prompt/'
        . rawurlencode($fullPrompt)
        . '?width=512&height=512&nologo=true&seed=' . $seed . '&model=flux';

// Proxy server-side → nessun problema CORS per il browser
$ctx = stream_context_create([
    'http' => [
        'timeout'         => 120,
        'follow_location' => 1,
        'header'          => "User-Agent: Mozilla/5.0\r\n",
    ],
    'ssl' => ['verify_peer' => false],
]);

$imgData = @file_get_contents($url, false, $ctx);

if ($imgData === false || strlen($imgData) < 1000) {
    echo json_encode(['error' => 'Generazione fallita. Riprova tra qualche secondo.']); exit;
}

// Ridimensiona a 384×384 con GD se disponibile
if (function_exists('imagecreatefromstring')) {
    $src = @imagecreatefromstring($imgData);
    if ($src) {
        $dst = imagecreatetruecolor(384, 384);
        imagecopyresampled($dst, $src, 0, 0, 0, 0, 384, 384, imagesx($src), imagesy($src));
        ob_start();
        imagepng($dst, null, 5);
        $imgData = ob_get_clean();
        imagedestroy($src);
        imagedestroy($dst);
    }
}

$base64  = base64_encode($imgData);
$dataUrl = 'data:image/png;base64,' . $base64;

echo json_encode([
    'success' => true,
    'url'     => $dataUrl,
    'prompt'  => $cleanPrompt,
]);
