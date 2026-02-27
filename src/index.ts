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

    if (client.$devMode ? process.env.MONGO_URI_DEV : process.env.MONGO_URI) {
        await client.useDatabase(new MongoDatabase(client));
    }

    await client.start(() => {
        client.status.set({
            production: {
                activity: { name: "Check out our server!", type: ActivityType.Streaming, status: StatusType.Online }
            },
            development: {
                activity: { name: "Testing new features...", type: ActivityType.Custom, status: StatusType.DND }
            }
        });
    });
}

main().catch(console.error);
