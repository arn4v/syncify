import { SpotifyHelper } from "../../spotify/api_helper";
import DataHelper from "../../data/data_helper";

module.exports = {
    name: "track",
    description: "Get the details of the current track",
    async execute(message: any, args: any) {
        // const serverId: string = message.guild.id;
        const userId: string = message.member.id;
        const platformInfo: any = {
            type: 1,
            discordUserId: userId,
        };
        await SpotifyHelper.getTrackInfo(platformInfo)
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
