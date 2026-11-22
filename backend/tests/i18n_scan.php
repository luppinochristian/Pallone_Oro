<?php
/**
 * Controllo traduzioni lato server: ogni chiamata t(it, en, de, es) deve avere 4 lingue.
 * Una chiamata con 2 o 3 argomenti farebbe ricadere de/es sull'inglese.
 * Restituisce l'elenco dei problemi (array vuoto = ok).
 */
function scanI18nIssues(string $root): array {
    $issues = [];
    $base = rtrim(realpath($root) ?: $root, '/');
    $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($base));
    foreach ($it as $f) {
        // esclude la cartella tests/ confrontando il percorso relativo alla root
        $rel = substr($f->getPathname(), strlen($base));
        if ($f->getExtension() !== 'php' || strpos($rel, '/tests/') !== false) continue;
        $toks = token_get_all(file_get_contents($f->getPathname()));
        $n = count($toks);
        for ($i = 0; $i < $n; $i++) {
            if (!is_array($toks[$i]) || $toks[$i][0] !== T_STRING || $toks[$i][1] !== 't') continue;
            $prev = null;
            for ($j = $i - 1; $j >= 0; $j--) { if (is_array($toks[$j]) && $toks[$j][0] === T_WHITESPACE) continue; $prev = $toks[$j]; break; }
            if (is_array($prev) && $prev[0] === T_FUNCTION) continue;
            $k = $i + 1;
            while (is_array($toks[$k]) && $toks[$k][0] === T_WHITESPACE) $k++;
            if ($toks[$k] !== '(') continue;
            // conta gli argomenti di primo livello
            $args = 1; $depth = 0; $hasContent = false;
            for ($k++; $k < $n; $k++) {
                $tk = $toks[$k];
                if ($tk === '(' || $tk === '[' || $tk === '{') $depth++;
                if ($tk === ')' || $tk === ']' || $tk === '}') { if ($depth === 0) break; $depth--; }
                if ($tk === ',' && $depth === 0) { $args++; continue; }
                if (!(is_array($tk) && $tk[0] === T_WHITESPACE)) $hasContent = true;
            }
            if (!$hasContent) continue;
            if ($args === 2 || $args === 3) {
                $issues[] = $f->getPathname() . ':' . $toks[$i][2] . ' (' . $args . ' argomenti)';
            }
        }
    }
    return $issues;
}
