import { getTrackInfo } from "../../spotify/track_info";

module.exports = {
    name: "track",
    description: "Get the details of the current track",
    async execute(message: any, args: any) {
        const userId: string = message.member.id;
        const platformInfo: any = {
            type: 1,
            discordUserId: userId,
        };
        await getTrackInfo(platformInfo)
            .then((response: any) => {
                message.channel.send(
                    ` Current playing ${response.name} by ${response.artists}`
                );
            })
            .catch((error: string) => {
                console.log(`LOG: discord/commands/track.ts: ${error}`);
            });
    },
};
