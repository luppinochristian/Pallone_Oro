#!/bin/bash
echo ""
echo "⚽ ================================="
echo "   GOLDEN STRIKER – Avvio Server"
echo "================================="
echo ""

# Fix permessi socket MySQL
sudo service mysql start 2>/dev/null
sleep 2
sudo chmod 666 /var/run/mysqld/mysqld.sock 2>/dev/null
echo "✅ MySQL attivo"

# Crea database se non esiste
echo "📦 Controllo database..."
if sudo mysql -e "USE golden_striker;" 2>/dev/null; then
    echo "✅ Database già esistente"
else
    echo "   Creo il database..."
    sudo mysql < backend/config/schema.sql
    echo "✅ Database creato!"
fi

echo ""
echo "🚀 Server avviato su http://localhost:8080"
echo "   Apri la porta 8080 dal pannello PORTS di Codespaces"
echo "   Ctrl+C per fermare"
echo ""

php -S 0.0.0.0:8080 router.php
