<?php
/**
 * rules.php — espone le regole di gioco al frontend (pubblico, sola lettura).
 */
header('Content-Type: application/json; charset=utf-8');
require_once '../config/db.php';
echo json_encode(getPublicGameRules());
