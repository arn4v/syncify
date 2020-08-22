import { SpotifyHelper } from "../../spotify/api_helper";
import DataHelper from "../../data/data_helper";

module.exports = {
    name: "resume",
    description: "Resume playing track",
    async execute(message: any, args: any) {
        // const serverId: string = message.guild.id;
        const userId: string = message.member.id;
        console.log(userId);
        const platformInfo: any = {
            type: 1,
            discordUserId: userId,
        };

        await SpotifyHelper.resumePausePlayback(1, platformInfo)
            .then(async (successfull: boolean) => {
                console.log(successfull);
                if (successfull) {
                    await SpotifyHelper.getTrackInfo(platformInfo)
                        .then((response: any) => {
                            console.log(response);
                            message.channel.send(
                                `> Resumed playing: ${response.name} by ${response.artists}`
                            );
                        })
                        .catch((error: string) => {
                            console.log(
                                `LOG: discord/commands/track.ts: ${error}`
                            );
                        });
                } else {
                    message.channel.send(
                        `> Spotify cannot find active devices.`
                    );
                }
            })
            .catch((error: string) => message.reply(error));
    },
};
