import { createMongoSchema } from "vimcord";

export interface IGuild {
    guildId: string;
    prefix?: string;
}

export const GuildSchema = createMongoSchema<IGuild>(
    "Guilds",
    {
        guildId: { type: String, unique: true, required: true },
        prefix: { type: String }
    },
    { timestamps: true }
);

GuildSchema.schema.index({ guildId: 1, prefix: 1 }, { unique: true });
