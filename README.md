# ⚽ GOLDEN STRIKER – Road to the Pallone d'Oro

## 🚀 INSTALLAZIONE

### Requisiti
- PHP 7.4+ con PDO/MySQL
- MySQL 5.7+ / MariaDB 10.3+
- Web server (Apache/Nginx) o PHP built-in server

---

## 📁 STRUTTURA PROGETTO

```
golden-striker/
├── backend/
│   ├── api/
│   │   ├── auth.php       # Login & registrazione
│   │   ├── player.php     # Dati giocatore
│   │   └── game.php       # Motore di gioco
│   └── config/
│       ├── db.php          # Connessione database
│       └── schema.sql      # Schema + dati iniziali
└── frontend/
    ├── index.html          # App principale
    ├── css/
    │   └── style.css
    └── js/
        └── app.js
```

---

## ⚙️ CONFIGURAZIONE

### 1. Database
```sql
-- Crea il database e importa lo schema:
mysql -u root -p < backend/config/schema.sql
```

### 2. Configura la connessione DB
Apri `backend/config/db.php` e modifica:
```php
define('DB_HOST', 'localhost');
define('DB_USER', 'tuo_utente');
define('DB_PASS', 'tua_password');
define('DB_NAME', 'golden_striker');
```

### 3. Avvio con PHP Built-in Server

**Backend:**
```bash
cd golden-striker
php -S localhost:8080 -t backend/
```

**Frontend:**
In un altro terminale:
```bash
php -S localhost:3000 -t frontend/
```

Poi modifica in `frontend/js/app.js` la riga:
```js
const API_BASE = 'http://localhost:8080/api';
```

### 4. Avvio con Apache/Nginx
Copia la cartella `golden-striker/` nella root del server web (es. `/var/www/html/` o `htdocs/`).

Il frontend è in `frontend/index.html` e comunica con `../backend/api/`.
Il percorso relativo funziona se frontend e backend sono nella stessa cartella padre.

---

## 🎮 COME GIOCARE

1. **Registrati** e crea il tuo calciatore (nome, sesso, nazionalità, età 16-19)
2. **Ogni mese** scegli 1-3 azioni di allenamento
3. **Simula le partite** - il gioco calcola gol, assist e voto automaticamente
4. **Guadagna soldi** e investi nella tua **struttura personale**
5. **Trasferisciti** a squadre migliori per più visibilità e stipendio
6. **A fine anno** viene calcolata la classifica Pallone d'Oro
7. **L'obiettivo**: vincere più Palloni d'Oro possibili prima dei 38 anni!

---

## 🏗️ STRUTTURA PERSONALE

| Livello | Nome | Costo | Bonus |
|---------|------|-------|-------|
| 1 | Campetto Base | €50K | +1 allenamento |
| 2 | Centro Moderno | €200K | +2% crescita, -5% infortuni |
| 3 | Centro High-Tech | €600K | +20% crescita |
| 4 | Academy Personale | €1.5M | +35% crescita, sponsor auto |

---

## ⭐ SQUADRE

| Stelle | Tipo | OVR minimo | Moltiplicatore |
|--------|------|------------|----------------|
| ⭐ | Club Locale | 55 | ×0.8 |
| ⭐⭐ | Club Medio | 70 | ×1.2 |
| ⭐⭐⭐ | Club Competitivo | 85 | ×1.8 |
| ⭐⭐⭐⭐ | Club Elite | 100 | ×2.5 |
| ⭐⭐⭐⭐⭐ | Club Globale | 115 | ×4.0 |

---

## 🔧 TROUBLESHOOTING

**Errore CORS:** Assicurati che frontend e backend siano sullo stesso dominio, o configura le CORS headers in `db.php`.

**Session non funzionante:** Verifica che PHP abbia i permessi di scrittura per le sessioni (`session.save_path`).

**DB Connection failed:** Controlla le credenziali in `db.php` e che MySQL sia in esecuzione.

---

*Golden Striker v1.0 - Buona fortuna nella corsa al Pallone d'Oro!* ⚽🏆
