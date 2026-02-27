#!/bin/bash
echo ""
echo "⚽ ================================="
echo "   GOLDEN STRIKER – Avvio Server"
echo "================================="
echo ""

# ─── Rileva versione PHP ───────────────────────────────────────────────────────
PHP_VER=$(php -r "echo PHP_MAJOR_VERSION.'.'.PHP_MINOR_VERSION;" 2>/dev/null)
if [ -z "$PHP_VER" ]; then
    echo "❌ PHP non trovato! Installa PHP prima di continuare."
    echo "   sudo apt install php php-mysql php-pdo"
    exit 1
fi
echo "✅ PHP $PHP_VER trovato"

# ─── Controlla driver pdo_mysql ───────────────────────────────────────────────
if php -m 2>/dev/null | grep -q "pdo_mysql"; then
    echo "✅ Driver pdo_mysql presente"
else
    echo "⚠️  Driver pdo_mysql MANCANTE. Installo..."
    sudo apt-get install -y php${PHP_VER}-mysql 2>/dev/null || \
    sudo apt-get install -y php-mysql 2>/dev/null || \
    sudo apt-get install -y php${PHP_VER}-pdo-mysql 2>/dev/null
    if php -m 2>/dev/null | grep -q "pdo_mysql"; then
        echo "✅ Driver pdo_mysql installato!"
    else
        echo ""
        echo "❌ Impossibile installare pdo_mysql automaticamente."
        echo "   Esegui manualmente:"
        echo "   sudo apt install php${PHP_VER}-mysql"
        echo "   oppure: sudo apt install php-mysql"
        exit 1
    fi
fi

# ─── Controlla/avvia MySQL ────────────────────────────────────────────────────
if mysqladmin ping --silent 2>/dev/null; then
    echo "✅ MySQL già attivo (senza password)"
elif mysqladmin ping -u root -proot --silent 2>/dev/null; then
    echo "✅ MySQL già attivo (root/root)"
else
    echo "⚠️  MySQL non risponde. Avvio..."
    sudo service mysql start 2>/dev/null || sudo systemctl start mysql 2>/dev/null
    sleep 3
    if mysqladmin ping --silent 2>/dev/null || mysqladmin ping -u root -proot --silent 2>/dev/null; then
        echo "✅ MySQL avviato"
    else
        echo "❌ MySQL non si avvia. Assicurati che sia installato:"
        echo "   sudo apt install mysql-server"
        exit 1
    fi
fi

# ─── Crea database e importa schema ──────────────────────────────────────────
echo ""
echo "📦 Inizializzazione database..."

# Prova prima senza password, poi con root/root
if mysql -u root --connect-timeout=5 -e "USE golden_striker;" 2>/dev/null; then
    echo "✅ Database golden_striker già esistente (no password)"
    DB_CMD="mysql -u root"
elif mysql -u root -proot --connect-timeout=5 -e "USE golden_striker;" 2>/dev/null; then
    echo "✅ Database golden_striker già esistente (root/root)"
    DB_CMD="mysql -u root -proot"
else
    echo "   Database non trovato, lo creo..."
    if mysql -u root --connect-timeout=5 -e "SELECT 1;" 2>/dev/null; then
        DB_CMD="mysql -u root"
    else
        DB_CMD="mysql -u root -proot"
    fi
    $DB_CMD < backend/config/schema.sql 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✅ Database creato e schema importato!"
    else
        echo "❌ Errore import schema. Controlla le credenziali MySQL in backend/config/db.php"
        exit 1
    fi
fi

# Aggiorna db.php in base alle credenziali funzionanti
if echo "$DB_CMD" | grep -q "proot"; then
    # Usa root/root
    sed -i "s/define('DB_PASS', '.*')/define('DB_PASS', 'root')/" backend/config/db.php 2>/dev/null
else
    # Usa root senza password
    sed -i "s/define('DB_PASS', '.*')/define('DB_PASS', '')/" backend/config/db.php 2>/dev/null
fi

echo ""
echo "🚀 Avvio server su http://localhost:8080"
echo "   Apri il browser su: http://localhost:8080"
echo "   (In Codespaces: apri la porta 8080 dal pannello PORTS)"
echo ""
echo "   Ctrl+C per fermare"
echo ""

php -S 0.0.0.0:8080 router.php
