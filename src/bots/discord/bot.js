import Discord from "discord.js";
import fs from "fs";
import path from "path";

export function startDiscordBot() {
    const prefix = process.env.DISCORD_BOT_PREFIX;
    const token = process.env.DISCORD_BOT_TOKEN;
    const client = new Discord.Client();
    client.commands = new Discord.Collection();

    const _commandsPath = path.resolve(__dirname, "commands");

    const commandFiles = fs
        .readdirSync(_commandsPath)
        .filter((file) => file.endsWith(".js"));

    for (const file of commandFiles) {
        const command = require(path.resolve(_commandsPath, file));
        client.commands.set(command.name, command);
    }

    client.once("ready", () => {
        console.log("LOG: Discord bot ready");
    });

    client.on("message", (message) => {
        if (!message.content.startsWith(prefix) || message.author.bot) return;

        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        if (!client.commands.has(command)) {
            message.reply("I don't know that command :O");
            return;
        }

        try {
            client.commands.get(command).execute(message, args);
        } catch (error) {
            console.error(error);
            message.reply("there was an error trying to execute that command!");
        }
    });

    client.login(token);
    console.log("LOG: Discord bot running");
}
