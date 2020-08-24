import { nextPreviousTrack } from "../../../spotify/next_previous_track";

module.exports = {
    name: "next",
    description: "Skip to next track",
    async execute(message: any, args: any) {
        const platformInfo: any = {
            type: 1,
            discordUserId: message.member.id,
            discordServerId: message.guild.id,
        };

        await nextPreviousTrack(platformInfo, 1)
            .then(async (status: any) => {
                if (status.done) {
                    message.reply(status.message);
                } else {
                    message.reply(status.message);
                }
            })
            .catch((error: any) => {
                console.log(`ERROR: discord/commands/shuffle: ${error}`);
            });
    },
};
