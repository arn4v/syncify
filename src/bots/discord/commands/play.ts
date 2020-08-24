import { playTrack } from "../../../spotify/play";
import { getTrackInfo } from "../../../spotify/track_info";

module.exports = {
    name: "play",
    description: "Resume playing track",
    async execute(message: any, args: any) {
        const platformInfo: any = {
            type: 1,
            discordUserId: message.member.id,
            discordServerId: message.guild.id,
        };
        if (typeof args != "undefined" && args.length >= 1) {
            await playTrack(platformInfo, args[0])
                .then(async (status: any) => {
                    if (status.done) {
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
        } else {
            message.reply("Please pass at least one argument");
        }
    },
};
