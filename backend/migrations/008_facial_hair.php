<?php
/**
 * Migrazione 008 — barba e baffi del giocatore (personalizzazione manuale).
 */
return [
    "ALTER TABLE players ADD COLUMN facial_hair VARCHAR(20) NOT NULL DEFAULT 'none'",
];
