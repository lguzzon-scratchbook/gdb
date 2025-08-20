
![image](https://github.com/user-attachments/assets/2c6e7853-07c0-4e63-851f-7f21f8be1f3a)

---

# **AI Module Documentation**

## **Overview**
The `AIModule.js` is a powerful extension for the `GenosDB` library that integrates artificial intelligence (AI) capabilities into your graph database operations. It allows you to process and transform data using AI models, such as summarizing text, translating content, or performing sentiment analysis, directly within your database queries.

This module extends the functionality of `GenosDB` by enabling AI-powered transformations on the `value` field of nodes in the graph. It ensures that the processed data maintains the same structure as the original objects, making it seamless to integrate with existing workflows.

---

## **Key Features**
1. **AI-Powered Transformations**:
   - Perform tasks like summarization, translation, sentiment analysis, and more on the `value` field of graph nodes.
   
2. **Seamless Integration**:
   - Automatically integrates with `GenosDB`'s `map` function, allowing you to apply AI transformations alongside standard database queries.

3. **Consistent Object Structure**:
   - Ensures that the modified objects retain their original structure, avoiding unexpected changes to the data format.

4. **Customizable Prompts**:
   - Allows users to define custom prompts for AI processing while enforcing consistent output formats.

5. **Error Handling**:
   - Provides robust error handling to gracefully handle invalid responses from the AI API.

---

## **Installation**

To use the AI module in GenosDB, simply install GenosDB and enable the AI module when initializing the database:

```javascript
import { gdb } from "genosdb";

const db = await gdb("posts-db", { ai: true });
```

This automatically enables AI capabilities. You do not need to import or call `withAI` manually.

---

## **Usage**


### **1. Enabling AI Capabilities in GenosDB**
When initializing the instance with `{ ai: true }`, the `map` method already supports AI transformations:

```javascript
import { gdb } from "genosdb";

const db = await gdb("posts-db", { ai: true });
```

No additional steps are required to enable AI.

---

### **2. Defining AI Queries**
When using the `map` function, include an `aiField` and a `prompt` in the query options to specify how the AI should process the data.

#### Example Query:
```json
{
  "query": {"body": {"$regex": "et"}},
  "order": "asc",
  "field": "id",
  "prompt": "Summarize the 'body' field of each object in one sentence."
}
```

- **`query`**: Filters the nodes to be processed.
- **`prompt`**: Defines the AI task (e.g., summarization, translation).
- **`order`**, **`field`**, etc.: Standard query options for sorting and filtering.

---

### **3. Executing AI Queries**
Use the `map` function to execute the query and apply the AI transformation:

```javascript
db.map({
  query: { body: { $regex: "et" } },
  order: "asc",
  field: "id",
  prompt: "Summarize the 'body' field of each object in one sentence."
}).then(result => {
  console.log("Processed Results:", result);
});
```

---

### **4. Understanding the Output**
The AI module ensures that the processed data maintains the same structure as the original objects. For example:

#### Input Node:
```json
{
  "id": "1",
  "value": {
    "title": "Original Title",
    "body": "This is the original body text."
  }
}
```

#### Output Node (After AI Processing):
```json
{
  "id": "1",
  "value": {
    "title": "Original Title",
    "body": "Summary of the original body text."
  }
}
```

Only the specified fields (e.g., `body`) are modified, while other fields remain unchanged.

---

## **Advanced Usage**

### **1. Customizing Prompts**
You can customize the prompt to perform various AI tasks. Here are some examples:

- **Translation**:
  ```json
  "Translate the 'title' field of each object into Spanish."
  ```

- **Sentiment Analysis**:
  ```json
  "Analyze the sentiment of the 'body' field for each object."
  ```

- **Rewriting**:
  ```json
  "Rewrite the 'body' field of each object in a more formal tone."
  ```

### **2. Handling Errors**
If the AI API returns an invalid response, the module will log an error and return the original data. You can handle these errors programmatically by checking the results:

```javascript
db.map({
  query: { body: { $regex: "et" } },
  prompt: "Invalid Prompt"
}).then(result => {
  if (result.error) {
    console.error("AI Processing Error:", result.error);
  } else {
    console.log("Processed Results:", result);
  }
});
```

---

## **How It Works**

### **1. Data Flow**
1. **Input Data**:
   - The `map` function extracts the `value` field of each node and sends it to the AI API.

2. **AI Processing**:
   - The AI processes the data based on the provided prompt and returns the modified values.

3. **Output Data**:
   - The module updates only the `value` field of the original nodes with the processed data.

### **2. Automatic Instructions**
The module automatically appends instructions to the prompt to ensure consistent output. For example:

```text
Instructions:
- Process the input data as specified in the prompt.
- Modify only the specified fields and return the same object structure.
- Do not create new fields or objects.
- Return the modified data as a JSON array of objects with the same structure as the input.
```

This ensures that the AI always returns the expected format.

---

## **API Reference**


### **1. AI Module Activation**
The AI module is activated by passing `{ ai: true }` when initializing GenosDB:

```javascript
import { gdb } from "genosdb";
const db = await gdb("posts-db", { ai: true });
```

This enables AI-powered `map` functionality automatically.


### **2. `processWithAI(results, prompt)`**
Processes the `value` field of each node using the AI API.

- **Parameters**:
  - `results`: An array of nodes to be processed.
  - `prompt`: A string defining the AI task.

- **Returns**:
  - An array of processed nodes with updated `value` fields.

---

### **3. `queryAPI(prompt)`**
Sends a request to the AI API and retrieves the processed data.

- **Parameters**:
  - `prompt`: A string containing the AI task instructions.

- **Returns**:
  - The processed data as a JSON array.

---

## **Best Practices**

1. **Be Specific in Prompts**:
   - Clearly define the task you want the AI to perform to avoid ambiguous results.

2. **Test with Small Datasets**:
   - Start with a small subset of data to verify that the AI produces the desired output.

3. **Handle Edge Cases**:
   - Ensure your application gracefully handles cases where the AI API fails or returns unexpected results.

4. **Monitor Performance**:
   - AI processing can introduce latency. Monitor performance and optimize queries as needed.

---

[Sandbox de Ejemplo](https://estebanrfp.github.io/gdb/examples/sandbox-posts.html?spm=a2ty_o01.29997173.0.0.3c56c921GplWTC)

## **Conclusion**
The AI module provides a seamless way to integrate AI capabilities into your GenosDB workflows. By leveraging this module, you can perform advanced data transformations with minimal effort, while maintaining the integrity of your graph database structure.

For further assistance or customization, refer to the source code or contact the maintainers. Happy coding! 🚀