# CRUD Operations Guide

GenosDB provides several CRUD operations. Each has its own dedicated guide:
---

| Method                     | Description                                                                                                   |
| -------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `put(value, id)`           | Inserts or updates a node with the provided value. If `id` is not specified, it is automatically generated using a hash of the value. Updates the inverted index and triggers real-time synchronization. |
| `get(id, callback)`                  | Retrieves the node with the specified ID and handles it using a callback function. | 
| `get(id)`                  | Retrieves the node with the specified ID and returns its value directly. |                                     
| `link(sourceId, targetId)` | Creates a unidirectional relationship between two nodes identified by `sourceId` and `targetId`. Ensures both nodes exist before creating the link. |
| `map({}, ({ ...fields }) => {})` | Iterates over all nodes in the database. Executes callback for each node with destructured fields (e.g., id, value, edges, timestamp, action). If realtime is true, listens for future updates. If iterable is false, passes all nodes as an array to the callback. |
| `remove(id)`               | Deletes a node by its ID. Also removes references to this node in other nodes' edges and updates the inverted index. Triggers real-time synchronization. |
| `clear()`                  | Deletes all nodes, relationships, and indexes from the database. Removes associated files from OPFS.         |

---

- [PUT Guide](PUT-Guide.md)
- [GET Guide](GET-Guide.md)
- [MAP Guide](MAP-Guide.md)
- [REMOVE Guide](REMOVE-Guide.md)
- [LINK Guide](LINK-Guide.md)

