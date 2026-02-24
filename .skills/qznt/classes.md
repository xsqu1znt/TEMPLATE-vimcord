# qznt Classes — Cache, Storage, Loop

---

## Cache\<T\>

In-memory key-value cache with optional TTL per entry. O(1) get/set. Periodic cleanup of expired entries runs in the background.

```typescript
import qznt from "qznt";

// Create a cache with 5-minute cleanup interval (default: 1 minute)
const userCache = new qznt.Cache<UserProfile>(5 * 60_000);

// Set with optional TTL
userCache.set("user:123", profileData);              // no expiry
userCache.set("user:456", profileData, 60_000);      // expires in 60s

// Get — returns null if expired or missing
const profile = userCache.get("user:123");
if (!profile) {
    // cache miss — fetch from DB
}

// Clear all
userCache.clear();
```

**Typical use:** Caching Discord API fetch results or DB queries that are expensive and stale-tolerant.

```typescript
// Pattern: cache-or-fetch
async function getProfile(userId: string): Promise<IUser | null> {
    const cached = profileCache.get(userId);
    if (cached) return cached;

    const user = await UserSchema.fetch({ userId });
    if (user) profileCache.set(userId, user, 30_000); // cache 30s
    return user;
}
```

---

## Storage

Persistent key-value store. In Node.js, writes a JSON file to disk. In the browser, uses `localStorage`.

```typescript
// Node.js: creates "bot-data.json" in process.cwd()
const store = new qznt.Storage("bot-data");

// Custom directory
const store = new qznt.Storage("cooldowns", "./data");

store.set("lastReset", Date.now());
store.set("maintenance", true, 3600_000); // TTL: expires in 1 hour

const lastReset = store.get<number>("lastReset"); // null if missing/expired
store.has("lastReset");  // boolean
store.remove("lastReset");
store.clear(); // wipe all keys
```

**When to use Storage vs DB:**
- `Storage` — bot-local state that survives restarts but doesn't need to be shared across processes or queried (e.g. bot startup timestamps, local feature flags, one-off migration markers).
- `MongoSchema` — anything user-facing, multi-instance, or needing query/aggregation.

---

## Loop

A controllable interval — like `setInterval` but supports pause/resume, state tracking, event emission, and waits for async work to complete before scheduling the next tick.

```typescript
import qznt from "qznt";

// Starts immediately (immediate = true by default)
const loop = new qznt.Loop(async (self) => {
    await processQueue();
    return "done"; // return value is emitted as "tick" event
}, 10_000); // every 10 seconds

// Start/stop
loop.start();  // only works if state is "stopped"
loop.stop();
loop.pause();  // saves remaining time before next tick
loop.resume(); // resumes from where it paused

// State
loop.state; // "running" | "paused" | "stopped"

// Change delay at runtime
loop.setDelay(5_000);

// Manual one-shot trigger (doesn't affect the loop schedule)
await loop.execute();

// Events
loop.on("tick",  (result) => console.log("Tick result:", result));
loop.on("start", ()       => console.log("Loop started"));
loop.on("stop",  ()       => console.log("Loop stopped"));
loop.on("pause", ({ remaining }) => console.log(`Paused, ${remaining}ms remaining`));
loop.on("resume",()       => console.log("Resumed"));
loop.on("error", (err)    => console.error("Loop error:", err));
```

**Loop vs Vimcord CronJob:**
- Use `Loop` for real-time, interval-based work inside a feature class or event handler (e.g. a live auction countdown, queue drain, polling).
- Use `CronJob` (`.skills/vimcord/jobs.md`) for scheduled tasks defined by cron expression or for tasks that need to be registered with the bot's job system.

```typescript
// Practical example: live auction countdown
class AuctionManager {
    private timer: qznt.Loop;

    start(): void {
        this.timer = new qznt.Loop(async () => {
            const remaining = this.endTime - Date.now();
            if (remaining <= 0) {
                await this.finalize();
                this.timer.stop();
            } else {
                await this.updateCountdownEmbed(remaining);
            }
        }, 5_000);
    }

    pause(): void  { this.timer.pause(); }
    resume(): void { this.timer.resume(); }
    end(): void    { this.timer.stop(); }
}
```
