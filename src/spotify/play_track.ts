import axios from "axios";
import { DataHelper } from "../data/data_helper";
import { refreshAccessToken } from "./refresh_access_token";
import { endpoints } from "./endpoints";

export async function playTrack(platformInfo: any, trackUri: string): Promise<boolean> {
    let new_access_token: string;
    let _done: boolean;
    const request_url: string = endpoints.play_track.url;
    await DataHelper.fetchSpotifyTokens(platformInfo)
        .then(async (spotifyInfo: any) => {
            let access_token: string = spotifyInfo.spotifyAccessToken;
            await axios({
                url: request_url,
                method: "put",
                headers: {
                    Authorization: "Bearer " + access_token,
                },
                data: {
                    uris: [trackUri],
                },
            })
                .then((res) => {
                    res.status == 204 ? (_done = true) : (_done = false);
                })
                .catch(async (error) => {
                    if (error.response.status == 401) {
                        await refreshAccessToken(
                            spotifyInfo.spotifyRefreshToken
                        ).then(async (data: any) => {
                            new_access_token = data;
                            DataHelper.updateSpotifyAccessToken(
                                data,
                                platformInfo
                            );
                            await axios({
                                url: request_url,
                                method: "put",
                                headers: {
                                    Authorization: "Bearer " + new_access_token,
                                },
                            })
                                .then((_res) => {
                                    if (_res.status == 204) {
                                        _done = true;
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
                        _done = false;
                    }
                });
        })
        .catch((__error) => {
            console.log("ERROR: DataHelper.fetchSpotifyTokens: " + __error);
            _done = false;
        });
    // @ts-ignore
    return _done;
}
