![image](https://github.com/user-attachments/assets/2c6e7853-07c0-4e63-851f-7f21f8be1f3a)

---

# **NQL Module Documentation**

## **Overview**

The NQL (Natural Language Query by prompts) module adds a thin prompt-to-query layer to `GenosDB`. Its only responsibility is to convert a simple natural-language prompt into a standard operator-based query that `GenosDB` understands.

Important: NQL does not perform AI, model inference, content generation, or value transformations. It only translates prompts into operator queries and executes them like any other query.

---

## **Key Features**

- Prompt-to-operator query translation only.
- No external services or model calls.
- Opt-in via `{ nql: true }`.

---

## **Installation**

Enable NQL when initializing the database:

```javascript
// import GenosDB
import { gdb } from "genosdb"
```

This enables NQL. No additional imports or helpers are required.

---

## **Usage**

### **1. Enable NQL**

When initializing the instance with `{ nql: true }`, the `map` method accepts a `prompt` field:

```javascript
const db = await gdb("my-db", { rtc: true, nql: true })
```

No additional steps are required.

---

### **2. Define a prompt**

Provide a single `prompt` string. NQL will translate it into an operator-based query and execute it.

Examples:

Prompt 1:
```json
{ "prompt": "Get posts id 4, 5, 8, 10" }
```
Resolves to (example):
```json
{ "query": { "id": { "$in": ["4", "5", "8", "10"] } } }
```

Prompt 2:
```json
{ "prompt": "Get posts id between 4, 10" }
```
Resolves to (example):
```json
{ "query": { "id": { "$gte": "4", "$lte": "10" } } }
```

Prompt 3:
```json
{ "prompt": "Searches for posts whose body contains the word: spain" }
```
Resolves to (example):
```json
{ "query": { "body": { "$regex": "spain", "$options": "i" } } }
```

---

### **3. Execute**

Use the `map` function; NQL only resolves the prompt to a query and runs it:

```javascript
db.map({
  prompt: "Get posts id 4, 5, 8, 10",
}).then((result) => {
  console.log("Processed Results:", result)
})
```

---

### **4. Output**

Results are the same as any operator-based query in `GenosDB`. NQL does not modify node values or add/remove fields.

---

## **Scope and Limitations**

- No AI, LLMs, or external APIs.
- No data transformation of node `value` fields.
- Only prompt parsing into operator queries.

---

## **How It Works**

1. You pass a `prompt` string.
2. NQL parses it into an operator-based query (e.g., `query`, `field`, `order`, `limit`).
3. The resolved operator query is executed by `GenosDB`.

---

## **Activation Reference**

Activate NQL by passing `{ nql: true }` when initializing GenosDB. This enables `prompt` support in `map`.

---

## **Best Practices**

- Use short, explicit prompts that unambiguously map to an operator query (e.g., "Get posts id 4, 5, 8, 10").

---

[Example Sandbox](https://estebanrfp.github.io/gdb/examples/sandbox-posts.html?spm=a2ty_o01.29997173.0.0.3c56c921GplWTC)

## **Conclusion**

NQL is a minimal, prompt-to-operator query adapter. It does not perform AI or content processing—only parses your prompt into a standard `GenosDB` query and executes it.
