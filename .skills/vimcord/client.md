# Client, Config, Logging & Error Handling Reference

---

## Client Configuration Methods

Chain `.configure()` calls after `createClient()`:

```typescript
client
    .configure("app", {
        name: "MyBot",
        version: "1.0.0",             // Defaults to package.json version
        verbose: false,               // Extra logging (also: --verbose flag)
        devMode: false,               // Uses TOKEN_DEV + MONGO_URI_DEV (also: --dev flag)
        enableCLI: false,             // Interactive CLI mode
        disableBanner: false          // Hide ASCII banner on startup
    })
    .configure("staff", {
        ownerId: "OWNER_USER_ID",
        superUsers: ["USER_ID_1", "USER_ID_2"],       // Treated as staff (botStaffOnly)
        superUserRoles: ["ROLE_ID_1"],                 // Roles treated as staff
        bypassers: [
            {
                commandName: "debug",                  // Command name
                userIds: ["TESTER_USER_ID"]            // These users bypass all permission checks for this command
            }
        ],
        bypassesGuildAdmin: {
            allBotStaff: true,
            botOwner: true,
            superUsers: true,
            bypassers: false
        },
        guild: {
            id: "STAFF_GUILD_ID",
            inviteUrl: "https://discord.gg/your-support-server",
            channels: {
                logs: "LOG_CHANNEL_ID"
            }
        }
    })
    .configure("slashCommands", {
        enabled: true,
        logExecution: true,
        permissions: {
            bot: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks]
        },
        async beforeExecute(client, interaction) {
            // Runs before every slash command — good for analytics, cooldown checks
        },
        async afterExecute(result, client, interaction) {
            // Runs after every slash command
        }
    })
    .configure("prefixCommands", {
        defaultPrefix: "?",
        allowMentionAsPrefix: true,                // @BotName command works as prefix
        allowCaseInsensitiveCommandNames: true,
        async guildPrefixResolver(client, guildId) {
            // Dynamic per-guild prefix from DB
            const guild = await GuildSchema.fetch({ guildId }, { prefix: 1 });
            return guild?.prefix ?? undefined;
        }
    });
```

---

## useClient / useReadyClient — Global Client Access

Access the client instance from anywhere without passing it as a parameter:

```typescript
import { useClient, useReadyClient } from "vimcord";

// Synchronous — returns undefined if not yet initialized
const client = useClient();
const client = useClient(0); // clientId defaults to 0

// Async — waits until the client is logged in and ready
const client = await useReadyClient();             // throws after 60s by default
const client = await useReadyClient(0, 30_000);    // custom timeout in ms
```

Use `useReadyClient()` inside utilities, feature classes, or jobs that may run before the client finishes startup. This is the idiomatic way to access `client` without threading it through every function call.

---

## Static Instance Helpers

```typescript
import { Vimcord } from "vimcord";

// Get an existing instance (returns undefined if not yet created)
const client = Vimcord.getInstance();
const client = Vimcord.getInstance(0);

// Wait for a ready instance
const client = await Vimcord.getReadyInstance(0, 60_000);
```

---

## Status Configuration

Set bot presence. Called inside `client.start(() => { ... })`:

```typescript
import { ActivityType } from "discord.js";
import { StatusType } from "vimcord";

client.start(() => {
    client.status.set({
        production: {
            interval: 30,           // Rotate every 30 seconds
            randomize: false,       // Sequential rotation (true = random)
            activity: {
                name: "/help",
                type: ActivityType.Listening,
                status: StatusType.Online
            }
        },
        development: {
            interval: 15,
            randomize: true,
            activity: [
                { name: "Dev Mode", type: ActivityType.Custom, status: StatusType.DND },
                { name: "Testing",  type: ActivityType.Custom, status: StatusType.Idle }
            ]
        }
    });
});
```

**StatusType values**: `Online`, `Idle`, `DND`, `Invisible`

### Status Activity Dynamic Variables

In `ClientActivity.name`, these tokens are replaced at runtime:

| Token | Value |
|-------|-------|
| `$USER_COUNT` | `client.users.cache.size` |
| `$GUILD_COUNT` | `client.guilds.cache.size` |
| `$STAFF_GUILD_MEMBER_COUNT` | Member count of the staff guild |

```typescript
activity: [
    { name: "Watching $GUILD_COUNT servers", type: ActivityType.Watching, status: StatusType.Online },
    { name: "Serving $USER_COUNT users",     type: ActivityType.Custom,   status: StatusType.Online }
]
```

### StatusManager Event Emitter

```typescript
client.status.emitter.on("changed",   (activity) => console.log("Status changed to:", activity.name));
client.status.emitter.on("rotation",  (activity) => { /* fires on every rotation cycle */ });
client.status.emitter.on("cleared",   ()          => { /* status cleared */ });
client.status.emitter.on("paused",    (loop)      => { /* rotation paused */ });
client.status.emitter.on("started",   (loop)      => { /* rotation started */ });
client.status.emitter.on("destroyed", ()          => { /* manager destroyed */ });
```

---

## Client Properties

```typescript
client.$name;          // Bot name (get/set)
client.$version;       // Bot version (get/set) — defaults to package.json version
client.$devMode;       // Is dev mode active (boolean, get/set)
client.$verboseMode;   // Is verbose logging on (boolean, get/set)

// Managers
client.events;         // EventManager
client.commands;       // CommandManager — .slash, .prefix, .context
client.status;         // StatusManager
client.db;             // DatabaseManager (only after useDatabase)
client.logger;         // Logger instance
client.error;          // VimcordErrorHandler

// Utilities
await client.fetchUser(userId);   // Cached user fetch
await client.fetchGuild(guildId); // Cached guild fetch

// Debug / lifecycle
client.toJSON();       // Returns { options, features, config }
client.clone();        // Creates a copy of this client with the same config
await client.kill();   // Gracefully disconnect from Discord
```

---

## client.importModules() — Runtime Module Loading

Load additional modules after the bot has started (e.g. from plugins):

```typescript
// Load slash commands from a new directory
await client.importModules("slashCommands", "./plugins/economy/commands", true);
// third arg `set: true` = replace existing commands with the same names

// Load events with full options
await client.importModules("events", {
    dir: "./plugins/economy/events",
    suffix: ".event",
    recursive: true
});
```

---

## Logger

```typescript
import { Logger } from "vimcord";

// Use the global client logger
client.logger.info("Bot started");
client.logger.success("Command registered");
client.logger.warn("Rate limit approaching");
client.logger.error("Failed to fetch user", error);
client.logger.debug("Verbose details"); // only shown when verbose mode is on

// Custom logger per module
const logger = new Logger({
    prefix: "Economy",
    prefixEmoji: "💰",
    colors: { primary: "#57F287" },
    minLevel: 1, // 0=debug, 1=info, 2=success, 3=warn, 4=error
    showTimestamp: true
});

// Async loader (spinner / progress indicator)
const done = logger.loader("Connecting to database...");
await connectDB();
done("Connected!");   // Overwrites the loader line with a message
done();               // End silently

// Table output
logger.table("Bot Stats", { guilds: 42, users: 1500 });

// Section header (visual divider in console)
logger.section("Initialization");

// Extend with custom methods (this === Logger instance inside methods)
const extendedLogger = logger.extend({
    command(name: string): void {
        this.info(`/${name} executed`);
    }
});
extendedLogger.command("ping");
```

---

## Error Handling

### In Commands

```typescript
async execute(client, interaction): Promise<void> {
    try {
        await riskyOperation();
    } catch (err) {
        client.logger.error("Operation failed", err as Error);
        await interaction.editReply("An error occurred. Please try again.");
    }
}

// Or use onError hook to intercept at the command level
onError: async (error, client, interaction): Promise<void> => {
    await interaction.editReply("Custom error response.");
    throw error; // Re-throw to also trigger global handler
}
```

### Global Error Handlers

```typescript
defineVimcordFeatures({
    useGlobalErrorHandlers: true, // Catches unhandledRejection + uncaughtException
    maxLoginAttempts: 3,

    enableCommandErrorMessage: {
        inviteUrl: "https://discord.gg/support",  // Defaults to staff.guild.inviteUrl
        inviteButtonLabel: "Support Server",
        detailButtonLabel: "Details",
        detailButtonIdleTimeout: 30_000,          // ms before detail button disappears
        ephemeral: true,
        deleteAfter: 15_000,                      // Auto-delete error message (ms)
        embed: (embed, error, guild) => {         // Customize the error embed
            embed.setTitle("Uh oh! Something went wrong.");
            return embed;
        }
    }
});
```

### Manual Global Handlers

```typescript
process.on("unhandledRejection", (reason) => {
    client.logger.error("Unhandled rejection", reason as Error);
});

process.on("uncaughtException", (error) => {
    client.logger.error("Uncaught exception", error);
    process.exit(1);
});
```

### VimcordErrorHandler — Manual Usage

```typescript
// client.error is an instance of VimcordErrorHandler
// Normally called automatically; use manually for custom command handlers:

// Send error embed to user, then rethrow
await client.error.handleCommandError(error, guild, messageOrInteraction);

// Log an internal error with [Vimcord] prefix (no rethrow)
client.error.handleVimcordError(error, "MyFeature.execute");

// Register global process error handlers manually (if not using features)
client.error.setupGlobalHandlers();
```

---

## VimcordCLI — Interactive Console

Enable an interactive command-line interface for the running bot process:

```typescript
client.configure("app", { enableCLI: true });
```

After enabling, add custom CLI commands:

```typescript
import { CLI } from "vimcord";

CLI.addCommand("stats", "Print bot stats", (args, content) => {
    console.log(`Guilds: ${client.guilds.cache.size}`);
    console.log(`Users: ${client.users.cache.size}`);
});

CLI.addCommand("broadcast", "Send a message to all guilds", async (args, content) => {
    const text = content; // everything after "broadcast "
    for (const guild of client.guilds.cache.values()) {
        await guild.systemChannel?.send(text);
    }
});

CLI.removeCommand("broadcast");
```

---

## ToolsConfig — Global UI Defaults

Configure global defaults for all UI components once at startup:

```typescript
import { defineGlobalToolsConfig } from "vimcord";

defineGlobalToolsConfig({
    embedColor: ["#5865F2"],           // Default embed color(s) — randomized if array
    embedColorDev: ["#FFA500"],        // Color used when devMode is active

    timeouts: {
        collectorTimeout: 120_000,     // Default collector max lifetime (ms)
        collectorIdle:    60_000,      // Default collector idle timeout (ms)
        pagination:       120_000,     // Default paginator timeout (ms)
        prompt:           30_000,      // Default prompt timeout (ms)
        modalSubmit:      120_000      // Default modal await timeout (ms)
    },

    collector: {
        notAParticipantMessage:         "These buttons aren't for you.",
        userLockMessage:                "Please wait for your previous action to finish.",
        notAParticipantWarningCooldown: 5_000   // ms between repeat warnings to the same user
    },

    paginator: {
        notAParticipantMessage: "These buttons aren't for you.",
        jumpableThreshold: 5,          // Minimum page count before jump button appears
        longThreshold:     10          // Minimum page count before first/last buttons appear
    },

    prompt: {
        defaultTitle:       "Confirm",
        defaultDescription: "Are you sure?",
        confirmLabel:       "Confirm",
        rejectLabel:        "Cancel"
    }
});
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TOKEN` | Yes | Production bot token |
| `TOKEN_DEV` | No | Development bot token |
| `MONGO_URI` | No | Production MongoDB URI |
| `MONGO_URI_DEV` | No | Development MongoDB URI |

Loaded via `client.useEnv()`. Never access `process.env.TOKEN` directly in code — let Vimcord handle token selection based on environment.

---

## Verbose / Dev Mode

```bash
# Enable verbose at runtime
node dist/index.js --verbose

# Or in configuration
client.configure("app", { verbose: true });

# Dev mode (uses TOKEN_DEV + MONGO_URI_DEV)
node dist/index.js --dev
# Or
client.configure("app", { devMode: true });
```
