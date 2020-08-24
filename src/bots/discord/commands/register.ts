import querystring from "querystring";
import { SERVER_URL } from "../../../helpers/url_helper";

module.exports = {
    name: "register",
    description: "Join Spotify party!",
    execute(message: any, args: string[] | undefined) {
        const _greet = `Welcome to the Party! Grant Syncify access to your Spotify client here: \n`;
        const qParams = {
            platform: "discord",
            client_id: message.guild.id,
            user_id: message.member.id,
        };
        const accessURL = `> ${SERVER_URL}/?${querystring.stringify(qParams)}`;
        message.reply(`${_greet}${accessURL}`);
    },
};
