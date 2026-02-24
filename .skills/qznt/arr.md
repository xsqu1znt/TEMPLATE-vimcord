# qznt.arr — Array Utilities

```typescript
import qznt from "qznt";
const { arr } = qznt;
```

---

## chunk(array, size)

Split into fixed-size pages. Throws if `size <= 0`.

```typescript
arr.chunk([1, 2, 3, 4, 5], 2);
// [[1, 2], [3, 4], [5]]

// Paginating Discord embeds
const pages = arr.chunk(items, 10);
paginator.addChapter(pages.map(page => buildEmbed(page)));
```

---

## chunkAdj(array, predicate)

Group **consecutive** elements that satisfy a predicate. Preserves order.

```typescript
arr.chunkAdj([1, 1, 2, 3, 3, 3], (a, b) => a === b);
// [[1, 1], [2], [3, 3, 3]]

arr.chunkAdj(messages, (a, b) => a.author.id === b.author.id);
// Groups consecutive messages from same author
```

---

## cluster(array, iteratee, maxChunkSize?)

Group by key (like `groupBy`). Returns `T[][]` — one inner array per unique key.

```typescript
arr.cluster(cards, card => card.tier);
// [[...tier1cards], [...tier2cards], [...tier3cards]]

// With maxChunkSize — splits groups that exceed the limit (useful for pagination)
arr.cluster(items, item => item.category, 5);
// Each category sub-array is at most 5 items; larger ones are split further
```

---

## compact(array, mode?)

Remove unwanted values. **Default mode is `"nullable"`** — only removes `null`/`undefined`.

```typescript
arr.compact([1, null, 2, undefined, 3]);
// [1, 2, 3]  — nulls/undefineds removed, type: number[]

arr.compact([0, "", false, null, 1, "hello"], "falsy");
// [1, "hello"]  — all falsy removed

// Useful after DB fetches that may return null
const users = await Promise.all(ids.map(id => fetchUser(client, id)));
const found = arr.compact(users); // User[] with no nulls
```

---

## forceArray(item)

Wraps a non-array in an array. If already an array, returns as-is.

```typescript
arr.forceArray("hello");   // ["hello"]
arr.forceArray([1, 2, 3]); // [1, 2, 3]
arr.forceArray(42);        // [42]
```

---

## search(array, target, comparator?)

Binary search on a **sorted** array. Returns the index if found, or the bitwise complement `~insertionIndex` if not found (same as `Array.prototype.indexOf` contract for sorted structures).

```typescript
const sorted = [1, 3, 5, 7, 9];
arr.search(sorted, 5); // 2 (found at index 2)
arr.search(sorted, 4); // ~2 (not found; would insert at index 2)

// Check existence
const result = arr.search(sorted, target);
const found = result >= 0;
```

---

## seqMap(array, callback)

Like `Array.map` but each callback receives context about the partially-built result.

```typescript
// Running total
const withRunningTotal = arr.seqMap(transactions, (tx, ctx) => ({
    ...tx,
    runningBalance: (ctx.lastElement?.runningBalance ?? 0) + tx.amount
}));

// Callbacks receive: { index, lastElement, newArray, originalArray }
```

> **Note:** `newArray` inside the callback is a live reference being built — earlier elements are complete, later elements are still `undefined`. Only access `lastElement` (index - 1) safely.

---

## shuffle(array, seed?)

Fisher-Yates shuffle. Returns a **new** array. Pass a seed for deterministic results.

```typescript
arr.shuffle([1, 2, 3, 4, 5]);          // random order each call
arr.shuffle([1, 2, 3, 4, 5], 42);       // always same order for seed 42
```

---

## sortBy(array, selector | selectors, order?)

Sort by one or more keys. Handles `null`/`undefined` (sorts to end). Returns a **new** array.

```typescript
// Single key
arr.sortBy(users, u => u.balance, "desc");

// Multiple keys (primary, secondary...)
arr.sortBy(cards, [c => c.tier, c => c.name]);

// Works with strings and numbers
arr.sortBy(items, item => item.createdAt, "asc");
```

---

## unique(array, key)

Deduplicate by a key function. **Last occurrence wins** if duplicates exist.

```typescript
arr.unique(users, u => u.userId);
arr.unique(cards, c => c.cardId);

// Merge two arrays and deduplicate
const merged = arr.unique([...existing, ...newItems], item => item.id);
```
