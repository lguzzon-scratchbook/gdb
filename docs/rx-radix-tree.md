# Radix Index (`rx`) Implementation: Features and Capabilities
![image](https://github.com/user-attachments/assets/fe84128e-ec7d-422e-9938-c78f0bcfb538)

The Radix Index module provides high-performance, prefix-based search capabilities for `genosdb`. It is built on a **Radix tree (prefix tree)**, making it exceptionally fast for applications like autocomplete, real-time filtering of identifiers, and querying data with hierarchical or structured IDs.

When enabled, the module automatically indexes the properties of every node you `put` into the database. This index is then used to accelerate queries that filter nodes by a starting prefix.

---

### **Enabling the Module**

To use the Radix Index, simply enable it during database initialization by setting the `rx` option to `true`.

```javascript
import { gdb } from "genosdb";

// Enable the Radix Index module during initialization
const db = await gdb("my-database", { rx: true });
```

No further setup is required. The module will automatically build and maintain the index in the background.

---

### **Features & Usage**

#### 1. Automatic Indexing

The module transparently hooks into `db.put()` and `db.remove()`. Whenever you add, update, or delete a node, the Radix index is updated automatically. You don't need to manage the index manually.

```javascript
// These operations will automatically update the Radix index
const id1 = await db.put({ type: "user", username: "alice_123" });
const id2 = await db.put({ type: "user", username: "alicia_789" });
const id3 = await db.put({ type: "document", name: "alpha-report.pdf" });

await db.remove(id3); // The index is updated on removal as well
```

#### 2. Querying with `db.map()` using `$startsWith`

The primary way to use the index is through the `db.map()` method, which is extended to support a new `$startsWith` operator on the `id` field within a query. This allows you to efficiently retrieve all nodes whose IDs begin with a specific prefix.

```javascript
// Find all nodes whose ID starts with a specific prefix
const { results } = await db.map({
  query: {
    id: { $startsWith: "b4fae" }, // Assuming 'b4fae...' is the start of an ID hash
  },
});

console.log(results);
```

This is significantly faster than fetching all nodes and filtering them in your application, especially with large datasets.

#### 3. Direct Search with `db.searchByPrefix()`

The module also adds a new convenience method, `db.searchByPrefix(prefix)`, directly to the `gdb` instance for cases where you only need to search by prefix.

This method returns a promise that resolves to an array of full node objects matching the prefix.

```javascript
// Use the dedicated method to search for a prefix
const nodes = await db.searchByPrefix("user:a");

// `nodes` would contain the node for "user:alice_123" and "user:alicia_789"
console.log(nodes);
```

---

### **Technical Implementation Details**

For those interested in the internal workings, here is a deeper look at how the Radix Index module is implemented.

#### 1. Data Structure

The core of the module is a **prefix tree** implemented using a simple but effective JavaScript `Object`.
-   **Keys**: Each key in the object is a prefix extracted from the node data.
-   **Values**: The value associated with each key is an array of node IDs (`string[]`) that share that prefix.

```
// Conceptual representation of the index
{
  "u": ["id_1", "id_2"],
  "us": ["id_1", "id_2"],
  "use": ["id_1", "id_2"],
  "user": ["id_1", "id_2"],
  "user:a": ["id_1", "id_2"],
  "user:al": ["id_1", "id_2"],
  // ... and so on
}
```

#### 2. Prefix Extraction Strategy

The index is built by extracting prefixes from the `value` of each node in a comprehensive manner:
-   **Strings**: For any string value, *all possible starting substrings* are generated and indexed.
    -   `"text"` → `"t"`, `"te"`, `"tex"`, `"text"`
-   **Numbers**: Numbers are converted to their string representation and indexed.
    -   `123` → `"123"`
-   **Objects**: For objects, the indexer processes both keys and key-value pairs, providing deep search capabilities.
    -   `{ type: "user", score: 95 }` →
        -   `"type"` (the key)
        -   `"type:user"` (the key-value pair)
        -   `"score"` (the key)
        -   `"score:95"` (the key-value pair)

This multi-faceted approach allows for flexible prefix searches across different data shapes.

#### 3. Persistence and Performance

To ensure efficiency and durability, the module employs several optimizations:
-   **Non-Blocking I/O**: The index is saved to and loaded from persistent storage (**OPFS** in the browser) using a **Web Worker**. This prevents file operations from blocking the main application thread.
-   **Debounced Saves**: Write operations to storage are debounced (default delay: 200ms). This batches multiple rapid updates (e.g., during heavy writes) into a single save operation, significantly reducing disk I/O.
-   **Efficient Serialization**: Before saving, the index is serialized into a compact binary format using **MessagePack** and then compressed with **pako (zlib)**. This drastically reduces the storage footprint and improves load times.

#### 4. Memory Management: Dynamic Fragmentation

To handle massive datasets without consuming excessive memory, the index implements a dynamic fragmentation strategy.
-   If the in-memory index size exceeds a predefined limit (`maxSize`, default 1MB), the `splitIndex()` function is triggered.
-   It divides the index object into two smaller fragments, moving them into a `fragmentedIndexes` store and clearing the main index to free up memory. This ensures the application remains responsive even with very large indexes. These fragments can be merged back if needed.

#### 5. Query Integration (`$startsWith`)

The module extends `db.map`'s functionality via "monkey-patching". When a query with `{ id: { $startsWith: "..." } }` is detected:
1.  It first uses the Radix index (`radixIndexer.searchByPrefix()`) to get a small, pre-filtered list of candidate node IDs.
2.  It then executes the original `db.map` query but filters its results to only include nodes whose IDs are in the candidate list.
This **post-filtering** approach leverages the speed of the index to drastically reduce the number of nodes the final query needs to process.