# JavaScript Modern – Style & Performance Guidelines

## Objective
Generate modern JavaScript (ES2020+) code that is **compact**, **high-performance**, and **readable**. Prioritize **clarity**, **efficiency**, and **conciseness** in every suggestion.

Antes de cada respuesta escribe "Respuesta en base a copilot-instructions"

## Guidelines

# GitHub Copilot Guidelines

- All code comments and `console.log` messages must be written in English.
- Use JSDoc comments to describe functions, parameters, and return values.
- Avoid redundant comments; the code should be self-explanatory.

1. **Modern Syntax**:
   - Use arrow functions, destructuring, optional chaining, nullish coalescing, dynamic imports, template literals, `async/await`.
   - Avoid `var`, callbacks, jQuery, or deprecated APIs.
   - Emphasize immutability, pure functions, and composition over inheritance.

2. **Descriptive Naming**:
   - Use clear, semantic names: `isLoading`, `fetchData`, `calculateSum`.
   - Avoid cryptic names like `a`, `b1`.

3. **Compact & Efficient**:
   - Refactor to use array methods (`map`, `filter`, `reduce`); avoid unnecessary loops.
   - Prefer early returns over deep nesting.
   - Minimize lines without losing clarity.

4. **High Performance**:
   - Reduce redundant DOM or variable accesses.
   - Use `Promise.allSettled()` for efficient concurrency.
   - Implement lazy loading (`import()`) and code splitting where applicable.

5. **Clear Explanations**:
   - When modifying or refactoring code, provide brief comments explaining the rationale.

## Example Response

```javascript
// Rule: ArrowFunction + EarlyReturn
const sumEven = arr => arr.filter(n => n % 2 === 0).reduce((a, b) => a + b, 0);

```

# Copilot Instructions

Please refer to the following documents for detailed guidelines