#!/usr/bin/env node

/**
 * Skrypt testowy OAuth Discord
 * Wyświetla informacje o konfiguracji OAuth bez uruchamiania serwera
 */

const fs = require('fs');
const path = require('path');

// Load .env file manually
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      process.env[key] = value;
    }
  });
}

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, symbol, message) {
  console.log(`${color}${symbol}${colors.reset} ${message}`);
}

console.log(`\n${colors.cyan}╔════════════════════════════════════════════╗${colors.reset}`);
console.log(`${colors.cyan}║   🔐 Discord OAuth Configuration Test    ║${colors.reset}`);
console.log(`${colors.cyan}╚════════════════════════════════════════════╝${colors.reset}\n`);

// Sprawdź zmienne środowiskowe
const requiredVars = [
  'DISCORD_CLIENT_ID',
  'DISCORD_CLIENT_SECRET',
  'DISCORD_CALLBACK_URL',
  'SESSION_SECRET',
  'PORT'
];

console.log(`${colors.blue}📋 Zmienne środowiskowe:${colors.reset}\n`);

let allPresent = true;
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    // Maskuj wrażliwe dane
    let displayValue = value;
    if (varName.includes('SECRET') || varName.includes('TOKEN')) {
      displayValue = '***' + value.slice(-4);
    }
    log(colors.green, '✓', `${varName}: ${displayValue}`);
  } else {
    log(colors.red, '✗', `${varName}: BRAKUJE!`);
    allPresent = false;
  }
});

console.log();

// Generuj OAuth URL
if (process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CALLBACK_URL) {
  const callbackURL = encodeURIComponent(process.env.DISCORD_CALLBACK_URL);
  const oauthURL = `https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${callbackURL}&response_type=code&scope=identify%20guilds`;

  console.log(`${colors.blue}🔗 OAuth URL:${colors.reset}\n`);
  console.log(`${oauthURL}\n`);
}

// Podsumowanie
console.log(`${colors.blue}📊 Podsumowanie:${colors.reset}\n`);

if (allPresent) {
  log(colors.green, '✓', 'Wszystkie wymagane zmienne są ustawione');
} else {
  log(colors.red, '✗', 'Brakuje niektórych zmiennych środowiskowych');
}

// Sprawdź długość SESSION_SECRET
if (process.env.SESSION_SECRET) {
  const length = process.env.SESSION_SECRET.length;
  if (length >= 32) {
    log(colors.green, '✓', `SESSION_SECRET ma odpowiednią długość (${length} znaków)`);
  } else {
    log(colors.yellow, '⚠', `SESSION_SECRET jest zbyt krótki (${length} znaków). Zalecane minimum: 32 znaki`);
  }
}

// Sprawdź format callback URL
if (process.env.DISCORD_CALLBACK_URL) {
  const url = process.env.DISCORD_CALLBACK_URL;
  if (url.includes('/auth/discord/callback')) {
    log(colors.green, '✓', 'DISCORD_CALLBACK_URL ma poprawny format');
  } else {
    log(colors.yellow, '⚠', 'DISCORD_CALLBACK_URL może mieć niepoprawny format');
  }
}

console.log();
console.log(`${colors.cyan}════════════════════════════════════════════${colors.reset}`);
console.log(`${colors.blue}📝 Następne kroki:${colors.reset}`);
console.log(`${colors.reset}1. Sprawdź Discord Developer Portal:`);
console.log(`   https://discord.com/developers/applications`);
console.log(`${colors.reset}2. Upewnij się, że Redirect URLs są dodane`);
console.log(`${colors.reset}3. Uruchom serwer: npm start`);
console.log(`${colors.reset}4. Testuj logowanie: http://localhost:${process.env.PORT || 3000}`);
console.log(`${colors.cyan}════════════════════════════════════════════${colors.reset}\n`);
