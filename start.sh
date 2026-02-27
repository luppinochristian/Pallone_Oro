#!/bin/bash
echo ""
echo "⚽ ================================="
echo "   GOLDEN STRIKER – Avvio Server"
echo "================================="
echo ""

# Controlla che MySQL sia attivo
if ! mysqladmin ping -u root -proot --silent 2>/dev/null; then
    echo "⚠️  MySQL non attivo. Avvio..."
    sudo service mysql start
    sleep 3
fi

echo "✅ MySQL attivo"
echo ""
echo "🚀 Avvio server su http://localhost:8080"
echo "   (In Codespaces: apri la porta 8080 dal pannello PORTS)"
echo ""
echo "   Ctrl+C per fermare"
echo ""

php -S 0.0.0.0:8080 router.php
