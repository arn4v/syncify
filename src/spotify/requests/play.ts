import Axios from "axios";
import { DataHelper } from "../../data/data_helper";
import { endpoints } from './endpoints'
import { refreshAccessToken } from "./refresh_tokens";
import { toggleShuffleRepeatRequest } from "./shuffle_repeat";
import { SpotifyInfo, MethodStatus } from "../../interfaces/global";

export async function playTrack(
    spotifyInfo: SpotifyInfo,
    tracks: string[]
): Promise<boolean> {
    let new_access_token: string;
    let status: MethodStatus = {
        done: false,
        error: undefined,
        data: undefined,
    };
    const request_url: string = endpoints.play_track.url;

    await Axios({
        url: request_url,
        method: "put",
        headers: {
            Authorization: "Bearer " + access_token,
            "Content-Type": "application/json",
        },
        data: {
            uris: tracks,
        },
    })
        .then((res: any) => {
            console.log(res.config);
            res.status == 204
                ? (_done = true)
                : (_done = false);
        })
        .catch(async (error: any) => {
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
                            Authorization:
                                "Bearer " + new_access_token,
                        },
                        data: {
                            uris: [tracks[0]],
                        },
                    })
                        .then((_res: any) => {
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
                    `ERROR: play_queue_track:playTrack:136: ${error.response.status}`
                );
                _done = false;
            }
        });
        })
        .catch (() => {
    _done = false;
});
return _done;
}
