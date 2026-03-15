#!/bin/bash
echo "⚽ GOLDEN STRIKER – Avvio Server"
sudo service mysql start 2>/dev/null
sleep 2
sudo chmod 666 /var/run/mysqld/mysqld.sock 2>/dev/null

# Crea DB se non esiste
mysql -u root -e "USE golden_striker;" 2>/dev/null || mysql -u root < backend/config/schema.sql

echo "🚀 Server su http://localhost:8080"
php -S 0.0.0.0:8080 router.php
