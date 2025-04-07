// ========================================================================
// GDB - Distributed Graph Database (Server Implementation)
// ========================================================================
// Core Capabilities:
// - Real-time P2P synchronization | Local file system persistence
// - Automatic conflict resolution | Compressed data transfer
//
// Architecture: CRDTs + MessagePack + WebRTC + Node.js File System
//
// Sync Features:
// - P2P synchronization with LWW (Last-Write-Wins) conflict resolution ⚖️
// - Hybrid approach: Timestamp-based merging
// - Local file system persistence for server-side storage
//
// Dependencies:
// - @msgpack/msgpack: For serialization
// - pako: For compression
// - trystero: For P2P communication
// - fs/promises: For local file system operations
// - webrtc-polyfill: For WebRTC compatibility in Node.js
// - HybridClock: For timestamp management
// ========================================================================

import express from "express";
import fs from "fs/promises";
import path from "path";
import { joinRoom } from "trystero";
import { resolveConflict } from './lib/components/conflictResolver.js';
import { encode, decode } from "@msgpack/msgpack";
import pako from "pako";
import { RTCPeerConnection } from "webrtc-polyfill"; // Import the polyfill
import { HybridClock } from "./lib/components/HybridClock.js";

// Helper function to compare arrays
function arraysEqual(a, b) {
  return a.length === b.length && a.every((val, i) => val === b[i]);
}

// Graph Implementation
class Graph {
  constructor() {
    this.nodes = {};
  }

  insert(id, value, timestamp) {
    this.nodes[id] = { id, value, edges: [], timestamp };
  }

  get(id) {
    return this.nodes[id] || null;
  }

  link(sourceId, targetId) {
    const sourceNode = this.nodes[sourceId];
    const targetNode = this.nodes[targetId];
    if (sourceNode && targetNode && !sourceNode.edges.includes(targetId)) {
      sourceNode.edges.push(targetId); // Only store IDs
    }
  }

  getAllNodes() {
    return Object.values(this.nodes);
  }

  serialize() {
    return pako.deflate(encode(this.nodes));
  }

  deserialize(data) {
    this.nodes = decode(pako.inflate(new Uint8Array(data)));
  }
}

// GraphDB Server Implementation
export default class GraphDBServer {
  constructor(name = process.argv[2] || "default", { password } = {}, storageDir = "./storage") {
    this.hybridClock = new HybridClock();
    this.globalTimestamp = 0; // Initialize global timestamp
    this.name = name;
    this.password = password;
    this.graph = new Graph();
    this.storageDir = storageDir;
    this.clients = new Set(); // Almacenar clientes SSE

    // Ensure the storage directory exists
    this.ensureStorageDirectory();

    // Wait for the graph to load from the local file system
    this.ready = this.loadGraphFromLocalStorage();

    // Trystero configuration with unique key based on the database name
    const key = `graph-sync-room-${this.name}`;

    console.log(`   P2P room key: ${key}`);

    const roomConfig = {
      appId: "1234",
      ...(this.password && { password: this.password }),
      rtcPolyfill: RTCPeerConnection, // Use the webrtc-polyfill here
    };
    const room = joinRoom(roomConfig, key);
    this.room = room;

    const [sendData, getData] = room.makeAction("syncGraph");
    this.sendData = sendData;

    // Listen for changes on the P2P network
    getData(data => this.receiveChanges(data));

    // Handle peer connections
    room.onPeerJoin(peerId => {
      console.log("⚡ New peer connected:", peerId);
      this.broadcastToClients({ type: "peerJoin", peerId });
      this.sendData([{ type: "sync", timestamp: this.globalTimestamp }]);
    });

    room.onPeerLeave(peerId => {
      console.log("⚡ Peer disconnected:", peerId);
      this.broadcastToClients({ type: "peerLeave", peerId });
    });
  }

  // Broadcast events to all connected SSE clients
  broadcastToClients(event) {
    const data = `data: ${JSON.stringify(event)}\n\n`;
    for (const client of this.clients) {
      client.write(data);
    }
  }

  // Ensure the storage directory exists
  async ensureStorageDirectory() {
    try {
      await fs.mkdir(this.storageDir, { recursive: true });
      console.log(`Storage directory created/exists: ${this.storageDir}`);
    } catch (error) {
      console.error("Error ensuring storage directory:", error.message);
    }
  }

  // Load the graph from the local file system
  async loadGraphFromLocalStorage() {
    try {
      const filePath = path.join(this.storageDir, `${this.name}_graph.msgpack`);
      let graphContent;

      try {
        graphContent = await fs.readFile(filePath);
      } catch (error) {
        if (error.code === "ENOENT") {
          console.warn("The file '_graph.msgpack' does not exist. Initializing an empty graph.");
          graphContent = new Uint8Array();
        } else {
          throw error;
        }
      }

      if (graphContent.byteLength > 0) {
        this.graph.deserialize(graphContent);
        console.log(`Graph loaded from local storage: [ ${this.graph.getAllNodes().length} nodes ]`);
      } else {
        console.warn("The file '_graph.msgpack' is empty or could not be loaded.");
      }
    } catch (error) {
      console.error("Error loading graph from local storage:", error.message);
    }
  }

  // Save the graph to the local file system
  async saveGraphToLocalStorage() {
    try {
      const serializedGraph = this.graph.serialize();
      const filePath = path.join(this.storageDir, `${this.name}_graph.msgpack`);
      await fs.writeFile(filePath, Buffer.from(serializedGraph));
  
      console.log("Graph saved to local storage successfully.");
    } catch (error) {
      console.error("Error saving graph to local storage:", error.message);
    }
  }

  // Insert or update a value in the graph and save changes
  async put(value, id) {
    await this.ready; // Ensure the graph is ready
    const timestamp = this.hybridClock.now();
    id ??= crypto.randomUUID(); // Generate ID if not provided
    this.graph.insert(id, value, timestamp);
    this.updateGlobalTimestamp(timestamp);
    await this.saveGraphToLocalStorage();
    this.sendData([{ type: "insert", id, value, timestamp }]);
    console.log(`Inserted node with ID: ${id}`);
    return id;
  }

  // Remove a node by ID and clean up references
  async remove(id) {
    await this.ready; // Ensure the graph is ready
    const timestamp = this.hybridClock.now();
    const node = this.graph.get(id);
    if (!node) return console.error(`Node with ID '${id}' not found.`);
    delete this.graph.nodes[id];
    Object.values(this.graph.nodes).forEach(otherNode =>
      otherNode.edges = otherNode.edges.filter(edgeId => edgeId !== id)
    );
    this.updateGlobalTimestamp(timestamp);
    await this.saveGraphToLocalStorage();
    this.sendData([{ type: "remove", id, value: node.value, timestamp }]);
    console.log(`Removed node with ID: ${id}`);
  }

  // Create a link between two nodes and notify peers
  async link(sourceId, targetId) {
    await this.ready; // Ensure the graph is ready
    const timestamp = this.hybridClock.now();
    if (!this.graph.nodes[sourceId] || !this.graph.nodes[targetId]) {
      console.error(`One or both nodes (${sourceId}, ${targetId}) do not exist.`);
      return;
    }
    this.graph.link(sourceId, targetId);
    this.updateGlobalTimestamp(timestamp);
    await this.saveGraphToLocalStorage();
    this.sendData([{ type: "link", sourceId, targetId, timestamp }]);
    console.log(`Linked nodes ${sourceId} and ${targetId}`);
  }

  // Replace the local graph with the remote graph and save changes
  async applyFullGraph(remoteGraph) {
    try {
      this.graph.nodes = { ...remoteGraph.nodes };
      await this.saveGraphToLocalStorage();
      console.log("Applied full graph from remote node.");
    } catch (error) {
      console.error(`Error applying the full graph: ${error.message}`);
    }
  }

  // Handle incoming changes and apply them to the graph
  async receiveChanges(changes) {    
    const handlers = {
      // insert: change => this.graph.insert(change.id, change.value, change.timestamp),
      insert: change => {
        const existingNode = this.graph.get(change.id);
        if (existingNode) {
          // Si el nodo ya existe, resolvemos el conflicto
          const resolution = resolveConflict(existingNode, change, this.hybridClock);
          if (resolution.resolved) {
            Object.assign(existingNode, { value: resolution.value, timestamp: resolution.timestamp });
          }
        } else {
          // Si el nodo no existe, simplemente lo insertamos
          this.graph.insert(change.id, change.value, change.timestamp);
        }
      },
      update: change => {
        const node = this.graph.get(change.id);
        const resolution = resolveConflict(node, change, this.hybridClock);
        resolution.resolved && Object.assign(node, { value: resolution.value, timestamp: resolution.timestamp });
      },
      remove: change => delete this.graph.nodes[change.id],
      link: change => this.graph.link(change.sourceId, change.targetId),
      sync: change => {
        if (this.hybridClock.compare(this.globalTimestamp, change.timestamp) > 0) {
          console.log("Sending recent data to the remote node.");
          this.sendData([{ type: "syncReceive", graph: this.graph }]);
        }
      },
      syncReceive: change => this.applyFullGraph(change.graph)
    };

    for (const change of changes) handlers[change.type]?.(change);
    await this.saveGraphToLocalStorage();
  }

  // Update the global timestamp
  updateGlobalTimestamp(timestamp) {
    if (this.hybridClock.compare(timestamp, this.globalTimestamp) > 0) {
      this.globalTimestamp = timestamp;
    }
  }
}

// Initialize the server
const graphDBServer = new GraphDBServer(process.argv[2] || "default");

// Express setup
const app = express();
const PORT = 3000;
// const STORAGE_DIR = path.join(process.cwd(), "storage");

// Middleware to parse JSON
app.use(express.json());

// Endpoint to serve the HTML page
app.get("/", (req, res) => {
  // Configurar las cabeceras para enviar HTML
  res.setHeader("Content-Type", "text/html");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // Enviar el HTML inicial al cliente
  res.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>GraphDB Real-Time Connections</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
        }
        #connections {
          margin-top: 20px;
        }
        .peer {
          padding: 10px;
          border-bottom: 1px solid #ccc;
        }
      </style>
    </head>
    <body>
      <h1>GraphDB Real-Time Connections</h1>
      <div id="connections">
        <p>No connections yet :-).</p>
      </div>
      <script>
        const connectionsDiv = document.getElementById("connections");

        // Conectar al servidor usando SSE
        const eventSource = new EventSource("/events");
        eventSource.onmessage = event => {
          const data = JSON.parse(event.data);

          if (data.type === "peerJoin") {
            addPeer(data.peerId);
          } else if (data.type === "peerLeave") {
            removePeer(data.peerId);
          }
        };

        function addPeer(peerId) {
          // Verificar si el peer ya existe en la lista
          const existingPeer = document.querySelector(\`[data-peer-id="\${peerId}"]\`);
          if (existingPeer) return;

          // Crear un nuevo elemento para el peer
          const div = document.createElement("div");
          div.className = "peer";
          div.setAttribute("data-peer-id", peerId); // Identificador único
          div.textContent = \`Peer: \${peerId}\`;
          connectionsDiv.appendChild(div);

          // Eliminar el mensaje "No connections yet" si es necesario
          const noConnectionsMessage = connectionsDiv.querySelector("p");
          if (noConnectionsMessage) {
            connectionsDiv.removeChild(noConnectionsMessage);
          }
        }

        function removePeer(peerId) {
          // Encontrar y eliminar el elemento correspondiente al peer
          const peerDiv = document.querySelector(\`[data-peer-id="\${peerId}"]\`);
          if (peerDiv) {
            connectionsDiv.removeChild(peerDiv);
          }

          // Mostrar el mensaje "No connections yet" si no hay más peers
          if (connectionsDiv.children.length === 0) {
            const noConnectionsMessage = document.createElement("p");
            noConnectionsMessage.textContent = "No connections yet :-).";
            connectionsDiv.appendChild(noConnectionsMessage);
          }
        }
      </script>
    </body>
    </html>
  `);

  // Finalizar la respuesta para el HTML inicial
  res.end();
});

// Endpoint para manejar SSE
app.get("/events", (req, res) => {
  // Configurar las cabeceras para SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // Agregar el cliente a la lista de clientes activos
  graphDBServer.clients.add(res);

  // Eliminar el cliente cuando se cierra la conexión
  req.on("close", () => {
    graphDBServer.clients.delete(res);
  });
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`⚡ Server listening on port ${PORT}`);
});