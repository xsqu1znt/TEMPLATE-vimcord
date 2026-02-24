# UI Components Reference

BetterEmbed, Paginator, Prompt, BetterModal, BetterCollector, BetterContainer, dynaSend.

---

## Table of Contents

1. [BetterEmbed](#betterembed)
2. [Paginator](#paginator)
3. [Prompt](#prompt)
4. [BetterModal](#bettermodal)
5. [BetterCollector](#bettercollector)
6. [BetterContainer (V2 Components)](#bettercontainer-v2-components)
7. [dynaSend](#dynasend)

---

## BetterEmbed

```typescript
import { BetterEmbed } from "vimcord";

const embed = new BetterEmbed({
    context: { interaction },  // Enables Auto Context Formatting (ACF)
    title: "Welcome, $USER!",
    description: ["Line 1", "Line 2 with **markdown**"],  // Array joins with \n
    color: "#5865F2",          // Or omit to use global embedColor
    thumbnailUrl: user.avatarURL() ?? undefined,
    imageUrl: "https://example.com/banner.png",
    footer: { text: "Footer text", icon: true },  // icon: true = user avatar, or URL string
    fields: [
        { name: "Field 1", value: "Value 1", inline: true },
        { name: "Field 2", value: "Value 2", inline: true }
    ],
    timestamp: true            // true = Date.now(), or pass a Date/number
});

await embed.send(interaction); // Or: embed.send(channel), embed.send(message)

// send() with overrides (second arg = DynaSendOptions, third = BetterEmbedData overrides)
await embed.send(interaction, { flags: "Ephemeral" }, { color: "#ED4245", title: "Error" });

// Clone with overrides
const errorEmbed = embed.clone({ color: "#ED4245", title: "Error!" });

// Serialize to plain embed object
const raw = embed.toJSON();
```

### ACF Tokens (Auto Context Formatting)

Available when `context: { interaction }` or `context: { user: member }` is set:

| Token | Output |
|-------|--------|
| `$USER` | User mention |
| `$USER_NAME` | Username |
| `$DISPLAY_NAME` | Server nickname or username |
| `$USER_AVATAR` | User avatar URL |
| `$BOT_AVATAR` | Bot avatar URL |
| `$YEAR` | Full year (4-digit) |
| `$MONTH` | Month (2-digit) |
| `$DAY` | Day (2-digit) |
| `$year/$month/$day` | Short date format |

Escape with backslash: `\$USER`

### Description as Array

Passing `description` as an array joins lines with `\n` automatically:

```typescript
description: [
    "## Header",
    "Some text",
    "",               // Empty line
    "More text"
]
```

---

## Paginator

Multi-page navigation with chapters:

```typescript
import { BetterEmbed, Paginator, PaginationType, PaginationTimeoutType } from "vimcord";

const paginator = new Paginator({
    type: PaginationType.LongJump,           // Navigation style (see below)
    timeout: 120_000,                        // Idle timeout in ms
    onTimeout: PaginationTimeoutType.ClearComponents,
    participants: [interaction.user],        // Restrict who can use buttons
    useReactions: false,                     // Use emoji reactions instead of buttons
    dynamic: false                           // Dynamic = pages can be updated after send
});

// Single-chapter shorthand (no need for addChapter)
const paginator = new Paginator({
    pages: [embed1, embed2, embed3]          // All on one chapter
});

// Add chapters (groups of pages)
paginator.addChapter(
    [
        new BetterEmbed({ title: "Page 1 of Chapter 1" }),
        new BetterEmbed({ title: "Page 2 of Chapter 1" })
    ],
    { label: "Chapter Name", emoji: "📖" }
);

paginator.addChapter(
    [new BetterEmbed({ title: "Only page of Chapter 2" })],
    { label: "Other Chapter", emoji: "🛡️" }
);

await paginator.send(interaction);
```

**PaginationType values**:
- `Short` — back, next
- `ShortJump` — back, jump, next
- `Long` — first, back, next, last
- `LongJump` — first, back, jump, next, last

**PaginationTimeoutType values**:
- `DisableComponents` — Disable buttons
- `ClearComponents` — Remove buttons
- `DeleteMessage` — Delete the message
- `DoNothing` — Leave as-is

### Paginator Events

```typescript
paginator.on("pageChange", (page, index) => {
    console.log(`Chapter ${index.chapter}, Page ${index.nested}`);
});

paginator.on("chapterChange", (option, page, index) => {
    console.log("Chapter changed to:", option.data.label);
});

paginator.on("preTimeout",  (message) => { /* cleanup before timeout */ });
paginator.on("postTimeout", (message) => { /* cleanup after timeout */ });

// Navigation events: "first", "back", "jump", "next", "last", "collect", "react"
paginator.on("next", (page, index) => { /* fires when next button clicked */ });
```

### Paginator Methods

```typescript
// Add a custom button at a specific position index
paginator.insertButtonAt(1, new ButtonBuilder({ customId: "share", label: "Share" }));
paginator.removeButtonAt(1);

// Remove / replace chapters
paginator.spliceChapters(0, 1); // remove chapter at index 0

// Update pages in an existing chapter without resending
paginator.hydrateChapter(0, [newPage1, newPage2]);       // append
paginator.hydrateChapter(0, [newPage1, newPage2], true); // replace

// Jump to a specific page
await paginator.setPage(0, 2);  // chapter 0, nested page 2

// Re-render current page (after dynamic updates)
await paginator.refresh();
```

---

## Prompt

Confirmation dialog with yes/no buttons:

```typescript
import { BetterEmbed, Prompt, PromptResolveType } from "vimcord";

const prompt = new Prompt({
    embed: new BetterEmbed({
        context: { interaction },
        title: "⚠️ Confirm Action",
        description: "This cannot be undone. Are you sure?",
        color: "#FEE75C"
    }),
    timeout: 30_000,
    participants: [interaction.user],
    onResolve: [PromptResolveType.DisableComponents, PromptResolveType.DeleteOnConfirm]
});

await prompt.send(interaction);
const result = await prompt.awaitResponse();

if (result.timedOut) {
    return interaction.editReply("Timed out.");
}

if (result.confirmed) {
    await doAction();
    await interaction.editReply("Done!");
} else {
    await interaction.editReply("Cancelled.");
}
```

**PromptResolveType values**:
- `DisableComponents` — Disable buttons after response
- `ClearComponents` — Remove buttons after response
- `DeleteOnConfirm` — Delete message when confirmed
- `DeleteOnReject` — Delete message when rejected

### Prompt — Advanced Options

```typescript
new Prompt({
    // Text-only prompt (no embed)
    textOnly: true,
    content: "Are you sure you want to proceed?",

    // Or use a BetterContainer instead of embed
    container: myContainer,

    // Customize the confirm/reject buttons
    buttons: {
        confirm: builder => builder.setLabel("Yes, delete it").setStyle(ButtonStyle.Danger),
        reject:  builder => builder.setLabel("Cancel").setStyle(ButtonStyle.Secondary)
    },

    // Add extra buttons
    customButtons: {
        maybe: {
            builder: builder => builder.setLabel("Maybe later").setStyle(ButtonStyle.Primary),
            index: 1,  // 0 = before confirm, 1 = between, 2+ = after reject
            handler: async (interaction) => {
                await interaction.reply({ content: "Remind you tomorrow!", flags: "Ephemeral" });
            }
        }
    }
});

// PromptResult has a customId for custom button presses
const result = await prompt.awaitResponse();
if (result.customId === "maybe") {
    // custom button was pressed
}
```

---

## BetterModal

```typescript
import { TextInputStyle } from "discord.js";
import { BetterModal } from "vimcord";

const modal = new BetterModal({
    title: "Submit Report",
    components: [
        {
            textInput: {
                label: "Subject",
                custom_id: "subject",
                style: TextInputStyle.Short,
                required: true,
                max_length: 100
            }
        },
        {
            textInput: {
                label: "Description",
                custom_id: "description",
                style: TextInputStyle.Paragraph,
                max_length: 1000
            }
        }
    ]
});

// Show modal and wait for submission
const result = await modal.showAndAwait(interaction, {
    timeout: 60_000,
    autoDefer: true // Defer modal interaction automatically (closes the modal)
});

if (!result) return; // User dismissed or timed out

const subject     = result.getField("subject", true);  // true = required, throws if missing
const description = result.getField("description");    // optional, returns undefined

// Reply methods on the result
await result.reply({ content: `Report submitted: ${subject}`, flags: "Ephemeral" });
await result.deferUpdate();   // Close the modal without replying
await result.followUp({ content: "Processing..." });

// All submitted values in order
console.log(result.values);   // string[]
console.log(result.interaction); // ModalSubmitInteraction
```

### Other Component Types

```typescript
// BetterModal supports more component types than just textInput
new BetterModal({
    title: "Select Options",
    components: [
        { stringSelect:     { label: "Choose color", custom_id: "color", options: [...] } },
        { userSelect:       { label: "Tag a user",   custom_id: "user" } },
        { roleSelect:       { label: "Pick a role",  custom_id: "role" } },
        { channelSelect:    { label: "Pick channel", custom_id: "channel" } },
        { mentionableSelect:{ label: "Pick mention", custom_id: "mention" } },
        { fileUpload:       { label: "Upload file",  custom_id: "file" } }
    ]
});
```

### show() + awaitSubmit() separately

```typescript
// Show and await in two steps (useful when you need the interaction first)
await modal.show(interaction);
const result = await modal.awaitSubmit(interaction, { timeout: 60_000 });
```

---

## BetterCollector

Enhanced button/component collector with participant tracking:

```typescript
import { BetterCollector, CollectorTimeoutType } from "vimcord";
import { ComponentType, ButtonStyle, ButtonBuilder, ActionRowBuilder } from "discord.js";

const message = await interaction.editReply({
    content: "Make your choice:",
    components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder({ customId: "btn_yes", label: "Yes",  style: ButtonStyle.Success }),
            new ButtonBuilder({ customId: "btn_no",  label: "No",   style: ButtonStyle.Danger })
        )
    ]
});

const collector = new BetterCollector(message, {
    type: ComponentType.Button,
    participants: [interaction.user], // Only these users can interact (omit = anyone)
    idle: 60_000,                     // Idle timeout (ms)
    timeout: 300_000,                 // Absolute timeout (ms)
    sequential: false,                // true = await each listener before running next
    userLock: true,                   // Prevent double-clicks while a handler runs
    max: 10,                          // Stop after 10 interactions total
    onTimeout: CollectorTimeoutType.DisableComponents
});

// General listener (runs for ALL interactions before specific handlers)
collector.on(async i => {
    // good for logging or pre-validation
});

// Specific handlers by customId
collector
    .on("btn_yes", async i => {
        await i.deferUpdate();
        await doAction();
        await i.editReply({ content: "Done!", components: [] });
    }, {
        defer: { update: true },           // Auto-deferUpdate before handler
        finally: i => pending.delete(i.user.id)  // Always runs after handler
    })
    .on("btn_no", async i => {
        await i.reply({ content: "Cancelled.", flags: "Ephemeral" });
    });

// Handle collector end (timeout or stop())
collector.onEnd((collected, reason) => {
    console.log(`Collector ended: ${reason}, ${collected.length} interactions`);
});

// Manually stop
collector.stop("completed");
```

**CollectorTimeoutType values**:
- `DisableComponents` — Disable all buttons
- `DeleteMessage` — Delete the message
- `DoNothing` — Leave as-is

**ListenerOptions**:
- `defer` — `true` or `{ update?: boolean; ephemeral?: boolean }` — auto-defer before handler
- `finally` — always runs after the handler, even on error (good for cleanup)
- `participants` — override participants for this specific listener

---

## BetterContainer (V2 Components)

Build Discord V2 component layouts (sections, media, separators):

```typescript
import { BetterContainer } from "vimcord";
import { ButtonStyle } from "discord.js";

const container = new BetterContainer({ color: "#5865F2" })
    .addText(["## Shop", "Select an item to purchase:"])
    .addMedia({ url: "https://example.com/shop-banner.png" })
    .addSeparator({ divider: true, spacing: 2 })
    .addSection({
        text: ["**Premium Bundle**", "-# Price: 1000 coins"],
        thumbnail: { media: { url: "https://example.com/bundle.png" } },
        button: {
            customId: "shop:premium",
            label: "Buy",
            style: ButtonStyle.Primary
        }
    })
    .addSeparator({ divider: true })
    .addSection({
        text: "Basic Pack — 100 coins",
        button: {
            customId: "shop:basic",
            label: "Buy",
            style: ButtonStyle.Secondary
        }
    });

await container.send(interaction);

// Change or clear the accent color
container.setColor("#ED4245");
container.clearColor();

// Serialize to raw JSON
const raw = container.toJSON();
```

**Container Methods**:

| Method | Description |
|--------|-------------|
| `addText(content)` | Text content — string or string array |
| `addMedia({ url, spoiler?, description? })` | Image or media |
| `addSeparator({ divider?, spacing? })` | Visual separator |
| `addSection({ text, button?, thumbnail? })` | Section with optional button/thumbnail |
| `addActionRow(...rows)` | Add a standard Discord action row |
| `setColor(color)` / `clearColor()` | Accent color |
| `send(target, options?)` | Send to interaction or channel |
| `toJSON()` | Serialize to raw API object |

---

## dynaSend

Universal send that works with any Discord target:

```typescript
import { dynaSend, SendMethod } from "vimcord";

// Auto-detects: interaction → reply/editReply/followUp, channel → send, message → reply
await dynaSend(interaction, {
    content: "Hello!",
    embeds: [embed],
    components: [row],
    files: [attachment],
    flags: "Ephemeral",

    // Advanced options
    sendMethod: SendMethod.FollowUp,    // Force a specific send method
    deleteAfter: 10_000,               // Auto-delete after 10 seconds
    withResponse: true,                // Return the Message even after interaction reply
    allowedMentions: { parse: [] },    // No mentions
    reply: { messageReference: msg },  // Reply to a specific message
    forward: { messageReference: msg } // Forward a message
});
```

**SendMethod values**: `Reply`, `EditReply`, `FollowUp`, `Channel`, `MessageReply`, `MessageEdit`, `User`

Most of the time you don't need to set `sendMethod` — it's auto-detected from the handler type.
