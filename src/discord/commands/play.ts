import { resumePausePlayback } from "../../spotify/toggle_playback";
import { getTrackInfo } from "../../spotify/track_info";

module.exports = {
    name: "play",
    description: "Resume playing track",
    async execute(message: any, args: any) {
        const platformInfo: any = {
            type: 1,
            discordUserId: message.member.id,
            discordServerId: message.guild.id,
        };

        await resumePausePlayback(1, platformInfo)
            .then(async (successfull: boolean) => {
                if (successfull) {
                    await getTrackInfo(platformInfo)
                        .then((response: any) => {
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
