import axios from "axios";
import DataHelper from "../data/data_helper";

export class SpotifyHelper {
    // private static _instance: any;
    private static baseUrl: string = "https://api.spotify.com/v1";

    // private static get instance() {
    //     if (this._instance != null) return this._instance;
    //     this._instance = axios.create({
    //         baseURL: "https://api.spotify.com/v1/",
    //     });
    // }

    // private static async refreshAccessToken(
    //     spotifyInfo: any,
    //     platformInfo: any
    // ) {
    //     let spotifyAccessToken: string = spotifyInfo.spotifyAccessToken;
    //     let spotifyRefreshToken: string = spotifyInfo.spotifyRefreshToken;
    // }

    public static async getTrackInfo(spotifyInfo: any, platformInfo: any) {
        let spotifyAccessToken: string = spotifyInfo.spotifyAccessToken;
        let spotifyRefreshToken: string = spotifyInfo.spotifyRefreshToken;
        let reqUrl = this.baseUrl + "/me/player/currently-playing";

        const trackInfo = async () => {
            let songInfo = {
                name: undefined,
                artists: undefined,
            };

            await axios
                .get(reqUrl, {
                    headers: { Authorization: `Bearer ${spotifyAccessToken}` },
                })
                .then((response) => {
                    switch (response.status) {
                        case 401: {
                            axios
                                .post(
                                    "https://accounts.spotify.com/api/token",
                                    {
                                        headers: {
                                            Authorization:
                                                "Basic " +
                                                Buffer.from(
                                                    process.env
                                                        .SPOTIFY_CLIENT_ID +
                                                        ":" +
                                                        process.env
                                                            .SPOTIFY_CLIENT_SECRET
                                                ).toString("base64"),
                                        },
                                        form: {
                                            grant_type: "refresh_token",
                                            refresh_token: spotifyRefreshToken,
                                        },
                                    }
                                )
                                .then(async (response) => {
                                    if (response.status == 200) {
                                        DataHelper.updateSpotifyAccessToken(
                                            response.data.access_token,
                                            platformInfo
                                        );
                                        await axios
                                            .get(reqUrl, {
                                                headers: {
                                                    Authorization: `Bearer ${spotifyAccessToken}`,
                                                },
                                            })
                                            .then((_response) => {
                                                songInfo.name =
                                                    _response.data.item.name;
                                                songInfo.artists = _response.data.item.artists
                                                    // @ts-ignore
                                                    .map((e) => e.name)
                                                    .join(", ");
                                            });
                                    }
                                })
                                .catch((error) =>
                                    console.log(
                                        `LOG: ERROR: SpotifyHelper.refreshAccessToken: ${error}`
                                    )
                                );
                            break;
                        }
                        default: {
                            songInfo.name = response.data.item.name;
                            songInfo.artists = response.data.item.artists
                                // @ts-ignore
                                .map((e) => e.name)
                                .join(", ");
                        }
                    }
                    // let data = JSON.parse(response.data);
                    // songInfo.name = data.
                    return trackInfo;
                })
                .catch((error) => console.log(error));

            return songInfo;
        };
        return trackInfo;
    }
}
