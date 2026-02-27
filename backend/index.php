<?php

$request = $_SERVER['REQUEST_URI'];

if (strpos($request, "create_player") !== false) {
    require "routes/create_player.php";
}
elseif (strpos($request, "get_player") !== false) {
    require "routes/get_player.php";
}
elseif (strpos($request, "simulate_month") !== false) {
    require "routes/simulate_month.php";
}
else {
    echo json_encode(["message" => "Golden Striker API"]);
}
