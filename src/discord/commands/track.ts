import { SpotifyHelper } from "../../spotify/api_helper";
import DataHelper from "../../data/data_helper";

module.exports = {
    name: "track",
    description: "Get the details of the current track",
    execute(message: any, args: any) {
        // const serverId: string = message.guild.id;
        const userId: string = message.member.id;
        // @ts-ignore
        DataHelper.fetchSpotifyTokens({
            platformType: 1,
            discordUserId: userId,
        })
            .then((spotifyInfo: any) => {
                message.channel.send(
                    SpotifyHelper.getTrackInfo(
                        // @ts-ignore
                        (spotifyAccessToken = spotifyInfo.spotifyAccessToken),
                        // @ts-ignore
                        (spotifyRefreshToken = spotifyInfo.spotifyRefreshToken)
                    )
                );
            })
            .catch((error) => console.log(error));
    },
};
