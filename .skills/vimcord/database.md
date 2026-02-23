# Database Reference

MongoDB via Mongoose, abstracted by Vimcord's `createMongoSchema`.

---

## Table of Contents

1. [Schema Creation](#schema-creation)
2. [Field Options](#field-options)
3. [CRUD Operations](#crud-operations)
4. [Aggregation](#aggregation)
5. [Indexes](#indexes)
6. [extend() — Custom Methods](#extend--custom-methods)
7. [Transactions](#transactions)
8. [execute() — Raw Model Access](#execute--raw-model-access)
9. [Utility Methods](#utility-methods)
10. [Full Schema Example](#full-schema-example)
11. [Barrel Export Pattern](#barrel-export-pattern)

---

## Schema Creation

```typescript
import { createMongoSchema } from "vimcord";

export interface IUser {
    userId: string;
    username: string;
    balance: number;
    experience: number;
    isPremium: boolean;
    favoriteCardIds: string[];
    lastActive: Date;
    createdAt: number;
}

export const UserSchema = createMongoSchema<IUser>("Users", {
    userId: { type: String, unique: true, required: true, index: true },
    username: { type: String, required: true },
    balance: { type: Number, default: 0 },
    experience: { type: Number, default: 0, index: true },
    isPremium: { type: Boolean, default: false },
    favoriteCardIds: { type: [String], default: [] },
    lastActive: { type: Date, default: () => new Date() },
    createdAt: { type: Number, default: Date.now }
});
```

The first argument is the MongoDB collection name (PascalCase, plural). The second is the schema definition.

---

## Field Options

| Option | Description |
|--------|-------------|
| `type` | Field type: `String`, `Number`, `Boolean`, `Date`, `[String]`, etc. |
| `required` | Throw error if missing |
| `unique` | Unique index |
| `default` | Default value or function: `Date.now`, `() => new Date()`, `0`, `[]` |
| `index` | Add an index for faster queries |

---

## CRUD Operations

### Create

```typescript
// Single
await UserSchema.create([{ userId: "123", username: "John" }]);

// Multiple
await UserSchema.create([
    { userId: "1", username: "Alice" },
    { userId: "2", username: "Bob" }
]);

// With session (inside transaction)
await UserSchema.create([{ userId: "123" }], { session });
```

### Read

```typescript
// Single document (returns null if not found)
const user = await UserSchema.fetch({ userId: "123" });

// With field projection (more efficient)
const user = await UserSchema.fetch({ userId: "123" }, { balance: 1, experience: 1 });

// Upsert on fetch (create if not found)
const user = await UserSchema.fetch({ userId: "123" }, null, { upsert: true });

// All matching
const premiumUsers = await UserSchema.fetchAll({ isPremium: true });

// With sort and limit
const topUsers = await UserSchema.fetchAll({}, null, { limit: 10, sort: { balance: -1 } });

// Lean (plain objects, faster for read-only)
const users = await UserSchema.fetchAll({}, null, { lean: true });

// Check existence
const exists = await UserSchema.exists({ userId: "123" });

// Distinct values
const groups = await CardSchema.distinct("group", { released: true });
```

### Update

```typescript
// Single document
await UserSchema.update({ userId: "123" }, { $inc: { balance: 100 } });

// Upsert (create if doesn't exist)
await UserSchema.update({ userId: "123" }, { $set: { lastActive: new Date() } }, { upsert: true });

// Return updated document
const updated = await UserSchema.update({ userId: "123" }, { $inc: { balance: 50 } }, { new: true });

// All matching
await CardSchema.updateAll({ released: false }, { $set: { released: true } });
```

### Delete

```typescript
// Single
await UserSchema.delete({ userId: "123" });

// All matching
await CooldownSchema.deleteAll({ endsAt: { $lt: new Date() } });
```

---

## Aggregation

```typescript
import { PipelineStage } from "mongoose";

// Simple
const topUsers = await UserSchema.aggregate([
    { $match: { balance: { $gt: 0 } } },
    { $sort: { balance: -1 } },
    { $limit: 10 }
]);

// Typed results
const cards = await CardSchema.aggregate<ICard>([
    { $match: { tier: CardTier.Public, released: true } },
    { $sample: { size: 3 } }
]);

// With session
const results = await CardSchema.aggregate(pipeline, { session });
```

---

## Indexes

```typescript
// In schema definition (single field)
userId: { type: String, unique: true, required: true, index: true }

// After schema creation (compound, special)
// Compound unique
GuildSchema.schema.index({ guildId: 1, prefix: 1 }, { unique: true });

// TTL index (auto-delete)
CooldownSchema.schema.index({ endsAt: 1 }, { expireAfterSeconds: 300 });

// Compound query index
AlbumCardSchema.schema.index({ userId: 1, claimedAt: -1 });
AlbumCardSchema.schema.index({ userId: 1, cardId: 1 }, { unique: true });
```

**Index any field you query frequently.** Compound indexes follow query order.

---

## extend() — Custom Methods

Add reusable business logic directly to the schema:

```typescript
export const UserSchema = createMongoSchema<IUser>("Users", {
    userId: { type: String, unique: true, required: true },
    balance: { type: Number, default: 0 },
    experience: { type: Number, default: 0 }
}).extend({ modifyBalance, addExperience, getLeaderboard });

async function modifyBalance(userId: string, amount: number): Promise<void> {
    await UserSchema.update({ userId }, { $inc: { balance: amount } });
}

async function addExperience(userId: string, xp: number): Promise<void> {
    await UserSchema.update({ userId }, { $inc: { experience: xp } }, { upsert: true });
}

async function getLeaderboard(limit: number = 10) {
    return UserSchema.aggregate([{ $sort: { experience: -1 } }, { $limit: limit }]);
}

// Usage
await UserSchema.modifyBalance("123", 100);
await UserSchema.addExperience("123", 50);
const top = await UserSchema.getLeaderboard(5);
```

Extended methods that need Discord API access accept `client: Vimcord<true>` as a parameter.

---

## Transactions

For atomic operations across multiple documents or schemas:

```typescript
// Automatic session management — session commits on success, rolls back on error
await UserSchema.useTransaction(async session => {
    await UserSchema.update({ userId: senderId }, { $inc: { balance: -amount } }, { session });
    await UserSchema.update({ userId: recipientId }, { $inc: { balance: amount } }, { session });
    await TradeLogSchema.create([{ senderId, recipientId, amount }], { session });
});
```

Any schema can call `useTransaction` — the session is shared across all schemas inside the callback.

---

## execute() — Raw Model Access

For operations not covered by built-in methods:

```typescript
// Bulk write
await UserSchema.execute(async model => {
    await model.bulkWrite(
        userIds.map(userId => ({
            updateOne: {
                filter: { userId },
                update: { $inc: { dailyStreak: 1 } },
                upsert: true
            }
        }))
    );
});

// Complex update
await AlbumCardSchema.execute(async model => {
    await model.bulkWrite(
        cards.map(card => ({
            updateOne: {
                filter: { userId, cardId: card.cardId },
                update: { $addToSet: { prints: { $each: card.prints } } },
                upsert: true
            }
        }))
    );
});
```

---

## Utility Methods

```typescript
// Generate a unique hex ID (length, fieldName)
const txId = await TransactionSchema.createHexId(12, "transactionId");
```

---

## Full Schema Example

```typescript
import { createMongoSchema } from "vimcord";
import { PipelineStage, FilterQuery, ProjectionFields } from "mongoose";

export interface ICard {
    cardId: string;
    name: string;
    group: string;
    rarity: number | null;
    type: CardType;
    imageUrl: string;
    released: boolean;
    createdAt: number;
}

export const CardSchema = createMongoSchema<ICard>("Cards", {
    cardId: { type: String, unique: true, required: true },
    name: { type: String, required: true, index: true },
    group: { type: String, required: true, index: true },
    rarity: { type: Number, default: null, index: true },
    type: { type: Number, required: true, index: true },
    imageUrl: { type: String, required: true },
    released: { type: Boolean, default: false, index: true },
    createdAt: { type: Number, default: Date.now }
}).extend({ sampleRandom });

// Compound index
CardSchema.schema.index({ type: 1, rarity: 1, released: 1 });

async function sampleRandom(quantity: number) {
    const pipeline: PipelineStage[] = [
        { $match: { released: true } },
        { $sample: { size: quantity } }
    ];
    return CardSchema.aggregate<ICard>(pipeline);
}
```

---

## Barrel Export Pattern

Always export all schemas from `src/db/index.ts`:

```typescript
// src/db/index.ts
export { UserSchema, type IUser } from "./schemas/user.schema";
export { GuildSchema, type IGuild } from "./schemas/guild.schema";
export { CardSchema, type ICard } from "./schemas/card.schema";
```

Import in commands/events:

```typescript
import { UserSchema, CardSchema } from "@db/index";
```
