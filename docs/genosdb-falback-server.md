# GenosDB Fallback Server

GenosDB is designed to run without servers by default.  
The **Fallback Server** is an optional Node.js service that can act as a superpeer to improve resilience in specific scenarios:

- When peers have limited uptime.  
- When you need reliable fallback connectivity.  
- When temporary coordination is required.  

This component does **not** turn GenosDB into a centralized system. It is optional and only enhances availability.  
The server behaves as just another peer in the network, participating like any other node.

Runs a real-time graph database server using GenosDB Fallback Server.  

## 🚀 You can deploy it to **Heroku** in one click.

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://www.heroku.com/deploy?template=https://github.com/estebanrfp/gdb-server)