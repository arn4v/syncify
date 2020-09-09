import { toggleShuffleRepeat } from "../../../spotify/toggle_shuffle_repeat";
import { MethodStatus } from "../../../interfaces";

module.exports = {
    name: "repeat",
    description: "Resume playing track",
    async execute(message: any, args: any) {
        const platformInfo: any = {
            type: 1,
            discordUserId: message.member.id,
            discordServerId: message.guild.id,
        };

        await toggleShuffleRepeat(platformInfo, "track", 2)
            .then(async (res: MethodStatus) => {
                message.reply(res.message);
            })
            .catch((error: string) => {
                console.log(`ERROR: discord/commands/shuffle: ${error}`);
            });
    },
};
