# qznt.async — Async Utilities

```typescript
import qznt from "qznt";
const { async: qAsync } = qznt;
// Note: destructure as qAsync to avoid shadowing the built-in `async` keyword
```

---

## retry(fn, options?)

Retry an async function with **exponential backoff + random jitter**. Each retry doubles the delay.

```typescript
// Defaults: 3 retries, 500ms initial delay
const data = await qAsync.retry(() => fetchExternalAPI());

// Custom options
const result = await qAsync.retry(
    signal => fetchWithSignal(url, signal),
    {
        retries: 5,
        delay: 1000,       // Initial delay — doubles each retry: 1s, 2s, 4s, 8s, 16s
        timeout: 5000,     // Per-attempt timeout (ms) — throws if attempt exceeds this
        signal: controller.signal  // AbortSignal to cancel the entire operation
    }
);
```

**Behavior:**
- Uses `jitter` (up to +200ms random) to avoid thundering herd
- If the `AbortSignal` fires, the operation is cancelled immediately — no more retries
- If `timeout` is set, each individual attempt is wrapped in its own `AbortController`
- Retries only on thrown errors — a resolved promise (even with an error object) is not retried

```typescript
// With AbortController for cancellation
const controller = new AbortController();
setTimeout(() => controller.abort(), 10_000); // Cancel after 10s total

const data = await qAsync.retry(
    signal => fetch(url, { signal }).then(r => r.json()),
    { retries: 3, delay: 500, signal: controller.signal }
);
```

---

## wait(ms)

Promise-based sleep. Returns `true` when resolved.

```typescript
await qAsync.wait(1000); // wait 1 second

// Sequential delays
await doStep1();
await qAsync.wait(500);
await doStep2();
```
