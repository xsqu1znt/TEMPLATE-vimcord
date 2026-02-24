# qznt.is — Type Guards & Checks

```typescript
import qznt from "qznt";
const { is } = qznt;
```

## defined\<T\>(val)

Type guard: narrows `T | null | undefined` → `T`. Use in place of `!= null` checks.

```typescript
is.defined(null);      // false
is.defined(undefined); // false
is.defined(0);         // true
is.defined("");        // true
is.defined(false);     // true

// With compact — idiomatic null-stripping
const users = arr.compact(ids.map(fetchSync));
// Or manually:
if (is.defined(value)) {
    // value is T here
}
```

## empty(val)

True if: `null`, `undefined`, empty string `""`, empty array `[]`, or empty object `{}`.

```typescript
is.empty(null);    // true
is.empty("");      // true
is.empty([]);      // true
is.empty({});      // true
is.empty(0);       // false — 0 is NOT empty
is.empty(false);   // false — false is NOT empty
```

## inRange(num, max) / inRange(num, min, max)

```typescript
is.inRange(5, 10);       // true  — 0..10
is.inRange(5, 3, 8);     // true  — 3..8
is.inRange(11, 10);      // false
is.inRange(-1, 0, 10);   // false
```

## object(val)

True if plain object (not array, not null, not function).

```typescript
is.object({});          // true
is.object([]);          // false
is.object(null);        // false
is.object(() => {});    // false
```

## string(val), sorted(arr), today(date)

```typescript
is.string("hello");   // true
is.string(42);        // false

is.sorted([1, 2, 3]); // true
is.sorted([3, 1, 2]); // false

is.today(new Date()); // true
is.today(Date.now()); // true (accepts timestamp)
```
