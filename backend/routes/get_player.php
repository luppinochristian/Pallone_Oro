<?php
require_once "../config/database.php";

$id = $_GET['id'];

$stmt = $pdo->prepare("SELECT * FROM players WHERE id = ?");
$stmt->execute([$id]);
$player = $stmt->fetch(PDO::FETCH_ASSOC);

echo json_encode($player);
