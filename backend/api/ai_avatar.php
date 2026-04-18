<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Auth-Token');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

// Evita timeout su server non-CLI (Apache/nginx-php con max_execution_time basso)
set_time_limit(150);

$data   = json_decode(file_get_contents('php://input'), true) ?? [];
$prompt = trim($data['prompt'] ?? $_GET['prompt'] ?? '');
$gender = trim($data['gender'] ?? $_GET['gender'] ?? 'male');
$gender = in_array($gender, ['male','female']) ? $gender : 'male';

if (!$prompt) {
    echo json_encode(['error' => 'Prompt mancante']); exit;
}

$cleanPrompt = preg_replace('/[^\p{L}\p{N}\s,.\'\-]/u', '', $prompt);
$cleanPrompt = mb_substr(trim($cleanPrompt), 0, 400);

// ── Traduzione italiano → inglese ────────────────────────────────────────────
// ORDINATO: le frasi più lunghe vengono prima di quelle più corte per evitare
// sostituzioni parziali (es. "capelli ricci" prima di "ricci" standalone).
// Si usa preg_replace con \b (word boundary) per evitare che una parola già
// tradotta in inglese venga re-elaborata da un pattern più corto (es. "blu"
// inside "blue" → "bluee").
$itToEn = [
    // ── Stili capelli composti (prima di tutto) ───────────────────────────
    'capelli a caschetto'  => 'bob cut hair',
    'capelli a punta'      => 'spiky hair',
    'capelli rasati ai lati' => 'undercut fade hair',
    'capelli arruffati'    => 'messy hair',
    'capelli raccolti'     => 'hair up',
    'capelli sciolti'      => 'loose hair',
    'capelli ondulati'     => 'wavy hair',
    'capelli ricci corti'  => 'short curly hair',
    'capelli ricci lunghi' => 'long curly hair',
    'capelli ricci'        => 'curly hair',
    'capelli lisci'        => 'straight hair',
    'capelli lunghi'       => 'long hair',
    'capelli corti'        => 'short hair',
    'capelli medi'         => 'medium length hair',
    // ── Colori capelli composti ───────────────────────────────────────────
    'capelli neri'         => 'black hair',
    'capelli biondi'       => 'blonde hair',
    'capelli castani'      => 'brown hair',
    'capelli rossi'        => 'red hair',
    'capelli arancioni'    => 'orange hair',
    'capelli bianchi'      => 'white hair',
    'capelli grigi'        => 'grey hair',
    'capelli viola'        => 'purple hair',
    'capelli blu'          => 'blue hair',
    'capelli verdi'        => 'green hair',
    // ── Testa / acconciature ──────────────────────────────────────────────
    'testa rasata'         => 'shaved head',
    'stempiato'            => 'receding hairline',
    'trecce'               => 'braided hair',
    'treccia'              => 'braid',
    'codino'               => 'small ponytail',
    'coda di cavallo'      => 'ponytail',
    'coda'                 => 'ponytail',
    'frangia'              => 'fringe bangs',
    'dreadlock'            => 'dreadlocks',
    'calvo'                => 'bald head',
    'rasato'               => 'shaved',
    // ── Occhi composti ────────────────────────────────────────────────────
    'occhi rossi'          => 'glowing red eyes',
    'occhi azzurri'        => 'light blue eyes',
    'occhi blu'            => 'blue eyes',
    'occhi verdi'          => 'green eyes',
    'occhi neri'           => 'dark eyes',
    'occhi marroni'        => 'brown eyes',
    'occhi grigi'          => 'grey eyes',
    'occhi gialli'         => 'yellow eyes',
    'occhi viola'          => 'purple eyes',
    'occhi arancioni'      => 'orange eyes',
    'occhi chiari'         => 'light eyes',
    'occhi scuri'          => 'dark eyes',
    // ── Carnagione / pelle composta ───────────────────────────────────────
    'carnagione olivastra' => 'olive skin',
    'carnagione chiara'    => 'light skin',
    'carnagione scura'     => 'dark skin',
    'carnagione media'     => 'medium skin',
    'pelle olivastra'      => 'olive skin',
    'pelle chiara'         => 'light skin',
    'pelle scura'          => 'dark skin',
    // ── Barba / viso composto ─────────────────────────────────────────────
    'barba folta'          => 'thick full beard',
    'barba corta'          => 'short beard',
    'barba lunga'          => 'long beard',
    'senza barba'          => 'clean shaven',
    'barba incolta'        => 'stubble beard',
    'barba'                => 'beard',
    'baffi'                => 'mustache',
    'sopracciglia folte'   => 'thick eyebrows',
    'sopracciglia sottili' => 'thin eyebrows',
    'sopracciglia'         => 'eyebrows',
    'cicatrici'            => 'facial scars',
    'cicatrice'            => 'facial scar',
    'lentiggini'           => 'freckles',
    'rughe'                => 'wrinkles',
    // ── Accessori / corpo ─────────────────────────────────────────────────
    'occhiali da sole'     => 'sunglasses',
    'occhiali'             => 'glasses',
    'tatuaggio sul collo'  => 'neck tattoo',
    'tatuaggio sul viso'   => 'face tattoo',
    'tatuaggio'            => 'tattoo',
    'tatuaggi'             => 'tattoos',
    'orecchino'            => 'earring',
    'orecchini'            => 'earrings',
    // ── Corporatura ───────────────────────────────────────────────────────
    'molto muscoloso'      => 'very muscular build',
    'muscoloso'            => 'muscular build',
    'snello'               => 'slim build',
    'robusto'              => 'stocky build',
    'atletico'             => 'athletic build',
    'alto'                 => 'tall',
    'basso'                => 'short stature',
    // ── Età / aspetto generale ────────────────────────────────────────────
    'giovane'              => 'young looking',
    'maturo'               => 'mature looking',
    'anziano'              => 'older looking',
    // ── Effetti / stile ───────────────────────────────────────────────────
    'fuoco'                => 'fiery glowing',
    'brillanti'            => 'bright glowing',
    'luminosi'             => 'glowing',
    // ── Aggettivi standalone (dopo le frasi composte) ─────────────────────
    'lunghi'               => 'long',
    'corti'                => 'short',
    'medi'                 => 'medium length',
    'ricci'                => 'curly',
    'mossi'                => 'wavy',
    'lisci'                => 'straight',
    'folti'                => 'thick',
    'sottili'              => 'thin',
    'chiari'               => 'light',
    'chiaro'               => 'light',  'chiara'   => 'light',
    'scuri'                => 'dark',
    'scuro'                => 'dark',   'scura'    => 'dark',
    // ── Colori standalone (singolare e plurale) ───────────────────────────
    'arancioni'            => 'orange',
    'arancione'            => 'orange',
    'castani'              => 'brown', 'castane'  => 'brown',
    'castano'              => 'brown', 'castana'  => 'brown',
    'biondi'               => 'blonde','bionde'   => 'blonde',
    'biondo'               => 'blonde','bionda'   => 'blonde',
    'marroni'              => 'brown',
    'marrone'              => 'brown',
    'azzurri'              => 'light blue','azzurre' => 'light blue',
    'azzurro'              => 'light blue','azzurra' => 'light blue',
    'grigi'                => 'grey',  'grigie'   => 'grey',
    'grigio'               => 'grey',  'grigia'   => 'grey',
    'bianchi'              => 'white', 'bianche'  => 'white',
    'bianco'               => 'white', 'bianca'   => 'white',
    'neri'                 => 'black', 'nere'     => 'black',
    'nero'                 => 'black', 'nera'     => 'black',
    'rossi'                => 'red',   'rosse'    => 'red',
    'rosso'                => 'red',   'rossa'    => 'red',
    'verdi'                => 'green',
    'verde'                => 'green',
    'gialli'               => 'yellow','gialle'   => 'yellow',
    'giallo'               => 'yellow','gialla'   => 'yellow',
    'viola'                => 'purple',
    'blu'                  => 'blue',
    // ── Congiunzioni / preposizioni comuni ───────────────────────────────
    ' con '                => ' with ',
    ' e '                  => ' and ',
    ' un '                 => ' a ',
    ' una '                => ' a ',
];

// Ordina per lunghezza decrescente: le frasi più lunghe hanno priorità,
// evitando che "blu" sia processato prima di "occhi blu" ecc.
uksort($itToEn, fn($a,$b) => strlen($b) - strlen($a));

$engPrompt = mb_strtolower($cleanPrompt);
foreach ($itToEn as $it => $en) {
    // Usa word boundary \b per le parole, semplice replace per congiunzioni con spazi
    if (str_starts_with($it, ' ') || str_ends_with($it, ' ')) {
        // Congiunzioni/preposizioni: hanno già spazi, sostituisci direttamente
        $engPrompt = str_ireplace($it, $en, $engPrompt);
    } else {
        // Word-boundary aware: evita che "blu" → "blue" poi riprocessi "blu" dentro "blue"
        $engPrompt = preg_replace('/\b' . preg_quote($it, '/') . '\b/iu', $en, $engPrompt);
    }
}

// ── Genere ────────────────────────────────────────────────────────────────────
$genderWord = $gender === 'female'
    ? 'female woman soccer player'
    : 'male man soccer player';

// ── Prompt finale — caratteristiche fisiche PRIMA dello stile ─────────────────
$fullPrompt =
    'comic book portrait of a ' . $genderWord . ', '
    . $engPrompt . ', '
    . 'comic book art style, bold linework, cel shading, '
    . 'dark background with golden light, sports jersey, '
    . 'detailed face, vibrant colors, no text, no watermark';

$seed = rand(1, 999999);
// NOTA: nessun parametro &negative= — non supportato da flux su Pollinations
$url  = 'https://image.pollinations.ai/prompt/'
      . rawurlencode($fullPrompt)
      . '?width=512&height=512&nologo=true&seed=' . $seed . '&model=flux';

$ctx = stream_context_create([
    'http' => ['timeout' => 120, 'follow_location' => 1,
               'header'  => "User-Agent: Mozilla/5.0\r\n"],
    'ssl'  => ['verify_peer' => false],
]);

$imgData = @file_get_contents($url, false, $ctx);

if ($imgData === false || strlen($imgData) < 1000) {
    echo json_encode(['error' => 'Generazione fallita. Riprova tra qualche secondo.']); exit;
}

$mime = 'image/jpeg';
$ext  = 'jpg';

if (function_exists('imagecreatefromstring')) {
    $src = @imagecreatefromstring($imgData);
    if ($src) {
        $dst = imagecreatetruecolor(384, 384);
        imagecopyresampled($dst, $src, 0, 0, 0, 0, 384, 384, imagesx($src), imagesy($src));
        ob_start(); imagepng($dst, null, 5); $imgData = ob_get_clean();
        imagedestroy($src); imagedestroy($dst);
        $mime = 'image/png';
        $ext  = 'png';
    }
}

if ($mime === 'image/jpeg') {
    // GD non disponibile o fallita: rileva il tipo reale dai magic bytes
    if (strlen($imgData) >= 4 && substr($imgData, 0, 4) === "\x89PNG") {
        $mime = 'image/png'; $ext = 'png';
    } elseif (strlen($imgData) >= 12 && substr($imgData, 0, 4) === 'RIFF'
              && substr($imgData, 8, 4) === 'WEBP') {
        $mime = 'image/webp'; $ext = 'webp';
    }
}

// ── Salva su disco invece di restituire base64 ────────────────────────────────
// In questo modo il DB conserva solo un path breve (es. /frontend/avatars/abc123.png)
// invece di 150-200 KB di base64 per ogni carriera.
// Il router.php già serve /frontend/ come file statici, quindi il path funziona subito.
$avatarsDir = dirname(__DIR__, 2) . '/frontend/avatars';
if (!is_dir($avatarsDir)) {
    mkdir($avatarsDir, 0755, true);
}
$filename   = bin2hex(random_bytes(16)) . '.' . $ext;
$filepath   = $avatarsDir . '/' . $filename;
$avatarUrl  = '/frontend/avatars/' . $filename;

if (file_put_contents($filepath, $imgData) === false) {
    // Fallback: se il filesystem non è scrivibile, usa base64 inline
    $avatarUrl = "data:{$mime};base64," . base64_encode($imgData);
}

echo json_encode([
    'success'   => true,
    'url'       => $avatarUrl,
    'prompt'    => $cleanPrompt,
    'prompt_en' => $engPrompt,
]);
