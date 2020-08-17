import checkEnv from "./check_env";
import dotenv from "dotenv";

dotenv.config();
checkEnv();

import { startDiscordBot } from "./discord/bot";
import { startServer } from "./server";

startServer();

if ((process.env.DISCORD_BOT as string) == "true") {
    startDiscordBot();
} else {
    console.log(
        "LOG: DISCORD_BOT environment variable not set, not starting Discord bot."
    );
}
