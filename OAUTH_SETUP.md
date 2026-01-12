# 🔐 Przewodnik konfiguracji OAuth Discord

## ✅ Checklist konfiguracji

### Discord Developer Portal
- [ ] Utwórz aplikację na https://discord.com/developers/applications
- [ ] Skopiuj Client ID
- [ ] Skopiuj Client Secret
- [ ] Dodaj Redirect URLs:
  - [ ] `http://2.59.135.27:3000/auth/discord/callback`
  - [ ] `http://localhost:3000/auth/discord/callback`
- [ ] Zapisz zmiany (Save Changes)

### Backend (.env)
- [x] DISCORD_CLIENT_ID - ✅ Skonfigurowany
- [x] DISCORD_CLIENT_SECRET - ✅ Skonfigurowany
- [x] DISCORD_CALLBACK_URL - ✅ Skonfigurowany
- [x] SESSION_SECRET - ✅ Skonfigurowany
- [x] PORT=3000 - ✅ Skonfigurowany

### Kod (już gotowe!)
- [x] Passport Discord Strategy - ✅ index.js:74-108
- [x] Route /auth/discord - ✅ index.js:113
- [x] Route /auth/discord/callback - ✅ index.js:114-118
- [x] Route /auth/check - ✅ index.js:120-126
- [x] Przycisk logowania w UI - ✅ Navigation.js

## 🔄 Flow logowania

```
┌─────────────┐
│  Użytkownik │
│   kliknij   │
│   "Login"   │
└──────┬──────┘
       │
       ↓
┌─────────────────────────────────────────────────────────┐
│  GET http://2.59.135.27:3000/auth/discord               │
└──────┬──────────────────────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────────────────────┐
│  Backend przekierowuje do Discord OAuth                 │
│  https://discord.com/api/oauth2/authorize?              │
│    client_id=YOUR_CLIENT_ID                             │
│    &redirect_uri=http://2.59.135.27:3000/auth/...       │
│    &scope=identify+guilds                               │
└──────┬──────────────────────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────────────────────┐
│  Discord - Użytkownik autoryzuje aplikację              │
│  "Authorize" lub "Cancel"                               │
└──────┬──────────────────────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────────────────────┐
│  Discord przekierowuje z kodem:                         │
│  GET http://2.59.135.27:3000/auth/discord/callback      │
│      ?code=AUTHORIZATION_CODE                           │
└──────┬──────────────────────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────────────────────┐
│  Backend (Passport):                                     │
│  1. Wymienia kod na access_token                        │
│  2. Pobiera dane użytkownika (profile)                  │
│  3. Tworzy/aktualizuje użytkownika w bazie              │
│  4. Tworzy sesję (req.user)                             │
│  5. Przekierowuje do "/"                                │
└──────┬──────────────────────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────────────────────┐
│  Frontend:                                               │
│  1. Wykonuje GET /auth/check                            │
│  2. Otrzymuje { isAuthenticated: true, username: ... }  │
│  3. Wyświetla nawigację dla zalogowanego                │
└─────────────────────────────────────────────────────────┘
```

## 🧪 Testowanie

### Krok 1: Uruchom skrypt testowy
```bash
./check-oauth.sh
```

### Krok 2: Uruchom serwer
```bash
npm start
```

### Krok 3: Testuj w przeglądarce

1. Otwórz: http://2.59.135.27:3000
2. Kliknij "Login with Discord"
3. Zaloguj się na Discord
4. Kliknij "Authorize"
5. Powinieneś być przekierowany z powrotem jako zalogowany

### Krok 4: Sprawdź sesję

Otwórz DevTools → Application → Cookies → Powinien być cookie `connect.sid`

### Krok 5: Sprawdź bazę danych

```bash
mysql -u kiraevo -p kiraevo
SELECT * FROM Users;
```

## ❌ Troubleshooting

### Błąd: "redirect_uri_mismatch"

**Przyczyna:** URL callback w Discord Portal nie zgadza się z tym w .env

**Rozwiązanie:**
1. Sprawdź DISCORD_CALLBACK_URL w .env
2. Upewnij się, że DOKŁADNIE ten sam URL jest w Discord Portal
3. Kliknij "Save Changes" w Discord Portal

### Błąd: "invalid_client"

**Przyczyna:** Nieprawidłowy Client ID lub Client Secret

**Rozwiązanie:**
1. Sprawdź czy DISCORD_CLIENT_ID w .env zgadza się z Discord Portal
2. Reset Client Secret w Discord Portal i zaktualizuj .env
3. Restartuj serwer: `npm start`

### Nie działa sesja (zawsze niezalogowany)

**Przyczyna:** Problem z cookie

**Rozwiązanie:**
1. Sprawdź czy `SESSION_SECRET` jest ustawiony w .env
2. Jeśli używasz HTTPS, ustaw `cookie.secure: true` w index.js
3. Sprawdź czy CORS jest poprawnie skonfigurowany
4. Wyczyść cookies w przeglądarce

### Błąd 429 (Too Many Requests)

**Przyczyna:** Rate limiting Discord API

**Rozwiązanie:**
- Poczekaj 15 minut
- Backend ma automatyczne retry (axiosRetry)

## 📚 Dokumentacja

- Discord OAuth2: https://discord.com/developers/docs/topics/oauth2
- Passport Discord: https://www.passportjs.org/packages/passport-discord/
- Express Session: https://github.com/expressjs/session

## 🔒 Bezpieczeństwo

### ⚠️ NIGDY nie udostępniaj:
- DISCORD_CLIENT_SECRET
- SESSION_SECRET
- DISCORD_BOT_TOKEN

### ✅ Dobre praktyki:
- Używaj długich, losowych SESSION_SECRET (min. 32 znaki)
- W produkcji ustaw `cookie.secure: true` (HTTPS)
- Regularnie rotuj Client Secret
- Ogranicz scope do minimum potrzebnego
- Monitoruj logi błędów

## 📝 Notatki

Twoja obecna konfiguracja:
- Client ID: 1237706962158878752
- Callback URL: http://2.59.135.27:3000/auth/discord/callback
- Scopes: identify, guilds
- Port: 3000
- Session: 24h maxAge
