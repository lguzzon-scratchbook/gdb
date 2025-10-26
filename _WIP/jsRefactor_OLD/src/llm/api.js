export class LLMApiClient {
  constructor(apiKey, model = 'z-ai/glm-4.6:exacto', options = {}) {
    this.apiKey = apiKey;
    this.model = model;
    this.baseURL = 'https://openrouter.ai/api/v1';
    this.options = {
      maxRetries: 3,
      retryDelay: 1000,
      timeout: 30000,
      ...options
    };
  }

  async renameRequest(context) {
    const prompt = this._buildRenamePrompt(context);
    
    try {
      const response = await this._makeRequest(prompt);
      return this._parseRenameResponse(response, context);
    } catch (error) {
      throw new Error(`LLM rename request failed: ${error.message}`);
    }
  }

  async batchRenameRequests(contexts) {
    const results = [];
    
    for (const context of contexts) {
      try {
        const result = await this.renameRequest(context);
        results.push({ ...context, ...result, success: true });
      } catch (error) {
        results.push({ ...context, error: error.message, success: false });
      }
    }
    
    return results;
  }

  _buildRenamePrompt(context) {
    const {
      currentName,
      nameType,
      functionBody,
      classBody,
      variables,
      dependencies,
      usagePattern,
      filePath,
      surroundingCode
    } = context;

    let prompt = `You are an expert JavaScript developer specializing in code naming and refactoring. 

TASK: Suggest a better name for the following ${nameType}.

CURRENT NAME: ${currentName}

CONTEXT:
`;

    if (functionBody) {
      prompt += `
FUNCTION BODY:
\`\`\`javascript
${functionBody}
\`\`\`
`;
    }

    if (classBody) {
      prompt += `
CLASS BODY:
\`\`\`javascript
${classBody}
\`\`\`
`;
    }

    if (variables && variables.length > 0) {
      prompt += `
RELATED VARIABLES: ${variables.join(', ')}
`;
    }

    if (dependencies && dependencies.length > 0) {
      prompt += `
DEPENDENCIES: ${dependencies.join(', ')}
`;
    }

    if (usagePattern) {
      prompt += `
USAGE PATTERN: ${usagePattern}
`;
    }

    if (filePath) {
      prompt += `
FILE PATH: ${filePath}
`;
    }

    if (surroundingCode) {
      prompt += `
SURROUNDING CODE:
\`\`\`javascript
${surroundingCode}
\`\`\`
`;
    }

    prompt += `
REQUIREMENTS:
1. Follow JavaScript naming conventions (camelCase for functions/variables, PascalCase for classes)
2. Be descriptive but concise
3. Avoid generic names like "data", "info", "item"
4. Consider the function's purpose and return value
5. Use domain-specific terminology when appropriate
6. Ensure the name is not a JavaScript reserved word
7. Make it semantically meaningful

RESPONSE FORMAT:
Provide your response as a JSON object with the following structure:
{
  "suggestedName": "your_suggested_name",
  "confidence": 0.9,
  "reasoning": "Brief explanation of why this name is better",
  "alternatives": ["alternative1", "alternative2"]
}

SUGGESTED NAME:`;

    return prompt;
  }

  async _makeRequest(prompt) {
    const requestBody = {
      model: this.model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    };

    let lastError;
    
    for (let attempt = 1; attempt <= this.options.maxRetries; attempt++) {
      try {
        const response = await fetch(`${this.baseURL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://github.com/jsrefactor',
            'X-Title': 'JSRefactor Renaming Assistant'
          },
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(this.options.timeout)
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
          throw new Error('Invalid response format from API');
        }

        return data.choices[0].message.content;
        
      } catch (error) {
        lastError = error;
        
        if (attempt === this.options.maxRetries) {
          throw lastError;
        }
        
        // Exponential backoff
        const delay = this.options.retryDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  _parseRenameResponse(response, context) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate response structure
      if (!parsed.suggestedName) {
        throw new Error('Missing suggestedName in response');
      }

      return {
        originalName: context.currentName,
        suggestedName: parsed.suggestedName,
        confidence: parsed.confidence || 0.5,
        reasoning: parsed.reasoning || 'No reasoning provided',
        alternatives: parsed.alternatives || [],
        rawResponse: response
      };
      
    } catch (error) {
      // Fallback: try to extract name from plain text
      const nameMatch = response.match(/["']([^"']+)["']/);
      const suggestedName = nameMatch ? nameMatch[1] : context.currentName;
      
      return {
        originalName: context.currentName,
        suggestedName,
        confidence: 0.3,
        reasoning: 'Parsed from plain text response',
        alternatives: [],
        rawResponse: response,
        parseError: error.message
      };
    }
  }

  async validateName(name, context) {
    const prompt = `Validate if "${name}" is a good JavaScript name for a ${context.nameType}.

CONTEXT: ${JSON.stringify(context, null, 2)}

Respond with JSON:
{
  "isValid": true,
  "score": 0.8,
  "issues": [],
  "suggestions": []
}`;

    try {
      const response = await this._makeRequest(prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : { isValid: true, score: 0.5 };
    } catch (error) {
      return { isValid: true, score: 0.5, error: error.message };
    }
  }

  setModel(model) {
    this.model = model;
  }

  setApiKey(apiKey) {
    this.apiKey = apiKey;
  }
}
