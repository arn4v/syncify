import axios from "axios";
import { DataHelper } from "../../data/data_helper";
import {
    MethodStatus,
    PlatformInfo,
    SpotifyInfo,
} from "../../interfaces/global";
import { refreshAccessToken } from "./refresh_tokens";
import { endpoints } from "./endpoints";
import { Track } from "../../interfaces/spotify";

export async function trackInfoRequest(
    platformInfo: PlatformInfo,
    spotifyInfo: SpotifyInfo
): Promise<MethodStatus> {
    const request_url: string = endpoints.current_track.url;
    const spotifyAccessToken: string = spotifyInfo.spotifyAccessToken;
    const spotifyRefreshToken: string = spotifyInfo.spotifyRefreshToken;
    let newSpotifyAccessToken: string;
    let authorization_header = (accessToken: string) => {
        return {
            Authorization: "Bearer " + accessToken,
        };
    };

    let status: MethodStatus = {
        done: undefined,
        message: undefined,
        data: undefined,
        rawData: undefined,
    };

    let trackInfo: Track = {
        name: undefined,
        id: undefined,
        link: undefined,
        uri: undefined,
        artists: [],
    };

    await axios({
        method: "get",
        url: request_url,
        headers: authorization_header(spotifyAccessToken),
    })
        .then(async (response: any) => {
            if (response.status == 401) {
                await refreshAccessToken(spotifyRefreshToken)
                    .then((data: string) => {
                        newSpotifyAccessToken = data;
                        DataHelper.updateSpotifyAccessToken(data, platformInfo);
                    })
                    .catch((error) =>
                        console.log(
                            `ERROR: SpotifyHelper.getTrackInfo: ${error}`
                        )
                    );
            } else if (response.status == (200 || 201)) {
                trackInfo.id = response.data.item.uri;
                trackInfo.link = response.data.item.link;
                trackInfo.name = response.data.item.name;
                trackInfo.position = response.data.item.progress_ms;
                trackInfo.uri = response.data.item.uri;
                response.data.item.artists.forEach((data: any) => {
                    trackInfo.artists?.push({
                        name: data.name,
                        link: data.external_urls.spotify,
                        uri: data.uri,
                    });
                });
                status.done = true;
                status.message = "Successfully fetched current track info";
                status.data = trackInfo;
                status.rawData = response.data;
                // Make this a helper instead
                // response.data.item.artists
                //     // @ts-ignore
                //     .map((e) => e.name)
                //     .join(", ");
                // TODO: Handle other status codes
            } else if (response.status == 204) {
            }
        })
        .catch(async () => {
            console.log(`ERROR: Got a 401, attempting to refresh access token`);
            await refreshAccessToken(spotifyRefreshToken)
                .then(async (data) => {
                    newSpotifyAccessToken = data;
                    DataHelper.updateSpotifyAccessToken(
                        // @ts-ignore
                        newSpotifyAccessToken,
                        platformInfo
                    );
                    await axios({
                        url: request_url,
                        method: "get",
                        headers: authorization_header(newSpotifyAccessToken),
                    })
                        .then((response) => {
                            trackInfo.id = response.data.item.uri;
                            trackInfo.link = response.data.item.link;
                            trackInfo.name = response.data.item.name;
                            trackInfo.position = response.data.item.progress_ms;
                            trackInfo.uri = response.data.item.uri;
                            response.data.item.artists.forEach((data: any) => {
                                trackInfo.artists?.push({
                                    name: data.name,
                                    link: data.external_urls.spotify,
                                    uri: data.uri,
                                });
                            });
                            status.done = true;
                            status.message =
                                "Successfully fetched current track info";
                            status.data = trackInfo;
                            status.rawData = response.data;
                        })
                        .catch((error) =>
                            console.log(
                                `ERROR: getTrackInfo catch block ${error}`
                            )
                        );
                })
                .catch((error) =>
                    console.log(`ERROR: SpotifyHelper.getTrackInfo: ${error}`)
                );
        });
    return status;
}

export async function nextPreviousTrackRequest(
    platformInfo: any,
    request_type: number
): Promise<MethodStatus> {
    const request_url: string =
        request_type == 1
            ? endpoints.next_track.url
            : endpoints.previous_track.url;

    let status: MethodStatus = {
        done: false,
    };
    let new_access_token: string;

    await DataHelper.fetchSpotifyTokens(platformInfo)
        .then(async (spotifyInfo: SpotifyInfo) => {
            let access_token: string = spotifyInfo.spotifyAccessToken;
            await axios({
                url: request_url,
                method: "post",
                headers: {
                    Authorization: "Bearer " + access_token,
                },
            })
                .then((res) => {
                    res.status == 204
                        ? (status.done = true)
                        : (status.done = false);
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
                                        status.done = true;
                                    }
                                })
                                .catch((_error) =>
                                    console.log(
                                        "Error: nextPreviousTrack: Second axios call: ",
                                        _error
                                    )
                                );
                        });
                    } else {
                        console.log(
                            `ERROR: SpotifyHelper.resumePlayback: ${error.response.status}`
                        );
                        status.done = false;
                    }
                });
        })
        .catch((__error) =>
            console.log("ERROR: DataHelper.fetchSpotifyTokens: " + __error)
        );
    return status;
}
