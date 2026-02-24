# qznt — Utility Library Skill

`qznt` is a zero-dependency TypeScript utility library used throughout this project.

**Import style:**
```typescript
// Named namespace import (preferred — groups utilities by domain)
import qznt from "qznt";
qznt.arr.chunk([1, 2, 3, 4], 2); // [[1,2],[3,4]]

// Or using the $ alias
import { $ } from "qznt";
$.math.clamp(value, 0, 100);

// Or named flat imports (for specific functions in hot paths)
import { chunk, clamp, sortBy } from "qznt";
```

---

## When to Use qznt

**Use qznt instead of writing from scratch whenever you need:**

| Need | Use |
|------|-----|
| Split array into pages | `qznt.arr.chunk(arr, size)` |
| Group array by key | `qznt.arr.cluster(arr, item => item.type)` |
| Strip nulls from array | `qznt.arr.compact(arr)` |
| Sort by one or more fields | `qznt.arr.sortBy(arr, x => x.value, "desc")` |
| Deduplicate by key | `qznt.arr.unique(arr, x => x.id)` |
| Retry a flaky async call | `qznt.async.retry(fn, { retries: 3, delay: 500 })` |
| Sleep / delay | `await qznt.async.wait(1000)` |
| Cache expensive computation | `qznt.fn.memoize(fn, { maxAge: 60_000 })` |
| Format timestamp as "3 days ago" | `qznt.date.eta(timestamp)` |
| Format duration (00:00 / "2 hours") | `qznt.date.duration(ms, "digital" \| "hms")` |
| Parse "1h 30m" → ms | `qznt.date.parse("1h 30m")` |
| Format number as "$1,234.50" | `qznt.format.currency(num)` |
| Format number as "1.2k" | `qznt.format.compactNumber(num)` |
| Format bytes as "4.2 MB" | `qznt.format.memory(bytes)` |
| Format as "1st", "2nd", "3rd" | `qznt.format.ordinal(num)` |
| Null / undefined guard (type narrowing) | `qznt.is.defined(val)` |
| Check empty string/array/object | `qznt.is.empty(val)` |
| Clamp a number to a range | `qznt.math.clamp(num, min, max)` |
| Convert ms ↔ seconds | `qznt.math.secs(ms)` / `qznt.math.ms(secs)` |
| Sum an array of objects by field | `qznt.math.sum(arr, x => x.amount)` |
| Pick/omit object keys | `qznt.obj.pick(obj, ["a","b"])` / `qznt.obj.omit(obj, ["x"])` |
| Deep merge objects | `qznt.obj.merge(target, source)` |
| Get/set nested path safely | `qznt.obj.get(obj, "a.b[0].c")` |
| Random item from array | `qznt.rnd.choice(arr)` |
| Random weighted item | `qznt.rnd.weighted(arr, x => x.weight)` |
| Random int / float | `qznt.rnd.int(1, 100)` / `qznt.rnd.float(0, 1)` |
| Probability check | `qznt.rnd.chance(0.25)` — true 25% of the time |
| Seeded RNG | `qznt.rnd.prng(seed)` |
| Convert to Title Case | `qznt.str.toTitleCase(str)` |
| Escape string for regex | `qznt.str.escapeRegex(str)` |
| Debounce / throttle function | `qznt.timing.debounce(fn, 300)` |
| Array → object record | `qznt.to.record(arr, item => ({ key: item.id, value: item }))` |
| Pipe value through transforms | `qznt.Pipe(value, fn1, fn2, fn3)` |
| Per-request in-memory cache (with TTL) | `new qznt.Cache<T>(cleanupMs)` |
| Persistent JSON file store | `new qznt.Storage("filename")` |
| Interval loop (pause/resume/stop) | `new qznt.Loop(fn, delayMs)` |
| Read all files in a directory | `qznt.fs.readDir("./src")` |

---

## Module Reference

For full API signatures and examples, read the matching reference file:

| Module | Contents | Reference |
|--------|----------|-----------|
| `arr` | chunk, chunkAdj, cluster, compact, forceArray, search, seqMap, shuffle, sortBy, unique | `docs/qznt/arr.md` |
| `async` | retry (exponential backoff), wait | `docs/qznt/async.md` |
| `fn` | memoize (with TTL + resolver) | `docs/qznt/fn.md` |
| `date` | duration, eta, getAge, parse | `docs/qznt/date.md` |
| `format` | currency, number, compactNumber, memory, ordinal | `docs/qznt/format.md` |
| `is` | defined, empty, inRange, object, sorted, string, today | `docs/qznt/is.md` |
| `math` | clamp, lerp, invLerp, remap, percent, sum, wrap, ms, secs | `docs/qznt/math.md` |
| `obj` | get, has, set, merge, pick, omit | `docs/qznt/obj.md` |
| `rnd` | chance, choice, weighted, sampler, int, float, index, str, prng | `docs/qznt/rnd.md` |
| `str` | escapeRegex, getFlag, hasFlag, toTitleCase | `docs/qznt/str.md` |
| `timing` | debounce, throttle | `docs/qznt/timing.md` |
| `to` | record | `docs/qznt/to.md` |
| `fs` | readDir | `docs/qznt/fs.md` |
| Classes | `Cache`, `Storage`, `Loop` | `docs/qznt/classes.md` |
| `Pipe` | Function pipeline | `docs/qznt/pipe.md` |

**Load a reference file when you need more than a one-liner.** The SKILL.md table above is enough for most usage — only go deeper when you need edge cases, option details, or behavioral gotchas.
