import Axios from "axios";
import { endpoints } from "./endpoints";
import { refreshAccessToken } from "./refresh_tokens";
import { SpotifyInfo } from "../../interfaces/global";
import { RequestStatus } from "../../interfaces/spotify";

export async function playTrackRequest(
    spotifyInfo: SpotifyInfo,
    tracks: string[]
): Promise<RequestStatus> {
    let status: RequestStatus = {
        successfull: false,
        status: undefined,
        error: undefined,
        response: undefined,
        isRefreshed: false,
    };
    const request_url: string = endpoints.play_track.url;

    await Axios({
        url: request_url,
        method: "put",
        headers: {
            Authorization: "Bearer " + spotifyInfo.spotifyAccessToken,
            "Content-Type": "application/json",
        },
        data: {
            uris: tracks,
        },
    })
        .then((res: any) => {
            if (res.status == 204) {
                status.successfull = true;
            }
            status.status = res.status;
            status.response = res.data;
        })
        .catch(async (error: any) => {
            status.status = error.response.status;
            status.error = error.response;
            if (error.response.status == 401) {
                await refreshAccessToken(spotifyInfo.spotifyRefreshToken).then(
                    async (newAccessToken: any) => {
                        status.isRefreshed = true;
                        status.newAccessToken = newAccessToken;
                        await Axios({
                            url: request_url,
                            method: "put",
                            headers: {
                                Authorization: "Bearer " + newAccessToken,
                            },
                            data: {
                                uris: [tracks[0]],
                            },
                        })
                            .then((_res: any) => {
                                status.status = _res.status;
                                status.response = _res.data;
                                if (_res.status == 204) {
                                    status.successfull = true;
                                }
                            })
                            .catch((_error) => {
                                status.error = _error;
                                console.log(
                                    "Error: resumePausePlayback: Second axios call: ",
                                    _error
                                );
                            });
                    }
                );
            } else {
                console.log(
                    `ERROR: play_queue_track:playTrack:136: ${error.response.status}`
                );
            }
        });
    return status;
}
