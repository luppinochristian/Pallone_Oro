<?php
/**
 * Migrazione 007 — limite tentativi sul codice OTP di verifica email.
 * Ogni migrazione restituisce un array di statement SQL, eseguiti in ordine.
 */
return [
    "ALTER TABLE email_verifications ADD COLUMN attempts INT NOT NULL DEFAULT 0",
];
