# Events Reference

---

## EventBuilder Full API

```typescript
import { Events } from "discord.js";
import { EventBuilder } from "vimcord";

export default new EventBuilder({
    event: Events.MessageCreate,   // discord.js Events enum value
    name: "messageCreate.AutoMod", // Unique dot-namespaced name: "category.Name"
    enabled: true,                 // Can disable without deleting
    once: false,                   // true = only fires once (use for ready events)
    priority: 0,                   // Higher = runs first when multiple handlers share an event

    // Conditions — ALL must return true for execute to run
    conditions: [
        async message => !message.author.bot,
        async message => message.guild !== null
    ],

    // Rate limiting per event
    rateLimit: {
        max: 5,
        interval: 10_000
    },

    async execute(client, message): Promise<void> {
        // Event logic
    },

    onError: async (error, client, message): Promise<void> => {
        console.error("Event error:", error);
    }
});
```

---

## Naming Convention

Event names use dot notation: `<discordEvent>.<Category>`

```
ready.Hello
messageCreate.AutoMod
messageCreate.Logging
guildMemberAdd.Welcome
guildMemberAdd.Logging
interactionCreate.ButtonHandler
presenceUpdate.VanityTracker
```

---

## Common Event Patterns

### Ready Event (once: true)

```typescript
import { Events } from "discord.js";
import { EventBuilder } from "vimcord";

export default new EventBuilder({
    event: Events.Ready,
    name: "ready.Hello",
    once: true,

    async execute(client): Promise<void> {
        console.log(`Logged in as ${client.user.tag}`);
    }
});
```

### Guild Member Join

```typescript
import { Events } from "discord.js";
import { BetterEmbed, EventBuilder } from "vimcord";
import { fetchChannel } from "vimcord";
import { ChannelType } from "discord.js";
import { CONFIG } from "@/constants";

export default new EventBuilder({
    event: Events.GuildMemberAdd,
    name: "guildMemberAdd.Welcome",
    priority: 50,

    async execute(client, member): Promise<void> {
        const channel = await fetchChannel(member.guild, CONFIG.channels.welcome, ChannelType.GuildText);
        if (!channel) return;

        const embed = new BetterEmbed({
            context: { member },
            title: "Welcome, $USER!",
            description: "We're glad you're here.",
            color: "#57F287"
        });

        await embed.send(channel);
    }
});
```

### Interaction Collector (in events/interaction/)

```typescript
import { Events, ComponentType } from "discord.js";
import { EventBuilder, BetterCollector, CollectorTimeoutType } from "vimcord";

export default new EventBuilder({
    event: Events.InteractionCreate,
    name: "interactionCreate.ShopButtons",

    conditions: [
        async i => i.isButton(),
        async i => i.isButton() && i.customId.startsWith("shop:")
    ],

    async execute(client, interaction): Promise<void> {
        if (!interaction.isButton()) return;
        // Handle shop button interactions
    }
});
```

### Presence Update (production only)

```typescript
import { Events } from "discord.js";
import { EventBuilder } from "vimcord";

export default new EventBuilder({
    event: Events.PresenceUpdate,
    name: "presenceUpdate.VanityTracker",
    deployment: { environments: ["production"] },

    async execute(client, oldPresence, newPresence): Promise<void> {
        // Track custom status / vanity URL changes
    }
});
```

---

## Event Priority

When multiple handlers share an event, higher priority runs first:

```typescript
// Runs first — log the join
new EventBuilder({ event: Events.GuildMemberAdd, name: "guildMemberAdd.Logging", priority: 100, ... });

// Runs second — send welcome
new EventBuilder({ event: Events.GuildMemberAdd, name: "guildMemberAdd.Welcome", priority: 50, ... });

// Runs last — assign default role
new EventBuilder({ event: Events.GuildMemberAdd, name: "guildMemberAdd.RoleAssign", priority: 0, ... });
```

---

## Subdirectory Organization

```
src/events/
├── interaction/     # Button/select menu/autocomplete collectors
├── intervals/       # Polling loops, periodic checks
├── presence/        # Presence/activity tracking
└── state/           # Client lifecycle (ready, disconnect, reconnect)
```

Vimcord imports all `*.event.ts` files recursively, so subdirectories work automatically as long as `importModules.events` points to `"./events"`.
