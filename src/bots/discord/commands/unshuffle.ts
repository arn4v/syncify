import { toggleShuffleRepeat } from "../../../spotify/toggle_shuffle_repeat";
import { PlatformInfo, MethodStatus } from "../../../interfaces/interfaces";

module.exports = {
    name: "unshuffle",
    description: "Resume playing track",
    async execute(message: any, args: any) {
        const platformInfo: PlatformInfo = {
            type: 1,
            discordUserId: message.member.id,
            discordServerId: message.guild.id,
        };

        await toggleShuffleRepeat(platformInfo, false, 1)
            .then(async (res: MethodStatus) => {
                message.reply(res.message);
            })
            .catch((error) => {
                console.log(`ERROR: discord/commands/shuffle: ${error}`);
            });
    },
};
