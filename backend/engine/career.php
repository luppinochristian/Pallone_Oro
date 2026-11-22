<?php
/**
 * engine/career.php — strutture, cambio squadra, abilità, Pallone d'Oro e riepilogo carriera
 * Estratto da api/game.php (refactor): nessuna logica modificata.
 */

function getBonusStruttura($livello) {
    if (!$livello) return ['bonus_allenamento'=>0,'bonus_crescita'=>0,'riduzione_infortuni'=>0];
    $db = getDB();
    $stmt = $db->prepare("SELECT * FROM strutture WHERE livello=?");
    $stmt->execute([$livello]);
    return $stmt->fetch() ?: ['bonus_allenamento'=>0,'bonus_crescita'=>0,'riduzione_infortuni'=>0];
}

function calcPalloneDoro($db, $player_id, $p, $overall, $gol_carriera, $assist_carriera) {
    $anno = $p['anno_corrente'];
    $stmt = $db->prepare("SELECT SUM(gol) as gol,SUM(assist) as assist,AVG(voto) as voto,COUNT(*) as partite_reali FROM log_mensile WHERE player_id=? AND anno=? AND avv!='' AND avv!='__riepilogo'");
    $stmt->execute([$player_id,$anno]);
    $stats = $stmt->fetch();
    $lega_bonus = (intval($p['lega_livello']??2)==1)?20:0;
    $score = ($stats['gol']??0)*3+($stats['assist']??0)*2+($stats['voto']??6)*5+$overall*0.5+$p['popolarita']*0.3+$lega_bonus;
    $pallone_pos=0;$msg='';$won=0;
    if ($score>=220)     {$pallone_pos=1;          $msg="🏆 HAI VINTO IL PALLONE D'ORO!!!";$won=1;}
    elseif ($score>=175) {$pallone_pos=rand(2,3);  $msg="🥈 Finalista al Pallone d'Oro (#{$pallone_pos})!";}
    elseif ($score>=130) {$pallone_pos=rand(4,10); $msg="⭐ Top 10 al Pallone d'Oro!";}
    elseif ($score>=90)  {$pallone_pos=rand(11,30);$msg="Top 30 al Pallone d'Oro.";}
    else                 {$msg="Non nominato al Pallone d'Oro quest'anno.";}
    $db->prepare("INSERT IGNORE INTO stagioni (player_id,anno,gol,assist,partite,media_voto,pallone_doro_pos,team_nome,lega_nome) VALUES(?,?,?,?,?,?,?,?,?)")
       ->execute([$player_id,$anno,$stats['gol']??0,$stats['assist']??0,intval($stats['partite_reali']??0),round($stats['voto']??6,2),$pallone_pos,$p['team_nome_full']??'',$p['lega_nome']??'']);
    if ($won) $db->prepare("UPDATE players SET palloni_doro=palloni_doro+1 WHERE id=?")->execute([$player_id]);
    return ['pos'=>$pallone_pos,'msg'=>$msg,'score'=>round($score)];
}

function calcEpilogo($db, $player_id) {
    // Mantiene la firma originale (ritorna una stringa breve) per retro-compatibilità.
    $r = buildCareerSummary($db, $player_id);
    return $r['titolo'] . ' ' . $r['emoji'];
}

/**
 * Costruisce il riepilogo completo di fine carriera: statistiche lifetime,
 * voto alla carriera (0-100), titolo onorifico e confronto con leggende NPC.
 * Restituisce un array strutturato consumato dalla schermata di ritiro.
 */
function buildCareerSummary($db, $player_id) {
    $stmt = $db->prepare("SELECT * FROM players WHERE id=?");
    $stmt->execute([$player_id]);
    $p = $stmt->fetch();
    if (!$p) return ['voto'=>0,'titolo'=>'','emoji'=>'','stats'=>[],'confronto'=>[],'verdetto'=>''];

    // ── Statistiche lifetime aggregate dalle stagioni ────────────────────────
    $st = $db->prepare("SELECT COUNT(*) stagioni, COALESCE(SUM(partite),0) partite,
                               COALESCE(SUM(gol),0) gol, COALESCE(SUM(assist),0) assist,
                               COALESCE(AVG(NULLIF(media_voto,0)),6.0) media_voto
                        FROM stagioni WHERE player_id=?");
    $st->execute([$player_id]);
    $agg = $st->fetch() ?: [];

    // Fallback sui contatori del giocatore se le stagioni non coprono tutto
    $gol     = max(intval($agg['gol'] ?? 0), intval($p['gol_carriera']));
    $assist  = max(intval($agg['assist'] ?? 0), intval($p['assist_carriera']));
    $partite = intval($agg['partite'] ?? 0);
    $stagioni = max(1, intval($agg['stagioni'] ?? 0));
    $media_voto = round(floatval($agg['media_voto'] ?? 6.0), 2);
    $palloni = intval($p['palloni_doro']);
    $trofei  = intval($p['trofei']);
    $overall_max = intval($p['overall']);
    $anni_carriera = max(1, intval($p['age']) - 16);
    $gol_partita = $partite > 0 ? round($gol / $partite, 2) : 0;

    // ── Voto alla carriera (0-100) ───────────────────────────────────────────
    // Pesi: Palloni d'Oro e trofei dominano, poi gol, overall di picco, media voto.
    $voto = 0;
    $voto += min(40, $palloni * 13);              // fino a 40 pt (3+ Palloni d'Oro)
    $voto += min(20, $trofei * 2.5);              // fino a 20 pt
    $voto += min(18, $gol * 0.05);                // fino a 18 pt (360+ gol)
    $voto += min(12, max(0, ($overall_max - 60) * 0.4)); // fino a 12 pt (overall 90)
    $voto += min(10, max(0, ($media_voto - 6.0) * 5));   // fino a 10 pt (media 8.0)
    $voto = (int) round(min(100, $voto));

    // ── Titolo onorifico in base al voto ─────────────────────────────────────
    if ($voto >= 88)      { $titolo = _tn('LEGGENDA IMMORTALE','IMMORTAL LEGEND','UNSTERBLICHE LEGENDE','LEYENDA INMORTAL'); $emoji='👑'; }
    elseif ($voto >= 72)  { $titolo = _tn('Fuoriclasse Mondiale','World-Class Superstar','Weltklasse-Superstar','Superestrella Mundial'); $emoji='🌟'; }
    elseif ($voto >= 55)  { $titolo = _tn('Grande Campione','Great Champion','Großer Champion','Gran Campeón'); $emoji='🏆'; }
    elseif ($voto >= 38)  { $titolo = _tn('Idolo Nazionale','National Idol','Nationaler Idol','Ídolo Nacional'); $emoji='⭐'; }
    elseif ($voto >= 22)  { $titolo = _tn('Professionista Solido','Solid Professional','Solider Profi','Profesional Sólido'); $emoji='⚽'; }
    else                  { $titolo = _tn('Talento Incompiuto','Unfulfilled Talent','Unerfülltes Talent','Talento Inacabado'); $emoji='💫'; }

    // ── Verdetto narrativo ───────────────────────────────────────────────────
    $nome = $p['player_name'];
    if ($voto >= 88)      $verdetto = _tn("Il nome di {$nome} sarà inciso per sempre nella storia del calcio. Generazioni future studieranno le sue giocate.","{$nome}'s name will be etched in football history forever. Future generations will study every move.","Der Name {$nome} wird für immer in die Fußballgeschichte eingehen. Künftige Generationen werden jeden Spielzug studieren.","El nombre de {$nome} quedará grabado para siempre en la historia del fútbol. Las generaciones futuras estudiarán cada jugada.");
    elseif ($voto >= 72)  $verdetto = _tn("Una carriera straordinaria. {$nome} ha regalato emozioni a milioni di tifosi e lascia un'eredità pesante.","An extraordinary career. {$nome} thrilled millions of fans and leaves a heavy legacy.","Eine außergewöhnliche Karriere. {$nome} hat Millionen Fans begeistert und hinterlässt ein schweres Erbe.","Una carrera extraordinaria. {$nome} emocionó a millones de aficionados y deja un legado importante.");
    elseif ($voto >= 55)  $verdetto = _tn("Una carriera di altissimo livello, costellata di successi. {$nome} può ritirarsi a testa alta.","A top-level career full of success. {$nome} can retire with his head held high.","Eine Karriere auf höchstem Niveau voller Erfolge. {$nome} kann erhobenen Hauptes abtreten.","Una carrera de altísimo nivel, repleta de éxitos. {$nome} puede retirarse con la cabeza bien alta.");
    elseif ($voto >= 38)  $verdetto = _tn("Una carriera rispettabile. {$nome} è stato un punto di riferimento per la sua squadra e i suoi tifosi.","A respectable career. {$nome} was a reference point for his team and fans.","Eine respektable Karriere. {$nome} war ein Bezugspunkt für sein Team und seine Fans.","Una carrera respetable. {$nome} fue un referente para su equipo y su afición.");
    elseif ($voto >= 22)  $verdetto = _tn("Una carriera onesta, fatta di lavoro e dedizione. Non tutti arrivano in alto, ma {$nome} ci ha provato fino in fondo.","An honest career built on hard work and dedication. Not everyone reaches the top, but {$nome} gave it everything.","Eine ehrliche Karriere voller Arbeit und Hingabe. Nicht jeder kommt nach oben, doch {$nome} hat alles gegeben.","Una carrera honesta, hecha de trabajo y dedicación. No todos llegan a lo más alto, pero {$nome} lo intentó hasta el final.");
    else                  $verdetto = _tn("Il talento c'era, forse è mancato qualcosa. Ma il viaggio di {$nome} resta una bella storia da raccontare.","The talent was there, maybe something was missing. But {$nome}'s journey remains a fine story to tell.","Das Talent war da, vielleicht fehlte etwas. Doch die Reise von {$nome} bleibt eine schöne Geschichte.","El talento estaba, quizá faltó algo. Pero el viaje de {$nome} sigue siendo una bonita historia que contar.");

    // ── Confronto con leggende NPC ───────────────────────────────────────────
    // Leggende fittizie con il loro "voto carriera" di riferimento.
    $leggende = [
        ['nome'=>'Diego "El Genio"',     'voto'=>97, 'desc'=>_tn('3 Palloni d\'Oro','3 Ballon d\'Ors','3 Ballons d\'Or','3 Balones de Oro')],
        ['nome'=>'O. Da Silva',          'voto'=>92, 'desc'=>_tn('Bomber leggendario','Legendary striker','Legendärer Stürmer','Delantero legendario')],
        ['nome'=>'M. König',             'voto'=>84, 'desc'=>_tn('Maestro del centrocampo','Midfield maestro','Mittelfeld-Maestro','Maestro del centro')],
        ['nome'=>'L. Fernández',         'voto'=>70, 'desc'=>_tn('Stella di una generazione','A generation\'s star','Star einer Generation','Estrella de una generación')],
        ['nome'=>'T. Andersson',         'voto'=>52, 'desc'=>_tn('Solido professionista','Solid pro','Solider Profi','Profesional sólido')],
    ];
    // Trova dove si posiziona il giocatore rispetto alle leggende
    $confronto = [];
    foreach ($leggende as $lg) {
        $confronto[] = ['nome'=>$lg['nome'], 'voto'=>$lg['voto'], 'desc'=>$lg['desc'], 'is_player'=>false];
    }
    $confronto[] = ['nome'=>$nome, 'voto'=>$voto, 'desc'=>$titolo, 'is_player'=>true];
    usort($confronto, fn($a,$b)=> $b['voto'] <=> $a['voto']);
    $rank = 1;
    foreach ($confronto as $i=>$c) { if ($c['is_player']) { $rank = $i+1; break; } }

    return [
        'voto'      => $voto,
        'titolo'    => $titolo,
        'emoji'     => $emoji,
        'verdetto'  => $verdetto,
        'rank_leggende' => $rank,
        'stats'     => [
            'nome'        => $nome,
            'palloni_doro'=> $palloni,
            'trofei'      => $trofei,
            'gol'         => $gol,
            'assist'      => $assist,
            'partite'     => $partite,
            'stagioni'    => $stagioni,
            'media_voto'  => $media_voto,
            'overall_max' => $overall_max,
            'gol_partita' => $gol_partita,
            'eta'         => intval($p['age']),
        ],
        'confronto' => $confronto,
    ];
}

function buyStruttura($player_id, $data) {
    $db = getDB();
    $p  = getPlayerData($player_id);
    $livello = intval($data['livello']??1);
    $stmt = $db->prepare("SELECT * FROM strutture WHERE livello=?"); $stmt->execute([$livello]);
    $struttura = $stmt->fetch();
    if (!$struttura)                         {echo json_encode(['error'=>t('Struttura non trovata','Facility not found', 'Einrichtung nicht gefunden.', 'Instalación no encontrada.')]);return;}
    if ($p['struttura_livello']>=$livello)   {echo json_encode(['error'=>t('Hai già questo livello','You already have this level', 'Du hast diese Stufe bereits.', 'Ya tienes este nivel.')]);return;}
    if ($p['struttura_livello']<$livello-1)  {echo json_encode(['error'=>t('Acquista prima il livello precedente','Buy the previous level first', 'Kaufe zuerst die vorherige Stufe.', 'Compra primero el nivel anterior.')]);return;}
    if ($p['soldi']<$struttura['costo'])     {echo json_encode(['error'=>t('Soldi insufficienti','Insufficient funds', 'Nicht genug Geld.', 'Fondos insuficientes.')]);return;}
    $db->prepare("UPDATE players SET struttura_livello=?,soldi=soldi-? WHERE id=?")->execute([$livello,$struttura['costo'],$player_id]);
    echo json_encode(['success'=>true,'msg'=>t("Costruito: ","Built: ","Gebaut: ","Construido: ").$struttura['nome']."!"]);
}

function changeTeam($player_id, $data) {
    $db = getDB();
    $p  = getPlayerData($player_id);

    // Un solo trasferimento per stagione
    if ((int)($p['trasferimento_anno'] ?? 0) >= 1) {
        echo json_encode(['error' => t('Hai già effettuato un trasferimento questa stagione.','You have already transferred this season.','Du hast diese Saison bereits einen Transfer durchgeführt.','Ya has realizado un fichaje esta temporada.')]);
        return;
    }

    $team_id = intval($data['team_id']??1);
    $stmt = $db->prepare("SELECT t.*,l.livello as lega_livello FROM teams t JOIN leghe l ON t.lega_id=l.id WHERE t.id=?");
    $stmt->execute([$team_id]);
    $team = $stmt->fetch();
    if (!$team) {echo json_encode(['error'=>t('Squadra non trovata','Team not found','Team nicht gefunden','Equipo no encontrado')]);return;}

    // Scala adattata al nuovo cap 125: 1*=55 2*=75 3*=90 4*=105 5*=120
    $min_overall = STELLE_OVR_MAP[$team['stelle']] ?? MIN_OVERALL_FLOOR;

    // Applica sconto OVR agente
    $agent = getAgentBonus($db, $player_id);
    $sconto = $agent['bonus_ovr_sconto'] ?? 0;
    $min_overall_scontato = max(MIN_OVERALL_FLOOR, intval($min_overall * (1 - $sconto/100)));

    if ($p['overall'] < $min_overall_scontato && $team['stelle'] > 1) {
        $msg_sconto_it = $sconto > 0 ? " (ridotto da {$min_overall} grazie all'agente -".$sconto."%)" : "";
        $msg_sconto_en = $sconto > 0 ? " (reduced from {$min_overall} thanks to agent -".$sconto."%)" : "";
        $msg_sconto_de = $sconto > 0 ? " (reduziert von {$min_overall} dank Agent -".$sconto."%)" : "";
        $msg_sconto_es = $sconto > 0 ? " (reducido de {$min_overall} gracias al agente -".$sconto."%)" : "";
        echo json_encode(['error'=> t(
            "Overall insufficiente. Serve almeno {$min_overall_scontato}{$msg_sconto_it}",
            "Overall too low. Need at least {$min_overall_scontato}{$msg_sconto_en}",
            "Overall zu niedrig. Mindestens {$min_overall_scontato}{$msg_sconto_de} erforderlich",
            "Overall insuficiente. Se necesitan al menos {$min_overall_scontato}{$msg_sconto_es}"
        )]);
        return;
    }
    $db->prepare("UPDATE players SET team_id=?, trasferimento_anno=1 WHERE id=?")->execute([$team_id,$player_id]);
    echo json_encode(['success'=>true,'msg'=>t("Trasferito a ","Transferred to ","Zu ","Fichado por ").$team['nome']."!"]);
}

// ── SKILL TREE BOOST FUNCTIONS ──

/**
 * Applica il boost di una skill alle stat del giocatore nel DB.
 * Logica: ogni skill ha un boost TOTALE per livello (boostPerLv = [2,4,7]).
 * Il DB tiene traccia del boost già applicato per skill (skill_boosts.amount = boost totale attuale).
 * La differenza (nuovo_totale - vecchio_totale) viene applicata alla stat.
 * Così si può chiamare N volte senza duplicare i boost.
 *
 * data: { skill_id, stat, total_boost, level }
 */
function applySkillBoost($player_id, $data) {
    $db        = getDB();
    $skill_id  = trim($data['skill_id'] ?? '');
    $stat      = trim($data['stat']     ?? '');
    $new_total = intval($data['total_boost'] ?? 0); // boost TOTALE al livello corrente
    $level     = intval($data['level']  ?? 1);

    $allowed = ['tiro','velocita','dribbling','fisico','mentalita'];
    if (!in_array($stat, $allowed)) {
        echo json_encode(['error' => t("Stat non valida: $stat", "Invalid stat: $stat", "Ungültiges Attribut: $stat", "Estadística no válida: $stat")]); return;
    }
    if (empty($skill_id)) {
        echo json_encode(['error' => t('skill_id mancante','skill_id missing', 'skill_id fehlt.', 'Falta skill_id.')]); return;
    }
    if ($new_total < 0 || $new_total > 50) {
        echo json_encode(['error' => t("Boost fuori range: $new_total", "Boost out of range: $new_total", "Verbesserung außerhalb des Bereichs: $new_total", "Mejora fuera de rango: $new_total")]); return;
    }

    // Leggi boost precedente già applicato per questa skill
    $stmt = $db->prepare("SELECT amount FROM skill_boosts WHERE player_id=? AND skill_id=?");
    $stmt->execute([$player_id, $skill_id]);
    $existing = $stmt->fetch();
    $old_total = $existing ? intval($existing['amount']) : 0;

    $delta = $new_total - $old_total; // quanto aggiungere (può essere 0 se già applicato)

    // Leggi stat corrente del giocatore
    $stmt2 = $db->prepare("SELECT tiro, velocita, dribbling, fisico, mentalita FROM players WHERE id=?");
    $stmt2->execute([$player_id]);
    $p = $stmt2->fetch();
    if (!$p) { echo json_encode(['error' => t('Giocatore non trovato','Player not found', 'Spieler nicht gefunden.', 'Jugador no encontrado.')]); return; }

    $currentStat = intval($p[$stat]);
    $newStat     = min(125, max(1, $currentStat + $delta));

    // Ricalcola overall
    $statMap = ['tiro'=>$p['tiro'],'velocita'=>$p['velocita'],'dribbling'=>$p['dribbling'],'fisico'=>$p['fisico'],'mentalita'=>$p['mentalita']];
    $statMap[$stat] = $newStat;
    $newOverall = intval(array_sum($statMap) / 5);

    // Aggiorna giocatore solo se c'è un delta reale
    if ($delta !== 0) {
        $db->prepare("UPDATE players SET {$stat}=?, overall=? WHERE id=?")
           ->execute([$newStat, $newOverall, $player_id]);
    }

    // Salva/aggiorna il boost applicato per questa skill
    $db->prepare("REPLACE INTO skill_boosts (player_id, skill_id, stat, amount, level) VALUES (?,?,?,?,?)")
       ->execute([$player_id, $skill_id, $stat, $new_total, $level]);

    // ── Aggiorna piede_forte / piede_debole / livello_skill in base alle skill sbloccate ──
    // Conta quante skill offensive del tiro/fisico sono sbloccate e a che livello
    $stmt_all = $db->prepare("SELECT skill_id, level FROM skill_boosts WHERE player_id=? AND level > 0");
    $stmt_all->execute([$player_id]);
    $all_skills = [];
    foreach ($stmt_all->fetchAll() as $row) $all_skills[$row['skill_id']] = intval($row['level']);

    // Piede forte: base 3/5. Sale con tiro_potente (lv2->4, lv3->5) o tiro_giro lv2
    $piede_forte = 3;
    if (isset($all_skills['tiro_potente'])) {
        if ($all_skills['tiro_potente'] >= 3) $piede_forte = 5;
        elseif ($all_skills['tiro_potente'] >= 2) $piede_forte = 4;
    }
    if (isset($all_skills['tiro_giro']) && $all_skills['tiro_giro'] >= 2) $piede_forte = max($piede_forte, 5);
    if (isset($all_skills['gol_rabona'])) $piede_forte = 5;

    // Piede debole: base 2/5. Sale con fredezza lv2->3, lv3->4; istinto lv2->5
    $piede_debole = 2;
    if (isset($all_skills['freddezza'])) {
        if ($all_skills['freddezza'] >= 3) $piede_debole = 4;
        elseif ($all_skills['freddezza'] >= 2) $piede_debole = 3;
    }
    if (isset($all_skills['istinto']) && $all_skills['istinto'] >= 2) $piede_debole = max($piede_debole, 5);

    // Livello skill: conta skill_id sbloccate
    $num_skills = count($all_skills);
    if ($num_skills >= 10) $livello_skill = 5;
    elseif ($num_skills >= 7) $livello_skill = 4;
    elseif ($num_skills >= 4) $livello_skill = 3;
    elseif ($num_skills >= 2) $livello_skill = 2;
    else $livello_skill = 2;

    $db->prepare("UPDATE players SET piede_forte=?, piede_debole=?, livello_skill=? WHERE id=?")
       ->execute([$piede_forte, $piede_debole, $livello_skill, $player_id]);

    echo json_encode([
        'success'      => true,
        'delta'        => $delta,
        'new_val'      => $newStat,
        'new_overall'  => $newOverall,
        'stat'         => $stat,
        'piede_forte'  => $piede_forte,
        'piede_debole' => $piede_debole,
        'livello_skill'=> $livello_skill,
    ]);
}

/**
 * Restituisce tutti i boost skill applicati per questo giocatore.
 * Usato dal frontend per sincronizzare lo stato.
 */
function getSkillBoosts($player_id) {
    $db = getDB();
    $stmt = $db->prepare("SELECT skill_id, stat, amount, level FROM skill_boosts WHERE player_id=?");
    $stmt->execute([$player_id]);
    $rows = $stmt->fetchAll();
    $boosts = [];
    foreach ($rows as $r) {
        $boosts[$r['skill_id']] = [
            'stat'   => $r['stat'],
            'amount' => intval($r['amount']), // boost totale applicato
            'level'  => intval($r['level']),
        ];
    }
    echo json_encode(['success'=>true, 'boosts'=>$boosts]);
}
