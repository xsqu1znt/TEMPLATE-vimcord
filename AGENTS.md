# AGENTS.md — Vimcord Bot Project

> **For AI agents:** This file is your primary source of truth for this project. Read it in full before writing a single line of code. It is a living document — update the [Project Registry](#project-registry) and [Project-Specific Notes](#project-specific-notes) sections as the project evolves.

---

setup: true

---

## Setup

> **Agent instruction:** Check the `setup:` flag above before doing anything else.
>
> - `setup: true` — Stop. Read `.skills/setup-vimcord/SKILL.md` in full and follow it before any other work. Do not write source code until the planning phases are complete and approved. Set `setup: false` when done.
> - `setup: false` — Ignore this section entirely and continue normally.

---
## Agent Orientation

This project is a Discord bot built with **TypeScript + Vimcord** (a discord.js wrapper) and **MongoDB** via Mongoose. It also uses **qznt** — a custom utility library covering arrays, dates, math, formatting, randomness, caching, and more.

Before working on any task:

1. **Read this file completely**
2. **Read `.skills/vimcord/SKILL.md`** — then load the relevant `.skills/vimcord/` reference file for your task domain before writing any code
3. **Check `.skills/qznt/SKILL.md`** before writing any utility logic — if qznt already has it, use it instead of writing from scratch
4. **Explore the codebase** — run `find src -type f | sort` to understand what already exists before adding anything
5. **Check the registry below** — schemas, commands, and utilities already in the project are listed there

For discord.js or Mongoose specifics not covered by skills, look up their official documentation online.

---

## Workflow: How to Approach a Task

### Before Writing Code

```
1. Read this AGENTS.md fully
2. Read .skills/vimcord/SKILL.md + the relevant reference file for your task
3. Run: find src -type f | sort
4. Read any existing files relevant to your task
5. Identify what exists vs. what needs to be built
6. Plan every file you'll create or modify before starting
```

### While Writing Code

```
- Write all files for a feature together, not one at a time
- If a schema is needed, write it first — commands depend on schemas, not the reverse
- If a utility is shared across files, write it first
- Run `pnpm run check` after each file to catch type errors early
- Barrel-export any new schema immediately in src/db/index.ts
```

### After Writing Code

```
- Run `pnpm run check` — fix ALL type errors before finishing
- Run `pnpm run format` — formatting is not optional
- Update the Project Registry below with any new schemas, commands, or utilities
- Update Project-Specific Notes if you introduced a new pattern or convention
```

### One-Shotting a Full Bot (Scaffolding from Scratch)

When asked to build a new bot or a full feature set from a prompt:

1. Read `docs/vimcord/scaffolding.md`
2. Stand up the full file structure first (tsconfig, package.json, bot.ts, index.ts, constants)
3. Build schemas before commands
4. Build in dependency order: utilities → schemas → command handlers → route files → events
5. Run `pnpm run check` — fix everything
6. Run `pnpm run format`

---

## Build & Dev Commands

| Command | Description |
|---------|-------------|
| `pnpm run dev` | Dev server with hot reload (nodemon + tsx) |
| `pnpm run build` | Compile TypeScript (tsc + tsc-alias) |
| `pnpm run check` | Type-check without emitting — **run after every file** |
| `pnpm run start` | Run compiled output from `dist/` |
| `pnpm run format` | Format all `.ts` and `.json` with Prettier |

> **Always run `pnpm run check` before declaring a task complete. Zero type errors is the bar.**

---

## Non-Negotiable Code Rules

| Rule | Detail |
|------|--------|
| No `any` | Use `unknown` with type guards, or proper generics |
| Explicit return types | Every function: `async function foo(): Promise<void>` |
| Path aliases only | Never use relative imports (`../../`) — see alias table |
| `export default` | All command and event files |
| `deferReply: true` | Any command that hits DB or takes > 1s |
| `editReply` after defer | Never `reply` on a deferred interaction |
| `async/await` everywhere | Never `.then()` chains |
| Semicolons | Every statement |
| No hardcoded secrets | Tokens, IDs, URIs always from env or constants |
| One command per file | No exceptions |
| `const` over `let` | Never `var` |
| No comments | Unless explaining non-obvious business logic |
| Barrel exports | New schemas go in `src/db/index.ts` immediately |

---

## Path Aliases

| Alias | Resolves To |
|-------|-------------|
| `@/*` | `./src/*` |
| `@commands/*` | `./src/commands/*` |
| `@slashCommands/*` | `./src/commands/slash/*` |
| `@prefixCommands/*` | `./src/commands/prefix/*` |
| `@contextCommands/*` | `./src/commands/context/*` |
| `@events/*` | `./src/events/*` |
| `@jobs/*` | `./src/jobs/*` |
| `@db/*` | `./src/db/*` — always include subpath: `@db/index` |
| `@features/*` | `./src/features/*` |
| `@utils/*` | `./src/utils/*` |
| `@constants/*` | `./src/constants/*` |
| `@ctypes/*` | `./src/types/*` |

---

## Code Style

**Prettier:** 4-space tabs · 125 char line width · double quotes · semicolons · no trailing commas · LF endings · arrow parens avoided (`x => x` not `(x) => x`)

**Import order:**
1. Node built-ins (`import { randomUUID } from "node:crypto"`)
2. Third-party packages (`import { PermissionFlagsBits } from "discord.js"`)
3. Local modules (`import { UserSchema } from "@db/index"`)

**Naming:**
- Files: `kebab-case` with type suffix — `ping.slash.ts`, `user.schema.ts`, `ready.hello.event.ts`
- Commands: lowercase dot-namespaced — `ping`, `moderator.ban`
- Events: dot-notation — `messageCreate.AutoMod`, `ready.Hello`
- Classes/Types: `PascalCase`
- Variables/Functions: `camelCase`
- Constants: `SCREAMING_SNAKE_CASE`

---

## Project Structure

```
[PROJECT_NAME]/
├── .skills/
│   ├── vimcord/                # Vimcord framework reference (do not edit)
│   │   ├── SKILL.md            # Start here — rules + reference map
│   │   ├── commands.md
│   │   ├── database.md
│   │   ├── events.md
│   │   ├── ui.md
│   │   ├── client.md
│   │   ├── jobs.md
│   │   ├── features.md
│   │   ├── migration.md
│   │   └── scaffolding.md
│   └── qznt/                   # qznt utility library reference (do not edit)
│       ├── SKILL.md            # Start here — module map + when to use
│       ├── arr.md              # Array utilities
│       ├── async.md            # retry, wait
│       ├── date.md             # duration, eta, parse
│       ├── format.md           # currency, compactNumber, ordinal, memory
│       ├── is.md               # Type guards
│       ├── math.md             # clamp, lerp, percent, sum, wrap
│       ├── obj.md              # get, set, merge, pick, omit
│       ├── rnd.md              # choice, weighted, sampler, chance
│       ├── classes.md          # Cache, Storage, Loop
│       ├── misc.md             # fn, str, timing, to, fs, Pipe
│       └── fn.md
├── constants/                  # JSON config — hot reloads without rebuild
│   └── config.json
├── src/
│   ├── index.ts                # Entry point
│   ├── bot.ts                  # Bot factory (createClient)
│   ├── constants.ts            # Re-exports from ../constants/*.json
│   ├── commands/
│   │   ├── slash/              # *.slash.ts
│   │   ├── prefix/             # *.prefix.ts
│   │   └── context/            # *.ctx.ts
│   ├── events/
│   │   ├── interaction/        # Button/autocomplete collectors
│   │   ├── intervals/          # Periodic polling
│   │   ├── presence/           # Presence updates
│   │   └── state/              # Client lifecycle
│   ├── jobs/                   # Cron jobs (*.job.ts + _BaseCronJob.ts + index.ts)
│   ├── features/               # Complex business logic classes
│   ├── db/
│   │   ├── index.ts            # Schema barrel exports
│   │   └── schemas/            # *.schema.ts
│   ├── utils/                  # Shared utility functions
│   └── types/                  # TypeScript type definitions
├── AGENTS.md
├── .env
├── .env.example
├── tsconfig.json
└── package.json
```

**`constants/` is outside `src/`** intentionally — JSON files here hot-reload in dev without a rebuild. Use for colors, IDs, messages, and any config that changes frequently.

To add new constants:
1. Create `constants/myconfig.json`
2. Import and re-export in `src/constants.ts`: `export const MY_CONFIG = _myconfig;`
3. Use via `import { MY_CONFIG } from "@/constants";`

---

## Skills (package reference documentation and guidelines)

**Vimcord is the project's main library for building Discord bots.**
`vimcord`'s skill is located at `.skills/vimcord/SKILL.md`. Read it before writing/planning a single line of bot/database related code. Then load only the related reference files you need from the `vimcord` skill.

**Qznt is the project's utility library.**
`qznt`'s skill is located at `.skills/qznt/SKILL.md`. Read it before before writing/planning any utility logic. Then load only the related reference files you need from the `qznt` skill. This package may already offer the utility you need, and if it doesn't only then should you write your own utility logic from scratch.

---

## Decision Heuristics

**Should I use a feature class?**
→ Yes if: logic spans 2+ commands, OR it's a stateful multi-step flow, OR the same DB operations appear in multiple places.
→ No if: single-command, single-purpose.

**Should I create a utility function?**
→ Yes if: the same logic appears (or will appear) in 2+ files.
→ No if: only used in one place — keep it local.

**Should this go in `constants/` JSON vs. hardcoded?**
→ JSON if: it could change without a deploy (colors, messages, channel IDs, role IDs).
→ Hardcoded if: it's structural and will never change (enum values, algorithm constants).

**Slash command, prefix command, or both?**
→ Slash: all new user-facing features.
→ Prefix: legacy support, staff/debug tooling, free-form argument parsing.
→ Both: only when explicitly required.

**Should I `deferReply`?**
→ Yes: any DB call, any external API call, anything that could take > 1 second.
→ No: pure synchronous responses (rare in practice).

**Where does a new event file go?**
→ `interaction/` — button/select/autocomplete collectors
→ `intervals/` — periodic polling
→ `presence/` — presence/activity tracking
→ `state/` — ready, disconnect, error lifecycle events
→ Root `events/` — everything else (messageCreate, guildMemberAdd, etc.)

---

## Anti-Slop Checklist

Run through this before marking any task complete:

- [ ] `pnpm run check` passes with zero errors
- [ ] `pnpm run format` has been run
- [ ] No `any` types anywhere in new or modified files
- [ ] All functions have explicit return types
- [ ] All imports use path aliases — no `../../` anywhere
- [ ] `deferReply: true` on all commands touching async work
- [ ] `editReply` used (not `reply`) on all deferred interactions
- [ ] `export default` on all command/event files
- [ ] No hardcoded tokens, IDs, or secrets
- [ ] `null` and `undefined` always handled explicitly
- [ ] Array access treated as `T | undefined` (`noUncheckedIndexedAccess`)
- [ ] New schemas barrel-exported from `src/db/index.ts`
- [ ] Project Registry below has been updated

---

## Project Registry

> **Agent instruction:** Keep this section current. When you add a schema, command, utility, or establish a new convention, document it here. This is how future agents avoid duplicating work or contradicting existing patterns.

### Bot Identity

```
Bot name:        [BOT_NAME]
Description:     [WHAT THIS BOT DOES — 1-2 sentences]
Command prefix:  [PREFIX e.g. ?]
Staff guild ID:  [GUILD_ID or "not configured"]
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TOKEN` | Yes | Production bot token |
| `TOKEN_DEV` | No | Development bot token |
| `MONGO_URI` | No | Production MongoDB URI |
| `MONGO_URI_DEV` | No | Development MongoDB URI |
<!-- Add project-specific env vars below -->

### Database Schemas

> Check here before creating a new schema to avoid duplicates.

| Schema | Collection | Key Fields | Notes |
|--------|------------|------------|-------|
| _(none yet)_ | | | |
<!-- | `UserSchema` | `Users` | `userId`, `balance` | Extended with `modifyBalance` | -->

### Commands

**Slash**

| Command | File | Category | Description |
|---------|------|----------|-------------|
| _(none yet)_ | | | |

**Prefix**

| Command | File | Description |
|---------|------|-------------|
| _(none yet)_ | | |

**Context Menu**

| Command | File | Type | Description |
|---------|------|------|-------------|
| _(none yet)_ | | | |

### Events

| Name | File | Discord Event | Notes |
|------|------|---------------|-------|
| _(none yet)_ | | | |

### Utilities

> Check here before writing logic that might already exist.

| Utility | File | Description |
|---------|------|-------------|
| _(none yet)_ | | |

### Feature Classes

| Class | File | Used By | Description |
|-------|------|---------|-------------|
| _(none yet)_ | | | |

### Scheduled Jobs or Loops

| Job/Loop     | File | Schedule | Description |
| ------------ | ---- | -------- | ----------- |
| _(none yet)_ |      |          |             |

### Constants

| Export | Source File | Description |
|--------|-------------|-------------|
| _(none yet)_ | | |

---

## Project-Specific Notes

> **Agent instruction:** Document any pattern, convention, or architectural decision unique to this project that isn't covered by the Vimcord skill. If you make a non-obvious call, explain it here so future agents don't undo it.

_(No project-specific notes yet. Add them as the project develops.)_

<!-- Examples of what belongs here:
- "All economy commands check for a blacklist via BlacklistSchema before executing — use the checkBlacklist() utility in @utils/blacklist."
- "The /card command family routes through CardManager in @features/CardManager — do not query CardSchema directly from command files."
- "Embeds use #5865F2 as primary and #ED4245 as error color — defined in constants/config.json."
- "This bot operates in a single guild only. All commands use guildOnly: true and InteractionContextType.Guild."
-->
