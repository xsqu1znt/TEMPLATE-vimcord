import { createMongoSchema } from "vimcord";

export interface IGuild {
    guildId: string;
    prefix: string | null;
    createdAt: Date;
}

export const GuildSchema = createMongoSchema<IGuild>("Guilds", {
    guildId: { type: String, unique: true, required: true },
    prefix: { type: String, default: null },
    createdAt: { type: Date, default: () => new Date() }
});

GuildSchema.schema.index({ guildId: 1, prefix: 1 }, { unique: true });
