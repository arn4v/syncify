import axios from "axios";
import { DataHelper } from "../data/data_helper";
import { endpoints } from "./endpoints";
import { refreshAccessToken } from "./refresh_access_token";

export async function resumePausePlayback(
    request_type: number,
    platformInfo: any
) {
    const request_url: string =
        request_type == 1
            ? endpoints.resume_playback.url
            : endpoints.pause_playback.url;
    let done: boolean;
    let new_access_token: string;

    await DataHelper.fetchSpotifyTokens(platformInfo)
        .then(async (spotifyInfo: any) => {
            let access_token: string = spotifyInfo.spotifyAccessToken;
            await axios({
                url: request_url,
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
