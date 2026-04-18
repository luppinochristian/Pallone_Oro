<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Auth-Token');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

$data   = json_decode(file_get_contents('php://input'), true) ?? [];
$prompt = trim($data['prompt'] ?? $_GET['prompt'] ?? '');
$gender = trim($data['gender'] ?? $_GET['gender'] ?? 'male');
$gender = in_array($gender, ['male','female']) ? $gender : 'male';

if (!$prompt) {
    echo json_encode(['error' => 'Prompt mancante']); exit;
}

// Mantieni lettere accentate italiane e caratteri utili
$cleanPrompt = preg_replace('/[^\p{L}\p{N}\s,.\'\-]/u', '', $prompt);
$cleanPrompt = mb_substr(trim($cleanPrompt), 0, 400);

// ── Traduzione italiano → inglese dei termini fisici più comuni ──────────────
$itToEn = [
    // capelli
    'capelli ricci'        => 'curly hair',
    'capelli lisci'        => 'straight hair',
    'capelli ondulati'     => 'wavy hair',
    'capelli lunghi'       => 'long hair',
    'capelli corti'        => 'short hair',
    'capelli medi'         => 'medium length hair',
    'capelli neri'         => 'black hair',
    'capelli biondi'       => 'blonde hair',
    'capelli castani'      => 'brown hair',
    'capelli rossi'        => 'red hair',
    'capelli arancioni'    => 'orange hair',
    'capelli bianchi'      => 'white hair',
    'capelli grigi'        => 'grey hair',
    'capelli viola'        => 'purple hair',
    'capelli blu'          => 'blue hair',
    'capelli verde'        => 'green hair',
    'capelli verdi'        => 'green hair',
    'testa rasata'         => 'shaved head',
    'rasato'               => 'shaved head',
    'trecce'               => 'dreadlocks braids',
    'dreadlock'            => 'dreadlocks',
    // occhi
    'occhi rossi'          => 'glowing red eyes',
    'occhi blu'            => 'blue eyes',
    'occhi verdi'          => 'green eyes',
    'occhi neri'           => 'dark black eyes',
    'occhi marroni'        => 'brown eyes',
    'occhi grigi'          => 'grey eyes',
    'occhi gialli'         => 'yellow eyes',
    'occhi viola'          => 'purple eyes',
    'occhi arancioni'      => 'orange eyes',
    'occhi azzurri'        => 'light blue eyes',
    // aggettivi
    'fuoco'                => 'fiery glowing',
    'brillanti'            => 'bright glowing',
    'luminosi'             => 'glowing',
    'lunghi'               => 'long',
    'corti'                => 'short',
    'ricci'                => 'curly',
    'mossi'                => 'wavy',
    'lisci'                => 'straight',
    // carnagione
    'carnagione chiara'    => 'light skin',
    'carnagione scura'     => 'dark skin',
    'carnagione olivastra' => 'olive skin',
    'pelle chiara'         => 'light skin',
    'pelle scura'          => 'dark skin',
    // barba / baffi
    'barba corta'          => 'short beard',
    'barba lunga'          => 'long beard',
    'senza barba'          => 'clean shaven',
    'barba'                => 'beard',
    'baffi'                => 'mustache',
    // corporatura
    'muscoloso'            => 'muscular build',
    'alto'                 => 'tall',
    'cicatrice'            => 'scar on face',
    // colori generici
    'rosso'                => 'red',
    'rossa'                => 'red',
    'blu'                  => 'blue',
    'verde'                => 'green',
    'nero'                 => 'black',
    'nera'                 => 'black',
    'bianco'               => 'white',
    'giallo'               => 'yellow',
    'arancione'            => 'orange',
    'viola'                => 'purple',
    'grigio'               => 'grey',
    'marrone'              => 'brown',
    'biondo'               => 'blonde',
    'bionda'               => 'blonde',
    'castano'              => 'brown',
    'castana'              => 'brown',
];

// Applica traduzioni (lunghezza discendente per evitare sostituzioni parziali)
uksort($itToEn, fn($a,$b) => strlen($b) - strlen($a));
$engPrompt = mb_strtolower($cleanPrompt);
foreach ($itToEn as $it => $en) {
    $engPrompt = str_ireplace($it, $en, $engPrompt);
}

// ── Genere: determina soggetto e caratteristiche ──────────────────────────────
if ($gender === 'female') {
    $genderDesc   = 'female woman girl';
    $genderExtras = 'female athlete, feminine features, woman soccer player';
    $negGender    = 'male, man, masculine, beard, mustache';
} else {
    $genderDesc   = 'male man';
    $genderExtras = 'male athlete, masculine features, man soccer player';
    $negGender    = 'female, woman, girl, feminine';
}

// ── Prompt: caratteristiche fisiche PRIMA dello stile ─────────────────────────
$fullPrompt =
    'comic book illustration of a ' . $genderDesc . ' football soccer player, '
    . 'IMPORTANT: ' . $engPrompt . ', '
    . $genderExtras . ', '
    . 'exact physical features as described, '
    . 'stylized comic art, bold cel-shading, dark dramatic background, '
    . 'golden light accents, sports jersey, confident athletic pose, '
    . 'detailed face and hair, sharp linework, vibrant colors, '
    . 'no text, no watermark, high quality';

$negativePrompt =
    'realistic photo, blurry, low quality, deformed, extra limbs, '
    . 'wrong hair color, wrong eye color, text, watermark, ugly, '
    . $negGender;

$seed = rand(1, 999999);
$url  = 'https://image.pollinations.ai/prompt/'
      . rawurlencode($fullPrompt)
      . '?width=512&height=512&nologo=true&seed=' . $seed
      . '&model=flux&negative=' . rawurlencode($negativePrompt);

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
    'success'   => true,
    'url'       => $dataUrl,
    'prompt'    => $cleanPrompt,
    'prompt_en' => $engPrompt,
]);
