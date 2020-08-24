import { toggleShuffleRepeat } from "../../spotify/toggle_shuffle_repeat";

module.exports = {
    name: "repeat",
    description: "Resume playing track",
    async execute(message: any, args: any) {
        const userId: string = message.member.id;
        const platformInfo: any = {
            type: 1,
            discordUserId: message.member.id,
            discordServerId: message.guild.id,
        };

        await toggleShuffleRepeat(platformInfo, "track", 2)
            .then(async (status?: boolean) => {
                if (status) {
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
