# Description

Javascript code for synchronization between "Živý obraz" and Golemio API (public transport).

The code will fetch data from Golemio API and import them to "Živý obraz" using their API.

## Initialisation

```bash
npm install
```

Set environment variables:

* `TOKEN` - [Golemio API token](https://api.golemio.cz/docs/openapi/)
* `IMPORT_KEY` - [Živý obraz](https://zivyobraz.eu/?page=muj-ucet&hodnoty=1) import key

Start:

```bash
  node src/index.mjs
```
