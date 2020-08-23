import { SpotifyHelper } from "../../spotify/api_helper";

module.exports = {
    name: "shuffle",
    description: "Resume playing track",
    async execute(message: any, args: any) {
        // const serverId: string = message.guild.id;
        const userId: string = message.member.id;
        const platformInfo: any = {
            type: 1,
            discordUserId: userId,
        };

        await SpotifyHelper.toggleShuffle(platformInfo, true)
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
