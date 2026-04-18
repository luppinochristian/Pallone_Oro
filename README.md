# ⚽ Golden Striker — Road to the Pallone d'Oro

> *Costruisci la carriera del tuo calciatore ideale, scala le leghe mondiali e conquista il Pallone d'Oro.*

---

## Indice

1. [Panoramica del progetto](#1-panoramica-del-progetto)
2. [Funzionalità principali](#2-funzionalità-principali)
3. [Struttura del progetto](#3-struttura-del-progetto)
4. [Stack tecnologico](#4-stack-tecnologico)
5. [Installazione e avvio locale](#5-installazione-e-avvio-locale)
6. [Architettura del sistema](#6-architettura-del-sistema)
7. [Il database](#7-il-database)
8. [Il sistema di gioco](#8-il-sistema-di-gioco)
9. [Internazionalizzazione (IT / EN)](#9-internazionalizzazione-it--en)
10. [API del backend](#10-api-del-backend)
11. [Deploy in produzione](#11-deploy-in-produzione)
12. [Note di sviluppo e crediti](#12-note-di-sviluppo-e-crediti)

---

## 1. Panoramica del progetto

**Golden Striker** è un simulatore di carriera calcistica single-player con interfaccia web. Il giocatore crea un avatar, sceglie una squadra iniziale e avanza mese per mese nella propria carriera, prendendo decisioni su allenamento, trasferimenti, gestione dell'agente e molto altro.

L'obiettivo finale è conquistare il **Pallone d'Oro** — il massimo riconoscimento calcistico — raggiungendo i livelli più alti di overall, gol, popolarità e trofei vinti.

Il gioco supporta **italiano e inglese** in tutte le sue parti (UI, notizie, commento partite, email transazionali) e usa l'**API Anthropic (Claude)** per la traduzione automatica delle notizie generate dinamicamente dal backend.

---

## 2. Funzionalità principali

### Gestione account
- Registrazione con **verifica email OTP** a 6 cifre (codice valido 15 minuti)
- Login con token di sessione persistente
- Reset password via email
- Più carriere per account (massimo configurabile)
- **Modalità ospite** per giocare senza registrarsi (dati in memoria)

### Carriera e simulazione
- **Avanzamento mensile**: ogni "turno" corrisponde a un mese di calendario (settembre → giugno)
- **Selezione azioni**: fino a 3 azioni per mese tra allenamenti, riposo, attività social
- **Simulazione partite**: campionato + Champions Cup con algoritmo probabilistico basato sull'overall
- **Promozione / retrocessione** a fine anno in base alla posizione in classifica
- **Infortuni** con probabilità variabile in base all'intensità degli allenamenti
- **Morale ed energia**: parametri che influenzano le performance

### Statistiche e progressione
- **7 attributi** del giocatore: Tiro, Velocità, Dribbling, Fisico, Mentalità, Energia, Morale
- **Overall** calcolato come media pesata degli attributi principali
- **Albero delle Abilità** con boost sbloccabili tramite punti esperienza
- **Strutture di allenamento** (7 livelli) che moltiplicano i guadagni dagli allenamenti
- **Agente personale** con bonus su stipendio, trasferimenti e morale

### Contenuti e varietà
- **400+ template di notizie** generate dinamicamente ogni mese
- **Commento partite** in tempo reale durante la simulazione
- **Encyclopedia** con record storici del calcio reale
- **40+ Achievement** sbloccabili con badge e notifiche
- **Timeline carriera** con eventi chiave visualizzati cronologicamente
- **Pianificatore stagionale** con calendario partite e previsioni
- **Classifica globale** tra tutti gli utenti registrati
- **Player Card SVG** generabile e scaricabile per la condivisione

### Champions Cup
- Qualificazione automatica in base alla posizione in campionato
- **Fase a gironi** con 4 gironi da 4 squadre
- Ottavi → Quarti → Semifinale → Finale con probabilità simulate
- Notizie e commenti dedicati per ogni fase

### Pallone d'Oro
- Algoritmo multicriteria: overall, gol, assist, trofei, popolarità, Palloni d'Oro precedenti
- Competizione contro NPC con statistiche simulate
- Annuncio con effetti visivi (particelle, crowd, animazioni)

---

## 3. Struttura del progetto

```
gs_fixed/
│
├── frontend/                    # Client-side: HTML, CSS, JavaScript
│   ├── index.html               # Unica pagina HTML (SPA)
│   ├── reset.html               # Pagina reset password (standalone)
│   │
│   ├── css/
│   │   ├── style.css                    # Stili base e variabili CSS
│   │   ├── gilded_velocity_override.css # Override tema Gilded Velocity
│   │   ├── enhancements.css             # Componenti UI avanzati
│   │   └── restyling.css                # Correzioni layout e fix
│   │
│   └── js/
│       ├── app.js              # Modulo principale (5000+ righe)
│       ├── gamedata.js         # Dati di gioco e template notizie extra
│       ├── locale.js           # Localizzazione IT/EN e contenuti testuali
│       ├── commentary.js       # Motore telecronaca partite
│       ├── achievements.js     # Sistema achievement (40+ badge)
│       ├── season_planner.js   # Calendario stagionale e previsioni
│       ├── tutorial.js         # Tutorial interattivo per nuovi utenti
│       ├── ui_components.js    # Libreria componenti UI (toast, modal...)
│       ├── analytics.js        # Analytics avanzate e heatmap
│       ├── timeline.js         # Timeline visuale della carriera
│       ├── particles.js        # Sistema particelle canvas
│       ├── charts.js           # Grafici canvas per statistiche
│       ├── encyclopedia.js     # Enciclopedia calcistica
│       ├── animations.js       # Transizioni e animazioni UI
│       └── playercard.js       # Generatore card SVG del giocatore
│
├── backend/
│   ├── config/
│   │   └── db.php              # Database, connessione, funzioni globali
│   │
│   └── api/
│       ├── auth.php            # Autenticazione, account, carriere
│       ├── game.php            # Motore di gioco (2300+ righe)
│       ├── player.php          # Dati giocatore, notizie, classifiche
│       ├── extra.php           # Fun fact, citazioni, trivia, contatti
│       ├── agente.php          # Sistema agente personale
│       ├── classifica.php      # Classifiche campionato e Champions
│       └── ai_avatar.php       # Generazione avatar tramite AI
│
├── router.php                  # Router per PHP built-in server (dev)
├── start.sh                    # Script avvio rapido locale
└── README.md                   # Questo file
```

---

## 4. Stack tecnologico

| Livello | Tecnologia | Note |
|---|---|---|
| **Frontend** | HTML5 / CSS3 / JavaScript ES2020 | Nessun framework — vanilla puro |
| **Backend** | PHP 8.x | API REST JSON |
| **Database** | SQLite 3 | File unico, nessuna installazione |
| **AI** | Anthropic API (Claude Sonnet) | Traduzione notizie + avatar AI |
| **Email** | PHP mail() | SMTP configurabile via php.ini |
| **Canvas** | HTML5 Canvas API | Particelle, folla, grafici |
| **Server dev** | PHP built-in server | php -S localhost:8080 router.php |
| **Server prod** | Apache / Nginx | Qualsiasi server PHP standard |

---

## 5. Installazione e avvio locale

### Prerequisiti

- **PHP 8.0+** con estensioni: `pdo_sqlite`, `sqlite3`, `mbstring`, `openssl`
- Nessun database esterno necessario (SQLite è incluso)
- Nessun `npm` o build step necessario

### Avvio rapido

```bash
# 1. Decomprimi il progetto
cd gs_fixed

# 2. Avvia il server di sviluppo
bash start.sh
# oppure manualmente:
php -S localhost:8080 router.php

# 3. Apri il browser
open http://localhost:8080
```

### Prima esecuzione

Al primo avvio, il database `backend/data/db.sqlite` viene creato automaticamente con tutte le tabelle e i dati iniziali (200+ squadre, 20+ leghe, 15+ nazioni). Non è necessario eseguire migrazioni SQL manualmente.

### Nota sull'API Anthropic

La traduzione delle notizie richiede una chiave API Anthropic. In sviluppo locale senza chiave, le notizie vengono mostrate in italiano anche se la lingua è impostata su inglese — il gioco funziona normalmente in tutti gli altri aspetti.

---

## 6. Architettura del sistema

### Flusso di una richiesta tipica

```
Browser (app.js)
    │
    │  POST /backend/api/game.php
    │  Body: { action: 'play_month', actions: [...] }
    │  Headers: X-Auth-Token, X-Lang
    ▼
router.php  →  backend/api/game.php
                    │
                    ├── getAuthPlayerId()   verifica token
                    ├── getPlayerData()     legge stato giocatore
                    ├── playMonth()         logica mensile
                    │       ├── simulaGiornataLega()
                    │       ├── simulaChampions()
                    │       ├── generaNotizieDinamiche()
                    │       └── calcPalloneDoro()
                    └── echo json_encode($result)
    │
    ▼
app.js riceve JSON → aggiorna UI → renderGame() → renderDashboard()
```

### Sistema di autenticazione

- Token univoco generato con `bin2hex(random_bytes(32))` (64 caratteri esadecimali)
- Salvato in `localStorage` lato client e nella tabella `account_tokens` lato server
- Ogni richiesta API lo invia nell'header `X-Auth-Token`
- `getAuthPlayerId()` in `db.php` lo verifica ad ogni chiamata

### Single Page Application

Tutta la navigazione avviene senza ricaricare la pagina. Le "pagine" sono `<div class="page">` — solo quella con classe `active` è visibile. `app.js` gestisce il routing interno con funzioni `showPage()`.

---

## 7. Il database

Il database SQLite si trova in `backend/data/db.sqlite` e viene creato automaticamente da `db.php` al primo avvio.

### Tabelle principali

| Tabella | Descrizione |
|---|---|
| `accounts` | Account utente (email, username, password hash) |
| `account_tokens` | Token di sessione attivi |
| `email_verifications` | Codici OTP per verifica email (scadono in 15 min) |
| `players` | Giocatori con tutte le statistiche di carriera |
| `teams` | 200+ squadre con overall, stelle, lega di appartenenza |
| `leghe` | 20+ campionati con nazione e livello |
| `nazioni` | Nazioni con nome e codice |
| `notizie` | Storico notizie generate per ogni giocatore |
| `lega_risultati` | Risultati di ogni giornata di campionato |
| `champions_bracket` | Stato del torneo Champions Cup |
| `player_skills` | Abilità sbloccate dall'Albero delle Abilità |

---

## 8. Il sistema di gioco

### Il turno mensile

Ogni mese il giocatore sceglie fino a 3 azioni (allenamento, riposo, social, ecc.) e clicca "Gioca Mese". Il backend esegue in sequenza: calcolo effetti azioni → simulazione partite campionato → simulazione Champions → infortuni → stipendio → notizie dinamiche → (a giugno) Pallone d'Oro e fine stagione.

### L'overall

```
overall = (tiro×0.25 + velocità×0.20 + dribbling×0.20 + fisico×0.20 + mentalità×0.15)
          × bonus_struttura × bonus_agente × bonus_abilità
```

Varia da **30** (esordiente assoluto) a **99** (leggenda mondiale).

### Simulazione partite

La probabilità di vittoria è basata sul rapporto di overall tra le squadre. L'overall del giocatore influenza gol, assist e voto. Le abilità sbloccate modificano tipi di gol e bonus. Il risultato è: Vittoria (V), Pareggio (P) o Sconfitta (S).

### Il Pallone d'Oro

A giugno viene calcolato un punteggio multicriteria:
```
punteggio = overall×0.30 + gol_stagione×0.25 + assist_stagione×0.10
          + trofei×0.15 + popolarità×0.10 + palloni_doro_precedenti×0.10
```
Il giocatore compete contro NPC simulati. Se vince, riceve trofeo e bonus popolarità permanente.

---

## 9. Internazionalizzazione (IT / EN)

### Frontend
Le stringhe UI sono in `app.js` in `STRINGS = { it: {...}, en: {...} }`. La funzione `_t(key)` restituisce la stringa corretta. Gli elementi `data-i18n="chiave"` vengono aggiornati da `_applyTranslations()`. La lingua è in `localStorage` ('gs_lang').

### Backend
Le stringhe PHP usano `t('italiano', 'english')`. La funzione `getLang()` legge l'header `X-Lang` inviato dal frontend. Le notizie dinamiche usano `_tn($it, $en)` per selezionare la lingua.

### Traduzione automatica notizie

Le notizie nascono in italiano. Quando la lingua è inglese, `_translateNewsItems()` le traduce in batch da 5 tramite API Anthropic. La cache in memoria evita chiamate ripetute. In caso di errore API, le notizie rimangono in italiano.

---

## 10. API del backend

Tutte le API accettano `POST` con body `application/json`, header `X-Auth-Token` e `X-Lang`.

### auth.php — Azioni disponibili
`register`, `verify_code`, `resend_code`, `login`, `logout`, `check`, `request_reset`, `do_reset`, `careers`, `create_career`, `delete_career`, `rename_career`

### game.php — Azioni disponibili
`play_month`, `buy_struttura`, `change_team`, `apply_skill_boost`, `get_skill_boosts`

### player.php — Azioni disponibili
`get_player`, `get_news`, `get_classifica`, `get_champions_bracket`, `update_skin`, `get_leaderboard`

### extra.php — Azioni disponibili
`get_fun_fact`, `get_tip`, `get_quote`, `get_trivia`, `contact`

---

## 11. Deploy in produzione

**Requisiti**: PHP 8.0+ con `pdo_sqlite`, `mbstring`, `openssl`. Nessun database esterno.

**Permessi**:
```bash
chmod 755 backend/data/
```

Il file `db.sqlite` viene creato automaticamente al primo avvio con tutti i dati necessari.

Per Apache, assicurarsi che le richieste a `/backend/` vengano servite come PHP e le altre reindirizzate a `frontend/index.html`.

---

## 12. Note di sviluppo e crediti

**Versione corrente**: v13 (gs_v13_fixed) — versione stabile con verifica email OTP, traduzione notizie a batch, fix pannello verifica, commenti in italiano su tutti i file.

**Filosofia**: zero dipendenze lato frontend (vanilla HTML/CSS/JS), PHP + SQLite lato backend per massima semplicità di deployment su qualsiasi hosting.

---

*Golden Striker — fatto con ❤️ e passione per il calcio e il codice.*
