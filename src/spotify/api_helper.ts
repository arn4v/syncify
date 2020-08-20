import axios from "axios";
import DataHelper from "../data/data_helper";
import qs from "qs";

export class SpotifyHelper {
    private static baseUrl: string = "https://api.spotify.com/v1";

    private static async refreshAccessToken(refresh_token: any) {
        const postData = {
            grant_type: "refresh_token",
            refresh_token: refresh_token,
        };
        let newAccessToken: string;
        await axios
            .post(
                "https://accounts.spotify.com/api/token",
                qs.stringify(postData),
                {
                    headers: {
                        Authorization:
                            "Basic " +
                            Buffer.from(
                                process.env.SPOTIFY_CLIENT_ID +
                                    ":" +
                                    process.env.SPOTIFY_CLIENT_SECRET
                            ).toString("base64"),
                        "content-type": "application/x-www-form-urlencoded",
                    },
                }
            )
            .then(async (response) => {
                if (response.status == 200) {
                    newAccessToken = response.data["access_token"];
                }
            })
            .catch((error) =>
                console.log(
                    `LOG: ERROR: SpotifyHelper.refreshAccessToken: ${error}`
                )
            );
        // @ts-ignore
        return newAccessToken;
    }

    public static async resumePausePlayback(
        request_type: number,
        platformInfo: any
    ) {
        let request_url: () => string = () => {
            var req_url: string = this.baseUrl + "/me/player/";
            return request_type == 1 ? req_url + "play" : req_url + "pause";
        };
        let done: boolean;

        await DataHelper.fetchSpotifyTokens(platformInfo)
            .then(async (spotifyInfo: any) => {
                let access_token: string = spotifyInfo.spotifyAccessToken;
                let new_access_token: string;
                await axios({
                    url: request_url(),
                    method: "put",
                    headers: {
                        Authorization: "Bearer " + access_token,
                    },
                })
                    .then((res) => {
                        res.status == 204 ? (done = true) : (done = false);
                    })
                    .catch(async (error) => {
                        if (error.response.status == 401) {
                            await this.refreshAccessToken(
                                spotifyInfo.spotifyRefreshToken
                            ).then(async (data) => {
                                new_access_token = data;
                                DataHelper.updateSpotifyAccessToken(
                                    data,
                                    platformInfo
                                );
                                await axios({
                                    url: request_url(),
                                    method: "put",
                                    headers: {
                                        Authorization:
                                            "Bearer " + new_access_token,
                                    },
                                })
                                    .then((_res) => {
                                        if (_res.status == 204) {
                                            done = true;
                                        }
                                    })
                                    .catch((_error) =>
                                        console.log(
                                            "Error: resumePausePlayback: Second axios call: ",
                                            _error
                                        )
                                    );
                            });
                        } else {
                            console.log(
                                `ERROR: SpotifyHelper.resumePlayback: ${error.response.status}`
                            );
                            done = false;
                        }
                    });
            })
            .catch((__error) =>
                console.log("ERROR: DataHelper.fetchSpotifyTokens: " + __error)
            );
        // @ts-ignore
        return done;
    }

    public static async getTrackInfo(platformInfo: any) {
        let newSpotifyAccessToken: string;
        let request_url = this.baseUrl + "/me/player/currently-playing";

        let songInfo = {
            name: undefined,
            artists: undefined,
        };

        await DataHelper.fetchSpotifyTokens(platformInfo)
            .then(async (spotifyInfo: any) => {
                let spotifyAccessToken: string = spotifyInfo.spotifyAccessToken;
                let spotifyRefreshToken: string =
                    spotifyInfo.spotifyRefreshToken;
                const authorization_header = (isRefreshed: boolean) => {
                    let token: string = isRefreshed
                        ? newSpotifyAccessToken
                        : spotifyAccessToken;
                    return {
                        Authorization: "Bearer " + token,
                    };
                };

                await axios
                    .get(request_url, {
                        headers: authorization_header(false),
                    })
                    .then(async (response) => {
                        // @ts-ignore
                        if (response.status == 401) {
                            await this.refreshAccessToken(spotifyRefreshToken)
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
                        } else if (response.status == 204) {
                        }
                    })
                    .catch(async () => {
                        console.log(
                            `ERROR: Got a 401, attempting to refresh access token`
                        );
                        await this.refreshAccessToken(spotifyRefreshToken)
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
                                        console.log("GOT IT" + res);
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
}
