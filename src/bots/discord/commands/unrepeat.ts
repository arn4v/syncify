import { toggleShuffleRepeat } from "../../../spotify/toggle_shuffle_repeat";
import { MethodStatus } from "../../../interfaces/global";

module.exports = {
    name: "unrepeat",
    description: "Resume playing track",
    async execute(message: any, args: any) {
        const platformInfo: any = {
            type: 1,
            discordUserId: message.member.id,
            discordServerId: message.guild.id,
        };

        await toggleShuffleRepeat(platformInfo, { toggleState: "off" }, 2)
            .then(async (res: MethodStatus) => {
                if (res.done) {
                    message.reply(`Shuffled your queue`);
                } else {
                    message.reply(`Unable to shuffle queue`);
                }
            })
            .catch((error) => {
                console.log(`ERROR: discord/commands/shuffle: ${error}`);
            });
    },
};
