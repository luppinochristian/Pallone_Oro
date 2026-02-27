<?php
/**
 * Router per PHP built-in server
 * Serve frontend da /frontend e backend da /backend
 */

$uri = $_SERVER['REQUEST_URI'];
$uri = strtok($uri, '?'); // rimuovi query string per routing

// Se è una richiesta alle API backend
if (strpos($uri, '/backend/') === 0) {
    $file = __DIR__ . $uri;
    if (file_exists($file) && pathinfo($file, PATHINFO_EXTENSION) === 'php') {
        require $file;
        return true;
    }
}

// Se è una richiesta a file statici del frontend (css, js, html)
if (strpos($uri, '/frontend/') === 0) {
    $file = __DIR__ . $uri;
    if (file_exists($file)) {
        // Serve il file con il MIME type corretto
        $ext = pathinfo($file, PATHINFO_EXTENSION);
        $mimes = [
            'css' => 'text/css',
            'js'  => 'application/javascript',
            'html'=> 'text/html',
            'png' => 'image/png',
            'jpg' => 'image/jpeg',
            'svg' => 'image/svg+xml',
        ];
        if (isset($mimes[$ext])) {
            header('Content-Type: ' . $mimes[$ext]);
        }
        readfile($file);
        return true;
    }
}

// Root → redirect al frontend
if ($uri === '/' || $uri === '') {
    header('Location: /frontend/index.html');
    exit;
}

// Fallback: lascia gestire a PHP
return false;
