import { GatewayIntentBits } from "discord.js";
import { createClient, Vimcord } from "vimcord";

export function createBot(): Vimcord {
    return createClient(
        {
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMembers
            ]
        },
        {
            useDefaultSlashCommandHandler: true,
            useDefaultContextCommandHandler: true,
            useDefaultPrefixCommandHandler: true,
            useGlobalErrorHandlers: true,
            maxLoginAttempts: 3,

            importModules: {
                events: "./events",
                slashCommands: "./commands/slash",
                prefixCommands: "./commands/prefix",
                contextCommands: "./commands/context"
            }
        }
    );
}
