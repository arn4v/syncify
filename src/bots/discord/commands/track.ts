import { MessageEmbed } from "discord.js";
import { MethodStatus, Track } from "../../../interfaces/interfaces";
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
            .then((response: MethodStatus) => {
                if (response.done == false) {
                    message.channel.send(response.message);
                } else {
                    console.log(response);
                    let track: Track = response.data;
                    const embed = new MessageEmbed().addFields(
                        {
                            name: "Name",
                            value: `[${track.name}](${track.link})`,
                            inline: true,
                        },
                        {
                            name: "Artists",
                            value: track?.artists
                                ?.map((e) => {
                                    return `[${e.name}](${e.link})`;
                                })
                                .join(", "),
                            inline: true,
                        }
                    );
                    message.channel.send(embed);
                }
            })
            .catch((error: string) => {
                console.log(`LOG: discord/commands/track.ts: ${error}`);
            });
    },
};
