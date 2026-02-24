# qznt.obj — Object Utilities

```typescript
import qznt from "qznt";
const { obj } = qznt;
```

---

## get(obj, path, defaultValue?)

Retrieve a nested property by dot-path. Supports array bracket notation.

```typescript
const data = { user: { profile: { name: "Alice" } }, scores: [10, 20, 30] };

obj.get(data, "user.profile.name");     // "Alice"
obj.get(data, "scores[1]");            // 20
obj.get(data, "user.profile.age", 0);  // 0 (default)

// Throws if path is broken and no default provided
obj.get(data, "user.missing.field");
// Error: get: Path broken at "user.missing". Property "missing" is missing on object.
```

---

## has(obj, path)

Check if a nested path exists. Never throws.

```typescript
obj.has(data, "user.profile.name"); // true
obj.has(data, "user.missing");      // false
obj.has(data, "scores[2]");         // true
obj.has(null, "anything");          // false
```

---

## set(obj, path, value)

Set a nested property. **Mutates** the object. Creates missing intermediary objects/arrays.

```typescript
const config = {};
obj.set(config, "database.host", "localhost");
obj.set(config, "database.port", 5432);
// config: { database: { host: "localhost", port: 5432 } }

obj.set(config, "tags[0]", "production");
// config.tags: ["production"]
```

---

## merge(target, ...sources)

Deep merge. **Mutates `target`** and returns it. Arrays are **concatenated** (not replaced).

```typescript
const defaults = { color: "#fff", timeouts: { idle: 60_000 } };
const overrides = { timeouts: { idle: 30_000 } };

obj.merge(defaults, overrides);
// { color: "#fff", timeouts: { idle: 30_000 } }

// Multiple sources
obj.merge(base, source1, source2, source3);

// Array behavior: arrays concatenate
obj.merge({ tags: ["a"] }, { tags: ["b"] });
// { tags: ["a", "b"] }
```

> **Note:** If you need array replacement (not concatenation), do it manually after merging, or use `obj.set`.

---

## pick(obj, keys)

Create a new object with only the specified keys.

```typescript
const user = { id: "1", name: "Alice", password: "secret", balance: 100 };

obj.pick(user, ["id", "name", "balance"]);
// { id: "1", name: "Alice", balance: 100 }

// Safe DB projection — only expose public fields
const publicUser = obj.pick(fullDoc, ["userId", "username", "joinedAt"]);
```

---

## omit(obj, keys)

Create a new object without the specified keys.

```typescript
const user = { id: "1", name: "Alice", password: "secret", __v: 0 };

obj.omit(user, ["password", "__v"]);
// { id: "1", name: "Alice" }
```
