#!/bin/bash

echo "🔍 Sprawdzanie konfiguracji OAuth Discord..."
echo ""

# Sprawdź zmienne środowiskowe
echo "📋 Zmienne środowiskowe:"
if [ -f .env ]; then
  echo "✅ Plik .env istnieje"

  if grep -q "DISCORD_CLIENT_ID" .env; then
    echo "✅ DISCORD_CLIENT_ID ustawiony"
  else
    echo "❌ DISCORD_CLIENT_ID brakuje!"
  fi

  if grep -q "DISCORD_CLIENT_SECRET" .env; then
    echo "✅ DISCORD_CLIENT_SECRET ustawiony"
  else
    echo "❌ DISCORD_CLIENT_SECRET brakuje!"
  fi

  if grep -q "DISCORD_CALLBACK_URL" .env; then
    CALLBACK_URL=$(grep DISCORD_CALLBACK_URL .env | cut -d '=' -f2)
    echo "✅ DISCORD_CALLBACK_URL: $CALLBACK_URL"
  else
    echo "❌ DISCORD_CALLBACK_URL brakuje!"
  fi

  if grep -q "SESSION_SECRET" .env; then
    echo "✅ SESSION_SECRET ustawiony"
  else
    echo "❌ SESSION_SECRET brakuje!"
  fi
else
  echo "❌ Plik .env nie istnieje!"
fi

echo ""
echo "🌐 Testowanie endpointów:"

# Sprawdź czy serwer działa
if curl -s http://localhost:3000/auth/check > /dev/null 2>&1; then
  echo "✅ Serwer działa na porcie 3000"

  # Sprawdź /auth/check
  AUTH_RESPONSE=$(curl -s http://localhost:3000/auth/check)
  echo "✅ /auth/check odpowiada: $AUTH_RESPONSE"
else
  echo "❌ Serwer nie działa lub /auth/check nie odpowiada"
fi

echo ""
echo "📝 Następne kroki:"
echo "1. Upewnij się, że w Discord Developer Portal dodałeś redirect URLs"
echo "2. Uruchom serwer: npm start"
echo "3. Otwórz: http://2.59.135.27:3000"
echo "4. Kliknij 'Login with Discord'"
