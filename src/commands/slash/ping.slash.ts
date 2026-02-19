import { InteractionContextType, SlashCommandBuilder } from "discord.js";
import { SlashCommandBuilder as VimcordSlashCommandBuilder } from "vimcord";

export default new VimcordSlashCommandBuilder({
    builder: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Check how fast the bot is right now. (less ms = faster)")
        .setContexts(InteractionContextType.Guild),

    metadata: { category: "General/App" },

    async execute(client, interaction) {
        interaction.reply({ content: `Client: **${client.ws.ping}ms**` });
    }
});
