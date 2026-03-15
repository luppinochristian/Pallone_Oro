<?php
/**
 * Router per PHP built-in server — serve tutto dalla porta 8080
 */
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Richieste alle API PHP
if (strpos($uri, '/backend/') === 0) {
    $file = __DIR__ . $uri;
    if (file_exists($file) && pathinfo($file, PATHINFO_EXTENSION) === 'php') {
        // Cambia directory per far funzionare i require relativi
        chdir(dirname($file));
        require $file;
        return true;
    }
}

// File statici del frontend
if (strpos($uri, '/frontend/') === 0) {
    $file = __DIR__ . $uri;
    if (file_exists($file) && !is_dir($file)) {
        $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
        $mimes = [
            'html' => 'text/html; charset=utf-8',
            'css'  => 'text/css',
            'js'   => 'application/javascript',
            'json' => 'application/json',
            'png'  => 'image/png',
            'jpg'  => 'image/jpeg',
            'svg'  => 'image/svg+xml',
        ];
        if (isset($mimes[$ext])) header('Content-Type: ' . $mimes[$ext]);
        readfile($file);
        return true;
    }
}

// Root → index
if ($uri === '/' || $uri === '') {
    header('Location: /frontend/index.html');
    exit;
}

return false;
