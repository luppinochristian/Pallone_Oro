<?php
/**
 * engine/player_sim.php — abilità, tipi di gol e simulazione prestazione del giocatore
 * Estratto da api/game.php (refactor): nessuna logica modificata.
 */

function getPlayerSkills($db, $player_id) {
    try {
        $stmt = $db->prepare("SELECT skill_id, level FROM skill_boosts WHERE player_id=? AND level > 0");
        $stmt->execute([$player_id]);
        $skills = [];
        foreach ($stmt->fetchAll() as $row) {
            $skills[$row['skill_id']] = intval($row['level']);
        }
        return $skills;
    } catch (Exception $e) {
        return [];
    }
}

function getGolType($p, $skills) {
    // Build pool of possible gol types based on unlocked skills
    // Each entry: [type_key, weight, description_template]
    $pool = [];
    $nome = $p['player_name'];

    // Base types always available
    $pool[] = ['base_dx', 10, null]; // handled separately

    // Tiro potente (tiro_potente >= 1)
    if (isset($skills['tiro_potente'])) {
        $w = $skills['tiro_potente'] >= 2 ? 25 : 15;
        $pool[] = ['tiro_potente', $w, [
            _tn("con un tiro potentissimo che ha bucato il portiere","with a thunderous strike that beat the keeper","mit einem wuchtigen Schuss, der den Keeper bezwang","con un disparo potentísimo que batió al portero"),
            _tn("con una cannonata da fuori area impossibile da fermare","with an unstoppable rocket from outside the box","mit einem unhaltbaren Geschoss von außerhalb des Strafraums","con un cañonazo desde fuera del área imposible de parar"),
            _tn("con un destro/sinistro di potenza pazzesca da dentro l'area","with an incredibly powerful shot from inside the box","mit einem unglaublich kraftvollen Schuss aus dem Strafraum","con un disparo de potencia brutal desde dentro del área")
        ]];
    }
    // Tiro a giro / trivella (tiro_giro >= 1)
    if (isset($skills['tiro_giro'])) {
        $w = $skills['tiro_giro'] >= 2 ? 22 : 14;
        $pool[] = ['tiro_giro', $w, [
            _tn("con un tiro angolato a giro sul secondo palo","with a curling shot into the far corner","mit einem gekrümmten Schuss ins lange Eck","con un disparo colocado y curvo al segundo palo"),
            _tn("con una trivella sul palo lontano, traiettoria imprendibile","with a knuckleball to the far post, an unreachable trajectory","mit einem Flatterball ans lange Eck, unerreichbare Flugbahn","con una rosca al palo lejano, trayectoria inalcanzable"),
            _tn("con un tiro a giro all'incrocio dei pali di rara bellezza","with a curling shot into the top corner of rare beauty","mit einem gekrümmten Schuss in den Winkel von seltener Schönheit","con un disparo curvo a la escuadra de rara belleza")
        ]];
    }
    // Colpo di testa (colpo_testa >= 1)
    if (isset($skills['colpo_testa'])) {
        $w = $skills['colpo_testa'] >= 2 ? 20 : 12;
        $pool[] = ['colpo_testa', $w, [
            _tn("di testa, saltando sopra a tutti i difensori sul cross","with a header, rising above every defender on the cross","per Kopf, über alle Verteidiger steigend bei der Flanke","de cabeza, saltando por encima de todos los defensores en el centro"),
            _tn("con un colpo di testa imperioso che non ha lasciato scampo","with a commanding header that left no chance","mit einem gebieterischen Kopfball, der keine Chance ließ","con un cabezazo imperioso que no dejó opción"),
            _tn("di testa su corner, dominando il difensore in elevazione","with a header from a corner, dominating his marker in the air","per Kopf nach Ecke, den Gegenspieler in der Luft beherrschend","de cabeza tras córner, dominando al defensor en el salto")
        ]];
    }
    // Turbo / velocista -> gol in velocità
    if (isset($skills['turbo']) || isset($skills['velocista'])) {
        $w = isset($skills['turbo']) ? 20 : 12;
        $pool[] = ['velocita', $w, [
            _tn("con uno scatto fulmineo che ha bruciato la difesa in velocità","with a lightning burst that scorched the defence for pace","mit einem blitzartigen Antritt, der die Abwehr im Tempo überlief","con un arranque fulgurante que quemó a la defensa en velocidad"),
            _tn("dopo aver seminato tre difensori in ripartenza fulminante","after leaving three defenders behind on a lightning counter","nachdem er drei Verteidiger im blitzschnellen Konter stehen ließ","tras dejar atrás a tres defensores en un contragolpe fulgurante"),
            _tn("con una corsa velocissima e un tiro a botta sicura","with a blistering run and a clinical finish","mit einem rasend schnellen Lauf und einem sicheren Abschluss","con una carrera velocísima y una definición segura")
        ]];
    }
    // Gol di Rabona (gol_rabona >= 1)
    if (isset($skills['gol_rabona'])) {
        $pool[] = ['rabona', 18, [
            _tn("con una RABONA da urlo che ha lasciato tutti di stucco!","with a screamer of a RABONA that stunned everyone!","mit einer sensationellen RABONA, die alle verblüffte!","¡con una RABONA de escándalo que dejó a todos atónitos!"),
            _tn("con una rabona leggendaria: il pubblico è esploso in un boato!","with a legendary rabona: the crowd erupted in a roar!","mit einer legendären Rabona: das Publikum brüllte vor Begeisterung!","¡con una rabona legendaria: el público estalló en un rugido!")
        ]];
    }
    // Istinto del goleador
    if (isset($skills['istinto'])) {
        $pool[] = ['istinto', 15, [
            _tn("con il suo istinto da goleador puro: palla sul piede, gol","with pure goalscorer's instinct: ball to feet, goal","mit reinem Torjägerinstinkt: Ball am Fuß, Tor","con puro instinto de goleador: balón al pie, gol"),
            _tn("trovandosi nel posto giusto al momento giusto — istinto puro","being in the right place at the right time — pure instinct","zur richtigen Zeit am richtigen Ort — purer Instinkt","estando en el lugar correcto en el momento correcto — puro instinto")
        ]];
    }
    // Da punizione (freddezza >= 2)
    if (isset($skills['freddezza']) && $skills['freddezza'] >= 2) {
        $pool[] = ['punizione', 14, [
            _tn("con un gol direttamente da calcio di punizione, potente e angolato","with a goal straight from a free-kick, powerful and placed","mit einem direkt verwandelten Freistoß, kraftvoll und platziert","con un gol directo de falta, potente y colocado"),
            _tn("da punizione, superando la barriera con un tiro preciso come un laser","from a free-kick, beating the wall with a laser-precise shot","per Freistoß, die Mauer mit einem laserpräzisen Schuss überwindend","de falta, superando la barrera con un disparo preciso como un láser")
        ]];
    }

    // Weighted random
    $total = array_sum(array_column($pool, 1));
    $rand = rand(1, $total);
    $cum = 0;
    foreach ($pool as $entry) {
        $cum += $entry[1];
        if ($rand <= $cum) {
            if ($entry[0] === 'base_dx' || $entry[2] === null) return null; // use default
            $descs = $entry[2];
            return ['type' => $entry[0], 'desc' => !empty($descs) ? $descs[rand(0, count($descs)-1)] : ''];
        }
    }
    return null;
}

function simulateMatch($p, $skills = []) {
    $team_stars = intval($p['team_stelle'] ?? 1);
    $form  = ($p['morale'] + $p['energia']) / 2;

    // Bonus piede forte/debole
    $piede_forte = intval($p['piede_forte'] ?? 3);
    $piede_bonus = ($piede_forte / 5) * 5; // up to +5 bonus to power

    $power = min(100, ($p['overall']*0.5) + ($form*0.3) + ($team_stars*10*0.2) + $piede_bonus);
    $gol=0; $assist=0;
    for ($i=0;$i<4;$i++) if (rand(1,100)<$power*0.4) $gol++;
    for ($i=0;$i<3;$i++) if (rand(1,100)<$power*0.3) $assist++;

    // Formula voto:
    // - Base 5.5: un professionista parte da "sufficiente"
    // - Gol vale +1.0: segna 2 gol → almeno 7.5 garantito
    // - Assist vale +0.6
    // - Rumore casuale ridotto (±0.56) così non azzera mai una doppietta
    // - OVR alto = leggero bonus costanza; bassa forma = bias negativo
    $ovr_factor  = ($p['overall'] - 50) / 75.0; // 0.0–1.0
    $noise       = rand(-8, 8) * 0.07;
    if ($form < 50) $noise -= 0.3; // penalità se forma scarsa
    $voto = round(5.5 + $gol*1.0 + $assist*0.6 + $noise + $ovr_factor*0.5, 1);
    $voto = max(4.5, min(10.0, $voto));
    $stipendio = $p['overall']*$p['moltiplicatore_stipendio']*100+$gol*1500+$assist*800;
    $pop_gain  = $gol*5+$assist*2+($voto>7?5:0);
    $morale    = ($voto>=7)?rand(10,25):rand(-8,0);
    $perf_word = _tn('stellare','stellar','glänzend','estelar');
    $perf_poor = _tn('opaca','poor','schwach','floja');
    $perf = $voto >= 7 ? $perf_word : $perf_poor;
    $descs = [
        _tn("{$gol} gol e {$assist} assist! Voto: {$voto}",
            "{$gol} goal(s) and {$assist} assist(s)! Rating: {$voto}",
            "{$gol} Tor/Tore und {$assist} Vorlage(n)! Bewertung: {$voto}",
            "{$gol} gol y {$assist} asistencia(s)! Valoración: {$voto}"),
        _tn("Prestazione {$perf} – {$gol} gol. Voto {$voto}",
            "{$perf} performance – {$gol} goal(s). Rating {$voto}",
            "{$perf} Leistung – {$gol} Tor/Tore. Bewertung {$voto}",
            "Actuación {$perf} – {$gol} gol(es). Valoración {$voto}"),
    ];

    // Determine gol type for news
    $gol_type = null;
    if ($gol > 0 && !empty($skills)) {
        $gol_type = getGolType($p, $skills);
    }

    return ['gol'=>$gol,'assist'=>$assist,'voto'=>$voto,'stipendio'=>round($stipendio),'pop_gain'=>$pop_gain,'morale'=>$morale,'desc'=>$descs[rand(0,1)],'gol_type'=>$gol_type];
}

