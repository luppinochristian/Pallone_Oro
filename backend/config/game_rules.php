<?php
/**
 * ============================================================
 * game_rules.php — UNICA fonte di verità delle regole di gioco
 * ============================================================
 * Costanti usate dal backend. Il frontend le legge dall'endpoint
 * backend/api/rules.php: non va più duplicato a mano in app.js.
 *
 * Per cambiare una regola (es. età del ritiro) si modifica SOLO qui.
 * ============================================================
 */

// Età a cui la carriera termina (schermata di ritiro)
define('RETIRE_AGE', 38);

// Overall minimo per trasferirsi, in funzione delle stelle della squadra
define('STELLE_OVR_MAP', [1 => 55, 2 => 75, 3 => 90, 4 => 105, 5 => 120]);

// Overall minimo assoluto (anche con sconto agente)
define('MIN_OVERALL_FLOOR', 55);

// Overall massimo teorico (media di 5 attributi da max 125)
define('OVERALL_MAX', 125);

/**
 * Regole esposte al frontend. Solo dati non sensibili.
 */
function getPublicGameRules(): array {
    return [
        'retire_age'       => RETIRE_AGE,
        'stelle_ovr_map'   => STELLE_OVR_MAP,
        'min_overall_floor'=> MIN_OVERALL_FLOOR,
        'overall_max'      => OVERALL_MAX,
    ];
}
