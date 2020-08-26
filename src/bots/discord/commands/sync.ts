import { syncSession } from "../../../spotify/sync";

module.exports = {
    name: "sync",
    description: "Resume playing track",
    async execute(message: any, args: any) {
        const platformInfo: any = {
            type: 1,
            discordUserId: message.member.id,
            discordServerId: message.guild.id,
        };

        await syncSession(platformInfo)
            .then((status: any) => {
                message.reply(status.message);
            })
            .catch((error: string) => message.reply(error));
    },
};
