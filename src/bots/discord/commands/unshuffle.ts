import { toggleShuffleRepeat } from "../../../spotify/toggle_shuffle_repeat";
import { PlatformInfo, MethodStatus } from "../../../interfaces/global";

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
                if (res.done) {
                    message.reply(`Unshuffled your queue`);
                } else {
                    message.reply(`Unable to shuffle queue`);
                }
            })
            .catch((error) => {
                console.log(`ERROR: discord/commands/shuffle: ${error}`);
            });
    },
};
