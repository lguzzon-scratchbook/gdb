# How to Run Your Own Nostr Relay for GenosDB (in under 5 minutes)

GenosDB / GenosRTC uses the Nostr relay network for peer discovery and signaling.  
By running your own Nostr relay, you get:

- Full control over your signaling infrastructure
- Better privacy and reliability
- The ability to run public, private, or paid relays and point GenosDB to them via `relayUrls`

This guide shows how to deploy a Nostr relay using the nostream implementation on an Ubuntu VM, fronted by Nginx with HTTPS.

## 1. Prerequisites

Before you start, you will need:

- A cloud VM (e.g. DigitalOcean, Linode, AWS, GCP, Azure, etc.)
- A domain name with access to its DNS configuration
- Basic familiarity with server administration

## 2. Provision and access your VM

Create and connect to an Ubuntu-based server. Then install required packages:

```bash
sudo apt update
sudo apt install -y nodejs npm nginx certbot python3-certbot-nginx git tmux curl
```

## 3. Install Docker and Docker Compose

Add Docker's GPG key and repository, then install:

```bash
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

echo   "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg]   https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"   | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo chmod a+r /etc/apt/keyrings/docker.gpg
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
```

Verify installed versions:

```bash
docker --version
npm --version
node --version
```

## 4. Clone the nostream relay

```bash
git clone https://github.com/Cameri/nostream.git
cd nostream
```

## 5. Configure Nginx as a reverse proxy

Remove default config:

```bash
sudo rm -f /etc/nginx/sites-available/default
```

Create a new config:

```bash
sudo nano /etc/nginx/sites-available/default
```

Insert:

```nginx
server {
    server_name relay.example.com;

    location / {
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $host;

        proxy_pass http://127.0.0.1:8008;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Test and reload:

```bash
sudo nginx -t
sudo service nginx restart
```

## 6. Configure DNS

Add an A record pointing your domain (e.g. relay.example.com) to your VM IP.

## 7. Enable HTTPS with Certbot

```bash
sudo certbot --nginx -d relay.example.com
```

## 8. Start the relay using tmux

```bash
tmux
cd ~/nostream
npm run docker:compose:start
```

Detach with: Ctrl+B, then D  
Reattach with: `tmux a`

## 9. Test your relay

Use any WebSocket testing tool to connect:

```
wss://relay.example.com
```

If the connection succeeds, your relay is live.

## 10. Use your relay in GenosDB

```javascript
import { gdb } from "genosdb"

const db = await gdb("my-db", {
  rtc: {
    relayUrls: [
      "wss://relay.example.com",
      "wss://another-relay.example.org"
    ]
  }
})
```

## 11. Production considerations

For production deployments, consider:

- Event limits and retention
- Authentication or access control
- Monitoring and logging
- Updating Docker images regularly

More details: https://github.com/Cameri/nostream

