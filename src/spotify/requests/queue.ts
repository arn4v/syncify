import { endpoints } from "./endpoints";
import { DataHelper } from "../../data/data_helper";
import Axios from "axios";
import { SpotifyInfo } from "../../interfaces/global";
import { refreshAccessToken } from "./refresh_tokens";

export async function queueRequest(
    platformInfo: any,
    trackUri: string
): Promise<boolean> {
    const request_url: string = endpoints.add_to_queue.url;
    let _done: boolean = false;
    let new_access_token: string;
    await DataHelper.fetchSpotifyTokens(platformInfo)
        .then(async (spotifyInfo: SpotifyInfo) => {
            let access_token: string = spotifyInfo.spotifyAccessToken;
            await Axios({
                url: request_url,
                method: "post",
                headers: {
                    Authorization: "Bearer " + access_token,
                },
                params: {
                    uri: trackUri,
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
                            await Axios({
                                url: request_url,
                                method: "put",
                                headers: {
                                    Authorization: "Bearer " + new_access_token,
                                },
                            })
                                .then((_res: any) => {
                                    if (_res.status == 204) {
                                        _done = true;
                                    }
                                })
                                .catch((_error: Error) =>
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
    return _done;
}
