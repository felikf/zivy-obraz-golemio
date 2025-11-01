# Synchronizační skripty pro Živý Obraz

Tento projekt obsahuje JavaScriptové skripty pro synchronizaci dat mezi různými API a platformou Živý Obraz.

## Forkování a úprava pro vlastní použití

1. Vytvořte fork:
   Na stránce repozitáře klikněte na tlačítko Fork a vytvořte kopii do svého GitHub účtu.
1. Nastavte vlastní tajné klíče:
   Ve svém forku přejděte do Settings > Secrets and variables > Actions a nastavte potřebné klíče podle sekce Nastavení.
1. Upravte workflow nebo skripty:
   Můžete upravit .github/workflows/*.yml soubory (např. časování, parametry) nebo samotné skripty v src/ podle svých
   potřeb.
1. Spouštění:
   Workflow se spouští automaticky podle nastaveného cron výrazu nebo ručně přes GitHub Actions (Run workflow).

---

## Popis skriptů a workflow

### Traffic Sync (Golemio ⇄ Živý Obraz)
- **Účel:** Synchronizace dat o veřejné dopravě z Golemio API do Živého Obrazu.
- **Workflow:** `\.github/workflows/traffic-sync.yml`
- **Spouštění:** Automaticky každých 10 minut (cron: `*/10 * * * *`) nebo ručně přes GitHub Actions.
- **Skript:** `src/traffic-sync.mjs`

### Marks Sync (Bakaláři ⇄ Živý Obraz)
- **Účel:** Synchronizace známek z Bakalářů do Živého Obrazu.
- **Workflow:** `\.github/workflows/marks-sync.yml`
- **Spouštění:** Automaticky denně v 6:00 (cron: `0 6 * * *`) nebo ručně přes GitHub Actions.
- **Skript:** `src/marks-sync.mjs`

### Homeworks Sync (Bakaláři ⇄ Živý Obraz)
- **Účel:** Synchronizace domácích úkolů z Bakalářů do Živého Obrazu.
- **Workflow:** `\.github/workflows/homeworks-sync.yml`
- **Spouštění:** Automaticky denně v 5:00 (cron: `0 6 * * *`) nebo ručně přes GitHub Actions.
- **Skript:** `src/homeworks-sync.mjs`

### Events Sync (Bakaláři ⇄ Živý Obraz)
- **Účel:** Synchronizace plánovaných testů a školních akcí z Bakalářů do Živého Obrazu.
- **Workflow:** `\.github/workflows/events-sync.yml`
- **Spouštění:** Automaticky denně ve 4:00 (cron: `0 6 * * *`) nebo ručně přes GitHub Actions.
- **Skript:** `src/events-sync.mjs`

### Proverb Sync (Statické přísloví ⇄ Živý Obraz)
- **Účel:** Odesílání náhodného přísloví do Živého Obrazu.
- **Workflow:** `\.github/workflows/proverb-sync.yml`
- **Spouštění:** Automaticky denně v 6:00 (cron: `0 6 * * *`) nebo ručně přes GitHub Actions.
- **Skript:** `src/proverb-sync.mjs`

---

## Požadavky

- **Node.js:** Verze 20
- **Balíčky:** Nainstalujte pomocí `npm install`

---

## Nastavení

### Prostředí

Nastavte následující tajné klíče v GitHub repozitáři (Settings > Secrets and variables > Actions):

- `GOLEMIO_TOKEN` - [Golemio API token](https://api.golemio.cz/docs/openapi/)
- `GOLEMIO_STOP_ID` - ID zastávky pro sledování
- `ZIVY_OBRAZ_IMPORT_KEY` - [Živý Obraz import key](https://zivyobraz.eu/?page=muj-ucet&hodnoty=1)
- `BAKALARI_BASE_URL` - URL instance Bakalářů
- `BAKALARI_USERNAME` - Uživatelské jméno pro API Bakalářů
- `BAKALARI_PASSWORD` - Heslo pro API Bakalářů

### Lokální spuštění

Nastavte proměnné prostředí ve vašem shellu:
```shell
export TOKEN=<GOLEMIO_TOKEN>
export IMPORT_KEY=<ZIVY_OBRAZ_IMPORT_KEY>
export BAKALARI_BASE_URL=<https://your-bakalari-instance/bakaweb>
export BAKALARI_USERNAME=<username>
export BAKALARI_PASSWORD=<password>

```

---

## Spuštění skriptů

Pro spuštění jednotlivých skriptů lokálně použijte následující příkazy:

```shell
npm install

node src/traffic-sync.mjs
node src/marks-sync.mjs
node src/homeworks-sync.mjs
node src/events-sync.mjs
node src/proverb-sync.mjs
```

---

## Linky

- [Golemio API dokumentace](https://api.golemio.cz/docs/openapi/)
- [Živý Obraz - Můj účet](https://zivyobraz.eu)
- [Bakaláři API dokumentace](https://api.bakalari.cz/docs/)
- [Bakaláři API endpoints](https://github.com/bakalari-api/bakalari-api-v3/blob/master/endpoints.md)


