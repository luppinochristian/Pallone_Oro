<?php
/**
 * ============================================================
 * appearance.php — aspetto del giocatore (barba, sopracciglia, lentiggini)
 * ============================================================
 * Funzioni pure: nessun accesso al DB, testabili in tests/run.php.
 * ============================================================
 */

// Stili di barba/baffi ammessi. 'none' = rasato (default).
const FACIAL_HAIR_STYLES = ['none', 'stubble', 'goatee', 'beard', 'mustache'];

/**
 * Restituisce uno stile di barba valido. Qualsiasi valore non ammesso
 * (input manipolato, campo mancante) diventa 'none'.
 */
function normalizeFacialHair($value): string {
    return in_array($value, FACIAL_HAIR_STYLES, true) ? $value : 'none';
}

// Stili di sopracciglia ammessi. 'standard' = disegno di base (default).
const EYEBROW_STYLES = ['thin', 'standard', 'thick', 'arched'];

/** Stile sopracciglia valido; qualsiasi altro valore diventa 'standard'. */
function normalizeEyebrowStyle($value): string {
    return in_array($value, EYEBROW_STYLES, true) ? $value : 'standard';
}

// Colori maglia ammessi. NULL = colore di default del genere (blu M / rosa F).
const KIT_COLORS = ['#1565c0', '#c62828', '#2e7d32', '#eeeeee', '#212121', '#f9a825', '#6a1b9a', '#ef6c00'];

/** Colore maglia valido oppure null (= default del genere). */
function normalizeKitColor($value): ?string {
    if (!is_string($value)) return null;
    $v = strtolower($value);
    return in_array($v, KIT_COLORS, true) ? $v : null;
}

/** Lentiggini come flag 0/1. Accetta bool, 0/1, '0'/'1', 'true'/'false'. */
function normalizeFreckles($value): int {
    return filter_var($value, FILTER_VALIDATE_BOOLEAN) ? 1 : 0;
}
