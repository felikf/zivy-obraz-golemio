# Description

JavaScript code for synchronization between "Živý obraz" and Golemio API (Public Transport API in Prague).

The code will fetch data from Golemio API and import them to "Živý obraz" using the API.

## Initialisation

```bash
npm install
```

Set environment variables:

* `TOKEN` - [Golemio API token](https://api.golemio.cz/docs/openapi/)
* `IMPORT_KEY` - [Živý obraz](https://zivyobraz.eu/?page=muj-ucet&hodnoty=1) import key

```shell
export TOKEN=XXX
export IMPORT_KEY=YYY
```

## Simple start

The first argument is the stop ID.

```bash
  node src/traffic-sync.mjs U1330Z1
```

