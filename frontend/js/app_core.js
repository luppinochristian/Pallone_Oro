/* app_core.js — core: costanti, traduzioni, lingua, impostazioni.
 * Estratto da app.js (refactor): nessuna logica modificata.
 * Caricato in ordine da index.html. */

/**
 * ============================================================
 * app.js — Modulo principale dell'applicazione Golden Striker
 * ============================================================
 * File JavaScript più grande del progetto (~5000 righe).
 * Coordina tutta la logica client-side del gioco:
 *
 * SEZIONI PRINCIPALI:
 *  - Stringhe UI bilingue (IT/EN) e sistema di internazionalizzazione
 *  - Gestione autenticazione: login, registrazione, verifica email OTP,
 *    reset password, modalità ospite
 *  - Navigazione tra pagine e rendering UI
 *  - Dashboard principale con notizie, statistiche e azioni mensili
 *  - Sistema di traduzione notizie in tempo reale via API Anthropic
 *  - Selezione e creazione carriere
 *  - Pagine: Abilità, Agente, Notizie, Classifica, Champions,
 *            Obiettivi, Strutture, Trasferimenti, Epilogo
 *  - Funzioni API (api(), toast(), renderGame(), renderDashboard())
 *  - Cambio lingua (setLanguage()) e applicazione traduzioni
 *
 * DIPENDENZE (caricati prima in index.html):
 *  gamedata.js, locale.js, commentary.js, achievements.js,
 *  season_planner.js, tutorial.js, ui_components.js, analytics.js,
 *  timeline.js, particles.js, charts.js, encyclopedia.js,
 *  animations.js, playercard.js
 * ============================================================
 */
// ── CONFIG ──
const API_BASE = '/backend/api';
let currentPlayer = null;
let selectedActions = [];
let _pendingDashboardRefresh = false;
let authToken       = localStorage.getItem('gs_token') || null;
let currentCareerId = parseInt(localStorage.getItem('gs_career') || '0') || null;
let selectedSkin      = '#C68642';
let selectedEye       = '#5C3317';
let selectedHairStyle = 'short';
let selectedFacialHair = 'none';
let selectedEyebrowStyle = 'standard';
let selectedFreckles = 0;
let selectedKit = null; // null = colore di default del genere
let selectedHairColor = '#1a1a1a';

// ── HAIR STYLES ──
const HAIR_STYLE_DEFS = [
    { id: 'short',  label: {it:'Corto', en:'Short',  de:'Kurz',    es:'Corto'},  emoji: '💈' },
    { id: 'medium', label: {it:'Medio', en:'Medium', de:'Mittel',  es:'Medio'},  emoji: '💇' },
    { id: 'long',   label: {it:'Lungo', en:'Long',   de:'Lang',    es:'Largo'},  emoji: '🧖' },
    { id: 'curly',  label: {it:'Ricci', en:'Curly',  de:'Lockig',  es:'Rizado'}, emoji: '🌀' },
    { id: 'afro',   label: {it:'Afro',  en:'Afro',   de:'Afro',    es:'Afro'},   emoji: '✊' },
    { id: 'mohawk', label: {it:'Mohawk',en:'Mohawk', de:'Mohawk',  es:'Mohawk'}, emoji: '🤘' },
    { id: 'bun',    label: {it:'Coda',  en:'Bun',    de:'Dutt',    es:'Moño'},   emoji: '🎀' },
    { id: 'bald',   label: {it:'Rasato',en:'Bald',   de:'Kahl',    es:'Calvo'},  emoji: '🧑‍🦲' },
];

const HAIR_PRESET_COLORS = [
    '#1a1a1a','#2d1a0e','#3d2b1f','#5c3317',
    '#8B4513','#A0522D','#C4893E','#D4A017',
    '#F5C842','#C0392B','#922B21','#7D3C98',
    '#808080','#b0b0b0','#d4d4d4','#ffffff',
];

const SKIN_COLORS = {
    light:'#FDDBB4', medium_light:'#E8B88A', medium:'#C68642',
    medium_dark:'#8D5524', dark:'#3B1A08'
};

const EYE_PRESETS = [
    '#5C3317','#3d1f0a','#1E90FF','#4169E1','#228B22','#2E8B57',
    '#8B6914','#D4A017','#708090','#536878','#8B0000','#800080',
    '#4B0082','#1a1a2e'
];

// ── TRADUZIONI (IT / EN) ──
const TRANSLATIONS = {
    it: {
        nav_dashboard:'🏠 Dashboard', nav_game:'⚽ Gioca', nav_career:'📊 Carriera',
        nav_transfer:'🔄 Trasferimento', nav_strutture:'🏗️ Strutture',
        nav_classifica:'🏟️ Classifica', nav_agente:'🤝 Agente',
        nav_notizie:'📰 Notizie', nav_skilltree:'🌟 Abilità',
        settings_title:'Impostazioni', settings_language:'🌐 Lingua / Language',
        settings_navigate:'🗺️ Navigazione', settings_main_menu:'Menu Principale',
        settings_main_menu_sub:'Cambia carriera o creane una nuova',
        settings_feedback:'Richiedi un Update', settings_feedback_sub:'Invia suggerimenti agli sviluppatori',
        settings_account:'👤 Account', settings_logout:'Logout Completo',
        settings_logout_sub:'Disconnetti account e torna al login',
        auth_login:'Accedi', auth_register:'Registrati',
        auth_login_btn:'⚽ Accedi', auth_register_btn:'🌟 Crea Account',
        auth_userauth_confirm_pw:'Conferma Password',
        auth_forgot_link:'Password dimenticata?', auth_forgot_btn:'📧 Invia Istruzioni',
        auth_back_login:'← Torna al Login', create_name_label:'Nome Carriera',
        create_player_label:'Nome Calciatore', create_gender:'Sesso', create_age:'Età',
        create_nationality:'Nazionalità', create_foot:'🦶 Piede Preferito',
        create_skin:'🧑 Carnagione', create_eyes:'👁️ Colore Occhi',
        create_eyebrows:'👁️ Sopracciglia', eyebrow_thin:'Sottili', eyebrow_standard:'Standard', eyebrow_thick:'Spesse', eyebrow_arched:'Arcuate', create_freckles:'✨ Lentiggini', freckles_off:'No', freckles_on:'Sì', create_kit:'👕 Maglia', kit_blu:'Blu', kit_rosso:'Rosso', kit_verde:'Verde', kit_bianco:'Bianco', kit_nero:'Nero', kit_giallo:'Giallo', kit_viola:'Viola', kit_arancio:'Arancio', create_facial:'🧔 Barba e Baffi', facial_none:'Rasato', facial_stubble:'Leggera', facial_goatee:'Pizzetto', facial_beard:'Barba', facial_mustache:'Baffi', btn_randomize:'🎲 Casuale', btn_reset_look:'↺ Ripristina',
        create_hairstyle:'✂️ Taglio', create_haircolor:'🎨 Colore Capelli',
        create_start_btn:'🌟 Inizia la Carriera!',
        cc_step1:'Identità', cc_step2:'Aspetto', cc_step3:'Stile', cc_step4:'Conferma',
        cc_step1_title:'Chi sei?', cc_step1_sub:'Il tuo nome entrerà nella storia del calcio',
        cc_step2_title:'Il tuo aspetto', cc_step2_sub:'Personalizza il tuo calciatore',
        cc_step3_title:'Il tuo stile', cc_step3_sub:'Come giochi in campo?',
        cc_step4_title:'Pronto per la gloria?', cc_step4_sub:'Controlla i tuoi dettagli e inizia',
        cc_back:'← Indietro', cc_next:'Avanti →',
        cc_role:'Ruolo / Specializzazione', cc_role_hint:'+5 alla stat principale a inizio carriera',
        gender_male:'⚽ Maschio', gender_female:'⚽ Femmina',
        foot_right:'👟 Destro', foot_left:'👟 Sinistro',
        career_new:'➕ Nuova Carriera', career_select_title:'Le tue Carriere', 
        dash_period:'Periodo', dash_money:'Soldi', dash_goals:'⚽ Gol Stagione',
        dash_assists:'🎯 Assist Stagione', dash_facility:'Struttura',
        dash_tech_stats:'📊 Statistiche Tecniche', dash_phys_cond:'🔋 Condizione Fisica',
        stat_tiro:'Tiro', stat_velocita:'Velocità', stat_dribbling:'Dribbling',
        stat_fisico:'Fisico', stat_mentalita:'Mentalità',
        stat_piede_forte:'🦶 Piede Forte', stat_piede_debole:'🦶 Piede Debole',
        stat_skill_lvl:'🎯 Livello Skill',
        stat_energia:'Energia', stat_morale:'Morale', stat_popolarita:'Popolarità',
        dash_season:'Stag.', dash_season_full:'Stagione', dash_age:'Età',
        dash_latest_news:'📰 Ultime Notizie',
        dash_activities:'📋 Ultime Attività',
        dash_no_news:'Gioca il primo mese per ricevere notizie!',
        page_game:'⚽ Gioca il Mese', page_career:'📊 Carriera',
        page_transfer:'🔄 Trasferimento', page_strutture:'🏗️ Struttura Personale',
        page_agente:'🤝 Agente Personale', page_notizie:'📰 Notizie',
        page_skilltree:'🌟 Albero delle Abilità',
        page_classifica:'🏟️ Classifica',
        classifica_subtitle:'Classifica in tempo reale di ogni lega e Champions Cup',
        transfer_subtitle:'Scegli la tua prossima squadra. Squadre migliori = più soldi e visibilità!',
        strutture_subtitle:'Investi i tuoi soldi per migliorare la struttura di allenamento e crescere più velocemente.',
        agente_subtitle:'Un buon agente negozia stipendi migliori e porta offerte dai top club',
        notizie_subtitle:'Gli ultimi aggiornamenti sulla tua carriera',
        skilltree_subtitle:'Raggiungi milestone nelle statistiche per sbloccare potenziamenti unici',
        nav_achievements:'🏅 Premi', nav_extra:'⋯ Extra',
        view_card:'Carta',
        page_achievements:'🏅 Obiettivi Sbloccati',
        achievements_subtitle:'Completa sfide per sbloccare badge esclusivi',
        achievements_unlocked:'sbloccati',
        ach_category_milestones:'🌟 Milestone',
        ach_category_scoring:'⚽ Gol & Assist',
        ach_category_growth:'📈 Crescita',
        ach_category_trophies:'🏆 Trofei',
        ach_category_career:'💼 Carriera',
        ach_category_skills:'✨ Abilità',
        ach_category_facilities:'🏗️ Strutture',
        ach_category_secrets:'🔒 Segreti',
        dash_current_status:'📈 Status Attuale',
        results_title:'📊 Risultati del Mese',
        results_close:'✅ Continua',
        skill_pts_zero:'0 punti abilità disponibili',
        st_strong_foot:'🦶 PIEDE FORTE', st_weak_foot:'🦶 PIEDE DEBOLE', st_skill_lvl:'🎯 LIVELLO SKILL',
        st_strong_hint:'Potenzia con: Tiro Potente, Tiro a Giro, Rabona',
        st_weak_hint:'Potenzia con: Freddezza, Istinto del Goleador',
        st_skill_hint:'Sale sbloccando più abilità nell\'albero',
        register_username_hint:'Solo lettere, numeri e _ (3-30 caratteri)',
        register_pw_label:'Password (min 6 caratteri)',
        forgot_desc:'Inserisci la tua email e ti manderemo le istruzioni per reimpostare la password.',
        careers_limit:'Hai raggiunto il limite di 5 carriere.',
        update_request_desc:'Scrivi le tue idee, suggerimenti o segnalazioni. Verranno inviate agli sviluppatori.',
        update_send_btn:'📨 Invia', update_sent_ok:'✅ Richiesta inviata! Grazie per il tuo suggerimento.',
        btn_cancel:'Annulla',
        menu_change_career:'Cambia Carriera',
        menu_change_career_sub:'Torna alla selezione carriere',
        menu_settings:'Impostazioni',
        menu_settings_sub:'Lingua, account, tutorial',
        menu_logout:'Logout',
        menu_logout_sub:'Disconnetti account',
        reg_err_email:'Inserisci una email valida',
        reg_err_password:'Le password non coincidono',
        verify_title:'Verifica Email',
        verify_mail_fail:'⚠️ Impossibile inviare l’email di verifica. Riprova più tardi o contatta l’amministratore.', verify_code_sent:'📧 Nuovo codice inviato', verify_subtitle:'Abbiamo inviato un codice a 6 cifre a',
        verify_btn:'✅ Verifica',
        verify_resend:'Reinvia codice',
        verify_resend_wait:'Reinvia tra',
        verify_err_code:'Inserisci il codice a 6 cifre',
        verify_success:'Account verificato! Benvenuto!', 
        tab_lega:'📋 Lega', tab_champions:'🏆 Champions Cup', tab_calendario:'📅 Calendario', tab_capocannonieri:'👟 Capocannonieri',
        select_league:'Seleziona una lega',
        stat_gol:'gol', stat_assist:'assist', stat_voto:'voto',
        stat_partite:'partite', stat_trofei:'trofei', stat_palloni:'Palloni d\'Oro',
        match_win:'VITTORIA', match_draw:'PAREGGIO', match_loss:'SCONFITTA',
        match_home:'🏠 Casa', match_away:'✈️ Trasferta',
        league_div1:'Prima Divisione', league_div2:'Seconda Serie',
        career_trophies_title:'🏅 Trofei e Riconoscimenti',
        pallone_top:'Pallone d\'Oro Top',
        career_best_rating_label:'Miglior Valutazione',
        classifica_legend_champion:'🥇 Campione',
        classifica_legend_top3:'🥉 Podio',
        classifica_legend_top4:'⭐ Champions Cup',
        classifica_legend_retro:'📉 Zona retrocessione',
        injury_blocked:'Sei infortunato, non puoi allenarti fisicamente!',
        energy_blocked:'Energia a zero! Riposati prima di allenarti.',
        actions_max:'Puoi scegliere massimo 3 azioni!', 
        // Obiettivi stagionali — usati dinamicamente con _t('obj_'+ob.tipo)
        obj_gol_stagione:'Segna {0} gol in stagione',
        obj_assist_stagione:'Fornisci {0} assist in stagione',
        obj_media_voto:'Mantieni una media voto ≥ 7.0',
        obj_overall:'Raggiungi Overall {0}',
        obj_popolarita:'Raggiungi {0} di popolarità',
        obj_complete:'Completato',
        obj_header:'🎯 Obiettivi Stagionali',
        obj_completed:'completati',
        obj_title:'🎯 Obiettivi Stagione',
        // Form registrazione
        register_pw_placeholder:'Scegli una password (min 6 caratteri)',
        register_pw2_placeholder:'Ripeti la password',
        // Restore: cc_role names/subs, auth labels, career defaults, nation search
        default_career_name:'La mia Carriera',
        cc_nation_search:'🔍 Cerca nazione...',
        auth_username:'Username',
        auth_confirm_pw:'Conferma Password',
        cc_role_bomber:'⚽ Bomber', cc_role_bomber_sub:'+5 Tiro',
        cc_role_fantasista:'✨ Fantasista', cc_role_fantasista_sub:'+5 Dribbling',
        cc_role_ala:'⚡ Ala', cc_role_ala_sub:'+5 Velocità',
        cc_role_regista:'🧠 Regista', cc_role_regista_sub:'+5 Mentalità',
        cc_role_tuttocampista:'💪 Tuttocampista', cc_role_tuttocampista_sub:'+5 Fisico',
        tooltip_delete:'Elimina', 
        default_career_injury_banner:'🩹 Sei infortunato — <strong>{0} {1}</strong>. Puoi solo riposare, allenarti mentalmente o fare attività social.',
        injury_mese:'mese rimanente', injury_mesi:'mesi rimanenti',
        energy_zero_banner:'⚡ Energia esaurita — non puoi allenarti fisicamente. Riposati prima!',
        energy_low_banner:'⚠️ Energia bassa ({0}) — rischio infortuni elevato negli allenamenti fisici!',
        res_section_training:'🏋️ Allenamento',
        res_section_injuries:'🚑 Infortuni',
        res_section_champions:'🏆 Champions Cup',
        res_section_matches:'⚽ Partite del mese', res_section_livefeed:'📡 Altri risultati della giornata',
        res_section_other:'📋 Altro',
        champions_badge:'🌟 Champions Cup',
        pallone_badge:"🥇 Pallone d'Oro",
        transfer_toast:'✈️ Trasferito a {0}!',
        transfer_confirm:'Trasferirsi a {0}?',
        api_error_label:'Errore: ',
        api_resp_invalid:'Risposta non valida',
        error_generic_msg:'Errore. Riprova.',
        error_unknown:'Errore sconosciuto',
        conn_error_short:'Errore di connessione',
        server_resp_invalid:'Risposta del server non valida',  
        prereq_unlock:'Sblocca prima il prerequisito!',
        no_career:'Nessuna carriera ancora.\nCreane una per iniziare!', 
        welcome_career:'Benvenuto! La tua carriera inizia ora! ⚽',
        rename_career_prompt:'Nuovo nome carriera:',
        delete_career_confirm:'Eliminare la carriera "{0}"?\nQuesta azione è irreversibile!',
        career_deleted:'Carriera eliminata',
        no_activity:'Nessuna attività ancora',
        loading:'⏳ Caricamento...',
        no_seasons:'Nessuna stagione giocata ancora.',
        loading_teams:'Caricamento squadre...',
        loading_leagues:'Caricamento leghe...',
        loading_champions:'Caricamento Champions Cup...',
        error_loading_teams:'Errore caricamento squadre.',
        no_agent:'Nessun agente disponibile.',
        agent_empty:'👤 Non hai ancora un agente. Assumine uno per massimizzare i guadagni e facilitare i trasferimenti!',
        agent_choose:'Scegli il tuo agente',
        no_matches:'Nessuna partita giocata ancora in questa lega.',
        champions_not_started_full:'🏆 La Champions Cup non è ancora iniziata. Le squadre si qualificano a settembre (top 4 di ogni Prima Divisione).',
        bracket_no_data_full:'Nessun tabellone ancora disponibile.',
        bracket_tbd:'In attesa',
        skill_maxed:'Abilità già al massimo!',
        end_career_banner:'🏁 FINE CARRIERA!', retirement_close:'🏠 Torna alle carriere',
        struttura_current:'Struttura Attuale',
        struttura_buy:'🏗️ Acquista',
        struttura_locked:'🔒 Sequenziale',
        struttura_no_funds:'💸 Fondi insuff.',
        ts_ovr:'⚽ OVR Squadra', ts_salary:'💰 Stipendio', ts_pop:'🏟️ Popolarità',
        salary_base:'base', salary_buono:'buono', salary_ottimo:'ottimo', salary_alto:'alto', salary_top:'top',
        transfer_current_team:'✅ Squadra Attuale',
        ag_level:'Livello', ag_salary_bonus:'stipendio', ag_ovr_bonus:'OVR trasferimento',
        ag_monthly_est:'Bonus mensile stimato', ag_ovr_note:'(basato sul tuo OVR attuale)',
        ag_req_prev:'Richiede prima Lv.', ag_req_pop:'Serve pop.', ag_req_money:'Mancano',
        ag_hire_btn:'🤝 Assumi', ag_upgrade_btn:'⬆️ Upgrade', ag_pop_free:'Libero',
        ag_owned:'✅ Attivo',
        obj_morale_prize:'morale',
        strutture_bonus_training:'Allenamento',
        strutture_bonus_growth:'Crescita',
        strutture_bonus_injury:'Infortuni',
        game_choose_actions:'🎮 Scegli le tue Azioni',
        game_choose_sub:'Seleziona 1-3 azioni mensili. Le scelte influenzano stats, energia e performance.',
        game_play_sub:'Scegli fino a 3 azioni per questo mese, poi simula le partite',
        play_btn:'⚽ Seleziona almeno 1 azione', play_btn_ready:'⚽ Gioca Mese',
        career_subtitle:'Storico delle tue stagioni — clicca su un anno per i dettagli',
        career_tab_seasons:'📅 Stagioni', career_tab_log:'📋 Log Partite',
        career_ongoing:'in corso', career_no_data:'Nessun dato',
        career_best_rating:'MIGLIOR VALUTAZIONE',
        career_year_label:'Anno',
        month_1:'Gen',month_2:'Feb',month_3:'Mar',month_4:'Apr',month_5:'Mag',month_6:'Giu',
        month_7:'Lug',month_8:'Ago',month_9:'Set',month_10:'Ott',month_11:'Nov',month_12:'Dic',
        month_full_1:'Gennaio',month_full_2:'Febbraio',month_full_3:'Marzo',month_full_4:'Aprile',
        month_full_5:'Maggio',month_full_6:'Giugno',month_full_7:'Luglio',month_full_8:'Agosto',
        month_full_9:'Settembre',month_full_10:'Ottobre',month_full_11:'Novembre',month_full_12:'Dicembre',
        // Piede lato
        foot_sx:'Sinistro', foot_dx:'Destro',
        // Transfer
        transfer_ovr_req:'🎯 OVR richiesto', transfer_btn_go:'✈️ Trasferisciti', transfer_agent_bonus:'🤝 Agente attivo: -{0}% OVR richiesto per il trasferimento',
        transfer_no_teams:'Nessuna squadra in questa lega.',
        // Career
        career_no_data_season:'Nessun dato disponibile per questa stagione.',
        career_best_gol_label:'Miglior partita per Gol', career_best_assist_label:'Miglior partita per Assist',
        // Objectives
        // Agent
        agent_active_badge:'✅ Agente attivo',
        // Status
        sim_running:'⏳ Simulazione in corso...', 
        // Senza squadra
        no_team:'Senza squadra',
        guest_desc:'Vuoi provare senza registrarti?',
        guest_btn:'👤 Modalità Ospite',
        guest_banner:'👤 Stai giocando come Ospite — i progressi non vengono salvati.',
        guest_save_prompt:'Crea un account gratuito per salvare la tua carriera!',
        update_request_placeholder:'Descrivi le tue idee, suggerimenti o bug...',
        color_hair_label:'Colore Capelli',
        color_eye_label:'Colore Occhi',
        agente_min_chars:'Testo troppo corto.',
        conn_error:'Errore di connessione. Riprova.',
        reg_err_username:'Username non valido.',
        tooltip_rename:'Rinomina carriera',
        guest_register_btn:'💾 Registrati e Salva',
        attr_overall:'Overall', attr_tiro:'Tiro', attr_velocita:'Velocità',
        attr_dribbling:'Dribbling', attr_fisico:'Fisico', attr_mentalita:'Mentalità',
    },
    en: {
        nav_dashboard:'🏠 Dashboard', nav_game:'⚽ Play', nav_career:'📊 Career',
        nav_transfer:'🔄 Transfer', nav_strutture:'🏗️ Facilities',
        nav_classifica:'🏟️ Standings', nav_agente:'🤝 Agent',
        nav_notizie:'📰 News', nav_skilltree:'🌟 Skills',
        settings_title:'Settings', settings_language:'🌐 Language / Lingua',
        settings_navigate:'🗺️ Navigation', settings_main_menu:'Main Menu',
        settings_main_menu_sub:'Switch career or create a new one',
        settings_feedback:'Request an Update', settings_feedback_sub:'Send suggestions to the developers',
        settings_account:'👤 Account', settings_logout:'Full Logout',
        settings_logout_sub:'Disconnect account and return to login',
        auth_login:'Login', auth_register:'Sign Up',
        auth_login_btn:'⚽ Login', auth_register_btn:'🌟 Create Account',
        auth_userauth_confirm_pw:'Confirm Password',
        auth_forgot_link:'Forgot password?', auth_forgot_btn:'📧 Send Instructions',
        auth_back_login:'← Back to Login', create_name_label:'Career Name',
        create_player_label:'Player Name', create_gender:'Gender', create_age:'Age',
        create_nationality:'Nationality', create_foot:'🦶 Preferred Foot',
        create_skin:'🧑 Skin Tone', create_eyes:'👁️ Eye Color',
        create_eyebrows:'👁️ Eyebrows', eyebrow_thin:'Thin', eyebrow_standard:'Standard', eyebrow_thick:'Thick', eyebrow_arched:'Arched', create_freckles:'✨ Freckles', freckles_off:'No', freckles_on:'Yes', create_kit:'👕 Shirt', kit_blu:'Blue', kit_rosso:'Red', kit_verde:'Green', kit_bianco:'White', kit_nero:'Black', kit_giallo:'Yellow', kit_viola:'Purple', kit_arancio:'Orange', create_facial:'🧔 Facial Hair', facial_none:'Clean', facial_stubble:'Stubble', facial_goatee:'Goatee', facial_beard:'Beard', facial_mustache:'Mustache', btn_randomize:'🎲 Random', btn_reset_look:'↺ Reset',
        create_hairstyle:'✂️ Hairstyle', create_haircolor:'🎨 Hair Color',
        create_start_btn:'🌟 Start this Career!',
        cc_step1:'Identity', cc_step2:'Appearance', cc_step3:'Style', cc_step4:'Confirm',
        cc_step1_title:'Who are you?', cc_step1_sub:'Your name will go down in football history',
        cc_step2_title:'Your appearance', cc_step2_sub:'Customize your player',
        cc_step3_title:'Your style', cc_step3_sub:'How do you play on the pitch?',
        cc_step4_title:'Ready for glory?', cc_step4_sub:'Check your details and start',
        cc_back:'← Back', cc_next:'Next →',
        cc_role:'Role / Specialization', cc_role_hint:'+5 to main stat at career start',
        gender_male:'⚽ Male', gender_female:'⚽ Female',
        foot_right:'👟 Right', foot_left:'👟 Left',
        career_new:'➕ New Career', career_select_title:'Your Careers', 
        dash_period:'Period', dash_money:'Budget', dash_goals:'⚽ Season Goals',
        dash_assists:'🎯 Season Assists', dash_facility:'Facility',
        dash_tech_stats:'📊 Technical Stats', dash_phys_cond:'🔋 Physical Condition',
        stat_tiro:'Shooting', stat_velocita:'Speed', stat_dribbling:'Dribbling',
        stat_fisico:'Physical', stat_mentalita:'Mental',
        stat_piede_forte:'🦶 Strong Foot', stat_piede_debole:'🦶 Weak Foot',
        stat_skill_lvl:'🎯 Skill Level',
        stat_energia:'Energy', stat_morale:'Morale', stat_popolarita:'Popularity',
        dash_season:'Season', dash_season_full:'Season', dash_age:'Age',
        dash_latest_news:'📰 Latest News',
        dash_activities:'📋 Recent Activity',
        dash_no_news:'Play the first month to receive news!',
        page_game:'⚽ Play the Month', page_career:'📊 Career',
        page_transfer:'🔄 Transfer', page_strutture:'🏗️ Personal Facilities',
        page_agente:'🤝 Personal Agent', page_notizie:'📰 News',
        page_skilltree:'🌟 Skill Tree',
        page_classifica:'🏟️ Standings',
        classifica_subtitle:'Live standings for every league and Champions Cup',
        transfer_subtitle:'Choose your next team. Better teams = more money and visibility!',
        strutture_subtitle:'Invest your money to improve your training facility and grow faster.',
        agente_subtitle:'A good agent negotiates better wages and brings offers from top clubs',
        notizie_subtitle:'The latest updates on your career',
        skilltree_subtitle:'Reach stat milestones to unlock unique upgrades',
        nav_achievements:'🏅 Awards', nav_extra:'⋯ More',
        view_card:'Card',
        page_achievements:'🏅 Achievements',
        achievements_subtitle:'Complete challenges to unlock exclusive badges',
        achievements_unlocked:'unlocked',
        ach_category_milestones:'🌟 Milestones',
        ach_category_scoring:'⚽ Goals & Assists',
        ach_category_growth:'📈 Growth',
        ach_category_trophies:'🏆 Trophies',
        ach_category_career:'💼 Career',
        ach_category_skills:'✨ Skills',
        ach_category_facilities:'🏗️ Facilities',
        ach_category_secrets:'🔒 Secrets',
        dash_current_status:'📈 Current Status',
        results_title:'📊 Monthly Results',
        results_close:'✅ Continue',
        skill_pts_zero:'0 skill points available',
        st_strong_foot:'🦶 STRONG FOOT', st_weak_foot:'🦶 WEAK FOOT', st_skill_lvl:'🎯 SKILL LEVEL',
        st_strong_hint:'Upgrade with: Power Shot, Curl, Rabona',
        st_weak_hint:'Upgrade with: Composure, Striker Instinct',
        st_skill_hint:'Increases by unlocking more skills in the tree',
        register_username_hint:'Letters, numbers and _ only (3-30 chars)',
        register_pw_label:'Password (min 6 chars)',
        forgot_desc:'Enter your email and we will send you instructions to reset your password.',
        careers_limit:'You have reached the limit of 5 careers.',
        update_request_desc:'Write your ideas, suggestions or bug reports. They will be sent to the developers.',
        update_send_btn:'📨 Send', update_sent_ok:'✅ Request sent! Thank you for your feedback.',
        btn_cancel:'Cancel',
        menu_change_career:'Change Career',
        menu_change_career_sub:'Back to career selection',
        menu_settings:'Settings',
        menu_settings_sub:'Language, account, tutorial',
        menu_logout:'Logout',
        menu_logout_sub:'Disconnect account',
        reg_err_email:'Please enter a valid email',
        reg_err_password:'Passwords do not match',
        verify_title:'Verify Email',
        verify_mail_fail:'⚠️ Could not send the verification email. Please try again later or contact the administrator.', verify_code_sent:'📧 New code sent', verify_subtitle:'We sent a 6-digit code to',
        verify_btn:'✅ Verify',
        verify_resend:'Resend code',
        verify_resend_wait:'Resend in',
        verify_err_code:'Please enter the 6-digit code',
        verify_success:'Account verified! Welcome!', 
        tab_lega:'📋 League', tab_champions:'🏆 Champions Cup', tab_calendario:'📅 Calendar', tab_capocannonieri:'👟 Top Scorers',
        select_league:'Select a league',
        stat_gol:'goals', stat_assist:'assists', stat_voto:'rating',
        stat_partite:'matches', stat_trofei:'trophies', stat_palloni:'Ballon d\'Or',
        match_win:'WIN', match_draw:'DRAW', match_loss:'LOSS',
        match_home:'🏠 Home', match_away:'✈️ Away',
        league_div1:'First Division', league_div2:'Second Division',
        career_trophies_title:'🏅 Trophies & Honours',
        pallone_top:"Ballon d'Or Top",
        career_best_rating_label:'Best Rating',
        classifica_legend_champion:'🥇 Champion',
        classifica_legend_top3:'🥉 Podium',
        classifica_legend_top4:'⭐ Champions Cup',
        classifica_legend_retro:'📉 Relegation zone',
        injury_blocked:'You are injured, you cannot train physically!',
        energy_blocked:'Energy at zero! Rest before training.',
        actions_max:'You can choose a maximum of 3 actions!', 
        // Season objectives — used dynamically with _t('obj_'+ob.tipo)
        obj_gol_stagione:'Score {0} goals this season',
        obj_assist_stagione:'Provide {0} assists this season',
        obj_media_voto:'Keep an average rating ≥ 7.0',
        obj_overall:'Reach Overall {0}',
        obj_popolarita:'Reach {0} popularity',
        obj_complete:'Completed',
        obj_header:'🎯 Season Objectives',
        obj_completed:'completed',
        obj_title:'🎯 Season Objectives',
        // Registration form
        register_pw_placeholder:'Choose a password (min 6 chars)',
        register_pw2_placeholder:'Repeat the password',
        // Restore: cc_role names/subs, auth labels, career defaults, nation search
        default_career_name:'My Career',
        cc_nation_search:'🔍 Search nation...',
        auth_username:'Username',
        auth_confirm_pw:'Confirm Password',
        cc_role_bomber:'⚽ Striker', cc_role_bomber_sub:'+5 Shooting',
        cc_role_fantasista:'✨ Playmaker', cc_role_fantasista_sub:'+5 Dribbling',
        cc_role_ala:'⚡ Winger', cc_role_ala_sub:'+5 Speed',
        cc_role_regista:'🧠 Midfielder', cc_role_regista_sub:'+5 Mental',
        cc_role_tuttocampista:'💪 All-rounder', cc_role_tuttocampista_sub:'+5 Physical',
        tooltip_delete:'Delete', 
        default_career_injury_banner:'🩹 You are injured — <strong>{0} {1}</strong>. You can only rest, train mentally or do social activities.',
        injury_mese:'month remaining', injury_mesi:'months remaining',
        energy_zero_banner:'⚡ Energy depleted — you cannot train physically. Rest first!',
        energy_low_banner:'⚠️ Low energy ({0}) — high injury risk for physical training!',
        res_section_training:'🏋️ Training',
        res_section_injuries:'🚑 Injuries',
        res_section_champions:'🏆 Champions Cup',
        res_section_matches:'⚽ Month matches', res_section_livefeed:'📡 Other results this matchday',
        res_section_other:'📋 Other',
        champions_badge:'🌟 Champions Cup',
        pallone_badge:"🥇 Ballon d'Or",
        transfer_toast:'✈️ Transferred to {0}!',
        transfer_confirm:'Transfer to {0}?',
        api_error_label:'Error: ',
        api_resp_invalid:'Invalid response',
        error_generic_msg:'Error. Please try again.',
        error_unknown:'Unknown error',
        conn_error_short:'Connection error',
        server_resp_invalid:'Invalid server response',  
        prereq_unlock:'Unlock the prerequisite first!',
        no_career:'No careers yet.\nCreate one to get started!', 
        welcome_career:'Welcome! Your career starts now! ⚽',
        rename_career_prompt:'New career name:',
        delete_career_confirm:'Delete career "{0}"?\nThis action cannot be undone!',
        career_deleted:'Career deleted',
        no_activity:'No activity yet',
        loading:'⏳ Loading...',
        no_seasons:'No seasons played yet.',
        loading_teams:'Loading teams...',
        loading_leagues:'Loading leagues...',
        loading_champions:'Loading Champions Cup...',
        error_loading_teams:'Error loading teams.',
        no_agent:'No agent available.',
        agent_empty:"👤 You don't have an agent yet. Hire one to maximise earnings and ease transfers!",
        agent_choose:'Choose your agent',
        no_matches:'No matches played yet in this league.',
        champions_not_started_full:"🏆 Champions Cup hasn't started yet. Teams qualify in September (top 4 of each First Division).",
        bracket_no_data_full:'No bracket data available yet.',
        bracket_tbd:'To be decided',
        skill_maxed:'Skill already maxed!',
        end_career_banner:'🏁 END OF CAREER!', retirement_close:'🏠 Back to careers',
        struttura_current:'Current Facility',
        struttura_buy:'🏗️ Buy',
        struttura_locked:'🔒 Sequential',
        struttura_no_funds:'💸 Insufficient funds',
        ts_ovr:'⚽ Team OVR', ts_salary:'💰 Salary', ts_pop:'🏟️ Popularity',
        salary_base:'base', salary_buono:'fair', salary_ottimo:'good', salary_alto:'high', salary_top:'top',
        transfer_current_team:'✅ Current Team',
        ag_level:'Level', ag_salary_bonus:'salary', ag_ovr_bonus:'OVR transfer',
        ag_monthly_est:'Estimated monthly bonus', ag_ovr_note:'(based on your current OVR)',
        ag_req_prev:'Requires Lv.', ag_req_pop:'Need pop.', ag_req_money:'Missing',
        ag_hire_btn:'🤝 Hire', ag_upgrade_btn:'⬆️ Upgrade', ag_pop_free:'Free',
        ag_owned:'✅ Active',
        obj_morale_prize:'morale',
        strutture_bonus_training:'Training',
        strutture_bonus_growth:'Growth',
        strutture_bonus_injury:'Injuries',
        game_choose_actions:'🎮 Choose your Actions',
        game_choose_sub:'Select 1-3 monthly actions. Your choices affect stats, energy and match performance.',
        game_play_sub:'Choose up to 3 actions for this month, then simulate the matches',
        play_btn:'⚽ Select at least 1 action', play_btn_ready:'⚽ Play Month',
        career_subtitle:'History of your seasons — click a year for details',
        career_tab_seasons:'📅 Seasons', career_tab_log:'📋 Match Log',
        career_ongoing:'ongoing', career_no_data:'No data',
        career_best_rating:'BEST RATING',
        career_year_label:'Year',
        month_1:'Jan',month_2:'Feb',month_3:'Mar',month_4:'Apr',month_5:'May',month_6:'Jun',
        month_7:'Jul',month_8:'Aug',month_9:'Sep',month_10:'Oct',month_11:'Nov',month_12:'Dec',
        month_full_1:'January',month_full_2:'February',month_full_3:'March',month_full_4:'April',
        month_full_5:'May',month_full_6:'June',month_full_7:'July',month_full_8:'August',
        month_full_9:'September',month_full_10:'October',month_full_11:'November',month_full_12:'December',
        // Piede lato
        foot_sx:'Left', foot_dx:'Right',
        // Transfer
        transfer_ovr_req:'🎯 OVR required', transfer_btn_go:'✈️ Transfer', transfer_agent_bonus:'🤝 Agent active: -{0}% OVR requirement for transfer',
        transfer_no_teams:'No teams in this league.',
        // Career
        career_no_data_season:'No data available for this season.',
        career_best_gol_label:'Best match (Goals)', career_best_assist_label:'Best match (Assists)',
        // Objectives
        // Agent
        agent_active_badge:'✅ Agent active',
        // Status
        sim_running:'⏳ Simulating...', 
        // Senza squadra
        no_team:'No team',
        guest_desc:'Want to try without signing up?',
        guest_btn:'👤 Guest Mode',
        guest_banner:'👤 Playing as Guest — progress will not be saved.',
        guest_save_prompt:'Create a free account to save your career!',
        update_request_placeholder:'Describe your ideas, suggestions or bugs...',
        color_hair_label:'Hair Color',
        color_eye_label:'Eye Color',
        agente_min_chars:'Text too short.',
        conn_error:'Connection error. Please retry.',
        reg_err_username:'Invalid username.',
        tooltip_rename:'Rename career',
        guest_register_btn:'💾 Sign Up & Save',
        attr_overall:'Overall', attr_tiro:'Shooting', attr_velocita:'Speed',
        attr_dribbling:'Dribbling', attr_fisico:'Physical', attr_mentalita:'Mental',
    },
    de: {
        nav_dashboard:'🏠 Dashboard', nav_game:'⚽ Spielen', nav_career:'📊 Karriere',
        nav_transfer:'🔄 Transfer', nav_strutture:'🏗️ Einrichtungen',
        nav_classifica:'🏟️ Tabelle', nav_agente:'🤝 Agent',
        nav_notizie:'📰 Nachrichten', nav_skilltree:'🌟 Fähigkeiten',
        settings_title:'Einstellungen', settings_language:'🌐 Sprache',
        settings_navigate:'🗺️ Navigation', settings_main_menu:'Hauptmenü',
        settings_main_menu_sub:'Karriere wechseln oder neue erstellen',
        settings_feedback:'Update anfordern', settings_feedback_sub:'Vorschläge an Entwickler senden',
        settings_account:'👤 Konto', settings_logout:'Vollständiger Logout',
        settings_logout_sub:'Konto trennen und zur Anmeldung zurückkehren',
        auth_login:'Anmelden', auth_register:'Registrieren',
        auth_login_btn:'⚽ Anmelden', auth_register_btn:'🌟 Konto erstellen',
        auth_userauth_confirm_pw:'Passwort bestätigen',
        auth_forgot_link:'Passwort vergessen?', auth_forgot_btn:'📧 Anleitung senden',
        auth_back_login:'← Zurück zum Login', create_name_label:'Karriere-Name',
        create_player_label:'Spielername', create_gender:'Geschlecht', create_age:'Alter',
        create_nationality:'Nationalität', create_foot:'🦶 Bevorzugter Fuß',
        create_skin:'🧑 Hautfarbe', create_eyes:'👁️ Augenfarbe',
        create_eyebrows:'👁️ Augenbrauen', eyebrow_thin:'Dünn', eyebrow_standard:'Standard', eyebrow_thick:'Buschig', eyebrow_arched:'Geschwungen', create_freckles:'✨ Sommersprossen', freckles_off:'Nein', freckles_on:'Ja', create_kit:'👕 Trikot', kit_blu:'Blau', kit_rosso:'Rot', kit_verde:'Grün', kit_bianco:'Weiß', kit_nero:'Schwarz', kit_giallo:'Gelb', kit_viola:'Lila', kit_arancio:'Orange', create_facial:'🧔 Bart & Schnurrbart', facial_none:'Glatt', facial_stubble:'Bartschatten', facial_goatee:'Ziegenbart', facial_beard:'Vollbart', facial_mustache:'Schnurrbart', btn_randomize:'🎲 Zufall', btn_reset_look:'↺ Zurücksetzen',
        create_hairstyle:'✂️ Frisur', create_haircolor:'🎨 Haarfarbe',
        create_start_btn:'🌟 Karriere starten!',
        cc_step1:'Identität', cc_step2:'Aussehen', cc_step3:'Stil', cc_step4:'Bestätigen',
        cc_step1_title:'Wer bist du?', cc_step1_sub:'Dein Name wird in die Fußballgeschichte eingehen',
        cc_step2_title:'Dein Aussehen', cc_step2_sub:'Passe deinen Spieler an',
        cc_step3_title:'Dein Stil', cc_step3_sub:'Wie spielst du auf dem Platz?',
        cc_step4_title:'Bereit für den Ruhm?', cc_step4_sub:'Überprüfe deine Angaben und starte',
        cc_back:'← Zurück', cc_next:'Weiter →',
        cc_role:'Rolle / Spezialisierung', cc_role_hint:'+5 zur Hauptwertung zu Karrierebeginn',
        gender_male:'⚽ Männlich', gender_female:'⚽ Weiblich',
        foot_right:'👟 Rechts', foot_left:'👟 Links',
        career_new:'➕ Neue Karriere', career_select_title:'Deine Karrieren', 
        dash_period:'Zeitraum', dash_money:'Budget', dash_goals:'⚽ Saisontore',
        dash_assists:'🎯 Saisonvorlagen', dash_facility:'Einrichtung',
        dash_tech_stats:'📊 Technische Werte', dash_phys_cond:'🔋 Körperliche Verfassung',
        stat_tiro:'Schuss', stat_velocita:'Geschwindigkeit', stat_dribbling:'Dribbling',
        stat_fisico:'Physis', stat_mentalita:'Mental',
        stat_piede_forte:'🦶 Starker Fuß', stat_piede_debole:'🦶 Schwacher Fuß',
        stat_skill_lvl:'🎯 Skill-Level',
        stat_energia:'Energie', stat_morale:'Moral', stat_popolarita:'Popularität',
        dash_season:'Saison', dash_season_full:'Saison', dash_age:'Alter',
        dash_latest_news:'📰 Neueste Nachrichten',
        dash_activities:'📋 Letzte Aktivitäten',
        dash_no_news:'Spiele den ersten Monat, um Nachrichten zu erhalten!',
        page_game:'⚽ Monat spielen', page_career:'📊 Karriere',
        page_transfer:'🔄 Transfer', page_strutture:'🏗️ Persönliche Einrichtung',
        page_agente:'🤝 Persönlicher Agent', page_notizie:'📰 Nachrichten',
        page_skilltree:'🌟 Fähigkeitsbaum',
        page_classifica:'🏟️ Tabelle',
        classifica_subtitle:'Live-Tabelle für jede Liga und den Champions Cup',
        transfer_subtitle:'Wähle dein nächstes Team. Bessere Teams = mehr Geld und Sichtbarkeit!',
        strutture_subtitle:'Investiere dein Geld, um deine Trainingseinrichtung zu verbessern.',
        agente_subtitle:'Ein guter Agent verhandelt bessere Gehälter und bringt Angebote von Top-Klubs',
        notizie_subtitle:'Die neuesten Updates deiner Karriere',
        skilltree_subtitle:'Erreiche Stat-Meilensteine, um einzigartige Upgrades freizuschalten',
        nav_achievements:'🏅 Auszeichnungen', nav_extra:'⋯ Mehr',
        view_card:'Karte',
        page_achievements:'🏅 Errungenschaften',
        achievements_subtitle:'Schließe Herausforderungen ab, um exklusive Abzeichen zu erhalten',
        achievements_unlocked:'freigeschaltet',
        ach_category_milestones:'🌟 Meilensteine',
        ach_category_scoring:'⚽ Tore & Vorlagen',
        ach_category_growth:'📈 Wachstum',
        ach_category_trophies:'🏆 Trophäen',
        ach_category_career:'💼 Karriere',
        ach_category_skills:'✨ Fähigkeiten',
        ach_category_facilities:'🏗️ Einrichtungen',
        ach_category_secrets:'🔒 Geheimnisse',
        dash_current_status:'📈 Aktueller Status',
        results_title:'📊 Monatliche Ergebnisse',
        results_close:'✅ Weiter',
        skill_pts_zero:'0 Skillpunkte verfügbar',
        st_strong_foot:'🦶 STARKER FUß', st_weak_foot:'🦶 SCHWACHER FUß', st_skill_lvl:'🎯 SKILL-LEVEL',
        st_strong_hint:'Verbessern mit: Mächtiger Schuss, Kurvenball, Rabona',
        st_weak_hint:'Verbessern mit: Kaltblütigkeit, Stürmerinstinkt',
        st_skill_hint:'Steigt durch Freischalten weiterer Fähigkeiten',
        register_username_hint:'Nur Buchstaben, Zahlen und _ (3-30 Zeichen)',
        register_pw_label:'Passwort (mind. 6 Zeichen)',
        forgot_desc:'Gib deine E-Mail ein und wir senden dir Anweisungen zum Zurücksetzen.',
        careers_limit:'Du hast das Limit von 5 Karrieren erreicht.',
        update_request_desc:'Schreibe deine Ideen, Vorschläge oder Fehlerberichte.',
        update_send_btn:'📨 Senden', update_sent_ok:'✅ Anfrage gesendet! Danke für dein Feedback.',
        btn_cancel:'Abbrechen',
        menu_change_career:'Karriere wechseln',
        menu_change_career_sub:'Zurück zur Karriereauswahl',
        menu_settings:'Einstellungen',
        menu_settings_sub:'Sprache, Konto, Tutorial',
        menu_logout:'Logout',
        menu_logout_sub:'Konto trennen',
        reg_err_email:'Bitte gib eine gültige E-Mail ein',
        reg_err_password:'Passwörter stimmen nicht überein',
        verify_title:'E-Mail bestätigen',
        verify_mail_fail:'⚠️ Die Bestätigungs-E-Mail konnte nicht gesendet werden. Bitte versuche es später erneut oder wende dich an den Administrator.', verify_code_sent:'📧 Neuer Code gesendet', verify_subtitle:'Wir haben einen 6-stelligen Code gesendet an',
        verify_btn:'✅ Bestätigen',
        verify_resend:'Code erneut senden',
        verify_resend_wait:'Erneut senden in',
        verify_err_code:'Bitte gib den 6-stelligen Code ein',
        verify_success:'Konto bestätigt! Willkommen!', 
        tab_lega:'📋 Liga', tab_champions:'🏆 Champions Cup', tab_calendario:'📅 Kalender', tab_capocannonieri:'👟 Torjäger',
        select_league:'Liga auswählen',
        stat_gol:'Tore', stat_assist:'Vorlagen', stat_voto:'Bewertung',
        stat_partite:'Spiele', stat_trofei:'Trophäen', stat_palloni:'Ballon d\'Or',
        match_win:'SIEG', match_draw:'UNENTSCHIEDEN', match_loss:'NIEDERLAGE',
        match_home:'🏠 Heim', match_away:'✈️ Auswärts',
        league_div1:'Erste Division', league_div2:'Zweite Division',
        career_trophies_title:'🏅 Trophäen & Ehrungen',
        pallone_top:'Ballon d\'Or Top',
        career_best_rating_label:'Beste Bewertung',
        classifica_legend_champion:'🥇 Meister',
        classifica_legend_top3:'🥉 Podium',
        classifica_legend_top4:'⭐ Champions Cup',
        classifica_legend_retro:'📉 Abstiegszone',
        injury_blocked:'Du bist verletzt, du kannst nicht physisch trainieren!',
        energy_blocked:'Energie bei null! Ruh dich aus, bevor du trainierst.',
        actions_max:'Du kannst maximal 3 Aktionen wählen!', 
        obj_gol_stagione:'{0} Tore in dieser Saison schießen',
        obj_assist_stagione:'{0} Vorlagen in dieser Saison geben',
        obj_media_voto:'Durchschnittsbewertung ≥ 7.0 halten',
        obj_overall:'Overall {0} erreichen',
        obj_popolarita:'{0} Popularität erreichen',
        obj_complete:'Abgeschlossen',
        obj_header:'🎯 Saisonziele',
        obj_completed:'abgeschlossen',
        obj_title:'🎯 Saisonziele',
        register_pw_placeholder:'Passwort wählen (mind. 6 Zeichen)',
        register_pw2_placeholder:'Passwort wiederholen',
        default_career_name:'Meine Karriere',
        cc_nation_search:'🔍 Nation suchen...',
        auth_username:'Benutzername',
        auth_confirm_pw:'Passwort bestätigen',
        cc_role_bomber:'⚽ Stürmer', cc_role_bomber_sub:'+5 Schuss',
        cc_role_fantasista:'✨ Spielmacher', cc_role_fantasista_sub:'+5 Dribbling',
        cc_role_ala:'⚡ Außenstürmer', cc_role_ala_sub:'+5 Geschwindigkeit',
        cc_role_regista:'🧠 Mittelfeldspieler', cc_role_regista_sub:'+5 Mental',
        cc_role_tuttocampista:'💪 Allrounder', cc_role_tuttocampista_sub:'+5 Physis',
        tooltip_delete:'Löschen', 
        default_career_injury_banner:'🩹 Du bist verletzt — <strong>{0} {1}</strong>. Du kannst nur ruhen, mental trainieren oder soziale Aktivitäten machen.',
        injury_mese:'verbleibender Monat', injury_mesi:'verbleibende Monate',
        energy_zero_banner:'⚡ Energie erschöpft — du kannst nicht physisch trainieren. Ruh dich zuerst aus!',
        energy_low_banner:'⚠️ Niedrige Energie ({0}) — hohes Verletzungsrisiko beim physischen Training!',
        res_section_training:'🏋️ Training',
        res_section_injuries:'🚑 Verletzungen',
        res_section_champions:'🏆 Champions Cup',
        res_section_matches:'⚽ Monats-Spiele', res_section_livefeed:'📡 Weitere Ergebnisse des Spieltags',
        res_section_other:'📋 Sonstiges',
        champions_badge:'🌟 Champions Cup',
        pallone_badge:'🥇 Ballon d\'Or',
        transfer_toast:'✈️ Zu {0} transferiert!',
        transfer_confirm:'Zu {0} transferieren?',
        api_error_label:'Fehler: ',
        api_resp_invalid:'Ungültige Antwort',
        error_generic_msg:'Fehler. Bitte versuche es erneut.',
        error_unknown:'Unbekannter Fehler',
        conn_error_short:'Verbindungsfehler',
        server_resp_invalid:'Ungültige Serverantwort',  
        prereq_unlock:'Schalte zuerst die Voraussetzung frei!',
        no_career:'Noch keine Karrieren.\nErstelle eine, um zu beginnen!', 
        welcome_career:'Willkommen! Deine Karriere beginnt jetzt! ⚽',
        rename_career_prompt:'Neuer Karrierename:',
        delete_career_confirm:'Karriere "{0}" löschen?\nDiese Aktion kann nicht rückgängig gemacht werden!',
        career_deleted:'Karriere gelöscht',
        no_activity:'Noch keine Aktivität',
        loading:'⏳ Laden...',
        no_seasons:'Noch keine Saisons gespielt.',
        loading_teams:'Teams laden...',
        loading_leagues:'Ligen laden...',
        loading_champions:'Champions Cup laden...',
        error_loading_teams:'Fehler beim Laden der Teams.',
        no_agent:'Kein Agent verfügbar.',
        agent_empty:'👤 Du hast noch keinen Agenten. Stelle einen ein, um Einnahmen zu maximieren!',
        agent_choose:'Deinen Agenten wählen',
        no_matches:'Noch keine Spiele in dieser Liga.',
        champions_not_started_full:'🏆 Der Champions Cup hat noch nicht begonnen. Teams qualifizieren sich im September (Top 4 jeder Ersten Division).',
        bracket_no_data_full:'Noch keine Bracket-Daten verfügbar.',
        bracket_tbd:'Noch zu bestimmen',
        skill_maxed:'Fähigkeit bereits maximiert!',
        end_career_banner:'🏁 KARRIERE BEENDET!', retirement_close:'🏠 Zurück zu den Karrieren',
        struttura_current:'Aktuelle Einrichtung',
        struttura_buy:'🏗️ Kaufen',
        struttura_locked:'🔒 Sequenziell',
        struttura_no_funds:'💸 Unzureichende Mittel',
        ts_ovr:'⚽ Team-OVR', ts_salary:'💰 Gehalt', ts_pop:'🏟️ Popularität',
        salary_base:'basis', salary_buono:'fair', salary_ottimo:'gut', salary_alto:'hoch', salary_top:'top',
        transfer_current_team:'✅ Aktuelles Team',
        ag_level:'Level', ag_salary_bonus:'Gehalt', ag_ovr_bonus:'OVR-Transfer',
        ag_monthly_est:'Geschätzter monatlicher Bonus', ag_ovr_note:'(basierend auf deinem aktuellen OVR)',
        ag_req_prev:'Benötigt Lv.', ag_req_pop:'Benötigt Pop.', ag_req_money:'Fehlend',
        ag_hire_btn:'🤝 Einstellen', ag_upgrade_btn:'⬆️ Upgrade', ag_pop_free:'Frei',
        ag_owned:'✅ Aktiv',
        obj_morale_prize:'Moral',
        strutture_bonus_training:'Training',
        strutture_bonus_growth:'Wachstum',
        strutture_bonus_injury:'Verletzungen',
        game_choose_actions:'🎮 Wähle deine Aktionen',
        game_choose_sub:'Wähle 1-3 monatliche Aktionen. Deine Wahl beeinflusst Werte, Energie und Leistung.',
        game_play_sub:'Wähle bis zu 3 Aktionen für diesen Monat, dann simuliere die Spiele',
        play_btn:'⚽ Mindestens 1 Aktion wählen', play_btn_ready:'⚽ Monat spielen',
        career_subtitle:'Geschichte deiner Saisons — klicke auf ein Jahr für Details',
        career_tab_seasons:'📅 Saisons', career_tab_log:'📋 Spielprotokoll',
        career_ongoing:'laufend', career_no_data:'Keine Daten',
        career_best_rating:'BESTE BEWERTUNG',
        career_year_label:'Jahr',
        month_1:'Jan',month_2:'Feb',month_3:'Mär',month_4:'Apr',month_5:'Mai',month_6:'Jun',
        month_7:'Jul',month_8:'Aug',month_9:'Sep',month_10:'Okt',month_11:'Nov',month_12:'Dez',
        month_full_1:'Januar',month_full_2:'Februar',month_full_3:'März',month_full_4:'April',
        month_full_5:'Mai',month_full_6:'Juni',month_full_7:'Juli',month_full_8:'August',
        month_full_9:'September',month_full_10:'Oktober',month_full_11:'November',month_full_12:'Dezember',
        foot_sx:'Links', foot_dx:'Rechts',
        transfer_ovr_req:'🎯 OVR benötigt', transfer_btn_go:'✈️ Transferieren', transfer_agent_bonus:'🤝 Agent aktiv: -{0}% OVR-Anforderung für Transfer',
        transfer_no_teams:'Keine Teams in dieser Liga.',
        career_no_data_season:'Keine Daten für diese Saison verfügbar.',
        career_best_gol_label:'Bestes Spiel (Tore)', career_best_assist_label:'Bestes Spiel (Vorlagen)',
        agent_active_badge:'✅ Agent aktiv',
        sim_running:'⏳ Simuliere...', 
        no_team:'Kein Team',
        guest_desc:'Möchtest du ohne Registrierung ausprobieren?',
        guest_btn:'👤 Gast-Modus',
        guest_banner:'👤 Du spielst als Gast — Fortschritt wird nicht gespeichert.',
        guest_save_prompt:'Erstelle ein kostenloses Konto, um deine Karriere zu speichern!',
        update_request_placeholder:'Beschreibe deine Ideen, Vorschläge oder Fehler...',
        color_hair_label:'Haarfarbe',
        color_eye_label:'Augenfarbe',
        agente_min_chars:'Text zu kurz.',
        conn_error:'Verbindungsfehler. Bitte erneut versuchen.',
        reg_err_username:'Ungültiger Benutzername.',
        tooltip_rename:'Karriere umbenennen',
        guest_register_btn:'💾 Registrieren & Speichern',
        attr_overall:'Gesamt', attr_tiro:'Schuss', attr_velocita:'Tempo',
        attr_dribbling:'Dribbling', attr_fisico:'Physis', attr_mentalita:'Mental',
    },
    es: {
        nav_dashboard:'🏠 Panel', nav_game:'⚽ Jugar', nav_career:'📊 Carrera',
        nav_transfer:'🔄 Transferencia', nav_strutture:'🏗️ Instalaciones',
        nav_classifica:'🏟️ Clasificación', nav_agente:'🤝 Agente',
        nav_notizie:'📰 Noticias', nav_skilltree:'🌟 Habilidades',
        settings_title:'Ajustes', settings_language:'🌐 Idioma',
        settings_navigate:'🗺️ Navegación', settings_main_menu:'Menú Principal',
        settings_main_menu_sub:'Cambiar carrera o crear una nueva',
        settings_feedback:'Solicitar una Actualización', settings_feedback_sub:'Enviar sugerencias a los desarrolladores',
        settings_account:'👤 Cuenta', settings_logout:'Cerrar Sesión Completo',
        settings_logout_sub:'Desconectar cuenta y volver al inicio de sesión',
        auth_login:'Iniciar sesión', auth_register:'Registrarse',
        auth_login_btn:'⚽ Iniciar sesión', auth_register_btn:'🌟 Crear Cuenta',
        auth_userauth_confirm_pw:'Confirmar Contraseña',
        auth_forgot_link:'¿Olvidaste tu contraseña?', auth_forgot_btn:'📧 Enviar Instrucciones',
        auth_back_login:'← Volver al Login', create_name_label:'Nombre de Carrera',
        create_player_label:'Nombre del Jugador', create_gender:'Género', create_age:'Edad',
        create_nationality:'Nacionalidad', create_foot:'🦶 Pie Preferido',
        create_skin:'🧑 Tono de Piel', create_eyes:'👁️ Color de Ojos',
        create_eyebrows:'👁️ Cejas', eyebrow_thin:'Finas', eyebrow_standard:'Estándar', eyebrow_thick:'Gruesas', eyebrow_arched:'Arqueadas', create_freckles:'✨ Pecas', freckles_off:'No', freckles_on:'Sí', create_kit:'👕 Camiseta', kit_blu:'Azul', kit_rosso:'Rojo', kit_verde:'Verde', kit_bianco:'Blanco', kit_nero:'Negro', kit_giallo:'Amarillo', kit_viola:'Morado', kit_arancio:'Naranja', create_facial:'🧔 Barba y Bigote', facial_none:'Afeitado', facial_stubble:'Barba corta', facial_goatee:'Perilla', facial_beard:'Barba', facial_mustache:'Bigote', btn_randomize:'🎲 Aleatorio', btn_reset_look:'↺ Restablecer',
        create_hairstyle:'✂️ Peinado', create_haircolor:'🎨 Color de Pelo',
        create_start_btn:'🌟 ¡Comenzar Carrera!',
        cc_step1:'Identidad', cc_step2:'Apariencia', cc_step3:'Estilo', cc_step4:'Confirmar',
        cc_step1_title:'¿Quién eres?', cc_step1_sub:'Tu nombre pasará a la historia del fútbol',
        cc_step2_title:'Tu apariencia', cc_step2_sub:'Personaliza tu jugador',
        cc_step3_title:'Tu estilo', cc_step3_sub:'¿Cómo juegas en el campo?',
        cc_step4_title:'¿Listo para la gloria?', cc_step4_sub:'Comprueba tus datos y empieza',
        cc_back:'← Atrás', cc_next:'Siguiente →',
        cc_role:'Rol / Especialización', cc_role_hint:'+5 a la stat principal al inicio de carrera',
        gender_male:'⚽ Masculino', gender_female:'⚽ Femenino',
        foot_right:'👟 Derecho', foot_left:'👟 Izquierdo',
        career_new:'➕ Nueva Carrera', career_select_title:'Tus Carreras', 
        dash_period:'Período', dash_money:'Presupuesto', dash_goals:'⚽ Goles de Temporada',
        dash_assists:'🎯 Asistencias de Temporada', dash_facility:'Instalación',
        dash_tech_stats:'📊 Stats Técnicas', dash_phys_cond:'🔋 Condición Física',
        stat_tiro:'Disparo', stat_velocita:'Velocidad', stat_dribbling:'Regate',
        stat_fisico:'Físico', stat_mentalita:'Mental',
        stat_piede_forte:'🦶 Pie Fuerte', stat_piede_debole:'🦶 Pie Débil',
        stat_skill_lvl:'🎯 Nivel de Habilidad',
        stat_energia:'Energía', stat_morale:'Moral', stat_popolarita:'Popularidad',
        dash_season:'Temporada', dash_season_full:'Temporada', dash_age:'Edad',
        dash_latest_news:'📰 Últimas Noticias',
        dash_activities:'📋 Actividad Reciente',
        dash_no_news:'¡Juega el primer mes para recibir noticias!',
        page_game:'⚽ Jugar el Mes', page_career:'📊 Carrera',
        page_transfer:'🔄 Transferencia', page_strutture:'🏗️ Instalaciones Personales',
        page_agente:'🤝 Agente Personal', page_notizie:'📰 Noticias',
        page_skilltree:'🌟 Árbol de Habilidades',
        page_classifica:'🏟️ Clasificación',
        classifica_subtitle:'Clasificación en tiempo real de cada liga y la Copa de Campeones',
        transfer_subtitle:'Elige tu próximo equipo. ¡Mejores equipos = más dinero y visibilidad!',
        strutture_subtitle:'Invierte tu dinero para mejorar tu instalación de entrenamiento.',
        agente_subtitle:'Un buen agente negocia mejores salarios y trae ofertas de los mejores clubes',
        notizie_subtitle:'Las últimas actualizaciones de tu carrera',
        skilltree_subtitle:'Alcanza hitos de estadísticas para desbloquear mejoras únicas',
        nav_achievements:'🏅 Logros', nav_extra:'⋯ Más',
        view_card:'Tarjeta',
        page_achievements:'🏅 Logros',
        achievements_subtitle:'Completa desafíos para desbloquear insignias exclusivas',
        achievements_unlocked:'desbloqueados',
        ach_category_milestones:'🌟 Hitos',
        ach_category_scoring:'⚽ Goles y Asistencias',
        ach_category_growth:'📈 Crecimiento',
        ach_category_trophies:'🏆 Trofeos',
        ach_category_career:'💼 Carrera',
        ach_category_skills:'✨ Habilidades',
        ach_category_facilities:'🏗️ Instalaciones',
        ach_category_secrets:'🔒 Secretos',
        dash_current_status:'📈 Estado Actual',
        results_title:'📊 Resultados del Mes',
        results_close:'✅ Continuar',
        skill_pts_zero:'0 puntos de habilidad disponibles',
        st_strong_foot:'🦶 PIE FUERTE', st_weak_foot:'🦶 PIE DÉBIL', st_skill_lvl:'🎯 NIVEL DE HABILIDAD',
        st_strong_hint:'Mejorar con: Disparo Potente, Vaselina, Rabona',
        st_weak_hint:'Mejorar con: Frialdad, Instinto Goleador',
        st_skill_hint:'Aumenta desbloqueando más habilidades en el árbol',
        register_username_hint:'Solo letras, números y _ (3-30 caracteres)',
        register_pw_label:'Contraseña (mín. 6 caracteres)',
        forgot_desc:'Introduce tu email y te enviaremos instrucciones para restablecer la contraseña.',
        careers_limit:'Has alcanzado el límite de 5 carreras.',
        update_request_desc:'Escribe tus ideas, sugerencias o reportes de errores.',
        update_send_btn:'📨 Enviar', update_sent_ok:'✅ ¡Solicitud enviada! Gracias por tu sugerencia.',
        btn_cancel:'Cancelar',
        menu_change_career:'Cambiar Carrera',
        menu_change_career_sub:'Volver a la selección de carreras',
        menu_settings:'Ajustes',
        menu_settings_sub:'Idioma, cuenta, tutorial',
        menu_logout:'Cerrar Sesión',
        menu_logout_sub:'Desconectar cuenta',
        reg_err_email:'Introduce un email válido',
        reg_err_password:'Las contraseñas no coinciden',
        verify_title:'Verificar Email',
        verify_mail_fail:'⚠️ No se pudo enviar el correo de verificación. Inténtalo más tarde o contacta con el administrador.', verify_code_sent:'📧 Nuevo código enviado', verify_subtitle:'Enviamos un código de 6 dígitos a',
        verify_btn:'✅ Verificar',
        verify_resend:'Reenviar código',
        verify_resend_wait:'Reenviar en',
        verify_err_code:'Introduce el código de 6 dígitos',
        verify_success:'¡Cuenta verificada! ¡Bienvenido!', 
        tab_lega:'📋 Liga', tab_champions:'🏆 Copa de Campeones', tab_calendario:'📅 Calendario', tab_capocannonieri:'👟 Goleadores',
        select_league:'Seleccionar una liga',
        stat_gol:'goles', stat_assist:'asistencias', stat_voto:'valoración',
        stat_partite:'partidos', stat_trofei:'trofeos', stat_palloni:'Balón de Oro',
        match_win:'VICTORIA', match_draw:'EMPATE', match_loss:'DERROTA',
        match_home:'🏠 Local', match_away:'✈️ Visitante',
        league_div1:'Primera División', league_div2:'Segunda División',
        career_trophies_title:'🏅 Trofeos y Honores',
        pallone_top:'Balón de Oro Top',
        career_best_rating_label:'Mejor Valoración',
        classifica_legend_champion:'🥇 Campeón',
        classifica_legend_top3:'🥉 Podio',
        classifica_legend_top4:'⭐ Copa de Campeones',
        classifica_legend_retro:'📉 Zona de descenso',
        injury_blocked:'¡Estás lesionado, no puedes entrenar físicamente!',
        energy_blocked:'¡Energía a cero! Descansa antes de entrenar.',
        actions_max:'¡Puedes elegir un máximo de 3 acciones!', 
        obj_gol_stagione:'Marca {0} goles esta temporada',
        obj_assist_stagione:'Da {0} asistencias esta temporada',
        obj_media_voto:'Mantén una valoración media ≥ 7.0',
        obj_overall:'Alcanza Overall {0}',
        obj_popolarita:'Alcanza {0} de popularidad',
        obj_complete:'Completado',
        obj_header:'🎯 Objetivos de Temporada',
        obj_completed:'completados',
        obj_title:'🎯 Objetivos de Temporada',
        register_pw_placeholder:'Elige una contraseña (mín. 6 caracteres)',
        register_pw2_placeholder:'Repite la contraseña',
        default_career_name:'Mi Carrera',
        cc_nation_search:'🔍 Buscar nación...',
        auth_username:'Usuario',
        auth_confirm_pw:'Confirmar Contraseña',
        cc_role_bomber:'⚽ Delantero', cc_role_bomber_sub:'+5 Disparo',
        cc_role_fantasista:'✨ Mediapunta', cc_role_fantasista_sub:'+5 Regate',
        cc_role_ala:'⚡ Extremo', cc_role_ala_sub:'+5 Velocidad',
        cc_role_regista:'🧠 Centrocampista', cc_role_regista_sub:'+5 Mental',
        cc_role_tuttocampista:'💪 Todocampista', cc_role_tuttocampista_sub:'+5 Físico',
        tooltip_delete:'Eliminar', 
        default_career_injury_banner:'🩹 Estás lesionado — <strong>{0} {1}</strong>. Solo puedes descansar, entrenar mentalmente o hacer actividades sociales.',
        injury_mese:'mes restante', injury_mesi:'meses restantes',
        energy_zero_banner:'⚡ Energía agotada — no puedes entrenar físicamente. ¡Descansa primero!',
        energy_low_banner:'⚠️ Energía baja ({0}) — ¡alto riesgo de lesión en entrenamientos físicos!',
        res_section_training:'🏋️ Entrenamiento',
        res_section_injuries:'🚑 Lesiones',
        res_section_champions:'🏆 Copa de Campeones',
        res_section_matches:'⚽ Partidos del mes', res_section_livefeed:'📡 Otros resultados de la jornada',
        res_section_other:'📋 Otros',
        champions_badge:'🌟 Copa de Campeones',
        pallone_badge:'🥇 Balón de Oro',
        transfer_toast:'✈️ ¡Transferido a {0}!',
        transfer_confirm:'¿Transferirse a {0}?',
        api_error_label:'Error: ',
        api_resp_invalid:'Respuesta no válida',
        error_generic_msg:'Error. Por favor, inténtalo de nuevo.',
        error_unknown:'Error desconocido',
        conn_error_short:'Error de conexión',
        server_resp_invalid:'Respuesta del servidor no válida',  
        prereq_unlock:'¡Desbloquea primero el prerequisito!',
        no_career:'Aún no hay carreras.\n¡Crea una para empezar!', 
        welcome_career:'¡Bienvenido! ¡Tu carrera comienza ahora! ⚽',
        rename_career_prompt:'Nuevo nombre de carrera:',
        delete_career_confirm:'¿Eliminar carrera "{0}"?\n¡Esta acción no se puede deshacer!',
        career_deleted:'Carrera eliminada',
        no_activity:'Sin actividad aún',
        loading:'⏳ Cargando...',
        no_seasons:'Aún no se han jugado temporadas.',
        loading_teams:'Cargando equipos...',
        loading_leagues:'Cargando ligas...',
        loading_champions:'Cargando Copa de Campeones...',
        error_loading_teams:'Error al cargar equipos.',
        no_agent:'No hay agente disponible.',
        agent_empty:'👤 Aún no tienes agente. ¡Contrata uno para maximizar ganancias!',
        agent_choose:'Elige tu agente',
        no_matches:'Aún no se han jugado partidos en esta liga.',
        champions_not_started_full:'🏆 La Copa de Campeones aún no ha comenzado. Los equipos se clasifican en septiembre (top 4 de cada Primera División).',
        bracket_no_data_full:'Aún no hay datos del cuadro disponibles.',
        bracket_tbd:'Por determinar',
        skill_maxed:'¡Habilidad ya al máximo!',
        end_career_banner:'🏁 ¡FIN DE CARRERA!', retirement_close:'🏠 Volver a las carreras',
        struttura_current:'Instalación Actual',
        struttura_buy:'🏗️ Comprar',
        struttura_locked:'🔒 Secuencial',
        struttura_no_funds:'💸 Fondos insuficientes',
        ts_ovr:'⚽ OVR Equipo', ts_salary:'💰 Salario', ts_pop:'🏟️ Popularidad',
        salary_base:'base', salary_buono:'justo', salary_ottimo:'bueno', salary_alto:'alto', salary_top:'top',
        transfer_current_team:'✅ Equipo Actual',
        ag_level:'Nivel', ag_salary_bonus:'salario', ag_ovr_bonus:'OVR transferencia',
        ag_monthly_est:'Bonus mensual estimado', ag_ovr_note:'(basado en tu OVR actual)',
        ag_req_prev:'Requiere Nv.', ag_req_pop:'Necesita pop.', ag_req_money:'Faltan',
        ag_hire_btn:'🤝 Contratar', ag_upgrade_btn:'⬆️ Mejorar', ag_pop_free:'Libre',
        ag_owned:'✅ Activo',
        obj_morale_prize:'moral',
        strutture_bonus_training:'Entrenamiento',
        strutture_bonus_growth:'Crecimiento',
        strutture_bonus_injury:'Lesiones',
        game_choose_actions:'🎮 Elige tus Acciones',
        game_choose_sub:'Selecciona 1-3 acciones mensuales. Tus elecciones afectan stats, energía y rendimiento.',
        game_play_sub:'Elige hasta 3 acciones para este mes, luego simula los partidos',
        play_btn:'⚽ Selecciona al menos 1 acción', play_btn_ready:'⚽ Jugar Mes',
        career_subtitle:'Historial de tus temporadas — haz clic en un año para detalles',
        career_tab_seasons:'📅 Temporadas', career_tab_log:'📋 Registro de Partidos',
        career_ongoing:'en curso', career_no_data:'Sin datos',
        career_best_rating:'MEJOR VALORACIÓN',
        career_year_label:'Año',
        month_1:'Ene',month_2:'Feb',month_3:'Mar',month_4:'Abr',month_5:'May',month_6:'Jun',
        month_7:'Jul',month_8:'Ago',month_9:'Sep',month_10:'Oct',month_11:'Nov',month_12:'Dic',
        month_full_1:'Enero',month_full_2:'Febrero',month_full_3:'Marzo',month_full_4:'Abril',
        month_full_5:'Mayo',month_full_6:'Junio',month_full_7:'Julio',month_full_8:'Agosto',
        month_full_9:'Septiembre',month_full_10:'Octubre',month_full_11:'Noviembre',month_full_12:'Diciembre',
        foot_sx:'Izquierdo', foot_dx:'Derecho',
        transfer_ovr_req:'🎯 OVR requerido', transfer_btn_go:'✈️ Transferirse', transfer_agent_bonus:'🤝 Agente activo: -{0}% OVR requerido para transferencia',
        transfer_no_teams:'No hay equipos en esta liga.',
        career_no_data_season:'No hay datos disponibles para esta temporada.',
        career_best_gol_label:'Mejor partido (Goles)', career_best_assist_label:'Mejor partido (Asistencias)',
        agent_active_badge:'✅ Agente activo',
        sim_running:'⏳ Simulando...', 
        no_team:'Sin equipo',
        guest_desc:'¿Quieres probar sin registrarte?',
        guest_btn:'👤 Modo Invitado',
        guest_banner:'👤 Jugando como Invitado — el progreso no se guardará.',
        guest_save_prompt:'¡Crea una cuenta gratuita para guardar tu carrera!',
        update_request_placeholder:'Describe tus ideas, sugerencias o errores...',
        color_hair_label:'Color de Pelo',
        color_eye_label:'Color de Ojos',
        agente_min_chars:'Texto demasiado corto.',
        conn_error:'Error de conexión. Por favor, inténtalo de nuevo.',
        reg_err_username:'Nombre de usuario no válido.',
        tooltip_rename:'Renombrar carrera',
        guest_register_btn:'💾 Registrarse y Guardar',
        attr_overall:'Total', attr_tiro:'Tiro', attr_velocita:'Velocidad',
        attr_dribbling:'Regate', attr_fisico:'Físico', attr_mentalita:'Mental',
    }
}
let currentLang = localStorage.getItem('gs_lang') || 'it';
let _cachedCareers = null; // cache for re-rendering career list on lang change

function _t(key) {
    return TRANSLATIONS[currentLang]?.[key] ?? TRANSLATIONS['it']?.[key] ?? key;
}

// ── NEWS: no client-side translation needed ──────────────────────────────────
// The backend (extra.php) returns news already in the correct language.
// News are stored bilingually in the DB and served in the right language via X-Lang header.
let _rawNewsData = null;
async function _translateNewsItems(newsArray /*, targetLang */) {
    return newsArray; // passthrough — translation handled server-side
}

// ── First-launch language picker ────────────────────────────────────────────
// Mostrato una sola volta, al primissimo avvio, prima di tutto il resto.
// La scelta viene ricordata in localStorage (gs_lang_chosen) e non riappare più.
function maybeShowLangOnboard() {
    if (localStorage.getItem('gs_lang_chosen') === '1') return false;
    const modal = document.getElementById('lang-onboard-modal');
    if (!modal) return false;
    // Evidenzia la lingua attualmente attiva
    modal.querySelectorAll('.lang-onboard-opt').forEach(btn => {
        const l = (btn.getAttribute('onclick') || '').match(/'(\w\w)'/)?.[1];
        btn.classList.toggle('lang-onboard-active', l === currentLang);
    });
    modal.style.display = 'flex';
    void modal.offsetHeight;
    requestAnimationFrame(() => modal.classList.add('modal-fade-in'));
    return true;
}

function chooseOnboardLang(lang) {
    localStorage.setItem('gs_lang_chosen', '1');
    setLanguage(lang);
    const modal = document.getElementById('lang-onboard-modal');
    if (modal) {
        modal.classList.remove('modal-fade-in');
        setTimeout(() => { modal.style.display = 'none'; }, 200);
    }
}

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('gs_lang', lang);
    // Update lang buttons in settings modal
    ['it','en','de','es'].forEach(l => document.getElementById('lang-btn-'+l)?.classList.toggle('active', lang === l));
    // Update header flag switcher - show flag + code for clarity
    const flagEl = document.getElementById('lang-switcher-flag');
    const flagMap  = { it:'🇮🇹', en:'🇬🇧', de:'🇩🇪', es:'🇪🇸' };
    const codeMap  = { it:'IT',   en:'EN',   de:'DE',   es:'ES'   };
    if (flagEl) {
        flagEl.innerHTML = `${flagMap[lang] || '🇮🇹'} <span style="font-size:0.7rem;font-weight:700;letter-spacing:0.5px;">${codeMap[lang] || 'IT'}</span>`;
    }
    ['it','en','de','es'].forEach(l => document.getElementById('lang-sw-'+l)?.classList.toggle('active', lang === l));
    // Update html lang attribute for accessibility
    document.getElementById('html-root')?.setAttribute('lang', lang);
    // Apply all data-i18n elements
    _applyTranslations();
    // Update nav buttons
    _updateNavLabels();
    attachTooltips();
    // Re-render current page text
    if (currentPlayer) {
        _buildActionsGrid();  // Rebuild with updated language
        renderGame();
        renderDashboard(); // also reloads dashboard news in new language
        // Se la pagina notizie è visibile, ricarica con la nuova lingua
        const notizieEl = document.getElementById('notizie-page');
        if (notizieEl && notizieEl.classList.contains('active')) {
            loadNotizie();
        }
        // Ricarica achievements se visibile
        const achEl = document.getElementById('achievements-page');
        if (achEl && achEl.classList.contains('active')) {
            loadAchievements();
        }
        // Ricarica le altre pagine con testo dinamico se visibili
        const activePageEl = document.querySelector('.page.active');
        const activePage = activePageEl?.id?.replace('-page', '');
        if (activePage === 'career')    loadCareer();
        if (activePage === 'strutture') loadStrutture();
        if (activePage === 'agente')    loadAgente();
        if (activePage === 'skilltree') loadSkillTree();
        if (activePage === 'transfer')  loadTransfer();
        if (activePage === 'classifica') loadClassifica();
        // Also re-render heatmap if calendar tab is active inside career page
        if (activePage === 'career') {
            loadCalendarioTab();
            // Reload analytics chart labels and career log headers
            loadCareerAnalytics();
            if (document.getElementById('career-log-tab')?.classList.contains('active')) loadCareerLog();
        }
    } else {
        // No career selected — re-render career list if visible (language change on select screen)
        if (_cachedCareers !== null) {
            renderCareerList(_cachedCareers);
        }
    }
    // Update tutorial language if active
    if (window.GS_Tutorial?.updateLang) GS_Tutorial.updateLang();
}

// Reload dashboard news from server in current language
function _applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const txt = _t(key);
        if (txt) el.textContent = txt;
    });
    // Handle placeholder translations
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        const txt = _t(key);
        if (txt) el.placeholder = txt;
    });
    // Handle title/aria-label translations
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        const txt = _t(key);
        if (txt) el.title = txt;
    });
    // Placeholders dinamici
    const aiPlaceholder = document.getElementById('ai-avatar-placeholder');
    if (aiPlaceholder) {
        const aiHints = {
            it: 'es: capelli ricci neri, occhi verdi, carnagione scura',
            en: 'e.g. curly black hair, green eyes, dark complexion',
            de: 'z.B. lockiges schwarzes Haar, grüne Augen, dunkle Haut',
            es: 'ej: pelo rizado negro, ojos verdes, tez oscura',
        };
        aiPlaceholder.placeholder = aiHints[currentLang] || aiHints.it;
    }
    const nationSearch = document.getElementById('cc-nation-search-input');
    if (nationSearch) {
        nationSearch.placeholder = _t('cc_nation_search');
    }
    // Ricostruisci lista nazioni con nuovo ordinamento linguistico
    if (document.getElementById('cc-nation-list')) {
        ccBuildNationList(nationSearch?.value || '');
        // Aggiorna il testo del trigger con la lingua corrente
        const curKey = document.getElementById('c-nationality')?.value || 'Italy';
        const curNat = CC_ALL_NATIONS.find(n => n.key === curKey);
        if (curNat) {
            const tName = document.getElementById('cc-trigger-name');
            if (tName) tName.textContent = ({en:curNat.key.replace(/_/g,' '),it:curNat.key_it,de:curNat.key_de||curNat.key_it,es:curNat.key_es||curNat.key_it})[currentLang]||curNat.key_it;
        }
    }
    const feedbackArea = document.getElementById('update-request-text');
    if (feedbackArea) {
        feedbackArea.placeholder = _t('update_request_placeholder');
    }
    const pwField = document.getElementById('r-password');
    if (pwField) pwField.placeholder = _t('register_pw_placeholder');
    const pw2Field = document.getElementById('r-password2');
    if (pw2Field) pw2Field.placeholder = _t('register_pw2_placeholder');
}

function _updateNavLabels() {
    const map = {
        dashboard: _t('nav_dashboard'), game: _t('nav_game'), career: _t('nav_career'),
        transfer: _t('nav_transfer'), strutture: _t('nav_strutture'),
        classifica: _t('nav_classifica'), agente: _t('nav_agente'),
        notizie: _t('nav_notizie'), skilltree: _t('nav_skilltree'), achievements: _t('nav_achievements'),
    };
    document.querySelectorAll('#main-nav button[data-page]').forEach(btn => {
        const page = btn.dataset.page;
        if (map[page]) btn.textContent = map[page];
    });
}

// Settings modal
function openSettings() {
    const modal = document.getElementById('settings-modal');
    if (!modal) return;
    // Sync lang buttons
    ['it','en','de','es'].forEach(l => document.getElementById('lang-btn-'+l)?.classList.toggle('active', currentLang === l));
    // Show/hide home button based on page
    const inGame = !!currentCareerId;
    const homeBtn = document.getElementById('settings-btn-home');
    if (homeBtn) homeBtn.style.display = inGame ? 'flex' : 'none';
    _applyTranslations();
    modal.classList.add('active');
}
function closeSettings() {
    document.getElementById('settings-modal')?.classList.remove('active');
}

// ── SVG CAPELLI ──
