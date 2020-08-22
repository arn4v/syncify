import checkEnv from "./check_env";
import dotenv from "dotenv";
dotenv.config();
checkEnv();

import { startDiscordBot } from "./discord/bot";
import { startTelegramBot } from "./telegram/bot";
import { startServer } from "./server";
import { ORMHelper } from "./data/orm_helper";

startServer();
ORMHelper.connection();

if ((process.env.DISCORD_BOT as string) == "true") {
    startDiscordBot();
} else {
    console.log(
        "LOG: DISCORD_BOT environment variable not set, not starting Discord bot."
    );
}

if ((process.env.TELEGRAM_BOT as string) == "true") {
    startTelegramBot();
} else {
    console.log(
        "LOG: TELEGRAM_BOT environment variable not set, not starting Telegram bot."
    );
}
