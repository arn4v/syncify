import { Client, Message } from "discord.js";
import querystring from "querystring";
import { SERVER_URL } from "../../../helpers/url_helper";

module.exports = {
    name: "register",
    description: "Join Spotify party!",
    execute(message: Message, args: string[] | undefined, client: any) {
        const _greet = `Hello! Please grant Syncify access to your Spotify client here: `;
        const qParams = {
            platform: "discord",
            client_id: message?.guild?.id,
            user_id: message?.member?.id,
        };
        const accessURL = `> ${SERVER_URL}/?${querystring.stringify(qParams)}`;
        client.users.cache.get(message?.member?.id).send(_greet + '\n' + accessURL);
        message.reply(
            `Hello, please look for a DM from the bot that contains the unique registration link`
        );
    },
};
