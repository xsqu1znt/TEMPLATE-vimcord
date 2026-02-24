# qznt.date — Date & Time Utilities

```typescript
import qznt from "qznt";
const { date } = qznt;
```

---

## duration(target, style?, options?)

Format a time difference as a human-readable string. `target` is a timestamp or `Date`.

```typescript
// Default style: "hms" — "2 hours, 30 minutes and 15 seconds"
date.duration(someTimestamp);

// "digital" — "02:30:15" (or "30:15" if < 1 hour)
date.duration(someTimestamp, "digital");
date.duration(someTimestamp, "digital", { since: Date.now() }); // relative to now (default)

// "ymdhms" — "3 days, 2 hours and 5 minutes"
date.duration(someTimestamp, "ymdhms");

// Custom reference point
date.duration(endTime, "hms", { since: startTime });

// Returns null if nullIfPast and the time is in the past
date.duration(pastTimestamp, "hms", { nullIfPast: true }); // null

// Omit the " ago" suffix for past times
date.duration(pastTimestamp, "hms", { ignorePast: true });
```

**Style guide:**
- `"digital"` → timer display, cooldown countdown
- `"hms"` → embed fields, readable summaries
- `"ymdhms"` → long durations spanning days

---

## eta(date, locale?)

Relative time string using `Intl.RelativeTimeFormat` — "3 days ago", "in 2 hours", "yesterday".

```typescript
date.eta(user.createdAt);        // "2 years ago"
date.eta(event.startsAt);        // "in 3 hours"
date.eta(Date.now() - 5000);     // "5 seconds ago"

date.eta(timestamp, "fr");       // "il y a 3 jours" (French)
date.eta(timestamp, "de-DE");    // "vor 3 Tagen" (German)
```

Use `eta` for embed footers, audit logs, and anywhere you show when something happened relative to now.

---

## getAge(birthdate)

Calculate age in years from a `Date`.

```typescript
date.getAge(new Date("2000-06-15")); // e.g. 24
```

---

## parse(str, options?)

Parse shorthand time strings into milliseconds.

**Supported units:** `ms`, `s`, `m`, `h`, `d`, `w`, `mth`, `y`

```typescript
date.parse("1h");           // 3_600_000
date.parse("1h 30m");       // 5_400_000
date.parse("2d 12h");       // 216_000_000
date.parse("90s");          // 90_000
date.parse(5000);           // 5000 (numbers pass through unchanged)

// Return seconds instead of ms
date.parse("2h", { unit: "s" }); // 7200

// Return absolute Unix timestamp (Date.now() + result)
date.parse("10m", { fromNow: true }); // timestamp 10 minutes from now

// Throws on invalid input
date.parse("not-a-time"); // Error: parse: Invalid time format: "not-a-time"
```

**Common use cases:**
```typescript
// Cooldown
const cooldownMs = date.parse("24h");
const endsAt = Date.now() + cooldownMs;

// TTL for a cache entry
cache.set("key", value, date.parse("5m"));

// Config-driven timeouts
const timeout = date.parse(config.timeout ?? "30s");
```
