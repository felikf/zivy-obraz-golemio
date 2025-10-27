# Description

This is the JavaScript code that synchronises 'Živý Obraz' with the Golemio API (the public transport API in Prague).

The code fetches data from the Golemio API and imports it to 'Živý Obraz' via the API.

Synchronisation is achieved via the workflow `.github/workflows/traffic-sync.yml`.

This workflow is dispatched by a cron job every 10 minutes to run a script that fetches data for a specific stop ID.

## Initialisation

```bash
npm install
```

Set environment secrets:
Settings -> Secrets and variables -> Actions -> New repository secret

- `GOLEMIO_TOKEN` - [Golemio API token](https://api.golemio.cz/docs/openapi/)
- `ZIVY_OBRAZ_IMPORT_KEY` - [Živý obraz](https://zivyobraz.eu/?page=muj-ucet&hodnoty=1) import key
- `BAKALARI_BASE_URL` - Bakaláři instance base URL (e.g. `https://bakalari.gpisnicka.cz/bakaweb`)
- `BAKALARI_USERNAME` - Bakaláři username used for API login
- `BAKALARI_PASSWORD` - Bakaláři password used for API login

To run the script locally, set the environment variables in your shell:

```shell
export TOKEN=<token>
export IMPORT_KEY=<import_key>
export BAKALARI_BASE_URL=<https://your-bakalari-instance/bakaweb>
export BAKALARI_USERNAME=<username>
export BAKALARI_PASSWORD=<password>
```

## Simple start

The first argument is the stop ID.

```bash
  node src/traffic-sync.mjs U1330Z1
```

To synchronise grades from Bakaláři, run:

```bash
  node src/marks-sync.mjs
```

To synchronise homework deadlines from Bakaláři, run:

```bash
  node src/homeworks-sync.mjs
```

To synchronise planned tests and school events from Bakaláři, run:

```bash
  node src/events-sync.mjs
```
