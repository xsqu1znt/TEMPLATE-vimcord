# qznt.math — Math Utilities

```typescript
import qznt from "qznt";
const { math } = qznt;
```

---

## clamp(num, min, max) / clamp(num, max)

Constrain a value within a range. If only one bound is given, clamps `0..max`.

```typescript
math.clamp(150, 0, 100); // 100
math.clamp(-5, 0, 100);  // 0
math.clamp(50, 0, 100);  // 50

math.clamp(value, 100);  // same as clamp(value, 0, 100)

// Clamp XP to valid range
const xp = math.clamp(rawXp, 0, MAX_XP);

// Clamp a page index
const page = math.clamp(requestedPage, 0, pages.length - 1);
```

---

## lerp(start, end, t)

Linear interpolation. `t` is a factor from 0 to 1.

```typescript
math.lerp(0, 100, 0.5);  // 50
math.lerp(10, 20, 0.2);  // 12
math.lerp(0, 255, 0.75); // 191.25
```

---

## invLerp(start, end, value)

Inverse lerp — computes the `t` factor (0–1) of a value between two bounds.

```typescript
math.invLerp(0, 100, 50);  // 0.5
math.invLerp(0, 200, 150); // 0.75
```

---

## remap(value, inMin, inMax, outMin, outMax)

Map a value from one range to another. Combines `invLerp` + `lerp`.

```typescript
// Map a 0-100 score to a 1-5 star rating
math.remap(75, 0, 100, 1, 5); // 4

// Map mouse X (0..1920) to volume (0..1)
const volume = math.remap(mouseX, 0, 1920, 0, 1);
```

---

## percent(a, b, round?)

Calculate percentage. `round` defaults to `true`.

```typescript
math.percent(50, 100);        // 50
math.percent(30, 40);         // 75  (30 is 75% of 40)
math.percent(1, 3, false);    // 33.33... (unrounded)

// Progress bar
const progress = math.percent(userXp, levelThreshold);
// `${progress}%`
```

---

## sum(array, selector?)

Sum numbers or sum a field from an array of objects. Negative values subtract.

```typescript
math.sum([1, 2, 3, 4, 5]);          // 15
math.sum([-1, 5, -2]);              // 2 (negatives subtract from total)

math.sum(items, item => item.price); // sum all .price fields
math.sum(trades, t => t.amount);

// Throws TypeError if non-numbers encountered
```

---

## wrap(num, max)

Wraps a number into a modular range `[0, max)`. Handles negatives correctly.

```typescript
math.wrap(12, 10); // 2
math.wrap(-1, 10); // 9  — wraps around
math.wrap(10, 10); // 0  — wraps at boundary

// Infinite carousel / ring navigation
const nextPage = math.wrap(currentPage + 1, totalPages);
const prevPage = math.wrap(currentPage - 1, totalPages);
```

---

## ms(seconds) / secs(ms)

Convert between seconds and milliseconds. Both round to nearest integer.

```typescript
math.ms(1.5);     // 1500  (seconds → ms)
math.ms(0.3);     // 300

math.secs(1500);  // 1  (ms → seconds, floored)
math.secs(3600);  // 3

// Store duration in seconds, compute ms for setTimeout
const timeoutMs = math.ms(config.cooldownSeconds);
```
