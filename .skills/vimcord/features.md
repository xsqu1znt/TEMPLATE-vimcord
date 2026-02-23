# Feature Classes Reference

Feature classes encapsulate complex business logic that spans multiple commands or requires stateful operations.

**When to use a feature class:**
- Logic is shared across 2+ commands
- State must be maintained during a multi-step operation (e.g. a trade flow)
- Business rules are complex enough to deserve isolation and potential testing

---

## Pattern

```typescript
// src/features/TradeManager.ts
import { User } from "discord.js";
import { Vimcord } from "vimcord";
import { UserSchema, ItemSchema } from "@db/index";

interface TradeOffer {
    itemIds: string[];
    coins: number;
}

export class PlayerTrade {
    readonly sender: User;
    readonly recipient: User;
    senderOffer: TradeOffer;
    recipientOffer: TradeOffer;

    constructor(sender: User, recipient: User) {
        this.sender = sender;
        this.recipient = recipient;
        this.senderOffer = { itemIds: [], coins: 0 };
        this.recipientOffer = { itemIds: [], coins: 0 };
    }

    async isEligible(): Promise<{ success: boolean; failReason?: string }> {
        const users = await UserSchema.fetchAll({
            userId: { $in: [this.sender.id, this.recipient.id] }
        });

        if (users.length < 2) {
            return { success: false, failReason: "Both users must be registered." };
        }

        const senderData = users.find(u => u.userId === this.sender.id);
        if ((senderData?.balance ?? 0) < this.senderOffer.coins) {
            return { success: false, failReason: "Sender has insufficient coins." };
        }

        return { success: true };
    }

    async execute(): Promise<{ success: boolean; failReason?: string }> {
        const eligibility = await this.isEligible();
        if (!eligibility.success) return eligibility;

        await UserSchema.useTransaction(async session => {
            // Transfer coins
            await UserSchema.update(
                { userId: this.sender.id },
                { $inc: { balance: -this.senderOffer.coins } },
                { session }
            );
            await UserSchema.update(
                { userId: this.recipient.id },
                { $inc: { balance: this.senderOffer.coins } },
                { session }
            );
            // Transfer items...
        });

        return { success: true };
    }
}
```

## Using in a Command

```typescript
import { SlashCommandBuilder } from "vimcord";
import { PlayerTrade } from "@features/TradeManager";

export default new SlashCommandBuilder({
    builder: builder =>
        builder
            .setName("trade")
            .setDescription("Initiate a trade")
            .addUserOption(opt => opt.setName("user").setDescription("Who to trade with").setRequired(true)),

    deferReply: true,

    async execute(client, interaction): Promise<void> {
        const targetUser = interaction.options.getUser("user", true);

        if (targetUser.id === interaction.user.id) {
            return interaction.editReply("You can't trade with yourself.");
        }

        const trade = new PlayerTrade(interaction.user, targetUser);
        const eligibility = await trade.isEligible();

        if (!eligibility.success) {
            return interaction.editReply(eligibility.failReason ?? "Trade not available.");
        }

        // Proceed with trade UI...
        const result = await trade.execute();
        if (!result.success) {
            return interaction.editReply(result.failReason ?? "Trade failed.");
        }

        await interaction.editReply("Trade complete!");
    }
});
```

## Stateless Utility Class (Manager Pattern)

For shared logic that doesn't need instance state:

```typescript
// src/features/CooldownManager.ts
import { TextBasedChannel } from "discord.js";
import { CooldownSchema } from "@db/index";

export class CooldownManager {
    static async check(userId: string, action: string): Promise<{ isActive: boolean; remaining?: number }> {
        const cooldown = await CooldownSchema.fetch({ userId, action });
        if (!cooldown) return { isActive: false };

        const remaining = cooldown.endsAt.getTime() - Date.now();
        if (remaining <= 0) {
            await CooldownSchema.delete({ userId, action });
            return { isActive: false };
        }

        return { isActive: true, remaining };
    }

    static async set(userId: string, action: string, durationMs: number): Promise<void> {
        const endsAt = new Date(Date.now() + durationMs);
        await CooldownSchema.update({ userId, action }, { $set: { endsAt } }, { upsert: true });
    }
}
```
