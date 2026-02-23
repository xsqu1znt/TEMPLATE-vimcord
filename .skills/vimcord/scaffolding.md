# Scaffolding a New Vimcord Bot

Complete setup guide for a new bot from zero.

---

## Package Setup

```json
{
    "dependencies": {
        "vimcord": "latest",
        "discord.js": "latest"
    },
    "devDependencies": {
        "@types/node": "latest",
        "typescript": "latest",
        "tsx": "latest",
        "nodemon": "latest",
        "tsc-alias": "latest",
        "prettier": "latest"
    },
    "optionalDependencies": {
        "mongoose": "latest"
    },
    "scripts": {
        "start": "node dist/index.js",
        "dev": "nodemon --exec \"tsx src/index.ts --dev\" -w src -w config -e \"json ts\"",
        "build": "tsc && tsc-alias",
        "check": "tsc --noEmit",
        "format": "prettier --write \"**/*.{ts,json}\""
    }
}
```

## tsconfig.json

```json
{
    "ts-node": {
        "files": true,
        "esm": true
    },

    "include": ["./src/**/*.ts"],
    "exclude": ["./node_modules", "./dist"],

    "compilerOptions": {
        // File Layout
        "rootDir": "./src",
        "outDir": "./dist",

        // Environment Settings
        "module": "commonjs",
        "target": "ES2022",
        "moduleResolution": "node",
        "types": ["node"],

        // Other Outputs
        "declaration": true,

        // Stricter Typechecking Options
        "noUncheckedIndexedAccess": true,

        // Style Options
        "noImplicitAny": true,
        "strictNullChecks": true,
        "noFallthroughCasesInSwitch": true,
        "forceConsistentCasingInFileNames": true,

        // Recommended Options
        "strict": true,
        "isolatedModules": true,
        "noUncheckedSideEffectImports": true,
        "moduleDetection": "force",
        "resolveJsonModule": true,
        "esModuleInterop": true,
        "allowSyntheticDefaultImports": true,
        "skipLibCheck": true,

        "paths": {
            "@/*": ["./src/*"],

            "@commands/*": ["./src/commands/*"],
            "@slashCommands/*": ["./src/commands/slash/*"],
            "@prefixCommands/*": ["./src/commands/prefix/*"],
            "@contextCommands/*": ["./src/commands/context/*"],

            "@events/*": ["./src/events/*"],
            "@jobs/*": ["./src/jobs/*"],

            "@db/*": ["./src/db/*"],
            "@features/*": ["./src/features/*"],
            "@utils/*": ["./src/utils/*"],

            "@constants/*": ["./src/constants"],
            "@ctypes/*": ["./src/types/*"]
        }
    }
}
```

## .prettierrc

```json
{
    "tabWidth": 4,
    "useTabs": false,
    "printWidth": 125,

    "trailingComma": "none",
    "arrowParens": "avoid",

    "bracketSpacing": true,
    "singleQuote": false,
    "semi": true,

    "endOfLine": "lf"
}
```

## .env.example

```bash
# Discord Bot Tokens
TOKEN=your_production_bot_token
TOKEN_DEV=your_development_bot_token

# MongoDB (optional)
MONGO_URI=mongodb://localhost:27017/mybot
MONGO_URI_DEV=mongodb://localhost:27017/mybot-dev
```

## src/bot.ts

```typescript
import { GatewayIntentBits } from "discord.js";
import { createClient, Vimcord, defineClientOptions, defineVimcordFeatures } from "vimcord";

export function createBot(): Vimcord {
    const clientOptions = defineClientOptions({
        // Only include intents your bot actually needs
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.GuildMembers
        ]
    });

    const vimcordFeatures = defineVimcordFeatures({
        useGlobalErrorHandlers: true,
        useDefaultSlashCommandHandler: true,
        useDefaultPrefixCommandHandler: true,
        useDefaultContextCommandHandler: true,
        maxLoginAttempts: 3,
        importModules: {
            events: "./events",
            slashCommands: "./commands/slash",
            prefixCommands: "./commands/prefix",
            contextCommands: "./commands/context"
        }
    });

    return createClient(clientOptions, vimcordFeatures);
}
```

## src/index.ts

```typescript
import { ActivityType } from "discord.js";
import { MongoDatabase, StatusType, defineGlobalToolsConfig } from "vimcord";
import { createBot } from "./bot";

defineGlobalToolsConfig({
    embedColor: ["#5865F2", "#57F287"],
    paginator: {
        notAParticipantMessage: "These buttons aren't for you."
    }
});

async function main(): Promise<void> {
    const client = createBot();

    client.useEnv();

    client
        .configure("app", {
            name: "MyBot",
            verbose: process.argv.includes("--verbose")
        })
        .configure("staff", {
            ownerId: "YOUR_OWNER_ID",
            superUsers: [],
            guild: { id: "YOUR_STAFF_GUILD_ID" }
        })
        .configure("prefixCommands", {
            defaultPrefix: "?"
        });

    if (process.env.MONGO_URI) {
        client.useDatabase(new MongoDatabase(client));
    }

    client.start(() => {
        client.status.set({
            production: {
                activity: { name: "Online", type: ActivityType.Playing, status: StatusType.Online }
            },
            development: {
                activity: [{ name: "Testing new features...", type: ActivityType.Custom, status: StatusType.DND }]
            }
        });
    });
}

main().catch(console.error);
```

## src/constants.ts

```typescript
// Import and re-export JSON constants from ../constants/ directory
// Hot-reloads in dev without rebuild
import _config from "../constants/config.json";
export const CONFIG = _config;
```

## src/db/index.ts (barrel file)

```typescript
// Export all schemas from here
export { UserSchema } from "./schemas/user.schema";
// export { GuildSchema } from "./schemas/guild.schema";
```

## constants/config.json (example)

```json
{
    "colors": {
        "primary": "#5865F2",
        "success": "#57F287",
        "error": "#ED4245"
    },
    "channels": {
        "logs": "CHANNEL_ID_HERE"
    }
}
```
