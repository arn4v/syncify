import { getTrackInfo } from "../../../spotify/track_info";

module.exports = {
    name: "track",
    description: "Get the details of the current track",
    async execute(message: any, args: any) {
        const platformInfo: any = {
            type: 1,
            discordUserId: message.member.id,
            discordServerId: message.guild.id,
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
