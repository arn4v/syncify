import { playOrAddToQueue } from "../../../spotify/play_queue_track";

module.exports = {
    name: "play",
    description: "Resume playing track",
    async execute(message: any, args: any) {
        const platformInfo: any = {
            type: 1,
            discordUserId: message.member.id,
            discordServerId: message.guild.id,
        };

        if (typeof args != "undefined" && args.length >= 1) {
            await playOrAddToQueue(platformInfo, args)
                .then(async (status: any) => {
                    message.reply(status.message);
                })
                .catch((error: string) => message.reply(error));
        } else {
            message.reply("Please pass at least one argument");
        }
    },
};
