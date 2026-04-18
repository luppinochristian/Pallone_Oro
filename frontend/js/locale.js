/**
 * ============================================================
 * locale.js — Sistema di localizzazione e contenuti testuali
 * ============================================================
 * Gestisce tutte le stringhe di testo del gioco in italiano e inglese.
 * Include anche contenuti di lore, storia e flavor text.
 *
 * SEZIONI:
 *  - STRINGS: oggetto con tutte le chiavi UI (it/en)
 *    Copre navigazione, attributi, mesi, risultati, strutture,
 *    azioni, milestone, errori, messaggi Champions, obiettivi
 *  - HISTORICAL_FACTS: fatti storici sul calcio (bilingue)
 *  - FOOTBALL_WISDOM: citazioni e massime sul calcio
 *  - CAREER_LORE: testi narrativi per le fasi della carriera
 *
 * API pubblica:
 *  - getString(key): restituisce la stringa nella lingua corrente
 *  - getHistoricalFact(): fatto storico casuale
 *  - getWisdom(): citazione casuale
 *  - getLoreLine(phase): testo narrativo per fase carriera
 *
 * Esposto come oggetto globale GS_Locale.
 * ============================================================
 */

const GS_Locale = (() => {

    // Helper lingua corrente
    const _lang = () => localStorage.getItem('gs_lang') || 'it';

    // ── Complete UI strings (backup/override for _t()) ───────────────────────
    const STRINGS = {
        it: {
            // Navigation
            home: 'Home', back: 'Indietro', close: 'Chiudi', save: 'Salva',
            confirm_yes: 'Sì', confirm_no: 'No', loading_dots: 'Caricamento...',
            // Player attributes labels  
            attr_tiro: 'Tiro', attr_velocita: 'Velocità', attr_dribbling: 'Dribbling',
            attr_fisico: 'Fisico', attr_mentalita: 'Mentalità', attr_overall: 'Overall',
            attr_energia: 'Energia', attr_morale: 'Morale', attr_popolarita: 'Popolarità',
            // Time labels
            month_full: ['', 'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
                         'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'],
            month_abbr: ['', 'Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'],
            season_word: 'Stagione', year_word: 'Anno', age_word: 'anni',
            // Match results
            result_win: 'Vittoria', result_draw: 'Pareggio', result_loss: 'Sconfitta',
            home_match: 'Casa', away_match: 'Trasferta',
            // Transfer
            req_overall: 'Overall minimo', transfer_cost: 'Nessun costo',
            transfer_once: 'Un solo trasferimento a stagione',
            // Salary
            salary_label: 'Stipendio mensile stimato', salary_per_month: '€/mese',
            // Objectives
            obj_progress: 'Progresso', obj_reward: 'Premio',
            obj_completed_badge: '✅ Completato',
            // Facilities names
            fac_0: 'Nessuna struttura',
            fac_1: 'Campetto Base', fac_1_desc: 'Un campetto di periferia. Giusto per tenersi in forma.',
            fac_2: 'Spogliatoio Attrezzato', fac_2_desc: 'Docce calde e qualche attrezzo. Si respira serietà.',
            fac_3: 'Palestra e Campo', fac_3_desc: 'Pesi, campo in erba, istruttore. Qui si cresce davvero.',
            fac_4: 'Centro Sportivo', fac_4_desc: 'Struttura professionale. Il tuo corpo diventa una macchina.',
            fac_5: 'Centro High-Tech', fac_5_desc: 'Analisi dati, video coach, fisioterapisti dedicati.',
            fac_6: "Centro d'Élite", fac_6_desc: 'Dove si allenano le leggende. Staff di 20 professionisti.',
            fac_7: 'Academy Personale', fac_7_desc: 'La tua struttura privata. Nessun limite alla crescita.',
            // Action descriptions
            action_allenamento_tiro: 'Allenamento al tiro',
            action_allenamento_tiro_desc: 'Sessioni intensive davanti alla porta. +Tiro, -Energia.',
            action_allenamento_velocita: 'Sprint e agilità',
            action_allenamento_velocita_desc: 'Circuiti di velocità. +Velocità, -Energia.',
            action_dribbling: 'Tecnica e dribbling',
            action_dribbling_desc: 'Lavoro con il pallone. +Dribbling, -Energia.',
            action_allenamento_fisico: 'Preparazione fisica',
            action_allenamento_fisico_desc: 'Pesi e resistenza. +Fisico, -Energia.',
            action_allenamento_speciale: 'Allenamento Speciale',
            action_allenamento_speciale_desc: 'Sessione intensa. Alto rischio infortuni ma grandi miglioramenti.',
            action_allenamento_mentale: 'Allenamento mentale',
            action_allenamento_mentale_desc: 'Psicologia, video analisi, tattica. +Mentalità, effetto morale.',
            action_social: 'Attività social',
            action_social_desc: 'Video, interviste, fan engagement. +Popolarità.',
            action_riposo: 'Riposo e recupero',
            action_riposo_desc: 'Stacca la spina. +Energia, +Morale.',
            // Career milestones
            milestone_rookie: 'Esordiente', milestone_prospect: 'Prospetto',
            milestone_player: 'Giocatore', milestone_talent: 'Talento',
            milestone_star: 'Stella', milestone_champion: 'Campione',
            milestone_legend: 'Leggenda', milestone_icon: 'Icona Mondiale',
            // Error messages
            err_no_actions: 'Seleziona almeno 1 azione!',
            err_max_actions: 'Puoi selezionare massimo 3 azioni.',
            err_injured: 'Sei infortunato! Puoi solo riposare o allenarti mentalmente.',
            err_no_energy: 'Energia esaurita! Riposati prima di allenarti fisicamente.',
            err_transfer_done: 'Hai già effettuato un trasferimento questa stagione.',
            err_ovr_low: 'Overall troppo basso per questa squadra.',
            err_no_money: 'Soldi insufficienti.',
            // Success messages
            ok_skill_unlocked: '✨ Abilità sbloccata!',
            ok_facility_built: '🏗️ Struttura costruita!',
            ok_agent_hired: '🤝 Agente ingaggiato!',
            ok_transfer_done: '✈️ Trasferimento completato!',
            // Champions Cup phases
            champ_group: 'Fase a Gironi', champ_round16: 'Ottavi di Finale',
            champ_quarter: 'Quarti di Finale', champ_semi: 'Semifinale',
            champ_final: 'Finale', champ_winner: '🏆 Campione!',
        },
        en: {
            // Navigation
            home: 'Home', back: 'Back', close: 'Close', save: 'Save',
            confirm_yes: 'Yes', confirm_no: 'No', loading_dots: 'Loading...',
            // Player attributes labels  
            attr_tiro: 'Shooting', attr_velocita: 'Speed', attr_dribbling: 'Dribbling',
            attr_fisico: 'Physical', attr_mentalita: 'Mental', attr_overall: 'Overall',
            attr_energia: 'Energy', attr_morale: 'Morale', attr_popolarita: 'Popularity',
            // Time labels
            month_full: ['', 'January', 'February', 'March', 'April', 'May', 'June',
                         'July', 'August', 'September', 'October', 'November', 'December'],
            month_abbr: ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            season_word: 'Season', year_word: 'Year', age_word: 'years old',
            // Match results
            result_win: 'Win', result_draw: 'Draw', result_loss: 'Loss',
            home_match: 'Home', away_match: 'Away',
            // Transfer
            req_overall: 'Minimum Overall', transfer_cost: 'No cost',
            transfer_once: 'One transfer per season',
            // Salary
            salary_label: 'Estimated monthly salary', salary_per_month: '€/month',
            // Objectives
            obj_progress: 'Progress', obj_reward: 'Reward',
            obj_completed_badge: '✅ Completed',
            // Facilities names
            fac_0: 'No facility',
            fac_1: 'Basic Pitch', fac_1_desc: 'A local pitch. Just enough to stay in shape.',
            fac_2: 'Equipped Dressing Room', fac_2_desc: 'Hot showers and some equipment. Starting to look serious.',
            fac_3: 'Gym & Field', fac_3_desc: 'Weights, grass pitch, trainer. This is where you grow.',
            fac_4: 'Sports Centre', fac_4_desc: 'Professional setup. Your body becomes a machine.',
            fac_5: 'High-Tech Centre', fac_5_desc: 'Data analysis, video coach, dedicated physiotherapists.',
            fac_6: 'Elite Centre', fac_6_desc: 'Where legends train. Staff of 20 professionals.',
            fac_7: 'Personal Academy', fac_7_desc: 'Your own private setup. No limits to growth.',
            // Action descriptions
            action_allenamento_tiro: 'Shooting Practice',
            action_allenamento_tiro_desc: 'Intensive sessions in front of goal. +Shooting, -Energy.',
            action_allenamento_velocita: 'Sprint & Agility',
            action_allenamento_velocita_desc: 'Speed circuits. +Speed, -Energy.',
            action_dribbling: 'Technical & Dribbling',
            action_dribbling_desc: 'Ball work. +Dribbling, -Energy.',
            action_allenamento_fisico: 'Physical Conditioning',
            action_allenamento_fisico_desc: 'Weights and endurance. +Physical, -Energy.',
            action_allenamento_speciale: 'Special Training',
            action_allenamento_speciale_desc: 'Intense session. High injury risk but big improvements.',
            action_allenamento_mentale: 'Mental Training',
            action_allenamento_mentale_desc: 'Psychology, video analysis, tactics. +Mental, morale effect.',
            action_social: 'Social Activities',
            action_social_desc: 'Videos, interviews, fan engagement. +Popularity.',
            action_riposo: 'Rest & Recovery',
            action_riposo_desc: 'Switch off. +Energy, +Morale.',
            // Career milestones
            milestone_rookie: 'Rookie', milestone_prospect: 'Prospect',
            milestone_player: 'Player', milestone_talent: 'Talent',
            milestone_star: 'Star', milestone_champion: 'Champion',
            milestone_legend: 'Legend', milestone_icon: 'World Icon',
            // Error messages
            err_no_actions: 'Select at least 1 action!',
            err_max_actions: 'You can select a maximum of 3 actions.',
            err_injured: "You're injured! You can only rest or train mentally.",
            err_no_energy: 'Energy depleted! Rest before physical training.',
            err_transfer_done: "You've already made a transfer this season.",
            err_ovr_low: 'Overall too low for this club.',
            err_no_money: 'Insufficient funds.',
            // Success messages
            ok_skill_unlocked: '✨ Skill unlocked!',
            ok_facility_built: '🏗️ Facility built!',
            ok_agent_hired: '🤝 Agent hired!',
            ok_transfer_done: '✈️ Transfer complete!',
            // Champions Cup phases
            champ_group: 'Group Stage', champ_round16: 'Round of 16',
            champ_quarter: 'Quarter-final', champ_semi: 'Semi-final',
            champ_final: 'Final', champ_winner: '🏆 Champion!',
        }
    };

    // ── Career milestone thresholds ────────────────────────────────────────────
    const MILESTONES = [
        { ovr: 0,  label_it: 'Esordiente',     label_en: 'Rookie',        color: '#64748b' },
        { ovr: 60, label_it: 'Prospetto',       label_en: 'Prospect',      color: '#10b981' },
        { ovr: 65, label_it: 'Giocatore',       label_en: 'Player',        color: '#3b82f6' },
        { ovr: 70, label_it: 'Talento',         label_en: 'Talent',        color: '#6366f1' },
        { ovr: 78, label_it: 'Stella',          label_en: 'Star',          color: '#8b5cf6' },
        { ovr: 85, label_it: 'Campione',        label_en: 'Champion',      color: '#FFD700' },
        { ovr: 92, label_it: 'Superstar',       label_en: 'Superstar',     color: '#f59e0b' },
        { ovr: 98, label_it: 'Leggenda',        label_en: 'Legend',        color: '#ef4444' },
        { ovr: 108, label_it: 'Icona Mondiale', label_en: 'World Icon',    color: '#ff6b35' },
        { ovr: 118, label_it: 'GOAT',           label_en: 'GOAT',          color: '#fff' },
    ];

    // ── Nationality flags and info ─────────────────────────────────────────────
    const NATIONALITIES = {
        Italy:        { flag: '🇮🇹', adj_it: 'italiano',     adj_en: 'Italian' },
        Brazil:       { flag: '🇧🇷', adj_it: 'brasiliano',    adj_en: 'Brazilian' },
        Argentina:    { flag: '🇦🇷', adj_it: 'argentino',     adj_en: 'Argentine' },
        France:       { flag: '🇫🇷', adj_it: 'francese',      adj_en: 'French' },
        Spain:        { flag: '🇪🇸', adj_it: 'spagnolo',      adj_en: 'Spanish' },
        Germany:      { flag: '🇩🇪', adj_it: 'tedesco',       adj_en: 'German' },
        Portugal:     { flag: '🇵🇹', adj_it: 'portoghese',    adj_en: 'Portuguese' },
        England:      { flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', adj_it: 'inglese',      adj_en: 'English' },
        Netherlands:  { flag: '🇳🇱', adj_it: 'olandese',      adj_en: 'Dutch' },
        Japan:        { flag: '🇯🇵', adj_it: 'giapponese',    adj_en: 'Japanese' },
        USA:          { flag: '🇺🇸', adj_it: 'americano',     adj_en: 'American' },
        Nigeria:      { flag: '🇳🇬', adj_it: 'nigeriano',     adj_en: 'Nigerian' },
        Belgium:      { flag: '🇧🇪', adj_it: 'belga',         adj_en: 'Belgian' },
        Croatia:      { flag: '🇭🇷', adj_it: 'croato',        adj_en: 'Croatian' },
        Uruguay:      { flag: '🇺🇾', adj_it: 'uruguaiano',    adj_en: 'Uruguayan' },
        Colombia:     { flag: '🇨🇴', adj_it: 'colombiano',    adj_en: 'Colombian' },
        Mexico:       { flag: '🇲🇽', adj_it: 'messicano',     adj_en: 'Mexican' },
        SouthKorea:   { flag: '🇰🇷', adj_it: 'sudcoreano',    adj_en: 'South Korean' },
        Senegal:      { flag: '🇸🇳', adj_it: 'senegalese',    adj_en: 'Senegalese' },
        Morocco:      { flag: '🇲🇦', adj_it: 'marocchino',    adj_en: 'Moroccan' },
        Ghana:        { flag: '🇬🇭', adj_it: 'ghanese',       adj_en: 'Ghanaian' },
        Sweden:       { flag: '🇸🇪', adj_it: 'svedese',       adj_en: 'Swedish' },
        Denmark:      { flag: '🇩🇰', adj_it: 'danese',        adj_en: 'Danish' },
        Austria:      { flag: '🇦🇹', adj_it: 'austriaco',     adj_en: 'Austrian' },
        Switzerland:  { flag: '🇨🇭', adj_it: 'svizzero',      adj_en: 'Swiss' },
        Poland:       { flag: '🇵🇱', adj_it: 'polacco',       adj_en: 'Polish' },
        Ukraine:      { flag: '🇺🇦', adj_it: 'ucraino',       adj_en: 'Ukrainian' },
        Turkey:       { flag: '🇹🇷', adj_it: 'turco',         adj_en: 'Turkish' },
        Serbia:       { flag: '🇷🇸', adj_it: 'serbo',         adj_en: 'Serbian' },
        Scotland:     { flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', adj_it: 'scozzese',      adj_en: 'Scottish' },
        CzechRepublic:{ flag: '🇨🇿', adj_it: 'ceco',          adj_en: 'Czech' },
        Romania:      { flag: '🇷🇴', adj_it: 'rumeno',        adj_en: 'Romanian' },
        SaudiArabia:  { flag: '🇸🇦', adj_it: 'saudita',       adj_en: 'Saudi' },
        Ivory_Coast:  { flag: '🇨🇮', adj_it: 'ivoriano',      adj_en: 'Ivorian' },
        Algeria:      { flag: '🇩🇿', adj_it: 'algerino',      adj_en: 'Algerian' },
        Australia:    { flag: '🇦🇺', adj_it: 'australiano',   adj_en: 'Australian' },
        Canada:       { flag: '🇨🇦', adj_it: 'canadese',      adj_en: 'Canadian' },
        Chile:        { flag: '🇨🇱', adj_it: 'cileno',        adj_en: 'Chilean' },
        Ecuador:      { flag: '🇪🇨', adj_it: 'ecuadoriano',   adj_en: 'Ecuadorian' },
    };

    // ── Skill tree extended descriptions ──────────────────────────────────────
    const SKILL_LORE = {
        it: {
            tiro_potente: "Un tiro come un cannone — la palla fende l'aria e il portiere non può fare nulla. Allenato per anni su campi vuoti all'alba.",
            tiro_giro:    "La perfetta combinazione di tecnica e geometria. Il tiro a giro è un'arte che richiede centinaia di ore di pratica per essere padroneggiata.",
            colpo_testa:  "Non è solo altezza — è il tempismo, la lettura del cross, e il coraggio di avventarsi sulla palla quando arrivano i difensori.",
            tiro_rabona:  "La mossa più audace del calcio. Pochissimi osano tentarla in partita. Chi ci riesce diventa leggenda.",
            turbo:        "Lo sprint esplosivo che brucia i difensori. Un dono naturale affinato con migliaia di ripetizioni in pista.",
            dribbling_elastico: "Il tocco morbido che cambia direzione in un millisecondo. Impossibile da prevedere per i difensori.",
            scatto:       "La cattiveria di anticipare l'avversario sul primo passo. Un'arma letale nei corridoi stretti.",
            dribblo_mosaico: "Una sequenza di finte che sembra una danza. Richiede coordinazione, fiducia e un pizzico di follia.",
            resistenza:   "Non importa quanti chilometri hai già macinato — con questa skill, ne hai ancora per correre.",
            fisico_bestiale: "Un corpo che resiste a tutto. I difensori rimbalzano, le situazioni difficili diventano opportunità.",
            freddezza:    "Davanti al portiere, la mente si ferma. Un respiro. E la palla va dove vuoi tu.",
            istinto:      "Non si può insegnare. Si nasce con questo. Il fiuto per il gol che ti porta sempre nel posto giusto.",
            lettura_gioco: "Vedere la partita con tre secondi di anticipo. Il cervello che processa prima degli occhi.",
        },
        en: {
            tiro_potente: "A shot like a cannon — the ball cuts through the air and the keeper can't do a thing. Trained for years on empty fields at dawn.",
            tiro_giro:    "The perfect combination of technique and geometry. The curl shot is an art that takes hundreds of hours to master.",
            colpo_testa:  "It's not just height — it's timing, reading the cross, and the courage to throw yourself at the ball when defenders arrive.",
            tiro_rabona:  "The most audacious move in football. Very few dare to attempt it in a match. Those who pull it off become legends.",
            turbo:        "The explosive sprint that burns past defenders. A natural gift honed with thousands of track repetitions.",
            dribbling_elastico: "The soft touch that changes direction in a millisecond. Impossible for defenders to predict.",
            scatto:       "The ferocity to anticipate your opponent on the first step. A lethal weapon in tight corridors.",
            dribblo_mosaico: "A sequence of feints that looks like a dance. Requires coordination, confidence and a pinch of madness.",
            resistenza:   "No matter how many kilometres you've already covered — with this skill, you've got plenty more to run.",
            fisico_bestiale: "A body that withstands everything. Defenders bounce off, difficult situations become opportunities.",
            freddezza:    "In front of the keeper, the mind goes still. One breath. And the ball goes exactly where you want.",
            istinto:      "You can't teach it. You're born with it. The goal-scoring instinct that always puts you in the right place.",
            lettura_gioco: "Seeing the game three seconds ahead. The brain processes before the eyes do.",
        }
    };

    // ── Pallon d'oro speech templates ─────────────────────────────────────────
    const PALLONE_ORO_SPEECHES = {
        it: [
            "«Questo premio è per tutti quelli che non ci hanno creduto. E per chi ha sempre creduto in me. Grazie.»",
            "«Non pensavo di arrivare fino a qui quando ero un ragazzo che calciava un pallone sgonfio in cortile. Questo è per voi.»",
            "«Ho dato tutto. Ogni allenamento, ogni sacrificio. Questo Pallone d'Oro è il risultato di una vita dedicata al calcio.»",
            "«Voglio ringraziare la mia squadra, il mio allenatore, e i tifosi. Senza di loro, non sarei qui stanotte.»",
            "«Il calcio mi ha dato tutto. Questo è il modo in cui cerco di restituirlo.»",
        ],
        en: [
            '"This award is for everyone who didn\'t believe. And for those who always did. Thank you."',
            '"I never imagined getting here when I was a kid kicking a flat ball in the yard. This is for you."',
            '"I gave everything. Every training session, every sacrifice. This Ballon d\'Or is the result of a life dedicated to football."',
            '"I want to thank my team, my coach, and the fans. Without them, I wouldn\'t be here tonight."',
            '"Football gave me everything. This is my way of giving something back."',
        ]
    };

    // ── Career ending reflections ──────────────────────────────────────────────
    const RETIREMENT_SPEECHES = {
        it: [
            "«Il calcio è stata la mia vita. Ora è tempo di guardare la vita dal bordo del campo.»",
            "«Ho segnato gol in stadi pieni e ho giocato sotto la pioggia davanti a dieci persone. Ogni momento è stato prezioso.»",
            "«Non smetterò mai di amare questo sport. Ma il mio corpo mi dice che è arrivato il momento.»",
            "«Ringrazio ogni allenatore, ogni compagno, ogni tifoso. Questa carriera appartiene a tutti loro.»",
            "«Il rimpianto più grande? Non averne nessuno. Ho dato tutto. Ogni volta.»",
        ],
        en: [
            '"Football was my life. Now it\'s time to watch life from the sideline."',
            '"I\'ve scored goals in packed stadiums and played in the rain in front of ten people. Every moment was precious."',
            '"I\'ll never stop loving this sport. But my body is telling me the time has come."',
            '"I thank every coach, every team-mate, every fan. This career belongs to all of them."',
            '"My biggest regret? Having none. I gave everything. Every time."',
        ]
    };

    // ── Transfer news templates ────────────────────────────────────────────────
    const TRANSFER_ANNOUNCEMENTS = {
        it: [
            "🚁 È ufficiale: {player} firma con {team}. Accordo pluriennale per il talento.",
            "📝 Ci siamo: {player} a {team}. Le visite mediche sono superate. Manca solo la firma.",
            "🔄 Colpo di mercato: {player} lascia tutto e vola a {team}. Una nuova avventura inizia.",
            "💼 Il deal è chiuso: {player} indosserà la maglia del {team} a partire da oggi.",
        ],
        en: [
            "🚁 It's official: {player} signs for {team}. Multi-year deal for the talent.",
            "📝 Done deal: {player} to {team}. Medical passed. Just the signature remaining.",
            "🔄 Transfer coup: {player} leaves everything and heads to {team}. A new adventure begins.",
            "💼 The deal is closed: {player} will wear {team}'s shirt from today.",
        ]
    };

    // ── League flavor text ─────────────────────────────────────────────────────
    const LEAGUE_DESCRIPTIONS = {
        it: {
            1: 'Seria Alfa — Il campionato più ambito d\'Italia. Solo i migliori sopravvivono.',
            2: 'Seria Beta — Il trampolino verso la massima serie. Qui si forgia il carattere.',
            3: 'Ligue Premier — Il campionato francese, tecnico e fisico. Una palestra d\'élite.',
            4: 'Ligue Seconde — La seconda divisione francese. Dove nascono le stelle di domani.',
            5: 'Premier Division — Il campionato più ricco e spettacolare d\'Europa.',
            6: 'Championship — La seconda divisione inglese. Più dura della Premier, dicono in molti.',
            7: 'La Primera — Il palcoscenico più tecnico d\'Europa. Il bello del calcio puro.',
            8: 'La Segunda — Il vivaio della Primera. Talento grezzo che aspetta di esplodere.',
            9: 'Bundesliga Pro — Organizzazione, tattica, intensità. Il calcio alla tedesca.',
            10: 'Bundesliga Zwei — La seconda divisione tedesca. Organizzata come una prima.',
        },
        en: {
            1: 'Seria Alfa — The most coveted league in Italy. Only the best survive.',
            2: 'Seria Beta — The springboard to the top flight. Character is forged here.',
            3: 'Ligue Premier — The French league, technical and physical. An elite training ground.',
            4: 'Ligue Seconde — The French second division. Where tomorrow\'s stars are born.',
            5: 'Premier Division — The richest and most spectacular league in Europe.',
            6: 'Championship — The English second division. Tougher than the Premier, many say.',
            7: 'La Primera — The most technical stage in Europe. The beauty of pure football.',
            8: 'La Segunda — The nursery of La Primera. Raw talent waiting to explode.',
            9: 'Bundesliga Pro — Organization, tactics, intensity. Football the German way.',
            10: 'Bundesliga Zwei — The German second division. Organized like a first division.',
        }
    };

    // ── Milestone rating descriptions ──────────────────────────────────────────
    const RATING_DESCRIPTIONS = {
        it: {
            10: 'Fuori dal mondo — la partita perfetta',
            9: 'Straordinario — hai dominato il campo',
            8: 'Ottima prestazione — sopra le aspettative',
            7: 'Buona partita — sopra la sufficienza',
            6: 'Sufficiente — hai fatto il tuo dovere',
            5: 'Sotto tono — ci si aspettava di più',
            4: 'Deludente — quasi invisibile in campo',
            3: 'Da dimenticare — una partita da cancellare',
        },
        en: {
            10: 'World class — the perfect game',
            9: 'Extraordinary — you dominated the pitch',
            8: 'Excellent performance — above expectations',
            7: 'Good game — above average',
            6: 'Satisfactory — you did your duty',
            5: 'Below par — more was expected',
            4: 'Disappointing — almost invisible on the pitch',
            3: 'One to forget — a game to delete from memory',
        }
    };

    // ── Popolarità level descriptions ──────────────────────────────────────────
    const POP_LEVELS = {
        it: [
            { min: 0,  label: 'Sconosciuto',        desc: 'Chi sei?' },
            { min: 10, label: 'Emergente',           desc: 'Qualcuno inizia a notarti.' },
            { min: 20, label: 'Noto a livello locale', desc: 'I tifosi locali ti riconoscono.' },
            { min: 30, label: 'Apprezzato',          desc: 'Il tuo nome circola sui giornali.' },
            { min: 40, label: 'Famoso in Italia',    desc: 'Ogni italiano di calcio ti conosce.' },
            { min: 55, label: 'Stella europea',      desc: 'I media internazionali parlano di te.' },
            { min: 70, label: 'Superstar',           desc: 'Riconosciuto ovunque nel mondo del calcio.' },
            { min: 82, label: 'Icona',               desc: 'Il tuo volto è sulle magliette dei bambini.' },
            { min: 92, label: 'Leggenda vivente',    desc: 'Sei nella storia del calcio.' },
        ],
        en: [
            { min: 0,  label: 'Unknown',            desc: 'Who are you?' },
            { min: 10, label: 'Emerging',           desc: 'People are starting to notice you.' },
            { min: 20, label: 'Locally known',      desc: 'Local fans recognize you.' },
            { min: 30, label: 'Appreciated',        desc: 'Your name is in the newspapers.' },
            { min: 40, label: 'Nationally famous',  desc: 'Every football fan knows you.' },
            { min: 55, label: 'European star',      desc: 'International media are talking about you.' },
            { min: 70, label: 'Superstar',          desc: 'Recognized everywhere in the football world.' },
            { min: 82, label: 'Icon',               desc: 'Your face is on kids\' shirts.' },
            { min: 92, label: 'Living legend',      desc: 'You are in football history.' },
        ]
    };

    // ── Utility ────────────────────────────────────────────────────────────────
    function getMilestone(ovr) {
        const lang = _lang();
        const key = lang === 'en' ? 'label_en' : 'label_it';
        let result = MILESTONES[0];
        for (const m of MILESTONES) { if (ovr >= m.ovr) result = m; }
        return { label: result[key], color: result.color };
    }

    function getPopLevel(pop) {
        const lang = _lang();
        const levels = POP_LEVELS[lang] || POP_LEVELS.it;
        let result = levels[0];
        for (const l of levels) { if (pop >= l.min) result = l; }
        return result;
    }

    function getRatingDesc(voto) {
        const lang = _lang();
        const descs = RATING_DESCRIPTIONS[lang] || RATING_DESCRIPTIONS.it;
        const rounded = Math.min(10, Math.max(3, Math.round(voto)));
        return descs[rounded] || descs[6];
    }

    function getLeagueDesc(legaId) {
        const lang = _lang();
        return (LEAGUE_DESCRIPTIONS[lang] || LEAGUE_DESCRIPTIONS.it)[legaId] || '';
    }

    function getNationality(nation) {
        return NATIONALITIES[nation] || { flag: '🌍', adj_it: nation, adj_en: nation };
    }

    function getPalloneSpeech() {
        const lang = _lang();
        const pool = PALLONE_ORO_SPEECHES[lang] || PALLONE_ORO_SPEECHES.it;
        return pool[Math.floor(Math.random() * pool.length)];
    }

    function getRetirementSpeech() {
        const lang = _lang();
        const pool = RETIREMENT_SPEECHES[lang] || RETIREMENT_SPEECHES.it;
        return pool[Math.floor(Math.random() * pool.length)];
    }

    function getSkillLore(skillId) {
        const lang = _lang();
        return (SKILL_LORE[lang] || SKILL_LORE.it)[skillId] || '';
    }

    function getTransferAnnouncement(player, team) {
        const lang = _lang();
        const pool = TRANSFER_ANNOUNCEMENTS[lang] || TRANSFER_ANNOUNCEMENTS.it;
        const tpl = pool[Math.floor(Math.random() * pool.length)];
        return tpl.replace('{player}', player).replace('{team}', team);
    }

    // ── Inject milestone badge on dashboard ────────────────────────────────────
    function injectMilestoneBadge(ovr) {
        const el = document.getElementById('player-milestone-badge');
        if (!el) return;
        const m = getMilestone(ovr);
        el.textContent = m.label;
        el.style.color = m.color;
    }

    // ── Inject pop level below popularity bar ──────────────────────────────────
    function injectPopLabel(pop) {
        const el = document.getElementById('player-pop-level');
        if (!el) return;
        const l = getPopLevel(pop);
        el.textContent = l.label;
        el.title = l.desc;
    }

    return {
        getMilestone, getPalloneSpeech,
    };
})();

window.GS_Locale = GS_Locale;


// ── Extended skill descriptions ───────────────────────────────────────────────
const SKILL_EXTENDED_LORE = {
    it: {
        turbo: "Lo sprint esplosivo che brucia i terzini. Velocità pura nell'accelerazione iniziale — il momento in cui la partita si decide.",
        dribbling_elastico: "Il tocco morbido che cambia direzione in un millisecondo. Impossibile da prevedere per i difensori. Una dote naturale perfezionata.",
        scatto: "La cattiveria agonistica nei duelli diretti. Anticipare il difensore sul primo passo vale oro.",
        dribblo_mosaico: "Una sequenza di finte che sembra una coreografia. Richiede coordinazione, fiducia e un pizzico di follia.",
        resistenza: "Non importa quanti chilometri hai già macinato — il motore non si ferma. La resistenza non si vede, si sente.",
        fisico_bestiale: "Ogni contrasto diventa un'opportunità. Corpo massiccio che tiene palla, resiste alle cariche, vince le battaglie aeree.",
        freddezza: "Il momento più importante della partita: tu davanti al portiere. Respiro, visione, scelta. Poi gol.",
        istinto: "Non si insegna, non si allena — è lì o non c'è. Il sesto senso del bomber che lo porta sempre nel posto giusto.",
        lettura_gioco: "Vedere la partita prima degli altri. Muoversi prima che arrivi il cross. Segnare prima di fermarsi a pensare.",
    },
    en: {
        turbo: "The explosive sprint that burns past full-backs. Pure acceleration — the moment that decides matches.",
        dribbling_elastico: "The soft touch that changes direction in milliseconds. Impossible to read for defenders. A natural gift refined.",
        scatto: "The competitive edge in direct duels. Anticipating the defender on the first step is worth gold.",
        dribblo_mosaico: "A sequence of feints that looks like choreography. Requires coordination, confidence and a pinch of madness.",
        resistenza: "No matter how many kilometres you've already covered — the engine doesn't stop. Endurance isn't seen, it's felt.",
        fisico_bestiale: "Every tackle becomes an opportunity. Powerful body that holds the ball, resists charges, wins aerial battles.",
        freddezza: "The most important moment in the match: just you and the keeper. Breathe, see, choose. Then goal.",
        istinto: "It can't be taught, can't be trained — it's either there or it isn't. The striker's sixth sense that always puts them in the right place.",
        lettura_gioco: "Seeing the game before others do. Moving before the cross arrives. Scoring before you've stopped to think.",
    }
};

// ── Extended nationality data ──────────────────────────────────────────────────
const NATIONALITY_EXTENDED = {
    Italy:        { style_it: "tecnico, tattico, temperamentoso", style_en: "technical, tactical, temperamental", famous: "Maldini, Del Piero, Totti, Pirlo" },
    Brazil:       { style_it: "creativo, allegro, istintivo",     style_en: "creative, joyful, instinctive",     famous: "Pelé, Ronaldo, Ronaldinho, Neymar" },
    Argentina:    { style_it: "passionale, battagliero, orgoglioso", style_en: "passionate, combative, proud",  famous: "Maradona, Messi, Batistuta, Riquelme" },
    France:       { style_it: "atletico, moderno, organizzato",   style_en: "athletic, modern, organised",      famous: "Zidane, Henry, Ribéry, Mbappé" },
    Spain:        { style_it: "tecnico, intelligente, collettivo", style_en: "technical, intelligent, collective", famous: "Xavi, Iniesta, Villa, Puyol" },
    Germany:      { style_it: "disciplinato, efficiente, solido", style_en: "disciplined, efficient, solid",    famous: "Beckenbauer, Müller, Klose, Lahm" },
    Portugal:     { style_it: "versatile, fisico, determinato",   style_en: "versatile, physical, determined",  famous: "Eusébio, Figo, Ronaldo, Deco" },
    England:      { style_it: "intenso, fisico, combattivo",      style_en: "intense, physical, combative",     famous: "Moore, Lineker, Beckham, Rooney" },
    Netherlands:  { style_it: "totale, creativo, innovativo",     style_en: "total, creative, innovative",      famous: "Cruyff, Van Basten, Gullit, Bergkamp" },
    Japan:        { style_it: "preciso, disciplinato, collettivo", style_en: "precise, disciplined, collective", famous: "Nakata, Kagawa, Endo, Kubo" },
    USA:          { style_it: "atletico, moderno, ambizioso",     style_en: "athletic, modern, ambitious",      famous: "Reyna, Pulisic, Dempsey, Howard" },
    Nigeria:      { style_it: "esplosivo, fisico, imprevedibile", style_en: "explosive, physical, unpredictable", famous: "Okocha, Kanu, Eto'o, Osimhen" },
};

// ── Attribute color scale ────────────────────────────────────────────────────
function getStatColor(value) {
    if (value >= 115) return '#ff6b35'; // legendary orange
    if (value >= 100) return '#FFD700'; // gold
    if (value >= 90)  return '#10b981'; // emerald
    if (value >= 80)  return '#3b82f6'; // blue
    if (value >= 70)  return '#8b5cf6'; // purple
    if (value >= 60)  return '#eab308'; // yellow
    return '#94a3b8'; // gray
}

function getStatLabel(value, lang = 'it') {
    if (value >= 115) return lang === 'en' ? 'Godlike'    : 'Divino';
    if (value >= 100) return lang === 'en' ? 'World Class': 'Mondiale';
    if (value >= 90)  return lang === 'en' ? 'Elite'      : 'Élite';
    if (value >= 80)  return lang === 'en' ? 'Excellent'  : 'Eccellente';
    if (value >= 70)  return lang === 'en' ? 'Good'       : 'Buono';
    if (value >= 60)  return lang === 'en' ? 'Average'    : 'Nella media';
    return lang === 'en' ? 'Below avg' : 'Sotto media';
}

// ── Salary calculator ─────────────────────────────────────────────────────────
function calcEstimatedSalary(overall, teamStars, agentBonus = 0) {
    const base = Math.pow(Math.max(1, overall - 55), 1.4) * 200;
    const starMult = [0, 1.0, 1.3, 1.7, 2.3, 3.2][Math.min(5, teamStars)] || 1.0;
    const agentMult = 1 + (agentBonus / 100);
    return Math.round(base * starMult * agentMult / 100) * 100;
}

// ── Transfer value calculator ─────────────────────────────────────────────────
function calcTransferValue(overall, age, popularity) {
    const ageMultiplier = age <= 20 ? 2.5 : age <= 24 ? 2.0 : age <= 28 ? 1.5 : age <= 32 ? 0.8 : 0.3;
    const base = Math.pow(Math.max(1, overall - 50), 2) * 1500;
    const popBonus = popularity * 5000;
    return Math.round((base * ageMultiplier + popBonus) / 10000) * 10000;
}

// ── Extended milestone check ──────────────────────────────────────────────────
function checkAllMilestones(player) {
    const ovr = parseInt(player.overall || 0);
    const { label, color } = getMilestone(ovr);
    const popLevel = getPopLevel(parseInt(player.popolarita || 0));
    const salaryEst = calcEstimatedSalary(ovr, parseInt(player.team_stelle || 1));
    const transferVal = calcTransferValue(ovr, parseInt(player.age || 20), parseInt(player.popolarita || 0));
    return { milestone: label, color, popLevel, salaryEst, transferVal };
}

// Export new functions
if (typeof window !== 'undefined' && window.GS_Locale) {
    Object.assign(GS_Locale, {
        SKILL_EXTENDED_LORE,
        NATIONALITY_EXTENDED,
        getStatColor,
        getStatLabel,
        calcEstimatedSalary,
        calcTransferValue,
        checkAllMilestones,
    });
}

// ── Formation descriptions ─────────────────────────────────────────────────────
GS_Locale.FORMATIONS = {
    it: {
        '4-3-3': { name: '4-3-3', desc: 'Pressing alto, ampiezza sulle fasce. Ideale per giocatori veloci.' },
        '4-4-2': { name: '4-4-2', desc: 'Classico e bilanciato. Buono per chi segna con il centravanti.' },
        '4-2-3-1': { name: '4-2-3-1', desc: 'Doppio mediano, trequartista libero. Protezione e fantasia.' },
        '3-5-2': { name: '3-5-2', desc: 'Tre difensori, cinque centrocampisti. Dominio del centrocampo.' },
        '3-4-3': { name: '3-4-3', desc: 'Offensivo, aggressivo. Per chi ama il gioco di posizione.' },
        '5-3-2': { name: '5-3-2', desc: 'Difensivo con ripartenza. Tre centrocampisti di sostanza.' },
    },
    en: {
        '4-3-3': { name: '4-3-3', desc: 'High press, width on the flanks. Ideal for fast players.' },
        '4-4-2': { name: '4-4-2', desc: 'Classic and balanced. Good for centre-forward scorers.' },
        '4-2-3-1': { name: '4-2-3-1', desc: 'Double pivot, free number 10. Protection and creativity.' },
        '3-5-2': { name: '3-5-2', desc: 'Three defenders, five midfielders. Midfield dominance.' },
        '3-4-3': { name: '3-4-3', desc: 'Offensive, aggressive. For lovers of positional football.' },
        '5-3-2': { name: '5-3-2', desc: 'Defensive with counter-attack. Three holding midfielders.' },
    }
};

// ── Skill synergy descriptions ─────────────────────────────────────────────────
GS_Locale.SKILL_SYNERGIES = {
    it: {
        'tiro_potente+turbo':       'Combo letale: accelera e spara. I portieri non arrivano mai.',
        'tiro_giro+freddezza':      'Precisione soprannaturale. Il tiro a giro con la testa fredda è quasi imprendibile.',
        'colpo_testa+fisico_bestiale': 'Dominio aereo totale. Nessun difensore può contrastare questo abbinamento.',
        'dribbling_elastico+scatto': 'Cambio di direzione + esplosività: il difensore non sa dove guardare.',
        'resistenza+istinto':       'Corpo e mente in perfetta sincronia. Le occasioni le crei, le occasioni le chiudi.',
    },
    en: {
        'tiro_potente+turbo':        'Lethal combo: accelerate and shoot. Keepers never get there.',
        'tiro_giro+freddezza':       'Supernatural precision. A curling shot with ice in the veins is near-unstoppable.',
        'colpo_testa+fisico_bestiale': 'Total aerial dominance. No defender can match this combination.',
        'dribbling_elastico+scatto': `Direction change + explosion: the defender doesn't know where to look.`,
        'resistenza+istinto':        'Body and mind in perfect sync. You create the chances, you finish the chances.',
    }
};

// ── Club prestige tiers ────────────────────────────────────────────────────────
GS_Locale.CLUB_TIERS = {
    it: {
        5: { label: 'Top Club Mondiale', desc: 'Il meglio del meglio. Solo i più forti giocano qui.', color: '#FFD700' },
        4: { label: `Club d'Élite`,     desc: 'Grandi ambizioni, grandi investimenti. Europa ogni anno.', color: '#f59e0b' },
        3: { label: 'Club Importante',   desc: `Una realtà consolidata. Lotta per l'Europa.`, color: '#10b981' },
        2: { label: 'Club Medio',        desc: 'Metà classifica, qualche sorpresa. Buona palestra.', color: '#3b82f6' },
        1: { label: 'Club Piccolo',      desc: 'Lotta per salvarsi. Ma i talenti qui nascono.', color: '#94a3b8' },
    },
    en: {
        5: { label: 'World Top Club',   desc: 'The best of the best. Only the strongest play here.', color: '#FFD700' },
        4: { label: 'Elite Club',       desc: 'Big ambitions, big investments. Europe every year.', color: '#f59e0b' },
        3: { label: 'Established Club', desc: 'A solid outfit. Fights for European football.', color: '#10b981' },
        2: { label: 'Mid-Table Club',   desc: 'Mid-table, the odd surprise. A good learning ground.', color: '#3b82f6' },
        1: { label: 'Small Club',       desc: 'Fighting to survive. But this is where talents are born.', color: '#94a3b8' },
    }
};

GS_Locale.getClubTier = function(stelle) {
    const lang = _lang();
    const tiers = GS_Locale.CLUB_TIERS[lang] || GS_Locale.CLUB_TIERS.it;
    return tiers[Math.min(5, Math.max(1, parseInt(stelle || 1)))] || tiers[1];
};

GS_Locale.getSkillSynergy = function(skillA, skillB) {
    const lang = _lang();
    const map = GS_Locale.SKILL_SYNERGIES[lang] || GS_Locale.SKILL_SYNERGIES.it;
    return map[`${skillA}+${skillB}`] || map[`${skillB}+${skillA}`] || null;
};

GS_Locale.getFormation = function(formation) {
    const lang = _lang();
    const fms = GS_Locale.FORMATIONS[lang] || GS_Locale.FORMATIONS.it;
    return fms[formation] || { name: formation, desc: '' };
};
