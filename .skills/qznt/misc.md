# qznt.fn — Function Utilities

## memoize(fn, options?)

Cache function results. Returns the same output for the same input without re-executing.

```typescript
import qznt from "qznt";

// Basic
const expensiveCalc = qznt.fn.memoize((n: number) => n * n);
expensiveCalc(5);  // computes 25
expensiveCalc(5);  // returns 25 from cache

// With TTL (1 minute)
const getConfig = qznt.fn.memoize(fetchConfig, { maxAge: 60_000 });

// Custom cache key (default: JSON.stringify of all args)
const getUser = qznt.fn.memoize(
    (userId: string, includePrivate: boolean) => fetchUser(userId, includePrivate),
    { resolver: (userId) => userId }  // cache only based on userId, ignore second arg
);

// Manual cache invalidation
getUser.clear();
```

---

# qznt.str — String Utilities

## toTitleCase(str, smart?)

```typescript
qznt.str.toTitleCase("hello world");                // "Hello World"
qznt.str.toTitleCase("the lord of the rings");      // "The Lord of the Rings"  (smart=true default)
qznt.str.toTitleCase("NATO summit in the UK");      // "NATO Summit in the UK"  (acronyms preserved)
qznt.str.toTitleCase("hello world", false);         // "Hello World" (no smart logic)
```

## escapeRegex(str)

Escape special regex characters so a string can be used literally in a `RegExp`.

```typescript
const raw = "hello.world (test)";
const pattern = new RegExp(qznt.str.escapeRegex(raw));
pattern.test("hello.world (test)"); // true
```

## hasFlag(str, flag) / getFlag(str, flag, length?)

Check or extract a flag token from a string.

```typescript
const msg = "!ban --reason spamming --duration 7d";

qznt.str.hasFlag(msg, "--reason");      // true
qznt.str.hasFlag(msg, /--dur\w+/);     // true (regex flag)

qznt.str.getFlag(msg, "--reason");     // "spamming --duration 7d"
qznt.str.getFlag(msg, "--reason", 1);  // "spamming" (first word only)
qznt.str.getFlag(msg, "--duration", 1);// "7d"
qznt.str.getFlag(msg, "--missing");    // null
```

---

# qznt.timing — Debounce & Throttle

## debounce(fn, wait, options?)

Execute only after `wait` ms have passed since the last call.

```typescript
const saveSearch = qznt.timing.debounce((query: string) => {
    sendToAnalytics(query);
}, 500);

// Even called rapidly, analytics fires once 500ms after the last call
saveSearch("h"); saveSearch("he"); saveSearch("hel"); // → fires once with "hel"

saveSearch.cancel(); // Cancel pending execution

// Immediate (leading edge) — fires on first call, then waits
const immediateHandler = qznt.timing.debounce(fn, 300, { immediate: true });
```

## throttle(fn, limit)

Execute at most once every `limit` ms.

```typescript
const handlePresence = qznt.timing.throttle((presence) => {
    updateUI(presence);
}, 200); // fires at most once per 200ms
```

---

# qznt.to — Conversion Utilities

## record(array, callback)

Transform an array into a `Record` with access to the object being built.

```typescript
import qznt from "qznt";

// Basic: array of users → lookup map
const byId = qznt.to.record(users, user => ({ key: user.id, value: user }));
byId["123"]; // User

// With context (access to index and partially-built record)
const ranked = qznt.to.record(sortedScores, (score, ctx) => ({
    key: score.userId,
    value: { ...score, rank: ctx.index + 1 }
}));
```

---

# qznt.fs — File System

## readDir(path, options?)

Recursively scan a directory and return relative file paths. Returns `[]` if directory doesn't exist.

```typescript
import qznt from "qznt";

qznt.fs.readDir("./src");             // all files, recursive (default)
qznt.fs.readDir("./src/commands");
qznt.fs.readDir("./dist", { recursive: false }); // top-level only

// Filter to .ts files
const tsFiles = qznt.fs.readDir("./src")
    .filter(f => f.endsWith(".ts"));
```

---

# qznt.Pipe — Function Pipeline

Pipe a value through a sequence of transformations. Fully typed — each function's output type flows into the next.

```typescript
import qznt from "qznt";

const result = qznt.Pipe(
    rawCards,
    cards => cards.filter(c => c.released),
    cards => qznt.arr.sortBy(cards, c => c.rarity, "desc"),
    cards => cards.slice(0, 10),
    cards => cards.map(c => c.name)
);
// result: string[] (top 10 released cards by rarity, names only)

// Single value passthrough (no transforms)
const val = qznt.Pipe(42); // 42
```

Supports up to 10 transformation steps. For more, chain multiple `Pipe` calls.
