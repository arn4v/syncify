import { togglePlayback } from "../../../spotify/toggle_playback";
import { getTrackInfo } from "../../../spotify/track_info";
import { MethodStatus } from "../../../interfaces/global";

module.exports = {
    name: "resume",
    description: "Resume playing track",
    async execute(message: any, args: any) {
        const platformInfo: any = {
            type: 1,
            discordUserId: message.member.id,
            discordServerId: message.guild.id,
        };

        await togglePlayback(1, platformInfo)
            .then(async (status: MethodStatus) => {
                message.reply(status.message);
            })
            .catch((error: string) => message.reply(error));
    },
};
