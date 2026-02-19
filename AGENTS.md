# AGENTS.md - Agent Coding Guidelines for TEMPLATE-vimcord

---

## Project Overview

This is a Discord bot template using TypeScript, Vimcord framework, and MongoDB. The bot uses slash commands, prefix commands, and event handlers.

For deep-dive patterns and API references beyond what this file covers, see [DOCS.md](./DOCS.md).

---

## Build & Development Commands

### Development

```bash
pnpm run dev    # Start development server with hot reload (nodemon + tsx)
```

### Build

```bash
pnpm run build    # Compile TypeScript with tsc and tsc-alias
pnpm run check    # Type-check without emitting (tsc --noEmit)
pnpm run start    # Run compiled JavaScript from dist/
```

### Formatting

```bash
pnpm run format   # Format all .ts and .json files with Prettier
```

### Testing

No test framework is currently configured. To add one, install Jest or Vitest, then add and document your test command here (e.g., `pnpm run test`).

---

## Code Style Guidelines

### Formatting (Prettier)

- **Tab width:** 4 spaces
- **Print width:** 125 characters
- **Trailing commas:** None
- **Arrow parens:** Avoid (prefer `x => x` over `(x) => x`)
- **Quotes:** Double quotes
- **Semicolons:** Required
- **Line endings:** LF

### TypeScript Configuration

The project uses strict TypeScript:

- `strict: true` - Full strict mode enabled
- `noImplicitAny: true` - No implicit `any` types
- `strictNullChecks: true` - Null/undefined must be explicitly handled
- `noUncheckedIndexedAccess: true` - Array access returns `T | undefined`
- `noFallthroughCasesInSwitch: true` - All switch cases must break/return
- `moduleDetection: force` - Each file is treated as a module

### Import Order

Always follow this order:

1. Node built-ins (e.g., `import { randomUUID } from "node:crypto"`)
2. Third-party packages (e.g., `import { PermissionFlagsBits } from "discord.js"`)
3. Local modules (e.g., `import { UserSchema } from "@/schemas/user.schema"`)

### Imports & Path Aliases

**Always prefer path aliases over relative imports:**

```typescript
// Good - use aliases
import { GuildSchema } from "@db/index";
import { SlashCommandBuilder } from "vimcord";
import { EMOJIS } from "@/constants";

// Bad - avoid relative paths
import { GuildSchema } from "../../db";
import { SomeUtil } from "../../../utils/some.util";
```

**Available aliases:**

- `@/*` - Source root (`./src/*`)
- `@commands/*` - Commands (`./src/commands/*`)
- `@slashCommands/*` - Slash commands (`./src/commands/slash/*`)
- `@prefixCommands/*` - Prefix commands (`./src/commands/prefix/*`)
- `@contextCommands/*` - Context menu commands (`./src/commands/context/*`)
- `@events/*` - Event handlers (`./src/events/*`)
- `@jobs/*` - Scheduled jobs (`./src/jobs/*`)
- `@db/*` - Database schemas (`./src/db/*`) — always include the subpath, e.g. `@db/index`
- `@features/*` - Planned out feature classes (`./src/features/*`)
- `@utils/*` - Utility functions (`./src/utils/*`)
- `@constants/*` - Constants (`./src/constants/*`)
- `@ctypes/*` - Custom types (`./src/types/*`)

### Naming Conventions

- **Files:** Use kebab-case: `ping.slash.ts`, `ready.hello.event.ts`
- **Commands:** Lowercase, use dots for namespacing: `ping`, `moderator.ban`
- **Events:** Use dot notation with category: `ready.Hello`, `messageCreate.Moderation`
- **Classes/Types:** PascalCase
- **Variables/Functions:** camelCase
- **Constants:** SCREAMING_SNAKE_CASE

### Type Safety

- **Never use `any`** - Use `unknown` with type guards instead
- **Use explicit return types** for functions
- **Use `satisfies`** for shape validation

### Function Signatures

```typescript
// Good
async function getUserData(userId: string): Promise<UserData | null> {
    return await UserSchema.fetch({ userId });
}

// Bad (relying on inference)
async function getUserData(userId: string) {
    return await UserSchema.fetch({ userId });
}
```

### Error Handling

- Use Vimcord's built-in global error handlers: `useGlobalErrorHandlers: true`
- Wrap all async operations in try/catch
- Prefer async/await over `.then()` chains
- Always handle potential `null`/`undefined` values (strictNullChecks enabled)
- Use optional chaining `?.` when accessing potentially undefined properties

### Logging

Use `console.log` for general logging — Vimcord intercepts and formats these in production. Use `console.warn` and `console.error` for degraded states and errors respectively. Do not introduce a third-party logger unless the project explicitly adopts one and documents it here.

### General Guidelines

1. **No comments** unless explaining complex business logic
2. **Always use semicolons**
3. **Use `const` over `let`**, avoid `var`
4. **Export default** for command/event files
5. **Use `async/await`** for all asynchronous operations
6. **One command per file**
7. **Extract shared logic into utilities**

---

## Project Structure

```
constants/                    # Static JSON configuration (outside src for hot reloading)
├── example.config.json       # JSON files imported into src/constants.ts
src/
├── index.ts                  # Bot entry point
├── bot.ts                    # Bot factory (createBot function)
├── constants.ts              # Re-exports constants from ../constants/*.json
├── db/
│   ├── index.ts              # Database exports
│   └── schemas/              # Mongoose schemas (*.schema.ts)
├── commands/
│   ├── slash/                # Slash commands (*.slash.ts)
│   ├── prefix/               # Prefix commands (*.prefix.ts)
│   └── context/              # Context menu commands (*.ctx.ts)
├── events/                   # Event handlers (*.event.ts)
├── jobs/                     # Scheduled jobs
├── features/                 # Vimcord feature configurations
├── utils/                    # Utility functions
└── types/                    # TypeScript type definitions
```

### About the constants/ Directory

Static JSON configuration files are placed in `constants/` (outside `src/`) for **hot reloading without rebuilding**:

- During development (`pnpm run dev`), changes to JSON files in `constants/` are picked up automatically by tsx
- This is ideal for configuration that changes frequently (colors, messages, IDs, etc.)
- No need to rebuild the project when updating these files

**To add new constants:**

1. Create a new JSON file in `constants/` (e.g., `constants/emojis.json`)
2. Import and re-export it in `src/constants.ts`:

```typescript
// src/constants.ts
import _emojis from "../constants/emojis.json";
export const EMOJIS = _emojis;
```

3. Import the constant where needed:

```typescript
import { EMOJIS } from "@/constants";
```

---

## Quick Reference

### Creating a Slash Command

Key points: use `VimcordSlashCommandBuilder`, set a `metadata.category`, implement `execute(client, interaction)`.

```typescript
import { InteractionContextType, SlashCommandBuilder } from "discord.js";
import { SlashCommandBuilder as VimcordSlashCommandBuilder } from "vimcord";

export default new VimcordSlashCommandBuilder({
    builder: new SlashCommandBuilder()
        .setName("command-name")
        .setDescription("Description here")
        .setContexts(InteractionContextType.Guild),

    metadata: { category: "Category/Name" },

    async execute(client, interaction): Promise<void> {
        // Your code here
    }
});
```

### Creating an Event Handler

Key points: use `EventBuilder`, provide a unique dot-namespaced `name`, implement `execute`.

```typescript
import { EventBuilder } from "vimcord";
import { Events } from "discord.js";

export default new EventBuilder({
    event: Events.Ready,
    name: "Ready.Hello",

    async execute(client): Promise<void> {
        console.log("Bot is ready!");
    }
});
```

### Client Setup Pattern

> **Note:** The `GatewayIntentBits` values below are illustrative. Your bot's required intents depend on the features it uses — refer to the Discord developer docs and add only the intents your bot actually needs.

```typescript
// src/bot.ts
import { GatewayIntentBits } from "discord.js";
import { createClient, Vimcord } from "vimcord";

export function createBot(): Vimcord {
    return createClient(
        {
            // Add only the intents your bot requires
            intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
        },
        {
            useDefaultSlashCommandHandler: true,
            useDefaultPrefixCommandHandler: true,
            useGlobalErrorHandlers: true,
            importModules: {
                events: "./events",
                slashCommands: "./commands/slash",
                prefixCommands: "./commands/prefix"
            }
        }
    );
}

// src/index.ts
import { createBot } from "./bot";

async function main(): Promise<void> {
    const client = createBot();
    client.useEnv();
    client.configure("app", { name: "MyBot" });
    await client.start();
}

main().catch(console.error);
```

---

## Additional Notes

- The bot uses environment variables via `client.useEnv()` method
- MongoDB connection configured in `src/db/`
- Default command prefix is `!`
- Development mode is auto-detected from `NODE_ENV` or `--dev` flag
