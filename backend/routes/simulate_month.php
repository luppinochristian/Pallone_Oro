<?php
require_once "../config/database.php";
require_once "../models/Player.php";

$id = $_GET['id'];

$stmt = $pdo->prepare("SELECT * FROM players WHERE id = ?");
$stmt->execute([$id]);
$player = $stmt->fetch(PDO::FETCH_ASSOC);

$result = Player::simulateMonth($player);

$newMoney = $player['money'] + $result['money'];

$update = $pdo->prepare("UPDATE players SET money = ? WHERE id = ?");
$update->execute([$newMoney, $id]);

echo json_encode($result);
