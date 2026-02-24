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
9. [CommandManager API](#commandmanager-api)

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
    logExecution: true,                      // false = suppress execution logs for this command
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
        { name: "view",  handler: (client, interaction) => settingsView(interaction) },
        { name: "set",   handler: (client, interaction) => settingsSet(interaction) },
        { name: "reset", handler: (client, interaction) => settingsReset(interaction) }
    ],

    // Optional: handle unknown subcommand names (e.g. if routes list is incomplete)
    onUnknownRouteHandler: async (client, interaction): Promise<void> => {
        await interaction.editReply("Unknown subcommand.");
    }
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

    async execute(client, message): Promise<void> {
        const args = message.content.split(" ").slice(1);
        const topic = args[0]?.toLowerCase();
        await message.reply(topic ? `Help for: ${topic}` : "Use !help <topic>");
    }
});
```

---

## Context Menu Commands

```ts
// ApplicationCommandType.Message is used when a context command should be used on a message for per-message based context
.setType(ApplicationCommandType.Message)

// ApplicationCommandType.User is used when a context command should be used on a user for per-user based context
.setType(ApplicationCommandType.User)
```

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

    // Role-based (user must have ANY of these roles)
    roles: ["ROLE_ID_1", "ROLE_ID_2"],
    roleBlacklist: ["BANNED_ROLE_ID"],

    // User-based
    userWhitelist: ["USER_ID_1"],
    userBlacklist: ["BLOCKED_USER_ID"],

    // Context
    guildOnly: true,          // No DMs
    guildOwnerOnly: false,    // Only server owner
    botOwnerOnly: false,      // Only bot ownerId
    botStaffOnly: false       // ownerId + superUsers + superUserRoles
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
        environments: ["production"]       // "production" | "development" — skip in other envs
    }
});
```

---

## Lifecycle Hooks

All hooks are available on every command type (slash, prefix, context):

```typescript
new SlashCommandBuilder({
    builder: {...},

    enabled: true,           // Set false to disable without deleting the file
    logExecution: true,      // Set false to suppress execution log for this command

    beforeExecute: async (client, interaction): Promise<void> => {
        // Runs before execute — good for logging, analytics
    },

    async execute(client, interaction): Promise<void> {
        // Main logic
    },

    afterExecute: async (result, client, interaction): Promise<void> => {
        // Runs after execute — result is the return value of execute()
    },

    onMissingPermissions: async (results, client, interaction): Promise<void> => {
        // results.failReason, results.missingUserPermissions, etc.
        await interaction.reply({ content: "You lack the required permissions.", flags: "Ephemeral" });
    },

    onConditionsNotMet: async (client, interaction): Promise<void> => {
        // Fires when any condition() returns false
        await interaction.reply({ content: "Requirements not met.", flags: "Ephemeral" });
    },

    onUsedWhenDisabled: async (client, interaction): Promise<void> => {
        // Fires when enabled: false and the command is still invoked
        await interaction.reply({ content: "This command is currently disabled.", flags: "Ephemeral" });
    },

    onError: async (error, client, interaction): Promise<void> => {
        // Handle error locally — re-throw to also trigger global handler
        await interaction.reply({ content: "Something went wrong.", flags: "Ephemeral" });
        throw error;
    }
});
```

---

## CommandManager API

Access and deploy commands via `client.commands`:

```typescript
// Sub-managers
client.commands.slash;    // SlashCommandManager
client.commands.prefix;   // PrefixCommandManager
client.commands.context;  // ContextCommandManager

// Get a specific command by name
const cmd = client.commands.slash.get("ping");

// Get all slash commands (alphabetical), optionally filtered
const all = client.commands.slash.getAll();
const staffOnly = client.commands.slash.getAll({ fuzzyNames: ["admin", "staff"] });

// Group commands by category
const categories = client.commands.slash.sortByCategory();
// categories[0].name, categories[0].emoji, categories[0].commands

// Get all app commands (slash + context combined)
const appCmds = client.commands.getAllAppCommands();

// Deploy to Discord
await client.commands.registerGlobal();          // All app commands globally
await client.commands.registerGlobal({ names: ["ping", "help"] }); // Filtered

await client.commands.registerGuild();           // Uses deployment.guilds from each command
await client.commands.registerGuild({ guilds: ["GUILD_ID"] }); // Force specific guilds

await client.commands.unregisterGlobal();        // Remove all global registrations
await client.commands.unregisterGuild({ guilds: ["GUILD_ID"] });
```

**CommandFilter options** (for `getAll`, `registerGlobal`, `registerGuild`):
```typescript
{
    names: ["ping"],               // Exact name match
    fuzzyNames: ["admin"],         // Partial name match
    globalOnly: true,              // Only commands with deployment.global = true
    ignoreDeploymentOptions: true  // Ignore deployment config, include all
}
```

