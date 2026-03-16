<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Auth-Token');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }
ini_set('display_errors', 0);

$raw  = file_get_contents('php://input');
$data = json_decode($raw, true) ?: [];
$userPrompt = strtolower(trim($data['prompt'] ?? $_GET['prompt'] ?? ''));

if (!$userPrompt) { echo json_encode(['error' => 'Prompt mancante']); exit; }

// ── Parser del prompt ──────────────────────────────────────────────────────
function pickFrom($prompt, $map, $default) {
    foreach ($map as $keyword => $val) {
        if (strpos($prompt, $keyword) !== false) return $val;
    }
    return $default;
}

// Carnagione
$skinMap = [
    'bianca'=>'#FDDBB4','chiara'=>'#FDDBB4','bianco'=>'#FDDBB4','pallida'=>'#FDDBB4',
    'olivastra'=>'#C68642','oliva'=>'#C68642','mediterranea'=>'#C8964A',
    'scura'=>'#8D5524','nera'=>'#6B3A2A','nero'=>'#6B3A2A','africa'=>'#5C3317',
    'marrone'=>'#A0522D','abbronzata'=>'#CC8844','abbronzato'=>'#CC8844',
    'latina'=>'#C07A40','latino'=>'#C07A40','asiatica'=>'#E8C99A','asiatico'=>'#E8C99A',
];
$skin = pickFrom($userPrompt, $skinMap, '#D4956A');

// Capelli - colore
$hairColMap = [
    'biondi'=>'#F5D060','bionda'=>'#F5D060','biondo'=>'#F5D060',
    'castani'=>'#8B5E3C','castana'=>'#8B5E3C','castano'=>'#8B5E3C',
    'neri'=>'#1A1A1A','nera'=>'#1A1A1A','nero'=>'#1A1A1A',
    'rossi'=>'#C0392B','rossa'=>'#C0392B','rosso'=>'#C0392B','ramata'=>'#B5451B',
    'grigi'=>'#888','grigi'=>'#888','grigio'=>'#888','bianchi'=>'#DDD','bianco'=>'#DDD',
    'azzurri'=>'#3A9BD5','viola'=>'#8E44AD','verdi'=>'#27AE60','colorati'=>'#E74C3C',
];
$hairCol = pickFrom($userPrompt, $hairColMap, '#3D2B1F');

// Capelli - stile
$hairStyle = 'short';
if (preg_match('/ricc[io]/u', $userPrompt)) $hairStyle = 'curly';
elseif (strpos($userPrompt,'mossi')!==false||strpos($userPrompt,'mossa')!==false) $hairStyle = 'wavy';
elseif (strpos($userPrompt,'lunghi')!==false||strpos($userPrompt,'lunga')!==false) $hairStyle = 'long';
elseif (strpos($userPrompt,'rast')!==false) $hairStyle = 'rasta';
elseif (strpos($userPrompt,'rasata')!==false||strpos($userPrompt,'rasato')!==false||strpos($userPrompt,'calvo')!==false) $hairStyle = 'bald';
elseif (strpos($userPrompt,'mohawk')!==false||strpos($userPrompt,'cresta')!==false) $hairStyle = 'mohawk';
elseif (strpos($userPrompt,'afro')!==false) $hairStyle = 'afro';

// Occhi
$eyeMap = [
    'marroni'=>'#6B3A2A','marrone'=>'#6B3A2A',
    'verdi'=>'#27AE60','verde'=>'#27AE60',
    'azzurri'=>'#3A9BD5','azzurro'=>'#3A9BD5','blu'=>'#2471A3','celesti'=>'#5DADE2',
    'grigi'=>'#717D7E','grigio'=>'#717D7E',
    'neri'=>'#1A1A1A','nero'=>'#1A1A1A',
    'nocciola'=>'#A04000','ambra'=>'#E67E22',
];
$eyeCol = pickFrom($userPrompt, $eyeMap, '#6B3A2A');

// Barba / capelli facciali
$hasBeard = preg_match('/barb[a]|baffetti|baffi|pizzetto/u', $userPrompt);
$beardCol  = $hairCol;

// Espressione
$serious = strpos($userPrompt,'serio')!==false||strpos($userPrompt,'determinat')!==false||strpos($userPrompt,'duro')!==false;
$smile   = strpos($userPrompt,'sorriso')!==false||strpos($userPrompt,'sorridente')!==false||strpos($userPrompt,'felice')!==false;

// Colore pelle ombre
function darken($hex, $amt=30) {
    $hex = ltrim($hex,'#');
    $r = max(0,hexdec(substr($hex,0,2))-$amt);
    $g = max(0,hexdec(substr($hex,2,2))-$amt);
    $b = max(0,hexdec(substr($hex,4,2))-$amt);
    return sprintf('#%02X%02X%02X',$r,$g,$b);
}
function lighten($hex, $amt=40) {
    $hex = ltrim($hex,'#');
    $r = min(255,hexdec(substr($hex,0,2))+$amt);
    $g = min(255,hexdec(substr($hex,2,2))+$amt);
    $b = min(255,hexdec(substr($hex,4,2))+$amt);
    return sprintf('#%02X%02X%02X',$r,$g,$b);
}

$skinDark   = darken($skin, 35);
$skinLight  = lighten($skin, 30);

// ── SVG Generator ──────────────────────────────────────────────────────────
$mouth = $smile
    ? '<path d="M88 148 Q100 160 112 148" stroke="'.$skinDark.'" stroke-width="2.5" fill="none" stroke-linecap="round"/>'
    : ($serious
        ? '<path d="M88 150 Q100 146 112 150" stroke="'.$skinDark.'" stroke-width="2.5" fill="none" stroke-linecap="round"/>'
        : '<path d="M90 148 Q100 155 110 148" stroke="'.$skinDark.'" stroke-width="2" fill="none" stroke-linecap="round"/>');

// Capelli in base allo stile
$hair = '';
switch ($hairStyle) {
    case 'bald': break;
    case 'curly':
        $hair = '<ellipse cx="100" cy="58" rx="42" ry="34" fill="'.$hairCol.'"/>
        <circle cx="62" cy="62" r="14" fill="'.$hairCol.'"/>
        <circle cx="138" cy="62" r="14" fill="'.$hairCol.'"/>
        <circle cx="72" cy="50" r="12" fill="'.$hairCol.'"/>
        <circle cx="128" cy="50" r="12" fill="'.$hairCol.'"/>
        <circle cx="100" cy="42" r="11" fill="'.$hairCol.'"/>';
        break;
    case 'afro':
        $hair = '<ellipse cx="100" cy="55" rx="52" ry="44" fill="'.$hairCol.'"/>
        <circle cx="55" cy="70" r="20" fill="'.$hairCol.'"/>
        <circle cx="145" cy="70" r="20" fill="'.$hairCol.'"/>';
        break;
    case 'rasta':
        $hair = '<ellipse cx="100" cy="58" rx="42" ry="30" fill="'.$hairCol.'"/>
        <rect x="68" y="72" width="7" height="55" rx="3" fill="'.$hairCol.'"/>
        <rect x="82" y="72" width="7" height="60" rx="3" fill="'.$hairCol.'"/>
        <rect x="96" y="72" width="7" height="58" rx="3" fill="'.$hairCol.'"/>
        <rect x="110" y="72" width="7" height="55" rx="3" fill="'.$hairCol.'"/>
        <rect x="124" y="72" width="7" height="52" rx="3" fill="'.$hairCol.'"/>';
        break;
    case 'long':
        $hair = '<ellipse cx="100" cy="60" rx="42" ry="32" fill="'.$hairCol.'"/>
        <rect x="60" y="75" width="20" height="80" rx="8" fill="'.$hairCol.'"/>
        <rect x="120" y="75" width="20" height="80" rx="8" fill="'.$hairCol.'"/>';
        break;
    case 'mohawk':
        $hair = '<rect x="90" y="30" width="20" height="50" rx="8" fill="'.$hairCol.'"/>
        <ellipse cx="100" cy="32" rx="10" ry="16" fill="'.$hairCol.'"/>';
        break;
    case 'wavy':
        $hair = '<ellipse cx="100" cy="60" rx="42" ry="32" fill="'.$hairCol.'"/>
        <path d="M60 72 Q65 80 70 72 Q75 64 80 72" fill="'.$hairCol.'" stroke="none"/>
        <path d="M120 72 Q125 80 130 72 Q135 64 140 72" fill="'.$hairCol.'" stroke="none"/>';
        break;
    default: // short
        $hair = '<ellipse cx="100" cy="58" rx="42" ry="30" fill="'.$hairCol.'"/>
        <rect x="59" y="70" width="12" height="20" rx="4" fill="'.$hairCol.'"/>
        <rect x="129" y="70" width="12" height="20" rx="4" fill="'.$hairCol.'"/>';
}

$beard = $hasBeard
    ? '<path d="M76 155 Q100 175 124 155 Q120 168 100 174 Q80 168 76 155Z" fill="'.$beardCol.'" opacity="0.85"/>'
    : '';

// Naso
$nose = '<path d="M96 115 Q100 130 104 115" stroke="'.$skinDark.'" stroke-width="2" fill="none" stroke-linecap="round"/>
<path d="M93 130 Q100 135 107 130" stroke="'.$skinDark.'" stroke-width="1.5" fill="none" stroke-linecap="round"/>';

// Orecchie
$ears = '<ellipse cx="58" cy="118" rx="8" ry="12" fill="'.$skin.'"/>
<ellipse cx="58" cy="118" rx="5" ry="8" fill="'.$skinDark.'"/>
<ellipse cx="142" cy="118" rx="8" ry="12" fill="'.$skin.'"/>
<ellipse cx="142" cy="118" rx="5" ry="8" fill="'.$skinDark.'"/>';

// Collo e spalle
$body = '<rect x="80" y="178" width="40" height="30" rx="6" fill="'.$skin.'"/>
<path d="M30 200 Q100 185 170 200 L170 220 L30 220Z" fill="#1a472a"/>
<path d="M30 200 Q100 185 170 200 L173 208 L27 208Z" fill="#ffffff" opacity="0.3"/>';

$svg = <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 220" width="256" height="256">
  <defs>
    <radialGradient id="bg" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#2d3748"/>
      <stop offset="100%" stop-color="#1a202c"/>
    </radialGradient>
    <radialGradient id="faceGrad" cx="45%" cy="35%" r="65%">
      <stop offset="0%" stop-color="{$skinLight}"/>
      <stop offset="100%" stop-color="{$skin}"/>
    </radialGradient>
    <filter id="shadow"><feDropShadow dx="0" dy="3" stdDeviation="4" flood-opacity="0.4"/></filter>
  </defs>
  <rect width="200" height="220" fill="url(#bg)" rx="16"/>
  {$body}
  {$ears}
  <!-- Testa -->
  <ellipse cx="100" cy="118" rx="42" ry="52" fill="url(#faceGrad)" filter="url(#shadow)"/>
  <!-- Ombra laterale -->
  <ellipse cx="138" cy="118" rx="8" ry="46" fill="{$skinDark}" opacity="0.18"/>
  {$hair}
  <!-- Sopracciglia -->
  <path d="M78 90 Q88 86 98 90" stroke="{$hairCol}" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M102 90 Q112 86 122 90" stroke="{$hairCol}" stroke-width="3" fill="none" stroke-linecap="round"/>
  <!-- Occhi bianchi -->
  <ellipse cx="88" cy="108" rx="10" ry="8" fill="#fff"/>
  <ellipse cx="112" cy="108" rx="10" ry="8" fill="#fff"/>
  <!-- Iride -->
  <circle cx="88" cy="108" r="6" fill="{$eyeCol}"/>
  <circle cx="112" cy="108" r="6" fill="{$eyeCol}"/>
  <!-- Pupille -->
  <circle cx="89" cy="108" r="3.5" fill="#111"/>
  <circle cx="113" cy="108" r="3.5" fill="#111"/>
  <!-- Riflessi occhi -->
  <circle cx="91" cy="105" r="1.5" fill="#fff" opacity="0.9"/>
  <circle cx="115" cy="105" r="1.5" fill="#fff" opacity="0.9"/>
  <!-- Ciglia -->
  <path d="M78 101 Q83 97 88 100" stroke="{$hairCol}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M112 100 Q117 97 122 101" stroke="{$hairCol}" stroke-width="2" fill="none" stroke-linecap="round"/>
  {$nose}
  {$mouth}
  {$beard}
</svg>
SVG;

// Converti SVG in PNG tramite PHP GD se disponibile, altrimenti restituisci SVG come base64
// GD non ha supporto SVG nativo, quindi restituiamo SVG as-is encoded in base64
$base64  = base64_encode($svg);
$dataUrl = "data:image/svg+xml;base64,{$base64}";

echo json_encode(['success' => true, 'data_url' => $dataUrl]);
