#!/bin/bash
echo ""
echo "⚽ ================================="
echo "   GOLDEN STRIKER – Avvio Server"
echo "================================="
echo ""

# ─── Rileva versione PHP ───────────────────────────────────────────────────────
PHP_VER=$(php -r "echo PHP_MAJOR_VERSION.'.'.PHP_MINOR_VERSION;" 2>/dev/null)
if [ -z "$PHP_VER" ]; then
    echo "❌ PHP non trovato!"
    exit 1
fi
echo "✅ PHP $PHP_VER trovato"

# ─── Controlla driver pdo_mysql ───────────────────────────────────────────────
if php -m 2>/dev/null | grep -q "pdo_mysql"; then
    echo "✅ Driver pdo_mysql presente"
else
    echo "❌ Driver pdo_mysql mancante."
    echo "   Esegui:"
    echo "   echo 'extension=pdo_mysql.so' | sudo tee -a /opt/php/8.0.30/ini/php.ini"
    echo "   echo 'extension_dir=/usr/lib/php/20200930/' | sudo tee -a /opt/php/8.0.30/ini/php.ini"
    exit 1
fi

# ─── Fix permessi socket MySQL ────────────────────────────────────────────────
sudo chmod 666 /var/run/mysqld/mysqld.sock 2>/dev/null
sudo service mysql start 2>/dev/null
sleep 2
sudo chmod 666 /var/run/mysqld/mysqld.sock 2>/dev/null

# ─── Controlla MySQL ──────────────────────────────────────────────────────────
if sudo mysqladmin ping --silent 2>/dev/null; then
    echo "✅ MySQL attivo"
else
    echo "❌ MySQL non risponde. Provo avvio forzato..."
    sudo service mysql stop 2>/dev/null
    sleep 1
    sudo service mysql start 2>/dev/null
    sleep 3
    sudo chmod 666 /var/run/mysqld/mysqld.sock 2>/dev/null
    if ! sudo mysqladmin ping --silent 2>/dev/null; then
        echo "❌ MySQL non si avvia."
        exit 1
    fi
    echo "✅ MySQL avviato"
fi

# ─── Crea database se non esiste ─────────────────────────────────────────────
echo ""
echo "📦 Controllo database..."

if sudo mysql -e "USE golden_striker;" 2>/dev/null; then
    echo "✅ Database golden_striker già esistente"
else
    echo "   Creo il database..."
    sudo mysql < backend/config/schema.sql
    if [ $? -eq 0 ]; then
        echo "✅ Database creato!"
    else
        echo "❌ Errore creazione database."
        exit 1
    fi
fi

# Su Codespaces MySQL accetta root senza password via socket unix
sed -i "s/define('DB_PASS', '.*')/define('DB_PASS', '')/" backend/config/db.php 2>/dev/null

echo ""
echo "🚀 Server avviato su http://localhost:8080"
echo "   Apri la porta 8080 dal pannello PORTS di Codespaces"
echo ""
echo "   Ctrl+C per fermare"
echo ""

php -S 0.0.0.0:8080 router.php
