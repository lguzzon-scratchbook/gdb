import { test } from 'node:test';
import assert from 'node:assert';
import { LLMApiClient } from '../src/llm/api.js';
import { RenamingEngine } from '../src/renaming-engine.js';

test('RenamingEngine - Basic functionality', async (t) => {
  await t.test('should create context for function', async () => {
    // Mock LLM client
    const mockClient = {
      async renameRequest(context) {
        return {
          originalName: context.currentName,
          suggestedName: 'betterName',
          confidence: 0.9,
          reasoning: 'More descriptive name',
          alternatives: ['alternative1', 'alternative2']
        };
      },
      
      async batchRenameRequests(contexts) {
        return contexts.map(ctx => ({
          ...ctx,
          suggestedName: `better_${ctx.name}`,
          confidence: 0.8,
          reasoning: 'Mock reasoning',
          alternatives: [],
          success: true
        }));
      }
    };

    const engine = new RenamingEngine(mockClient, { enableLLM: true });
    
    const mockContext = {
      currentName: 'testFunc',
      nameType: 'function',
      functionBody: 'function testFunc() { return 42; }',
      variables: ['x', 'y'],
      dependencies: ['console'],
      usagePattern: 'function-calls'
    };

    const result = await mockClient.renameRequest(mockContext);
    
    assert.strictEqual(result.originalName, 'testFunc');
    assert.strictEqual(result.suggestedName, 'betterName');
    assert.strictEqual(result.confidence, 0.9);
    assert(Array.isArray(result.alternatives));
  });

  await t.test('should handle batch rename requests', async () => {
    const mockClient = {
      async batchRenameRequests(contexts) {
        return contexts.map((ctx, index) => ({
          ...ctx,
          suggestedName: `renamed_${ctx.name}_${index}`,
          confidence: 0.7 + (index * 0.1),
          reasoning: `Batch reasoning for ${ctx.name}`,
          alternatives: [],
          success: true
        }));
      }
    };

    const engine = new RenamingEngine(mockClient, { enableLLM: true });
    
    const contexts = [
      { name: 'func1', type: 'function' },
      { name: 'func2', type: 'function' },
      { name: 'var1', type: 'variable' }
    ];

    const suggestions = await engine.suggestRenames(contexts);
    
    assert.strictEqual(suggestions.length, 3);
    assert(suggestions.every(s => s.success));
    assert(suggestions.every(s => s.suggestedName.startsWith('renamed_')));
  });

  await t.test('should filter by confidence threshold', async () => {
    const mockClient = {
      async batchRenameRequests(contexts) {
        return contexts.map((ctx, index) => ({
          ...ctx,
          suggestedName: `renamed_${ctx.name}`,
          confidence: 0.5 + (index * 0.2), // 0.5, 0.7, 0.9
          reasoning: 'Mock reasoning',
          alternatives: [],
          success: true
        }));
      }
    };

    const engine = new RenamingEngine(mockClient, { 
      enableLLM: true,
      confidenceThreshold: 0.7 
    });
    
    const contexts = [
      { name: 'low', type: 'function' },
      { name: 'medium', type: 'function' },
      { name: 'high', type: 'function' }
    ];

    const suggestions = await engine.suggestRenames(contexts);
    
    // Should only include suggestions with confidence >= 0.7
    assert.strictEqual(suggestions.length, 2);
    assert(suggestions.every(s => s.confidence >= 0.7));
  });

  await t.test('should handle API failures gracefully', async () => {
    const mockClient = {
      async batchRenameRequests(contexts) {
        return contexts.map((ctx, index) => {
          if (index === 1) {
            return {
              ...ctx,
              error: 'API Error',
              success: false
            };
          }
          return {
            ...ctx,
            suggestedName: `renamed_${ctx.name}`,
            confidence: 0.8,
            reasoning: 'Mock reasoning',
            alternatives: [],
            success: true
          };
        });
      }
    };

    const engine = new RenamingEngine(mockClient, { enableLLM: true });
    
    const contexts = [
      { name: 'success', type: 'function' },
      { name: 'failed', type: 'function' },
      { name: 'success2', type: 'function' }
    ];

    const suggestions = await engine.suggestRenames(contexts);
    
    // Should only include successful suggestions
    assert.strictEqual(suggestions.length, 2);
    assert(suggestions.every(s => s.success));
  });
});

test('LLMApiClient - API integration', async (t) => {
  await t.test('should build proper rename prompt', () => {
    const client = new LLMApiClient('test-key');
    
    const context = {
      currentName: 'badName',
      nameType: 'function',
      functionBody: 'function badName(x) { return x * 2; }',
      variables: ['multiplier'],
      dependencies: ['Math'],
      usagePattern: 'function-calls',
      filePath: '/test/file.js'
    };

    const prompt = client._buildRenamePrompt(context);
    
    assert(prompt.includes('badName'));
    assert(prompt.includes('function'));
    assert(prompt.includes('function badName(x) { return x * 2; }'));
    assert(prompt.includes('multiplier'));
    assert(prompt.includes('Math'));
    assert(prompt.includes('/test/file.js'));
  });

  await t.test('should parse rename response correctly', () => {
    const client = new LLMApiClient('test-key');
    
    const mockResponse = `{
  "suggestedName": "calculateDouble",
  "confidence": 0.85,
  "reasoning": "More descriptive name that indicates the function doubles the input",
  "alternatives": ["doubleValue", "multiplyByTwo"]
}`;

    const context = { currentName: 'badName' };
    const result = client._parseRenameResponse(mockResponse, context);
    
    assert.strictEqual(result.suggestedName, 'calculateDouble');
    assert.strictEqual(result.confidence, 0.85);
    assert.strictEqual(result.reasoning, 'More descriptive name that indicates the function doubles the input');
    assert.deepStrictEqual(result.alternatives, ['doubleValue', 'multiplyByTwo']);
  });

  await t.test('should handle malformed response gracefully', () => {
    const client = new LLMApiClient('test-key');
    
    const malformedResponse = 'The suggested name is "betterName" because it\'s more descriptive.';
    
    const context = { currentName: 'badName' };
    const result = client._parseRenameResponse(malformedResponse, context);
    
    // Should fallback to parsing from plain text
    assert.strictEqual(result.suggestedName, 'betterName');
    assert.strictEqual(result.confidence, 0.3);
    assert.strictEqual(result.reasoning, 'Parsed from plain text response');
  });
});
