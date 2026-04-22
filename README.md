# ⚽ Golden Striker — Road to the Pallone d'Oro

> *Costruisci la carriera del tuo calciatore ideale, scala le leghe mondiali e conquista il Pallone d'Oro.*

---

## 🚀 Avvio rapido

### Prerequisiti

- **PHP 8.0+** con le estensioni: `pdo_sqlite`, `sqlite3`, `mbstring`, `openssl`
- Nessun database esterno, nessun `npm`, nessun build step

### Comando per avviare

```bash
cd Pallone_Oro-fixed
php -S localhost:8080 router.php
```

Poi apri il browser su **http://localhost:8080** — il gioco è pronto.

> **Nota:** al primo avvio il database SQLite viene creato automaticamente in `backend/data/db.sqlite` con tutte le tabelle, le squadre e le leghe precaricate. Non serve eseguire nessun SQL manualmente.

### Variabili d'ambiente opzionali

| Variabile | Default | Descrizione |
|---|---|---|
| `GMAIL_FROM` | `goldenstrikerreset@gmail.com` | Indirizzo mittente email |
| `GMAIL_PASS` | *(app password inclusa)* | Password applicazione Gmail |
| `GMAIL_NAME` | `Golden Striker` | Nome visualizzato mittente |
| `ANTHROPIC_API_KEY` | — | Chiave API per traduzione notizie e avatar AI |

```bash
GMAIL_FROM=tua@email.com GMAIL_PASS=xxxx php -S localhost:8080 router.php
```

Senza `ANTHROPIC_API_KEY` il gioco funziona normalmente: le notizie rimangono in italiano anche se la lingua è impostata su inglese.

---

## 🎮 Cos'è Golden Striker

Golden Striker è un **simulatore di carriera calcistica single-player** con interfaccia web. Non è un gioco di squadra, non è un fantasy: sei tu il calciatore. Crei il tuo avatar, scegli una squadra di partenza e avanzi mese dopo mese prendendo decisioni su allenamento, trasferimenti, gestione dell'agente e vita fuori dal campo.

L'obiettivo è uno solo: conquistare il **Pallone d'Oro** — il massimo riconoscimento calcistico mondiale.

Il gioco supporta **italiano e inglese** in tutta la UI, nelle notizie e nel commento delle partite.

---

## 📖 Tutorial — Come si gioca

### 1. Crea un account (o gioca come ospite)

Dalla schermata iniziale puoi:

- **Registrarti** con email, username e password → ricevi un codice OTP a 6 cifre via email per verificare l'account
- **Accedere** se hai già un account
- **Giocare come ospite** senza registrarti (i dati rimangono in memoria, non vengono salvati)

Con un account registrato puoi avere **più carriere simultanee** e accedere alla **classifica globale**.

---

### 2. Crea la tua carriera

Dopo il login scegli **"Nuova Carriera"**. Ti verrà chiesto di:

1. **Scegliere un nome** per il tuo calciatore
2. **Selezionare il ruolo** (attaccante, centrocampista, difensore, portiere)
3. **Scegliere la squadra iniziale** — puoi partire da un club di bassa lega per la sfida, o da una big per puntare subito in alto
4. **Personalizzare l'aspetto** del tuo avatar

Il giocatore parte con statistiche basse (overall ~30-40). La crescita dipende interamente dalle tue scelte.

---

### 3. Il turno mensile — il cuore del gioco

La carriera avanza **mese per mese** (da settembre a giugno, una stagione sportiva). Ogni mese devi:

**a) Scegliere fino a 3 azioni** tra:

| Categoria | Esempi |
|---|---|
| **Allenamenti** | Allenamento Tiro, Sprint, Tecnica, Forza fisica |
| **Riposo** | Riposo completo, Fisioterapia (recupera energia) |
| **Social & Media** | Intervista TV, Sponsorizzazioni, Social media |
| **Agente** | Negozia contratto, Esplora offerte di mercato |

Ogni azione modifica i tuoi attributi, l'energia, il morale e la popolarità.

**b) Cliccare "Gioca Mese"**

Il backend simula automaticamente:
- Le partite di **campionato** della settimana
- Le fasi della **Champions Cup** (se qualificato)
- Gli **infortuni** (influenzati dall'intensità degli allenamenti)
- Le **notizie dinamiche** sul tuo conto
- Il pagamento dello **stipendio**

**c) Leggere il risultato**

Vedi gol, assist, voto, i risultati della squadra e le notizie generate dal sistema.

---

### 4. I tuoi attributi

Il tuo giocatore ha **7 statistiche**:

| Attributo | Effetto principale |
|---|---|
| **Tiro** | Gol segnati, efficacia in porta |
| **Velocità** | Dribbling superati, pressing |
| **Dribbling** | Palloni conservati, azioni individuali |
| **Fisico** | Resistenza agli infortuni, duelli |
| **Mentalità** | Performance nelle partite decisive |
| **Energia** | Capacità di fare azioni intensive senza infortuni |
| **Morale** | Bonus generale alle performance |

L'**overall** è la media pesata dei primi 5 attributi, moltiplicata per bonus di struttura, agente e abilità. Va da **30** (esordiente) a **99** (leggenda).

---

### 5. Strutture di allenamento e Albero delle Abilità

Nel menu **"Strutture"** puoi investire i guadagni in infrastrutture (7 livelli) che moltiplicano i benefici di ogni sessione di allenamento.

Nell'**Albero delle Abilità** sblocchi potenziamenti permanenti usando i punti esperienza: boost agli attributi, riduzione rischio infortuni, bonus ai gol su punizione e molto altro.

---

### 6. Trasferimenti e squadra

Quando il tuo overall cresce, le squadre migliori si fanno vive. Dal menu **"Agente"** puoi:

- Vedere le offerte di trasferimento disponibili
- Negoziare un contratto più ricco
- Scegliere di cambiare lega per competere a un livello più alto

Ogni lega ha un livello di competitività diverso. Scalare dalla Serie B alla Premier League è parte del percorso.

---

### 7. Champions Cup

Se la tua squadra si qualifica (top 4 del campionato), accedi alla **Champions Cup**:

- **Fase a gironi**: 4 gironi da 4 squadre
- **Ottavi, Quarti, Semifinale, Finale**: bracket a eliminazione diretta
- Le partite Champions sono più difficili — l'overall avversario è mediamente più alto
- Vincere la Champions vale moltissimo per il punteggio Pallone d'Oro

---

### 8. Il Pallone d'Oro

A **giugno** (fine stagione) viene calcolato il vincitore con questo algoritmo:

```
Punteggio = overall×0.30 + gol_stagione×0.25 + assist_stagione×0.10
          + trofei×0.15 + popolarità×0.10 + palloni_doro_precedenti×0.10
```

Competi contro NPC simulati. Se vinci, ricevi il trofeo, un bonus permanente di popolarità e un'animazione celebrativa con effetti particellari. Puoi vincerlo più volte nella stessa carriera.

---

## ✨ Funzionalità aggiuntive

| Funzione | Dove trovarla | Descrizione |
|---|---|---|
| **40+ Achievement** | Menu → Achievements | Badge sbloccabili per traguardi speciali |
| **Player Card** | Profilo → Scarica Card | Card SVG del tuo giocatore da condividere |
| **Classifica globale** | Menu → Leaderboard | Confronta il tuo overall con gli altri utenti |
| **Timeline carriera** | Menu → Timeline | Visualizzazione cronologica degli eventi chiave |
| **Analytics** | Menu → Statistiche | Grafici con andamento di ogni attributo nel tempo |
| **Pianificatore stagionale** | Menu → Stagione | Calendario partite e previsioni rendimento |
| **Encyclopedia** | Menu → Encyclopedia | Record storici del calcio reale integrati nel gioco |
| **Avatar AI** | Profilo → Avatar | Generazione avatar tramite API Anthropic |
| **Agente personale** | Menu → Agente | Sistema agente con livelli e bonus negoziabili |
| **Tutorial interattivo** | Al primo accesso | Guida passo-passo per nuovi giocatori |
| **Lingua IT / EN** | Impostazioni → Lingua | Switch completo italiano/inglese su tutta la UI |

---

## 🗂️ Struttura del progetto

```
Pallone_Oro-fixed/
│
├── frontend/
│   ├── index.html               # SPA — unica pagina HTML
│   ├── reset.html               # Pagina reset password
│   ├── css/
│   │   ├── style.css            # Stili base e variabili
│   │   ├── enhancements.css     # Componenti UI avanzati
│   │   ├── restyling.css        # Fix layout
│   │   └── gilded_velocity_override.css
│   └── js/
│       ├── app.js               # Logica principale
│       ├── gamedata.js          # Dati di gioco
│       ├── locale.js            # Stringhe IT/EN
│       ├── commentary.js        # Telecronaca partite
│       ├── achievements.js      # Sistema achievement
│       ├── season_planner.js    # Pianificatore stagionale
│       ├── analytics.js         # Grafici e statistiche
│       ├── timeline.js          # Timeline carriera
│       ├── encyclopedia.js      # Enciclopedia calcistica
│       ├── playercard.js        # Generatore card SVG
│       ├── tutorial.js          # Tutorial interattivo
│       ├── ui_components.js     # Toast, modal, ecc.
│       ├── charts.js            # Canvas charts
│       └── particles.js        # Effetti particellari
│
├── backend/
│   ├── config/
│   │   └── db.php               # Connessione DB, funzioni globali
│   └── api/
│       ├── auth.php             # Account, login, OTP, carriere
│       ├── game.php             # Motore di gioco (turni, simulazioni)
│       ├── player.php           # Dati giocatore, notizie, classifiche
│       ├── agente.php           # Sistema agente
│       ├── classifica.php       # Classifiche campionato e Champions
│       ├── extra.php            # Fun fact, citazioni, contatti
│       └── ai_avatar.php        # Avatar generato da AI
│
├── router.php                   # Router per il server built-in PHP
└── README.md                    # Questa guida
```

---

*Golden Striker — fatto con ❤️ e passione per il calcio e il codice.*
