# Utilities Reference

Fetch helpers, mention parsing, and other standalone utilities.

---

## Fetch Helpers

All fetch helpers check the Discord.js cache first before making an API call. They return `null` if the resource is not found or if a null/undefined ID is passed — safe to use without a try/catch.

```typescript
import {
    fetchUser, fetchGuild, fetchMember,
    fetchChannel, fetchMessage, fetchRole
} from "vimcord";
import { ChannelType } from "discord.js";
```

### fetchUser

```typescript
// Fetch a user by ID, checking cache first
const user = await fetchUser(client, userId);
if (!user) return interaction.reply("User not found.");
```

### fetchGuild

```typescript
const guild = await fetchGuild(client, guildId);
```

### fetchMember

```typescript
const member = await fetchMember(guild, memberId);
```

### fetchChannel

```typescript
// Without type — returns GuildBasedChannel
const channel = await fetchChannel(guild, channelId);

// With type — narrows the return type
const textChannel = await fetchChannel(guild, channelId, ChannelType.GuildText);
// Returns null if found but wrong type

const thread = await fetchChannel(guild, channelId, ChannelType.PublicThread);
const voice  = await fetchChannel(guild, channelId, ChannelType.GuildVoice);
const dm     = await fetchChannel(guild, channelId, ChannelType.DM);
```

### fetchMessage

```typescript
const message = await fetchMessage(channel, messageId);
```

### fetchRole

```typescript
const role = await fetchRole(guild, roleId);
```

### client.fetchUser / client.fetchGuild

Shorthand wrappers that use the client internally (same behavior):

```typescript
const user  = await client.fetchUser(userId);
const guild = await client.fetchGuild(guildId);
```

---

## Mention Parsing

Useful for parsing user/member/channel/role arguments in prefix commands.

```typescript
import {
    isMentionOrSnowflake,
    cleanMention,
    getMessageMention,
    getFirstMentionId
} from "vimcord";
```

### isMentionOrSnowflake

Returns `true` if the string is a Discord mention (`<@123>`, `<#123>`, etc.) or a raw snowflake ID (numeric string with at least 6 digits):

```typescript
isMentionOrSnowflake("<@123456789>"); // true
isMentionOrSnowflake("123456789");    // true
isMentionOrSnowflake("hello");        // false
isMentionOrSnowflake(undefined);      // false
```

### cleanMention

Strips mention syntax from a string, leaving just the ID:

```typescript
cleanMention("<@123456789>");  // "123456789"
cleanMention("<#987654321>"); // "987654321"
cleanMention("123456789");    // "123456789" (unchanged)
cleanMention(undefined);      // undefined
```

### getMessageMention

Get a mention or snowflake argument from a message at a specific index in the content:

```typescript
// Returns the resolved object (User, GuildMember, Channel, or Role)
const user = await getMessageMention(message, message.content, "user", 0);
// index 0 = first argument after the command name

// idOnly = true — returns just the string ID
const userId = await getMessageMention(message, message.content, "user", 0, true);

// Type options: "user" | "member" | "channel" | "role"
const member  = await getMessageMention(message, message.content, "member", 0);
const channel = await getMessageMention(message, message.content, "channel", 1);
const role    = await getMessageMention(message, message.content, "role", 1);
```

### getFirstMentionId

Get the ID of the first mention of a given type from a message or raw content string:

```typescript
const userId = getFirstMentionId({ message, type: "user" });
const roleId  = getFirstMentionId({ content: "<@&123456>", type: "role" });
```

### Usage in a Prefix Command

```typescript
import { PrefixCommandBuilder } from "vimcord";
import { getMessageMention } from "vimcord";

export default new PrefixCommandBuilder({
    name: "ban",
    description: "Ban a user",

    async execute(client, message): Promise<void> {
        const member = await getMessageMention(message, message.content, "member", 0);

        if (!member) {
            return message.reply("Please mention a valid member.");
        }

        await member.ban({ reason: "Banned via bot command" });
        await message.reply(`Banned ${member.user.tag}.`);
    }
});
```

---

## Other Utilities

### deepMerge

Deeply merges objects — mutates `target` and returns it:

```typescript
import { deepMerge } from "vimcord";

const defaults = { color: "#fff", timeouts: { idle: 60_000 } };
const overrides = { timeouts: { idle: 30_000 } };
const result = deepMerge(defaults, overrides);
// { color: "#fff", timeouts: { idle: 30_000 } }
```

### getPackageJson / getDevMode

```typescript
import { getPackageJson, getDevMode } from "vimcord";

const pkg = getPackageJson(); // Reads package.json from cwd
console.log(pkg.version);

const isDev = getDevMode(); // Returns true if --dev flag was passed
```

### importModulesFromDir

Dynamically import all modules from a directory (used internally by Vimcord, but available for advanced patterns):

```typescript
import { importModulesFromDir } from "vimcord";

const modules = await importModulesFromDir<MyModule>("./src/plugins", ".plugin");
for (const { module, path } of modules) {
    // module is the default export of each file
}
```
