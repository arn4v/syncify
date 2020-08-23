import { resumePausePlayback } from "../../spotify/toggle_playback";

module.exports = {
    name: "pause",
    description: "Resume playing track",
    async execute(message: any, args: any) {

        const platformInfo: any = {
            type: 1,
            discordUserId: message.member.id,
            discordServerId: message.guild.id,
        };

        await resumePausePlayback(2, platformInfo)
            .then((successfull: boolean) => {
                message.reply(
                    successfull
                        ? "> Paused playback"
                        : "> Unable to pause playback"
                );
            })
            .catch((error: string) => message.reply(error));
    },
};
