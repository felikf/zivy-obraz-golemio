# Description

Javascript code for synchronization between "Živý obraz" and Golemio API (Public Transport API in Prague).

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

```bash
  node src/traffic-sync.mjs
```

## Raspberry Pi

### Install required packages

```bash
apt get update
apt install nodejs
apt install npm
apt install git
git clone https://github.com/felikf/zivy-obraz-golemio.git
```

### Configure

```bash
sudo touch /etc/rc.local 
sudo nano /etc/rc.local
sudo chmod +x /etc/rc.local
```

### /etc/rc.local

```bash
#!/bin/sh -e

# wait for network services to start
sleep 60

# setup environment variables
export TOKEN=XXX
export IMPORT_KEY=YYY
  
# run the script
/usr/bin/node /home/user/zivy-obraz-golemio/src/traffic-sync.mjs > /tmp/log.txt
exit 0
```

### Start using m2

[PM2](https://www.npmjs.com/package/pm2) is a production process manager for Node.js.

> Your app is now daemonized, monitored and kept alive forever.

```shell
npm install -g pm2
pm2 start src/traffic-sync.mjs --name traffic-sync
pm2 start src/proverb-sync.mjs --name proverb-sync
```

```shell
pm2 logs proverb-sync
pm2 logs traffic-sync
```

```shell
pm2 list
```
