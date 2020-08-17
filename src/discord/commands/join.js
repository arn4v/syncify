import querystring from "querystring";

let server_url =
    process.env["SYNCIFY_SERVER_BASE_URL"] != undefined
        ? process.env["SYNCIFY_SERVER_BASE_URL"] + "/auth]"
        : "http://localhost:8888/auth";

module.exports = {
    name: "join",
    description: "Join Spotify party!",
    execute(message, args) {
        const _greet = `Welcome to the Party! Grant Syncify access to your Spotify client here: \n`;
        const qParams = {
            client_id: message.guild.id,
            user_id: message.member.id,
        };
        const accessURL = `> ${server_url}/?${querystring.stringify(qParams)}`;

        message.reply(`${_greet}${accessURL}`);
    },
};
