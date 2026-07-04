#!/bin/bash
cd "$(dirname "$0")"

echo "▶ Deteniendo frontend y backend..."
pkill -f "vite" 2>/dev/null
pkill -f "gradlew\|spring-boot" 2>/dev/null

echo "▶ Deteniendo base de datos..."
docker compose down

echo "✔ Todo detenido."
