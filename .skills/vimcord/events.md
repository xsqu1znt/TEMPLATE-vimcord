# Events Reference

---

## EventBuilder Full API

```typescript
import { Events } from "discord.js";
import { EventBuilder } from "vimcord";

export default new EventBuilder({
    event: Events.MessageCreate,    // discord.js Events enum value
    name: "messageCreate.AutoMod",  // Unique dot-namespaced name: "category.Name"
    enabled: true,                  // Can disable without deleting
    once: false,                    // true = only fires once (use for ready events)
    priority: 0,                    // Higher = runs first when multiple handlers share an event

    // Conditions — ALL must return true for execute to run
    conditions: [
        async (client, message) => !message.author.bot,
        async (client, message) => message.guild !== null
    ],

    // Rate limiting per event
    rateLimit: {
        max: 5,
        interval: 10_000,
        onRateLimit: async (client, message) => {
            // Optional: respond when rate limited
        }
    },

    // Deployment environment restriction
    deployment: {
        environments: ["production"] // "production" | "development"
    },

    beforeExecute: async (client, message): Promise<void> => {
        // Runs before execute
    },

    async execute(client, message): Promise<void> {
        // Event logic
    },

    afterExecute: async (result, client, message): Promise<void> => {
        // Runs after execute — result is the return value of execute()
    },

    onError: async (error, client, message): Promise<void> => {
        console.error("Event error:", error);
    }
});
```

### Static Factory

```typescript
// EventBuilder.create() is equivalent to new EventBuilder({ event, name })
const handler = EventBuilder.create(Events.MessageCreate, "messageCreate.Logger")
    .setExecute(async (client, message) => {
        // logic
    })
    .setEnabled(true);

// Clone an existing handler (same config, new UUID)
const handler2 = handler.clone();
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
import { Events, ChannelType } from "discord.js";
import { BetterEmbed, EventBuilder, fetchChannel } from "vimcord";
import { CONFIG } from "@/constants";

export default new EventBuilder({
    event: Events.GuildMemberAdd,
    name: "guildMemberAdd.Welcome",
    priority: 50,

    async execute(client, member): Promise<void> {
        const channel = await fetchChannel(member.guild, CONFIG.channels.welcome, ChannelType.GuildText);
        if (!channel) return;

        const embed = new BetterEmbed({
            context: { user: member },
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
        async (client, i) => i.isButton(),
        async (client, i) => i.isButton() && i.customId.startsWith("shop:")
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

## EventManager API

Manage event handlers at runtime via `client.events`:

```typescript
import { EventBuilder } from "vimcord";

// Register one or more events at runtime
client.events.register(handler1, handler2);

// Unregister by name
client.events.unregister("messageCreate.AutoMod", "ready.Hello");

// Remove all registered events
client.events.clear();

// Get by name
const handler = client.events.get("messageCreate.AutoMod");

// Filter by metadata
const modHandlers = client.events.getByCategory("moderation");
const logHandlers = client.events.getByTag("logging");

// Get all handlers for a specific Discord event type
const messageHandlers = client.events.getByEvent(Events.MessageCreate);

// Manually trigger all handlers for an event (advanced use)
await client.events.executeEvents(Events.MessageCreate, message);
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
