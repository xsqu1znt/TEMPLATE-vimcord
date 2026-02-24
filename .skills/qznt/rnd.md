# qznt.rnd — Random Utilities

All functions accept an optional `seed` for deterministic results. Without a seed, `Math.random()` is used.

```typescript
import qznt from "qznt";
const { rnd } = qznt;
```

---

## int(min, max, seed?)

Random integer inclusive of both bounds.

```typescript
rnd.int(1, 6);         // Dice roll: 1–6
rnd.int(0, 100);       // 0–100
rnd.int(1, 10, 42);    // Always same value for seed 42
```

---

## float(min, max, seed?)

Random float between min and max.

```typescript
rnd.float(0, 1);       // e.g. 0.7341
rnd.float(1.5, 3.0);
```

---

## chance(percent?, seed?)

Returns `true` with the given probability. Default is 50%.

```typescript
rnd.chance(0.25);   // true 25% of the time
rnd.chance(0.01);   // true 1% of the time (rare drop)
rnd.chance();       // true 50% of the time
rnd.chance(0);      // always false
rnd.chance(1);      // always true

// Item drop with rarity
if (rnd.chance(card.dropRate)) {
    await giveCard(userId, card);
}
```

---

## choice(array, options?)

Pick a random element from an array.

```typescript
rnd.choice(["sword", "shield", "potion"]); // random item

// Reroll if result equals a specific value (avoids repetition)
rnd.choice(statuses, { not: currentStatus });

// Reroll using a predicate
rnd.choice(cards, { not: card => card.id === lastCardId });

// Deterministic
rnd.choice(items, { seed: 42 });
```

**Options:** `seed`, `not` (value or predicate to reroll away from), `maxRerolls` (default: 10)

---

## weighted(array, selector, seed?)

Pick a random item using weights. Higher weight = higher probability.

```typescript
const rarities = [
    { name: "Common",    weight: 60 },
    { name: "Uncommon",  weight: 25 },
    { name: "Rare",      weight: 10 },
    { name: "Legendary", weight: 5  }
];

rnd.weighted(rarities, r => r.weight); // "Common" ~60% of the time
```

Uses binary search for large arrays (>= 20 items) for performance.

---

## sampler(items, selector, seed?)

Pre-compute a weighted sampler using the **Alias Method** for O(1) repeated picks. Use when you need to draw from the same weighted pool many times.

```typescript
// Set up once
const cardPool = rnd.sampler(allCards, card => card.weight);

// Pick repeatedly — O(1) each call
const card1 = cardPool.pick();
const card2 = cardPool.pick();
const card3 = cardPool.pick();

// 10-pack opening
const pack = Array.from({ length: 10 }, () => cardPool.pick());
```

> Use `sampler` over `weighted` when you're drawing from the same pool repeatedly in a loop. `weighted` recalculates cumulative weights on every call.

---

## index(array, options?)

Returns a random **index** (number) rather than a random element.

```typescript
rnd.index(myArray);           // random valid index
rnd.index(myArray, { not: currentIndex }); // won't repeat current index
```

---

## str(len, mode, options?)

Generate a random string.

```typescript
rnd.str(8, "alphanumeric");           // e.g. "aB3xK9mZ"
rnd.str(6, "number");                 // e.g. "394827"
rnd.str(10, "alpha", { casing: "upper" }); // e.g. "XKQMJLNRPW"
rnd.str(12, "alpha", { casing: "mixed" });
rnd.str(8, "custom", { customChars: "ABCDEF0123456789" }); // hex-like
rnd.str(8, "alphanumeric", { exclude: "0O1lI" }); // no ambiguous chars
```

**Modes:** `"number"` | `"alpha"` | `"alphanumeric"` | `"custom"`

---

## prng(seed)

Create a deterministic pseudo-random number generator (Mulberry32 algorithm). Returns a `() => number` function that generates values in `[0, 1)`.

```typescript
const rng = rnd.prng(12345);
rng(); // always 0.xxxx for seed 12345
rng(); // next value in sequence

// Use as custom RNG
const values = Array.from({ length: 5 }, rng);
```
