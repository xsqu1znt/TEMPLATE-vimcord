import { ActivityType } from "discord.js";
import { MongoDatabase, StatusType } from "vimcord";
import { createBot } from "./bot";

async function main() {
    const client = createBot();

    client.useEnv();

    client.configure("app", {
        name: "My Amazing Bot",
        verbose: process.argv.includes("--verbose")
    });

    if (process.env.MONGO_URI) {
        await client.useDatabase(new MongoDatabase(client));
    }

    client.status.set({
        production: {
            activity: { name: "Check out our server!", type: ActivityType.Streaming, status: StatusType.Online }
        },
        development: {
            activity: { name: "Testing new features...", type: ActivityType.Custom, status: StatusType.DND }
        }
    });

    await client.start();
}

main().catch(console.error);
