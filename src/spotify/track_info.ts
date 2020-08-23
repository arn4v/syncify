import axios from "axios";
import { DataHelper } from "../data/data_helper";
import { endpoints } from "./endpoints";
import { refreshAccessToken } from "./refresh_access_token";
import { SpotifyInfo } from "../types/spotify_info";

export async function getTrackInfo(platformInfo: SpotifyInfo) {
    let newSpotifyAccessToken: string;
    const request_url: string = endpoints.current_track.url;

    let songInfo = {
        name: undefined,
        artists: undefined,
    };

    await DataHelper.fetchSpotifyTokens(platformInfo)
        .then(async (spotifyInfo: any) => {
            const spotifyAccessToken: string = spotifyInfo.spotifyAccessToken;
            const spotifyRefreshToken: string = spotifyInfo.spotifyRefreshToken;
            const authorization_header = (isRefreshed: boolean) => {
                let token: string = isRefreshed
                    ? newSpotifyAccessToken
                    : spotifyAccessToken;
                return {
                    Authorization: "Bearer " + token,
                };
            };

            await axios({
                method: "get",
                url: request_url,
                headers: authorization_header(false),
            })
                .then(async (response) => {
                    // @ts-ignore
                    if (response.status == 401) {
                        await refreshAccessToken(spotifyRefreshToken)
                            .then((data) => {
                                newSpotifyAccessToken = data;
                                DataHelper.updateSpotifyAccessToken(
                                    data,
                                    platformInfo
                                );
                            })
                            .catch((error) =>
                                console.log(
                                    `ERROR: SpotifyHelper.getTrackInfo: ${error}`
                                )
                            );
                        // @ts-ignore
                    } else if (response.status == (200 || 201)) {
                        // @ts-ignore
                        songInfo.name = response.data.item.name;
                        // @ts-ignore
                        songInfo.artists = response.data.item.artists
                            // @ts-ignore
                            .map((e) => e.name)
                            .join(", ");
                        // TODO: Handle other status codes
                    } else if (response.status == 204) {
                    }
                })
                .catch(async () => {
                    console.log(
                        `ERROR: Got a 401, attempting to refresh access token`
                    );
                    await refreshAccessToken(spotifyRefreshToken)
                        .then(async (data) => {
                            newSpotifyAccessToken = data;
                            DataHelper.updateSpotifyAccessToken(
                                // @ts-ignore
                                newSpotifyAccessToken,
                                platformInfo
                            );
                            await axios
                                .get(request_url, {
                                    headers: authorization_header(true),
                                })
                                .then((res) => {
                                    // @ts-ignore
                                    songInfo.name = res.data.item.name;
                                    // @ts-ignore
                                    songInfo.artists = res.data.item.artists
                                        // @ts-ignore
                                        .map((e) => e.name)
                                        .join(", ");
                                })
                                .catch((error) =>
                                    console.log(
                                        `ERROR: getTrackInfo catch block ${error}`
                                    )
                                );
                        })
                        .catch((error) =>
                            console.log(
                                `ERROR: SpotifyHelper.getTrackInfo: ${error}`
                            )
                        );
                });
        })
        .catch((error: any) => console.log(error));

    return songInfo;
}
