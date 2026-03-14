# Golden Striker v9 — Road to the Pallone d'Oro

## Changelog v9 (pulizia e bug fix)

### 🐛 Bug Critici Corretti
- **`loadTransfer()` COMPLETAMENTE RISCRITTA** — la funzione era troncata a metà: mancava tutto il corpo di rendering delle squadre, i filtri nazione/lega, i pulsanti di trasferimento. La pagina Trasferimento era completamente non funzionante.
- **Variabili `window._trNaz` / `window._trLiv` spostate in scope module** — erano appoggiate sull'oggetto `window` in modo disordinato; ora sono variabili di modulo pulite (`_trNaz`, `_trLiv`).
- **`doTransfer()` aggiunta** — la funzione di conferma trasferimento mancava.

### 🧹 Pulizie
- **Rimosso `buildSkinPicker()`** (legacy, duplicato di `buildSkinTonePicker()`): il picker a ruota colore per la carnagione era un residuo di versioni precedenti, mai usato nella UI attuale.
- **Rimosso `SKIN_PRESETS` e funzioni correlate**: `selectSkinPreset()`, `selectSkinCustomFromHistory()`, `selectSkin()`, `toggleSkinWheel()`, `drawSkinColorWheel()` ecc. — tutto codice morto non collegato a nessun elemento HTML.
- **Rimosso `skinCustomHistory`** e tutto il sistema di cronologia colore pelle (mai esposto all'utente).
- **`showCareerSelectBack()`** — rinominata per chiarezza (era `showCareerSelect()` usata come "torna indietro", ambigua con la funzione principale).
- **Milestone bar corretta** — mostrava "100" come limite invece di "125".
- **Struttura `loadSkillTree()`** — rimosso il pattern `api(...).then(p => { loadSkillTree(); })` annidato; sostituito con `await` diretto.
- Commenti ridondanti e blocchi vuoti rimossi.

## Struttura
```
golden_striker_v9/
├── frontend/
│   ├── index.html
│   ├── reset.html
│   ├── css/style.css
│   └── js/app.js
├── backend/
│   ├── api/
│   │   ├── auth.php
│   │   ├── game.php
│   │   ├── player.php
│   │   ├── agente.php
│   │   ├── classifica.php
│   │   └── extra.php
│   └── config/
│       ├── db.php
│       └── schema.sql
├── router.php
└── start.sh
```

## Avvio
```bash
bash start.sh
```
Poi apri http://localhost:8080
