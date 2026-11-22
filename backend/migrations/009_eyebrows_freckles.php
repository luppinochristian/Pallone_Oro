<?php
/**
 * Migrazione 009 — sopracciglia e lentiggini del giocatore (personalizzazione grafica).
 */
return [
    "ALTER TABLE players ADD COLUMN eyebrow_style VARCHAR(20) NOT NULL DEFAULT 'standard'",
    "ALTER TABLE players ADD COLUMN freckles TINYINT(1) NOT NULL DEFAULT 0",
];
