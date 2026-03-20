<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Auth-Token');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

// Questo endpoint ora valida il prompt e restituisce l'URL Pollinations.ai
// L'immagine non viene scaricata: il browser la carica direttamente tramite <img>
// Nel DB salviamo solo il prompt testuale (colonna ai_prompt)

$data = _getCachedBody();
$prompt = trim($data['prompt'] ?? $_GET['prompt'] ?? '');

if (!$prompt) {
    echo json_encode(['error' => 'Prompt mancante']); exit;
}

// Sanitize: rimuovi caratteri speciali pericolosi per l'URL
$cleanPrompt = preg_replace('/[^\w\s,àáâãäåæçèéêëìíîïðñòóôõöùúûüýÿÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖÙÚÛÜÝ\-\.\']/u', '', $prompt);
$cleanPrompt = mb_substr($cleanPrompt, 0, 300);

// Prompt sistema in inglese per Pollinations (produce risultati migliori)
$sysPrompt = "cartoon portrait of a football player, {$cleanPrompt}, flat illustration style, dark background, gold accents, sporting look, no text";
$encodedPrompt = urlencode($sysPrompt);

// URL Pollinations.ai (gratuito, nessuna API key)
$pollinationsUrl = "https://image.pollinations.ai/prompt/{$encodedPrompt}?width=256&height=256&nologo=true&seed=" . rand(1, 9999);

echo json_encode([
    'success'  => true,
    'url'      => $pollinationsUrl,
    'prompt'   => $cleanPrompt,  // prompt pulito da salvare nel DB
]);
