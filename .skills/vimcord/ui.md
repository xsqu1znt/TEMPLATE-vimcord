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
    context: { interaction }, // Enables Auto Context Formatting (ACF)
    title: "Welcome, $USER!",
    description: ["Line 1", "Line 2 with **markdown**"],
    color: "#5865F2",         // Or omit to use global embedColor
    thumbnail: user.avatarURL() ?? undefined,
    image: "https://example.com/banner.png",
    footer: { text: "Footer text", iconUrl: client.user.displayAvatarURL() },
    fields: [
        { name: "Field 1", value: "Value 1", inline: true },
        { name: "Field 2", value: "Value 2", inline: true }
    ]
});

await embed.send(interaction); // Or: embed.send(channel), embed.send(message)
```

### ACF Tokens (Auto Context Formatting)

Available when `context: { interaction }` or `context: { member }` is set:

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
| `$INVIS` | Zero-width space |

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
import { BetterEmbed, Paginator, PaginationType } from "vimcord";

const paginator = new Paginator({
    type: PaginationType.LongJump, // first | back | jump | next | last
    timeout: 120_000,              // 2 minutes idle timeout
    onTimeout: 1                   // 0=disable, 1=clear, 2=delete, 3=nothing
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

// Events
paginator.on("pageChange", (page, index) => {
    console.log(`Chapter ${index.chapter}, Page ${index.nested}`);
});
```

**PaginationType values**:
- `Short` — back, next
- `ShortJump` — back, jump, next
- `Long` — first, back, next, last
- `LongJump` — first, back, jump, next, last

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
    onResolve: [PromptResolveType.DisableComponents, PromptResolveType.DeleteOnConfirm]
});

await prompt.send(interaction);
const result = await prompt.awaitResponse();

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
    autoDefer: true // Defer modal interaction automatically
});

if (!result) return; // User dismissed or timed out

const subject = result.getField("subject", true);   // true = required
const description = result.getField("description");  // optional

await result.reply({
    content: `Report submitted: ${subject}`,
    flags: "Ephemeral"
});
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
            new ButtonBuilder({ customId: "btn_yes", label: "Yes", style: ButtonStyle.Success }),
            new ButtonBuilder({ customId: "btn_no", label: "No", style: ButtonStyle.Danger })
        )
    ]
});

const collector = new BetterCollector(message, {
    type: ComponentType.Button,
    participants: [interaction.user], // Only these users can interact
    idle: 60_000,
    onTimeout: CollectorTimeoutType.DisableComponents
});

// Lock tracking for concurrent request prevention
const pending = new Set<string>();

// General listener (runs for all interactions before specific handlers)
collector.on(async i => {
    if (pending.has(i.user.id)) {
        return i.reply({ content: "Please wait...", flags: "Ephemeral" });
    }
});

// Specific handlers
collector
    .on(
        "btn_yes",
        async i => {
            pending.add(i.user.id);
            await i.deferUpdate();
            await doAction();
            await i.editReply({ content: "Done!", components: [] });
        },
        { finally: i => pending.delete(i.user.id) }
    )
    .on(
        "btn_no",
        async i => {
            await i.reply({ content: "Cancelled.", flags: "Ephemeral" });
        },
        { defer: { update: true } }
    );
```

**CollectorTimeoutType values**:
- `DisableComponents` — Disable all buttons
- `ClearComponents` — Remove all buttons
- `DeleteMessage` — Delete the message
- `DoNothing` — Leave as-is

---

## BetterContainer (V2 Components)

Build Discord V2 component layouts (sections, media, separators):

```typescript
import { BetterContainer } from "vimcord";
import { ButtonStyle } from "discord.js";

const container = new BetterContainer()
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
```

**Container Methods**:

| Method | Description |
|--------|-------------|
| `addText(content)` | Text content — string or string array |
| `addMedia({ url })` | Image or media |
| `addSeparator({ divider, spacing })` | Visual separator |
| `addSection({ text, button?, thumbnail? })` | Section with optional button/thumbnail |
| `send(target)` | Send to interaction or channel |

---

## dynaSend

Universal send that works with any Discord target:

```typescript
import { dynaSend } from "vimcord";

// Auto-detects: interaction → reply/editReply/followUp, channel → send, message → reply
await dynaSend(interaction, {
    content: "Hello!",
    embeds: [embed],
    components: [row],
    files: [attachment],
    flags: "Ephemeral"
});
```
