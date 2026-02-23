# Migration Guide: discord.js → Vimcord

---

## Core Philosophy for Migration

- **Incremental migration is valid** — Vimcord works alongside existing discord.js code
- **Migrate commands first** — highest ROI, most visible improvement
- **Events second** — conditions + priority system is powerful
- **Don't rewrite what works** — if a system is stable, migrate it opportunistically

---

## Commands

### Slash Command (before → after)

**Before (raw discord.js)**:
```typescript
client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName !== "ping") return;

    await interaction.deferReply();
    await interaction.editReply(`Pong! ${client.ws.ping}ms`);
});
```

**After (Vimcord)**:
```typescript
// src/commands/slash/ping.slash.ts
import { SlashCommandBuilder } from "vimcord";

export default new SlashCommandBuilder({
    builder: builder => builder.setName("ping").setDescription("Check latency"),
    deferReply: true,
    metadata: { category: "General" },
    async execute(client, interaction): Promise<void> {
        await interaction.editReply(`Pong! ${client.ws.ping}ms`);
    }
});
```

---

## Events

### Event Handler (before → after)

**Before**:
```typescript
client.on("messageCreate", async message => {
    if (message.author.bot) return;
    if (!message.guild) return;
    // logic
});
```

**After**:
```typescript
import { Events } from "discord.js";
import { EventBuilder } from "vimcord";

export default new EventBuilder({
    event: Events.MessageCreate,
    name: "messageCreate.Handler",
    conditions: [
        async m => !m.author.bot,
        async m => m.guild !== null
    ],
    async execute(client, message): Promise<void> {
        // logic
    }
});
```

---

## Client Initialization

**Before**:
```typescript
import { Client, GatewayIntentBits } from "discord.js";

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.login(process.env.TOKEN);
```

**After**:
```typescript
import { GatewayIntentBits } from "discord.js";
import { createClient, defineClientOptions, defineVimcordFeatures } from "vimcord";

const client = createClient(
    defineClientOptions({
        intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
    }),
    defineVimcordFeatures({
        useGlobalErrorHandlers: true,
        useDefaultSlashCommandHandler: true,
        importModules: { slashCommands: "./commands/slash", events: "./events" }
    })
);

client.useEnv();
client.start();
```

---

## Embeds

**Before**:
```typescript
import { EmbedBuilder } from "discord.js";

const embed = new EmbedBuilder()
    .setTitle(`Welcome, ${interaction.user.username}!`)
    .setDescription("Glad you're here.")
    .setColor(0x5865F2)
    .setThumbnail(interaction.user.displayAvatarURL());

await interaction.reply({ embeds: [embed] });
```

**After**:
```typescript
import { BetterEmbed } from "vimcord";

const embed = new BetterEmbed({
    context: { interaction },
    title: "Welcome, $USER_NAME!",
    description: "Glad you're here.",
    color: "#5865F2",
    thumbnail: interaction.user.displayAvatarURL()
});

await embed.send(interaction);
```

---

## Command Registration

**Before** (manual registration script):
```typescript
import { REST, Routes } from "discord.js";

const commands = [...]; // manually built command objects
const rest = new REST().setToken(process.env.TOKEN!);
await rest.put(Routes.applicationCommands(clientId), { body: commands });
```

**After**: Vimcord handles this automatically via `importModules`. No registration script needed. Commands in `commands/slash/*.slash.ts` are auto-registered on startup.

---

## Permission Checking

**Before**:
```typescript
if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages)) {
    return interaction.reply({ content: "No permission.", ephemeral: true });
}
```

**After**:
```typescript
new SlashCommandBuilder({
    permissions: {
        user: [PermissionFlagsBits.ManageMessages]
    },
    // Vimcord handles the check and response automatically
});
```

---

## Incremental Migration Strategy

1. **Install Vimcord alongside existing discord.js** — no breaking changes
2. **Migrate commands first** — move each command to a `*.slash.ts` file
3. **Add `importModules`** to auto-load new files; keep old handlers temporarily
4. **Migrate events** — replace raw `client.on()` with `EventBuilder`
5. **Remove old handlers** once migration is complete
6. **Add Vimcord tools** — replace `EmbedBuilder` with `BetterEmbed`, add Paginator/Prompt where useful

---

## Common Gotchas

| Discord.js Pattern | Vimcord Equivalent | Note |
|---|---|---|
| `interaction.reply()` after defer | `interaction.editReply()` | Always `editReply` after `deferReply: true` |
| `ephemeral: true` | `flags: "Ephemeral"` | Use string flag |
| `client.on("ready", ...)` | `EventBuilder` with `once: true` | |
| Manual try/catch everywhere | `useGlobalErrorHandlers: true` | Vimcord handles uncaught errors |
| `new EmbedBuilder()` | `new BetterEmbed()` | ACF tokens are a bonus |
