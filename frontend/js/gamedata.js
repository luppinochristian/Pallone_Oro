/**
 * Golden Striker — Extended Game Data
 * Additional news templates, events, fun facts, and game flavor text
 * This file enriches the game experience with more variety
 */

const GS_GameData = (() => {

    // ── Extended injury messages ──────────────────────────────────────────────
    const INJURY_DESCRIPTIONS = {
        it: [
            'stiramento muscolare alla coscia',
            'distorsione alla caviglia',
            'contrattura al polpaccio',
            'infiammazione al ginocchio',
            'lesione ai legamenti',
            'trauma cranico lieve',
            'frattura di un dito',
            'elongazione muscolare',
            'tendinite al tendine d\'Achille',
            'botta alla schiena',
        ],
        en: [
            'thigh muscle strain',
            'ankle sprain',
            'calf contraction',
            'knee inflammation',
            'ligament injury',
            'mild concussion',
            'broken finger',
            'muscle elongation',
            'Achilles tendon tendinitis',
            'back knock',
        ],
    };

    // ── Fun facts shown during loading ────────────────────────────────────────
    const FUN_FACTS = {
        it: [
            '💡 Pellegrino era il nome originale di Cristiano Ronaldo.',
            '💡 Messi ha vinto 8 Palloni d\'Oro, il record assoluto.',
            '💡 Ronaldo ha segnato in tutte le 40 nazioni europee in cui ha giocato.',
            '💡 Il calcio è lo sport più seguito al mondo con 4 miliardi di appassionati.',
            '💡 La durata ufficiale di un pallone FIFA è di 3.600 calci.',
            '💡 Maradona aveva il piede sinistro dominante, ma segnava anche col destro.',
            '💡 Il primo Mondiale di calcio si tenne in Uruguay nel 1930.',
            '💡 Pele è l\'unico calciatore ad aver vinto 3 Mondiali.',
            '💡 La velocità media di un tiro in porta è di 112 km/h.',
            '💡 In una stagione tipo un centrocampista percorre circa 12 km a partita.',
            '💡 Mbappé è il secondo marcatore più giovane in un Mondiale dopo Pelé.',
            '💡 Il portiere deve parare mediamente 2.5 tiri in porta per partita.',
            '💡 Il pallone di cuoio fu usato ufficialmente fino agli anni \'70.',
            '💡 Buffon ha giocato 17 anni in Serie A senza mai subire un rosso.',
            '💡 Ronaldinho è stato eletto miglior giocatore al mondo due anni consecutivi.',
            '💡 Il calcio di punizione diretto fu introdotto nel 1924.',
            '💡 I tacchetti a scarpette furono brevettati da Adidas nel 1954.',
            '💡 Haaland al primo anno in Premier ha segnato 52 gol.',
            '💡 L\'Islanda è la nazione più piccola ad aver partecipato ad un Mondiale.',
            '💡 Il derby di Manchester è la partita più vista al mondo.',
        ],
        en: [
            '💡 Cristiano Ronaldo\'s original nickname was "Cris" not "CR7".',
            '💡 Messi has won 8 Ballon d\'Ors, the all-time record.',
            '💡 Ronaldo has scored in every one of the 40 European countries he\'s played in.',
            '💡 Football is the world\'s most popular sport with 4 billion fans.',
            '💡 The official lifespan of a FIFA ball is 3,600 kicks.',
            '💡 Maradona was left-foot dominant but also scored with his right.',
            '💡 The first World Cup was held in Uruguay in 1930.',
            '💡 Pelé is the only player to win 3 World Cups.',
            '💡 The average speed of a shot on goal is 112 km/h.',
            '💡 A typical midfielder covers around 12 km per match.',
            '💡 Mbappé is the second youngest scorer at a World Cup after Pelé.',
            '💡 Goalkeepers face an average of 2.5 shots on target per game.',
            '💡 Leather balls were officially used until the 1970s.',
            '💡 Buffon played 17 seasons in Serie A without a single red card.',
            '💡 Ronaldinho was voted world\'s best player two consecutive years.',
            '💡 The direct free kick was introduced in 1924.',
            '💡 Adidas patented football studs in 1954.',
            '💡 Haaland scored 52 goals in his first Premier League season.',
            '💡 Iceland is the smallest nation to have participated in a World Cup.',
            '💡 The Manchester derby is the most watched football match in the world.',
        ],
    };

    // ── Motivational quotes ───────────────────────────────────────────────────
    const QUOTES = {
        it: [
            '"La vittoria più difficile è vincere se stessi." — Johan Cruyff',
            '"Non è la caduta che conta, ma il rialzarsi." — Vince Lombardi',
            '"Il calcio è semplice, ma giocare bene a calcio è la cosa più difficile al mondo." — Johan Cruyff',
            '"Ogni mattina in Africa una gazzella si sveglia. Sa che deve correre più veloce del leone o verrà uccisa." — Anon',
            '"La differenza tra un campione e uno sfidante è come rispondono alla pressione." — Anon',
            '"Non ho paura dei fallimenti. Ho paura di non provare." — Michael Jordan',
            '"Il talento vince partite, ma il lavoro di squadra e l\'intelligenza vincono campionati." — Michael Jordan',
            '"Puoi fare di più di quanto pensi." — Roger Bannister',
            '"Ogni gol nasce prima nella mente." — Anon',
            '"Il calcio è un gioco di semplicità. Complica le cose semplici e sei nei guai." — Glenn Hoddle',
        ],
        en: [
            '"The hardest victory is to win against yourself." — Johan Cruyff',
            '"It\'s not the fall that matters, it\'s the getting back up." — Vince Lombardi',
            '"Football is simple, but playing good football is the most difficult thing in the world." — Johan Cruyff',
            '"Every morning in Africa a gazelle wakes up. It knows it must run faster than the lion or it will be killed." — Anon',
            '"The difference between a champion and a challenger is how they respond to pressure." — Anon',
            '"I\'m not afraid of failure. I\'m afraid of not trying." — Michael Jordan',
            '"Talent wins games, but teamwork and intelligence wins championships." — Michael Jordan',
            '"You can do more than you think." — Roger Bannister',
            '"Every goal is born first in the mind." — Anon',
            '"Football is a simple game. Make things complicated and you\'re in trouble." — Glenn Hoddle',
        ],
    };

    // ── Injury recovery messages ──────────────────────────────────────────────
    const RECOVERY_MSGS = {
        it: [
            '✅ Sei tornato in piena forma! Il riposo ha fatto bene.',
            '✅ Recupero completato! Pronti a riprendere a segnare.',
            '✅ Il medico ti ha dato il via libera. Bentornato in campo!',
            '✅ Infortunio superato! La squadra ti aspettava.',
            '✅ Sei di nuovo al 100%. Adesso sfogati in campo!',
        ],
        en: [
            '✅ Back to full fitness! The rest did you good.',
            '✅ Recovery complete! Ready to start scoring again.',
            '✅ The doctor has cleared you. Welcome back to the pitch!',
            '✅ Injury overcome! The team was waiting for you.',
            '✅ You\'re 100% again. Now go express yourself on the pitch!',
        ],
    };

    // ── Pre-match hype messages shown in game page ────────────────────────────
    const PREMATCH_HYPE = {
        it: [
            '🎙️ Il fischio d\'inizio si avvicina. Sei pronto?',
            '🏟️ Lo stadio è tutto esaurito. I tifosi ti aspettano!',
            '⚡ Massima concentrazione. È il tuo momento.',
            '🔥 Questa è la tua partita. Dimostralo.',
            '💪 Non basta allenarsi. Bisogna vincere.',
            '🌟 I campioni si riconoscono nei momenti difficili.',
            '🎯 Un gol alla volta. Un mese alla volta.',
        ],
        en: [
            '🎙️ Kickoff approaches. Are you ready?',
            '🏟️ The stadium is sold out. The fans are waiting!',
            '⚡ Maximum focus. This is your moment.',
            '🔥 This is your match. Prove it.',
            '💪 Training isn\'t enough. You have to win.',
            '🌟 Champions are recognized in difficult moments.',
            '🎯 One goal at a time. One month at a time.',
        ],
    };

    // ── Season summary templates ──────────────────────────────────────────────
    const SEASON_SUMMARIES = {
        it: [
            '{nome} chiude un\'altra stagione memorabile. I numeri parlano per lui.',
            'Stagione straordinaria per {nome}: ha dominato il campionato.',
            'Una stagione di crescita per {nome}. Il meglio deve ancora venire.',
            '{nome} ha mostrato al mondo di cosa è capace. Ora punta al vertice.',
            'Non la stagione migliore per {nome}, ma il carattere non manca mai.',
            '{nome} è pronto per la prossima avventura. La carriera è appena iniziata.',
        ],
        en: [
            '{nome} closes another memorable season. The numbers speak for themselves.',
            'An extraordinary season for {nome}: they dominated the league.',
            'A growth season for {nome}. The best is yet to come.',
            '{nome} has shown the world what they\'re capable of. Now aiming for the top.',
            'Not {nome}\'s best season, but the character never wavers.',
            '{nome} is ready for the next adventure. The career has only just begun.',
        ],
    };

    // ── Transfer market quotes ────────────────────────────────────────────────
    const TRANSFER_GOSSIP = {
        it: [
            '📰 Voci di mercato: {nome} potrebbe essere il prossimo grande colpo.',
            '🔍 Gli scout di mezza Europa seguono {nome} da settimane.',
            '📱 I social media impazziscono per {nome}: tifosi pazzi del nuovo acquisto.',
            '💼 Il procuratore di {nome} ha incontrato diversi club nelle ultime ore.',
            '🚁 Un jet privato è atterrato stamattina. Destinazione? Forse la firma di {nome}.',
        ],
        en: [
            '📰 Transfer rumors: {nome} could be the next big signing.',
            '🔍 Scouts from across Europe have been following {nome} for weeks.',
            '📱 Social media goes wild for {nome}: fans excited about the new signing.',
            '💼 {nome}\'s agent has met several clubs in recent hours.',
            '🚁 A private jet landed this morning. Destination? Perhaps {nome}\'s signing.',
        ],
    };

    // ── Celebration style descriptions (used in goal commentary) ─────────────
    const CELEBRATION_STYLES = [
        'corre verso la curva con le braccia aperte',
        'si toglie la maglia e la agita in aria',
        'punta il dito verso il cielo',
        'si inginocchia e urla verso il pubblico',
        'fa una capriola perfetta davanti alla tribuna',
        'bacia lo stemma della squadra sulla maglia',
        'mimics taking off in a plane/airplane run',
        'imita la marcatura di un tiro',
        'si siede sul terreno di gioco meditando',
        'abbraccia tutto il settore ospiti',
        'corre fino alla bandierina del corner',
        'posa come una statua con le braccia tese',
    ];

    // ── Weather / pitch conditions ────────────────────────────────────────────
    const PITCH_CONDITIONS = {
        it: ['terreno perfetto', 'pioggia battente', 'vento forte', 'caldo torrido', 'nebbia fitta', 'neve leggera', 'terreno scivoloso', 'campo in ottime condizioni'],
        en: ['perfect pitch', 'heavy rain', 'strong wind', 'scorching heat', 'thick fog', 'light snow', 'slippery surface', 'pitch in great condition'],
    };

    // ── Utility functions ─────────────────────────────────────────────────────
    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    function format(str, vars) {
        return str.replace(/\{(\w+)\}/g, (_, k) => vars[k] || `{${k}}`);
    }

    function getRandomFunFact(lang = 'it') {
        return pick(FUN_FACTS[lang] || FUN_FACTS.it);
    }

    function getRandomQuote(lang = 'it') {
        return pick(QUOTES[lang] || QUOTES.it);
    }

    function getPreMatchHype(lang = 'it') {
        return pick(PREMATCH_HYPE[lang] || PREMATCH_HYPE.it);
    }

    function getSeasonSummary(nome, lang = 'it') {
        return format(pick(SEASON_SUMMARIES[lang] || SEASON_SUMMARIES.it), { nome });
    }

    function getTransferGossip(nome, lang = 'it') {
        return format(pick(TRANSFER_GOSSIP[lang] || TRANSFER_GOSSIP.it), { nome });
    }

    function getRecoveryMsg(lang = 'it') {
        return pick(RECOVERY_MSGS[lang] || RECOVERY_MSGS.it);
    }

    function getInjuryDesc(lang = 'it') {
        return pick(INJURY_DESCRIPTIONS[lang] || INJURY_DESCRIPTIONS.it);
    }

    function getCelebrationStyle() {
        return pick(CELEBRATION_STYLES);
    }

    function getPitchCondition(lang = 'it') {
        return pick(PITCH_CONDITIONS[lang] || PITCH_CONDITIONS.it);
    }

    // ── Show fun fact in loading screens ─────────────────────────────────────
    function injectFunFactToLoading() {
        const loadingEls = document.querySelectorAll('.loading');
        loadingEls.forEach(el => {
            if (el.dataset.funFactSet) return;
            el.dataset.funFactSet = '1';
            const lang = localStorage.getItem('gs_lang') || 'it';
            const fact = getRandomFunFact(lang);
            const factEl = document.createElement('div');
            factEl.style.cssText = `
                font-size: 0.75rem; color: #64748b; margin-top: 8px;
                font-style: italic; max-width: 320px; line-height: 1.4;
            `;
            factEl.textContent = fact;
            el.parentElement?.insertBefore(factEl, el.nextSibling);
        });
    }

    // Observe DOM for loading elements
    const observer = new MutationObserver(() => injectFunFactToLoading());
    observer.observe(document.body, { childList: true, subtree: true });

    // ── Pre-match hype injection into game page ────────────────────────────
    function showPreMatchHype() {
        const gameHeader = document.getElementById('game-page-inner');
        if (!gameHeader) return;
        const existing = document.getElementById('gs-prematch-hype');
        if (existing) existing.remove();

        const hype = document.createElement('div');
        hype.id = 'gs-prematch-hype';
        const lang = localStorage.getItem('gs_lang') || 'it';
        hype.style.cssText = `
            text-align: center; color: rgba(255,215,0,0.7);
            font-size: 0.85rem; font-style: italic;
            margin-bottom: 8px; font-weight: 600;
            animation: fadeIn 0.5s ease;
        `;
        hype.textContent = getPreMatchHype(lang);
        gameHeader.querySelector('div[style*="position:relative"]')?.prepend(hype);
    }

    // ── Match celebration description ─────────────────────────────────────────
    function buildGoalDescription(playerName, gol, lang = 'it') {
        if (gol <= 0) return '';
        const style = getCelebrationStyle();
        const condition = getPitchCondition(lang);
        if (lang === 'en') {
            return `${playerName} scores ${gol > 1 ? gol + ' goals' : 'a goal'} and ${style}. Pitch: ${condition}.`;
        }
        return `${playerName} segna ${gol > 1 ? gol + ' gol' : 'un gol'} e ${style}. Condizioni: ${condition}.`;
    }

    // ── Merge extended data into main pools ──────────────────────────────────────
    // Merge extended fun facts
    FUN_FACTS.it = [...FUN_FACTS.it, ...(EXTENDED_FUN_FACTS.it || [])];
    FUN_FACTS.en = [...FUN_FACTS.en, ...(EXTENDED_FUN_FACTS.en || [])];

    // Merge extended pre-match hype
    PREMATCH_HYPE.it = [...PREMATCH_HYPE.it, ...(EXTENDED_PREMATCH.it || [])];
    PREMATCH_HYPE.en = [...PREMATCH_HYPE.en, ...(EXTENDED_PREMATCH.en || [])];

    return {
        getRandomFunFact, getRandomQuote, getPreMatchHype, getSeasonSummary,
        getTransferGossip, getRecoveryMsg, getInjuryDesc, getCelebrationStyle,
        getPitchCondition, showPreMatchHype, buildGoalDescription,
        FUN_FACTS, QUOTES, CELEBRATION_STYLES,
    };
})();

window.GS_GameData = GS_GameData;


// ── Extended Fun Facts (100 more) ────────────────────────────────────────────
const EXTENDED_FUN_FACTS = {
    it: [
        '💡 La durata del pallone è di circa 1.800 minuti di gioco prima di perdere pressione.',
        '💡 Un calciatore professionista esegue circa 1.200 sprint durante una stagione.',
        '💡 Il Manchester United è il club con più entrate da merchandising al mondo.',
        '💡 Nel 1900, le porte erano senza rete — i gol venivano stabiliti dalla traiettoria della palla.',
        '💡 Il primo gol della storia in trasmissione televisiva fu segnato nel 1937.',
        '💡 Cristiano Ronaldo è il primo calciatore a guadagnare più di 100 milioni in un anno.',
        '💡 La FIFA fu fondata il 21 maggio 1904 a Parigi da sette nazioni europee.',
        '💡 Il tiro più veloce in assoluto registrato è di 211 km/h, segnato da Ronny Heberson.',
        '💡 La Coppa del Mondo è il secondo evento sportivo più seguito al mondo dopo le Olimpiadi.',
        `💡 L'erba di un campo da calcio professionale viene tagliata ogni 2-3 giorni.`,
        '💡 Il calcio è stato introdotto ai Giochi Olimpici nel 1900.',
        '💡 In Cina il calcio esiste da oltre 2.000 anni con il gioco "Cuju".',
        '💡 Il Real Madrid è il club con il valore di mercato più alto al mondo.',
        `💡 I guanti del portiere sono stati introdotti solo negli anni '70.`,
        '💡 La distanza media percorsa da un centrocampista in una partita è di 11-13 km.',
        '💡 Il primo rigore della storia fu calciato nel 1892 in Irlanda del Nord.',
        '💡 Un campo da calcio standard contiene circa 600 kg di erba.',
        '💡 Il calcio è praticato in più di 200 paesi del mondo.',
        '💡 La porta da calcio standard misura 7,32 metri per 2,44 metri.',
        `💡 Ronaldinho ha vinto il Pallone d'Oro nel 2004 e nel 2005.`,
        '💡 Il Liverpool ha vinto la Champions League sei volte.',
        `💡 Il gol dell'anno FIFA è assegnato dal 2001.`,
        '💡 Un tiro in porta in media impiega 0.3 secondi a raggiungere la rete.',
        `💡 La Serie A è stato il campionato più forte al mondo negli anni '80 e '90.`,
        '💡 Paolo Maldini ha giocato per il Milan per 25 stagioni consecutive.',
        '💡 Il Barcellona ha una propria scuola calcio, La Masia, fondata nel 1979.',
        '💡 Il primo transfer fee della storia fu pagato nel 1893 per Willie Groves.',
        '💡 Zinedine Zidane ha segnato con una rovesciata nella finale di Champions 2002.',
        `💡 Il calcio femminile è cresciuto del 400% in popolarità nell'ultimo decennio.`,
        `💡 Lev Yashin è l'unico portiere ad aver vinto il Pallone d'Oro (1963).`,
    ],
    en: [
        '💡 A football lasts about 1,800 minutes of play before losing pressure.',
        '💡 A professional footballer performs around 1,200 sprints per season.',
        '💡 Manchester United is the club with the highest merchandise revenue worldwide.',
        `💡 In 1900, goals had no nets — goals were determined by the ball's trajectory.`,
        '💡 The first goal in television history was scored in 1937.',
        '💡 Cristiano Ronaldo is the first footballer to earn over 100 million in a year.',
        '💡 FIFA was founded on 21 May 1904 in Paris by seven European nations.',
        '💡 The fastest recorded shot ever is 211 km/h, scored by Ronny Heberson.',
        '💡 The World Cup is the second most watched sporting event after the Olympics.',
        '💡 Grass on a professional pitch is cut every 2-3 days.',
        '💡 Football was introduced to the Olympic Games in 1900.',
        '💡 Football has existed in China for over 2,000 years with the game "Cuju".',
        '💡 Real Madrid is the club with the highest market value in the world.',
        '💡 Goalkeeper gloves were only introduced in the 1970s.',
        '💡 The average distance covered by a midfielder in a match is 11-13 km.',
        '💡 The first penalty in history was taken in 1892 in Northern Ireland.',
        '💡 A standard football pitch contains around 600 kg of grass.',
        '💡 Football is played in more than 200 countries worldwide.',
        '💡 A standard goal measures 7.32 metres wide and 2.44 metres high.',
        `💡 Ronaldinho won the Ballon d'Or in 2004 and 2005.`,
        '💡 Liverpool has won the Champions League six times.',
        '💡 The FIFA Goal of the Year award has been given since 2001.',
        '💡 A shot on goal takes an average of 0.3 seconds to reach the net.',
        '💡 Serie A was the strongest league in the world in the 1980s and 90s.',
        '💡 Paolo Maldini played 25 consecutive seasons for AC Milan.',
        '💡 Barcelona has its own football academy, La Masia, founded in 1979.',
        '💡 The first transfer fee in history was paid in 1893 for Willie Groves.',
        '💡 Zinedine Zidane scored with an overhead kick in the 2002 Champions League final.',
        `💡 Women's football has grown by 400% in popularity in the last decade.`,
        `💡 Lev Yashin is the only goalkeeper to have won the Ballon d'Or (1963).`,
    ]
};

// ── Extended pre-match hype ───────────────────────────────────────────────────
    it: [
        '🎙️ Lo stadio è tuo. Il pallone è tuo. Il gol è il tuo destino.',
        '🔥 Nessuno si ricorda di chi è arrivato secondo.',
        '⚡ Ogni secondo conta. Ogni tocco conta. Ogni gol conta.',
        '🌟 I campioni si costruiscono quando nessuno guarda.',
        '💪 La stanchezza è temporanea. La vittoria è per sempre.',
        '🎯 Non esistono partite facili per chi vuole vincere sempre.',
        '🏟️ Migliaia di persone sono venute a vederti. Non deluderle.',
        '🧠 Il fisico ti porta in campo. La mente ti fa vincere.',
        '⚽ Questo non è solo calcio. È la tua storia che si scrive.',
        `🌍 Ogni gol ti avvicina al Pallone d'Oro.`,
    ],
    en: [
        '🎙️ The stadium is yours. The ball is yours. The goal is your destiny.',
        '🔥 Nobody remembers who came second.',
        '⚡ Every second counts. Every touch counts. Every goal counts.',
        '🌟 Champions are built when nobody is watching.',
        '💪 Fatigue is temporary. Victory is forever.',
        '🎯 There are no easy matches for those who want to win every time.',
        `🏟️ Thousands of people came to watch you. Don't let them down.`,
        '🧠 Your body gets you on the pitch. Your mind makes you win.',
        `⚽ This isn't just football. It's your story being written.`,
        `🌍 Every goal brings you closer to the Ballon d'Or.`,
    ]
};

// ── Season end reflections ────────────────────────────────────────────────────
const SEASON_END_REFLECTIONS = {
    it: [
        '{nome} si ferma negli spogliatoi dopo la partita. I suoi occhi raccontano una storia di sacrifici e vittorie.',
        'Una stagione si chiude, una nuova si apre. {nome} sa già cosa fare diversamente.',
        'I numeri dicono una cosa, ma la verità la conosce solo {nome}: ha dato tutto.',
        'Fine stagione. {nome} legge i messaggi dei tifosi e sente che ne è valsa la pena.',
        `L'ultimo allenamento della stagione. {nome} resta sul campo un minuto in più, a guardare.`,
    ],
    en: [
        '{nome} pauses in the dressing room after the final match. Their eyes tell a story of sacrifice and victory.',
        'One season ends, a new one opens. {nome} already knows what to do differently.',
        'The numbers say one thing, but only {nome} knows the truth: everything was given.',
        `End of season. {nome} reads the fans' messages and feels it was all worth it.`,
        'The last training session of the season. {nome} stays on the pitch a minute longer, just looking.',
    ]
};

// ── Export additional data ────────────────────────────────────────────────────
if (typeof window !== 'undefined') {
    window.EXTENDED_FUN_FACTS = EXTENDED_FUN_FACTS;
    window.SEASON_END_REFLECTIONS = SEASON_END_REFLECTIONS;
    
    // Enhance getRandomFunFact to use extended pool
    const _origGetFact = GS_GameData.getRandomFunFact;
    // Already merged above, no override needed
}

// ── Extended quotes collection ────────────────────────────────────────────────
GS_GameData.EXTRA_QUOTES = {
    it: [
        '"Non ho mai incontrato un campione che non credesse in se stesso." — Muhammad Ali',
        `"La differenza tra il possibile e l'impossibile è la tua determinazione." — Tommy Lasorda`,
        `"Il talento è comune, l'impegno è raro." — Johann Wolfgang von Goethe`,
        '"I campioni continuano a giocare finché non lo sanno fare bene." — Billie Jean King',
        `"Il successo non è definitivo, il fallimento non è fatale: è il coraggio di continuare che conta." — Winston Churchill`,
        '"Un campione è qualcuno che si alza anche quando non può." — Jack Dempsey',
        '"Il mio corpo è il mio strumento, il campo è il mio palcoscenico." — Pelé',
        `"Non aspettare l'ispirazione. L'ispirazione viene mentre si lavora." — Henri Matisse`,
        '"Ho fallito più e più volte nella mia vita. Ecco perché sono riuscito." — Michael Jordan',
        '"La fatica di oggi è la forza di domani." — Anonimo',
        '"Il talento vince partite, ma il lavoro di squadra vince campionati." — Michael Jordan',
        '"Chi vuole, trova i modi. Chi non vuole, trova le scuse." — Anonimo',
        '"Il dolore è temporaneo. La gloria è per sempre." — Lance Armstrong',
        '"Non è abbastanza sognare. Bisogna svegliarsi e lavorare." — Anonimo',
        '"Il segreto del successo è la costanza nello scopo." — Benjamin Disraeli',
    ],
    en: [
        `"I've never met a champion who didn't believe in themselves." — Muhammad Ali`,
        '"The difference between the possible and the impossible lies in determination." — Tommy Lasorda',
        '"Talent is common, commitment is rare." — Johann Wolfgang von Goethe',
        '"Champions keep playing until they get it right." — Billie Jean King',
        '"Success is not final, failure is not fatal: it is the courage to continue that counts." — Winston Churchill',
        `"A champion is someone who gets up when they can't." — Jack Dempsey`,
        '"My body is my instrument, the pitch is my stage." — Pelé',
        `"Don't wait for inspiration. Inspiration comes while working." — Henri Matisse`,
        '"I have failed over and over in my life. That is why I succeed." — Michael Jordan',
        `"Today's effort is tomorrow's strength." — Anon`,
        '"Talent wins games, but teamwork wins championships." — Michael Jordan',
        `"Those who want to, find ways. Those who don't, find excuses." — Anon`,
        '"Pain is temporary. Glory is forever." — Lance Armstrong',
        `"Dreaming isn't enough. You have to wake up and work." — Anon`,
        '"The secret of success is constancy of purpose." — Benjamin Disraeli',
    ]
};

GS_GameData.getExtraQuote = function() {
    const lang = localStorage.getItem('gs_lang') || 'it';
    const pool = GS_GameData.EXTRA_QUOTES[lang] || GS_GameData.EXTRA_QUOTES.it;
    return pool[Math.floor(Math.random() * pool.length)];
};

// ── Pre-season predictions ─────────────────────────────────────────────────
GS_GameData.PRE_SEASON_PREDICTIONS = {
    it: [
        `🔮 I pronostici dicono che quest'anno potresti fare qualcosa di speciale.`,
        '📊 Le statistiche indicano una stagione in crescita. Aspettati miglioramenti.',
        '🌟 Il momento giusto per affermarsi definitivamente. È il tuo anno.',
        `⚡ Carichi di aspettative, ma il potenziale c'è. Devi solo esprimerlo.`,
        `🎯 Quest'anno o mai più. La finestra è aperta — coglila.`,
        '🏆 I tifosi si aspettano titoli. Tu puoi darglieli.',
        '📈 Trend positivo in entrata. Prosegui su questa strada.',
    ],
    en: [
        '🔮 Predictions say you could do something special this year.',
        '📊 The stats point to a season of growth. Expect improvements.',
        `🌟 The right moment to establish yourself for good. It's your year.`,
        '⚡ Loaded with expectations, but the potential is there. Express it.',
        '🎯 This year or never. The window is open — seize it.',
        '🏆 The fans expect trophies. You can deliver them.',
        '📈 Positive incoming trend. Stay on this path.',
    ]
};

GS_GameData.getPreSeasonPrediction = function() {
    const lang = localStorage.getItem('gs_lang') || 'it';
    const pool = GS_GameData.PRE_SEASON_PREDICTIONS[lang] || GS_GameData.PRE_SEASON_PREDICTIONS.it;
    return pool[Math.floor(Math.random() * pool.length)];
};
