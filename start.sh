#!/bin/bash
cd "$(dirname "$0")"

echo "▶ Levantando base de datos..."
docker compose up -d

echo "▶ Levantando backend..."
cd api
chmod +x gradlew
./gradlew bootRun &
API_PID=$!
cd ..

echo "▶ Instalando dependencias del frontend..."
cd app
npm install --silent

echo "▶ Levantando frontend..."
npm run dev &
APP_PID=$!
cd ..

echo ""
echo "✔ Todo corriendo:"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:8080"
echo "  DB:       localhost:5432"
echo ""
echo "Presioná Ctrl+C para detener todo."

trap "kill $API_PID $APP_PID 2>/dev/null; docker compose down; echo '✔ Todo detenido.'" EXIT

wait
