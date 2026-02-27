<?php
class Player {

    public static function calculateOverall($shooting, $speed, $dribbling, $physical, $mentality) {
        return round(
            $shooting * 0.25 +
            $speed * 0.20 +
            $dribbling * 0.20 +
            $physical * 0.15 +
            $mentality * 0.20
        );
    }

    public static function simulateMonth($player) {

        $goalChance = (
            $player['shooting'] * 0.4 +
            $player['overall'] * 0.3 +
            $player['morale'] * 0.1
        ) / 100;

        $goals = rand(0, round($goalChance));
        $assists = rand(0, 2);

        $moneyEarned = $player['overall'] * 1000;

        return [
            "goals" => $goals,
            "assists" => $assists,
            "money" => $moneyEarned
        ];
    }
}
