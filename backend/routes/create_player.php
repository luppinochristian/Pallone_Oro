<?php
require_once "../config/database.php";
require_once "../models/Player.php";

$data = json_decode(file_get_contents("php://input"), true);

$name = $data['name'];
$gender = $data['gender'];
$nationality = $data['nationality'];
$age = rand(16,19);

$shooting = rand(60,70);
$speed = rand(60,70);
$dribbling = rand(60,70);
$physical = rand(60,70);
$mentality = rand(60,70);
$popularity = 50;
$energy = 100;
$morale = 70;

$overall = Player::calculateOverall($shooting,$speed,$dribbling,$physical,$mentality);

$stmt = $pdo->prepare("INSERT INTO players 
(name, gender, nationality, age, shooting, speed, dribbling, physical, mentality, popularity, energy, morale, overall) 
VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)");

$stmt->execute([
    $name, $gender, $nationality, $age,
    $shooting, $speed, $dribbling, $physical,
    $mentality, $popularity, $energy, $morale, $overall
]);

echo json_encode(["success" => true]);
