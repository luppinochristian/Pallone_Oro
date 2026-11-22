<?php
/**
 * Migrazione 010 — colore della maglia (personalizzazione grafica).
 * NULL = colore di default del genere, così le carriere esistenti restano invariate.
 */
return [
    "ALTER TABLE players ADD COLUMN kit_color VARCHAR(7) NULL DEFAULT NULL",
];
