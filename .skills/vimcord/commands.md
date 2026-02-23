# Commands Reference

Covers slash commands, prefix commands, context menu commands, routing, permissions, rate limiting, and deployment.

---

## Table of Contents

1. [Slash Commands](#slash-commands)
2. [Prefix Commands](#prefix-commands)
3. [Context Menu Commands](#context-menu-commands)
4. [Permissions Reference](#permissions-reference)
5. [Rate Limiting](#rate-limiting)
6. [Deployment Options](#deployment-options)
7. [Lifecycle Hooks](#lifecycle-hooks)
8. [Subcommand Routing](#subcommand-routing)

---

## Slash Commands

### Builder Function Pattern (Preferred)

Always use the builder function form (`builder => builder...`). Never instantiate `DJSSlashCommandBuilder` separately unless you need to assign it before the object.

```typescript
import { InteractionContextType, PermissionFlagsBits } from "discord.js";
import { SlashCommandBuilder } from "vimcord";

export default new SlashCommandBuilder({
    builder: builder =>
        builder
            .setName("example")
            .setDescription("Example command")
            .setContexts(InteractionContextType.Guild)
            .addStringOption(opt =>
                opt.setName("input").setDescription("Some input").setRequired(true).setMaxLength(100)
            ),

    deferReply: true,                        // Use { ephemeral: true } for ephemeral defer
    metadata: { category: "Category/Name" }, // Used by help commands

    async execute(client, interaction): Promise<void> {
        const input = interaction.options.getString("input", true);
        await interaction.editReply(`You said: ${input}`);
    }
});
```

### Staff-Only Command

```typescript
import { SlashCommandBuilder } from "vimcord";

export default new SlashCommandBuilder({
    builder: builder =>
        builder
            .setName("admin-action")
            .setDescription("Staff only action (STAFF)"),

    deferReply: true,
    permissions: { guildOnly: true, botStaffOnly: true },
    metadata: { category: "Staff" },

    async execute(client, interaction): Promise<void> {
        // Only reached by ownerId + superUsers
        await interaction.editReply("Done.");
    }
});
```

### With Database

```typescript
import { InteractionContextType } from "discord.js";
import { SlashCommandBuilder } from "vimcord";
import { UserSchema } from "@db/index";

export default new SlashCommandBuilder({
    builder: builder =>
        builder
            .setName("balance")
            .setDescription("Check your balance")
            .setContexts(InteractionContextType.Guild),

    deferReply: true,
    metadata: { category: "Economy" },

    async execute(client, interaction): Promise<void> {
        const userId = interaction.user.id;
        const user = await UserSchema.fetch({ userId }, { balance: 1 });

        await interaction.editReply(`Your balance: ${user?.balance ?? 0} coins`);
    }
});
```

### Autocomplete

```typescript
import { InteractionContextType } from "discord.js";
import { SlashCommandBuilder } from "vimcord";
import { CardSchema } from "@db/index";

export default new SlashCommandBuilder({
    builder: builder =>
        builder
            .setName("card")
            .setDescription("View a card")
            .setContexts(InteractionContextType.Guild)
            .addStringOption(opt =>
                opt.setName("name").setDescription("Card name").setRequired(true).setAutocomplete(true)
            ),

    deferReply: true,

    async autocomplete(client, interaction): Promise<void> {
        const focused = interaction.options.getFocused();
        const cards = await CardSchema.fetchAll({ name: { $regex: focused, $options: "i" } }, null, { limit: 25 });
        await interaction.respond(cards.map(c => ({ name: c.name, value: c.cardId })));
    },

    async execute(client, interaction): Promise<void> {
        const cardId = interaction.options.getString("name", true);
        const card = await CardSchema.fetch({ cardId });

        if (!card) {
            return interaction.editReply("Card not found.");
        }

        await interaction.editReply(card.name);
    }
});
```

---

## Subcommand Routing

Split complex commands with subcommands into separate handler files:

```typescript
// commands/slash/settings.slash.ts
import { SlashCommandBuilder } from "vimcord";
import settingsView from "./settings/view";
import settingsSet from "./settings/set";
import settingsReset from "./settings/reset";

export default new SlashCommandBuilder({
    builder: builder =>
        builder
            .setName("settings")
            .setDescription("Manage bot settings")
            .addSubcommand(sub => sub.setName("view").setDescription("View current settings"))
            .addSubcommand(sub =>
                sub
                    .setName("set")
                    .setDescription("Change a setting")
                    .addStringOption(opt => opt.setName("key").setDescription("Setting name").setRequired(true))
                    .addStringOption(opt => opt.setName("value").setDescription("New value").setRequired(true))
            )
            .addSubcommand(sub => sub.setName("reset").setDescription("Reset all settings")),

    deferReply: true,
    permissions: { guildOnly: true },

    routes: [
        { name: "view", handler: (client, interaction) => settingsView(interaction) },
        { name: "set", handler: (client, interaction) => settingsSet(interaction) },
        { name: "reset", handler: (client, interaction) => settingsReset(interaction) }
    ]
});

// commands/slash/settings/view.ts
import { ChatInputCommandInteraction } from "discord.js";
import { GuildSchema } from "@db/index";

export default async function settingsView(interaction: ChatInputCommandInteraction): Promise<void> {
    const settings = await GuildSchema.fetch({ guildId: interaction.guildId! });
    await interaction.editReply(`Prefix: ${settings?.prefix ?? "?"}`);
}
```

---

## Prefix Commands

```typescript
import { PrefixCommandBuilder } from "vimcord";

export default new PrefixCommandBuilder({
    name: "help",
    aliases: ["h", "?"],
    description: "Show help information",

    metadata: {
        category: "General",
        examples: ["help", "help economy"]
    },

    permissions: { guildOnly: true },

    async execute(client, message, args): Promise<void> {
        const topic = args[0]?.toLowerCase();
        await message.reply(topic ? `Help for: ${topic}` : "Use !help <topic>");
    }
});
```

---

## Context Menu Commands

```typescript
import { ApplicationCommandType, InteractionContextType } from "discord.js";
import { ContextCommandBuilder } from "vimcord";

export default new ContextCommandBuilder({
    builder: builder =>
        builder
            .setName("Report Message")
            .setContexts(InteractionContextType.Guild)
            .setType(ApplicationCommandType.Message),

    async execute(client, interaction): Promise<void> {
        const message = await interaction.channel?.messages.fetch(interaction.targetId);
        if (!message) return;

        await interaction.reply({
            content: `Reported: ${message.url}`,
            flags: "Ephemeral"
        });
    }
});
```

---

## Permissions Reference

```typescript
permissions: {
    // Discord API permissions
    user: [PermissionFlagsBits.ManageMessages, PermissionFlagsBits.KickMembers],
    bot: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks],

    // Role-based (user must have ANY of these)
    roles: ["ROLE_ID_1", "ROLE_ID_2"],
    roleBlacklist: ["BANNED_ROLE_ID"],

    // User-based
    userWhitelist: ["USER_ID_1"],
    userBlacklist: ["BLOCKED_USER_ID"],

    // Context
    guildOnly: true,          // No DMs
    guildOwnerOnly: false,    // Only server owner
    botOwnerOnly: false,      // Only bot ownerId
    botStaffOnly: false       // ownerId + superUsers
}
```

---

## Rate Limiting

```typescript
import { RateLimitScope, SlashCommandBuilder } from "vimcord";

export default new SlashCommandBuilder({
    builder: builder => builder.setName("daily").setDescription("Daily reward"),

    rateLimit: {
        max: 1,
        interval: 86_400_000, // 24 hours in ms
        scope: RateLimitScope.User
    },

    onRateLimit: async (client, interaction): Promise<void> => {
        await interaction.reply({ content: "Already claimed today!", flags: "Ephemeral" });
    },

    async execute(client, interaction): Promise<void> {
        await interaction.reply("Claimed!");
    }
});
```

**RateLimitScope values**: `User`, `Guild`, `Channel`, `Global`

---

## Deployment Options

```typescript
new SlashCommandBuilder({
    builder: {...},
    deployment: {
        global: true,                      // Deploy to all guilds
        guilds: ["GUILD_ID_1"],            // Or specific guilds only
        environments: ["production"]       // "production" | "development"
    }
});
```

---

## Lifecycle Hooks

```typescript
new SlashCommandBuilder({
    builder: {...},

    beforeExecute: async (client, interaction): Promise<void> => {
        // Runs before execute — good for logging, analytics
    },

    async execute(client, interaction): Promise<void> {
        // Main logic
    },

    afterExecute: async (result, client, interaction): Promise<void> => {
        // Runs after execute — good for cleanup
    },

    onError: async (error, client, interaction): Promise<void> => {
        // Handle error locally — re-throw to also trigger global handler
        await interaction.reply({ content: "Something went wrong.", flags: "Ephemeral" });
        throw error;
    }
});
```
