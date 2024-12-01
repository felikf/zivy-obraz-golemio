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
/usr/bin/node /home/user/zivy-obraz-golemio/src/index.mjs > /tmp/log.txt
exit 0
```
