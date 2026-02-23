# Client, Config, Logging & Error Handling Reference

---

## Client Configuration Methods

Chain `.configure()` calls after `createClient()`:

```typescript
client
    .configure("app", {
        name: "MyBot",
        verbose: false, // Extra logging
        devMode: false, // Uses TOKEN_DEV + MONGO_URI_DEV
        enableCLI: false, // Interactive CLI mode
        disableBanner: false // Hide ASCII banner on startup
    })
    .configure("staff", {
        ownerId: "123456789",
        superUsers: ["111222333", "444555666"],
        guild: {
            id: "987654321",
            inviteUrl: "https://discord.gg/invite",
            channels: {
                staffSpam: "LOG_CHANNEL_ID"
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
        async guildPrefixResolver(client, guildId) {
            // Dynamic per-guild prefix from DB
            const guild = await GuildSchema.fetch({ guildId }, { prefix: 1 });
            return guild?.prefix ?? undefined;
        }
    });
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
            activity: {
                name: "/help",
                type: ActivityType.Listening,
                status: StatusType.Online
            }
        },
        development: {
            interval: 15, // Rotate every 15 seconds
            randomize: true, // Pick randomly instead of sequentially
            activity: [
                { name: "Dev Mode", type: ActivityType.Custom, status: StatusType.DND },
                { name: "Testing", type: ActivityType.Custom, status: StatusType.Idle }
            ]
        }
    });
});
```

**StatusType values**: `Online`, `Idle`, `DND`, `Invisible`

---

## Client Properties

```typescript
client.$name; // Bot name (get/set)
client.$version; // Bot version (get/set)
client.$devMode; // Is dev mode active (boolean)
client.$verboseMode; // Is verbose logging on (boolean)

// Managers
client.events; // EventManager
client.commands; // CommandManager — .slash, .prefix, .context
client.status; // StatusManager
client.db; // DatabaseManager (only after useDatabase)
client.logger; // Logger instance
client.error; // ErrorHandler

// Utilities
await client.fetchUser(userId); // Cached user fetch
await client.fetchGuild(guildId); // Cached guild fetch

// Debug
console.log(client.toJSON()); // Shows { options, features, config }
```

---

## Logger

```typescript
import { Logger } from "vimcord";

// Use console.log — Vimcord intercepts and formats it
console.log("General info");
console.warn("Degraded state");
console.error("Error occurred");

// Custom logger per module
const logger = new Logger({
    prefix: "Economy",
    prefixEmoji: "💰",
    colors: { primary: "#57F287" },
    minLevel: 1 // 0=debug, 1=info, 2=success, 3=warn, 4=error
});

logger.info("Processing...");
logger.success("Done!");
logger.warn("Balance low");
logger.error("Failed", error);

// Async loader
const stop = logger.loader("Connecting to database...");
await connectDB();
stop("Connected!");

// Table output
logger.table("Bot Stats", { guilds: 42, users: 1500 });

// Verbose logging (only shown when --verbose or verbose:true)
client.logger.debug("Detailed debug info");
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

    // Show error embeds with invite link when commands fail
    enableCommandErrorMessage: {
        inviteButtonLabel: "Support Server",
        inviteUrl: "https://discord.gg/your-invite"
    }
});
```

### Manual Global Handlers

```typescript
process.on("unhandledRejection", reason => {
    client.logger.error("Unhandled rejection", reason as Error);
});

process.on("uncaughtException", error => {
    client.logger.error("Uncaught exception", error);
    process.exit(1);
});
```

---

## Environment Variables

| Variable        | Required | Description                                            |
| --------------- | -------- | ------------------------------------------------------ |
| `TOKEN`         | Yes      | Production bot token                                   |
| `TOKEN_DEV`     | No       | Development bot token (required to use `pnpm run dev`) |
| `MONGO_URI`     | No       | Production MongoDB URI                                 |
| `MONGO_URI_DEV` | No       | Development MongoDB URI                                |

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
