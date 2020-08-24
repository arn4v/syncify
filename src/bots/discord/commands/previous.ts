import { nextPreviousTrack } from "../../../spotify/next_previous_track";

module.exports = {
    name: "previous",
    description: "Go back one track",
    async execute(message: any, args: any) {
        const platformInfo: any = {
            type: 1,
            discordUserId: message.member.id,
            discordServerId: message.guild.id,
        };

        await nextPreviousTrack(platformInfo, 2)
            .then(async (status: any) => {
                if (status.done) {
                    message.reply(status.message);
                } else {
                    message.reply(status.message);
                }
            })
            .catch((error: string) => {
                console.log(`ERROR: discord/commands/shuffle: ${error}`);
            });
    },
};
