import { gdb } from "../dist/index.js";

test('Validate all GenosDB operators', async () => {
  const db = await gdb('operators-test');
  
  // Insert test data
  const user1 = await db.put({ name: 'Alice', age: 25, active: true, tags: ['dev'], email: 'alice@example.com' });
  const user2 = await db.put({ name: 'Bob', age: 30, active: false, tags: ['admin'], email: 'bob@example.com' });
  const user3 = await db.put({ name: 'Charlie', age: 35, active: true, tags: ['dev', 'lead'] });
  const company = await db.put({ type: 'Company', name: 'TechCorp' });
  await db.link(company, user1);
  await db.link(company, user2);
  
  // $eq: Exact equality
  const { results: eqResults } = await db.map({ query: { name: { $eq: 'Alice' } } });
  expect(eqResults.length).toBe(1);
  expect(eqResults[0].value.name).toBe('Alice');
  
  // $ne: Not equal
  const { results: neResults } = await db.map({ query: { active: { $ne: true } } });
  expect(neResults.length).toBe(2);  // Bob (false) and Company (no field)
  expect(neResults.find(r => r.value.name === 'Bob')).toBeDefined();
  
  // $gt: Greater than
  const { results: gtResults } = await db.map({ query: { age: { $gt: 28 } } });
  expect(gtResults.length).toBe(2);
  
  // $gte: Greater than or equal
  const { results: gteResults } = await db.map({ query: { age: { $gte: 30 } } });
  expect(gteResults.length).toBe(2);
  
  // $lt: Less than
  const { results: ltResults } = await db.map({ query: { age: { $lt: 30 } } });
  expect(ltResults.length).toBe(1);
  
  // $lte: Less than or equal
  const { results: lteResults } = await db.map({ query: { age: { $lte: 25 } } });
  expect(lteResults.length).toBe(1);
  
  // $in: In array
  const { results: inResults } = await db.map({ query: { tags: { $in: ['dev'] } } });
  expect(inResults.length).toBe(2);
  
  // $between: Between values
  const { results: betweenResults } = await db.map({ query: { age: { $between: [24, 32] } } });
  expect(betweenResults.length).toBe(2);
  
  // $exists: Field exists
  const { results: existsResults } = await db.map({ query: { email: { $exists: true } } });
  expect(existsResults.length).toBe(2);
  
  // $startsWith: Starts with
  const { results: startsWithResults } = await db.map({ query: { name: { $startsWith: 'A' } } });
  expect(startsWithResults.length).toBe(1);
  
  // $endsWith: Ends with
  const { results: endsWithResults } = await db.map({ query: { name: { $endsWith: 'e' } } });
  expect(endsWithResults.length).toBe(2);  // Alice and Charlie
  expect(endsWithResults.find(r => r.value.name === 'Alice')).toBeDefined();
  expect(endsWithResults.find(r => r.value.name === 'Charlie')).toBeDefined();
  
  // $contains: Contains
  const { results: containsResults } = await db.map({ query: { name: { $contains: 'li' } } });
  expect(containsResults.length).toBe(2);  // Alice and Charlie
  expect(containsResults.find(r => r.value.name === 'Alice')).toBeDefined();
  expect(containsResults.find(r => r.value.name === 'Charlie')).toBeDefined();
  
  // $text: Text search (using field search)
  const { results: textResults } = await db.map({ query: { name: { $text: 'Alice' } } });
  expect(textResults.length).toBe(1);
  
  // $like: SQL-like pattern
  const { results: likeResults } = await db.map({ query: { name: { $like: 'A%' } } });
  expect(likeResults.length).toBe(1);
  
  // $regex: Regular expression
  const { results: regexResults } = await db.map({ query: { name: { $regex: '^A' } } });
  expect(regexResults.length).toBe(1);
  
  // $and: Logical AND
  const { results: andResults } = await db.map({ query: { $and: [{ age: { $gt: 20 } }, { active: true }] } });
  expect(andResults.length).toBe(2);
  
  // $or: Logical OR
  const { results: orResults } = await db.map({ query: { $or: [{ name: 'Alice' }, { name: 'Bob' }] } });
  expect(orResults.length).toBe(2);
  
  // $not: Negation
  const { results: notResults } = await db.map({ query: { $not: { active: true } } });
  expect(notResults.length).toBe(2);  // Bob (false) and Company (no field)
  expect(notResults.find(r => r.value.name === 'Bob')).toBeDefined();
  
  // $edge: Graph traversal
  const { results: edgeResults } = await db.map({ query: { type: 'Company', $edge: { active: true } } });
  expect(edgeResults.length).toBe(1);  // Only Alice (linked and active: true)
});

// ...existing code...

// $edge: Graph traversal with depth up to 50
test('Validate $edge with depth up to 50', async () => {
  const db = await gdb('edge-depth-test');
  await db.clear();
  
  // Create chain of 50 nodes
  const nodeIds = [];
  for (let i = 0; i <= 50; i++) {
    const nodeData = {
      type: i === 0 ? 'ChainStart' : 'ChainNode',
      level: i,
      chain: 'SuccessChain'
    };
    const id = await db.put(nodeData);
    nodeIds.push(id);
  }
  
  // Link sequentially
  for (let i = 0; i < 50; i++) {
    await db.link(nodeIds[i], nodeIds[i + 1]);
  }
  
  // Query with $edge for level > 45
  const { results: edgeResults } = await db.map({
    query: {
      type: 'ChainStart',
      chain: 'SuccessChain',
      $edge: {
        level: { $gt: 45 }
      }
    }
  });
  
  expect(edgeResults.length).toBe(5);  // Levels 46, 47, 48, 49, 50
  expect(edgeResults.every(r => r.value.level > 45)).toBe(true);
});

// ...existing code...

// Edge cases for operators
test('Edge cases for GenosDB operators', async () => {
  const db = await gdb('edge-cases-test');
  
  // Insert test data with edge values
  const node1 = await db.put({ name: '', age: 0, tags: [], active: null });
  const node2 = await db.put({ name: 'Test', age: null, tags: ['a'], active: false });
  const node3 = await db.put({ name: null, age: 10, tags: null, active: true });
  
  // Empty query
  const { results: emptyQuery } = await db.map({ query: {} });
  expect(emptyQuery.length).toBe(3);
  
  // $eq with empty string
  const { results: emptyString } = await db.map({ query: { name: { $eq: '' } } });
  expect(emptyString.length).toBe(1);
  
  // $gt with 0
  const { results: gtZero } = await db.map({ query: { age: { $gt: 0 } } });
  expect(gtZero.length).toBe(1);  // Only node3
  
  // $in with empty array
  const { results: inEmpty } = await db.map({ query: { tags: { $in: [] } } });
  expect(inEmpty.length).toBe(0);
  
  // $exists with false
  const { results: existsFalse } = await db.map({ query: { active: { $exists: false } } });
  expect(existsFalse.length).toBe(0);  // active exists in all nodes
  
  // $contains with empty string
  const { results: containsEmpty } = await db.map({ query: { name: { $contains: '' } } });
  expect(containsEmpty.length).toBe(2);  // node1 and node2
  
  // $regex with empty pattern
  const { results: regexEmpty } = await db.map({ query: { name: { $regex: '' } } });
  expect(regexEmpty.length).toBe(2);  // node1 and node2
  
  // $and with empty array
  const { results: andEmpty } = await db.map({ query: { $and: [] } });
  expect(andEmpty.length).toBe(3);
  
  // $or with empty array
  const { results: orEmpty } = await db.map({ query: { $or: [] } });
  expect(orEmpty.length).toBe(0);
  
  // $not with empty query
  const { results: notEmpty } = await db.map({ query: { $not: {} } });
  expect(notEmpty.length).toBe(0);
  
  // $edge with depth 0
  const { results: edgeZero } = await db.map({ query: { $edge: { active: true } } });
  expect(edgeZero.length).toBe(0);  // Without root node, finds nothing
  
  // $between with equal limits
  const { results: betweenEqual } = await db.map({ query: { age: { $between: [10, 10] } } });
  expect(betweenEqual.length).toBe(1);  // node3
  
  // $text with empty string
  const { results: textEmpty } = await db.map({ query: { name: { $text: '' } } });
  expect(textEmpty.length).toBe(3);  // Finds all nodes
});