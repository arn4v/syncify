import { toggleShuffleRepeat } from "../../../spotify/toggle_shuffle_repeat";

module.exports = {
    name: "unshuffle",
    description: "Resume playing track",
    async execute(message: any, args: any) {
        const platformInfo: any = {
            type: 1,
            discordUserId: message.member.id,
            discordServerId: message.guild.id,
        };

        await toggleShuffleRepeat(platformInfo, false, 1)
            .then(async (status?: boolean) => {
                if (status) {
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
