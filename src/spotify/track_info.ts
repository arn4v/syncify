import axios, { Method } from "axios";
import { DataHelper } from "../data/data_helper";
import { endpoints } from "./endpoints";
import { refreshAccessToken } from "./refresh_access_token";
import { Track } from "../types/track";
import { Artist } from "../types/artist";
import { MethodStatus } from "../types/status";

export async function trackInfoRequest(
    platformInfo: any,
    spotifyInfo: any
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
                    .then((data) => {
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

async function fetchAndRequest(platformInfo: any): Promise<MethodStatus> {
    let status: MethodStatus = {
        done: undefined,
        message: undefined,
        data: undefined,
        rawData: undefined,
    };

    await DataHelper.fetchSpotifyTokens(platformInfo)
        .then(async (spotifyInfo) => {
            await trackInfoRequest(platformInfo, spotifyInfo)
                .then((res: any) => {
                    if (res.done) {
                        status = res;
                    } else {
                        status = res;
                    }
                })
                .catch(() => (status.done = false));
        })
        .catch(() => {
            status.done = false;
        });
    return status;
}

export async function getTrackInfo(platformInfo: any) {
    let status: MethodStatus = {
        done: undefined,
        message: undefined,
        data: undefined,
        rawData: undefined,
    };

    await DataHelper.doesSessionExist(platformInfo)
        .then(async (res: MethodStatus) => {
            if (res.done ) {
                let admin: string = res.data.createdBy;
                let platInfo = platformInfo;
                platInfo.type == 1
                    ? (platInfo.discordUserId = admin)
                    : (platInfo.telegramUserId = admin);

                try {
                    let platInfo = platformInfo;
                    platInfo.type == 1
                        ? (platInfo.discordUserId = admin)
                        : (platInfo.telegramUserId = admin);
                    await fetchAndRequest(platInfo)
                        .then((res: MethodStatus) => {
                            status.data = res.data;
                            status.rawData = res.rawData;
                            status.done = true;
                            status.message =
                                `Currently playing [${res.data?.name}](${res.data?.link}) by ` +
                                res.data?.artists
                                    .map((artist: Artist) => {
                                        `[${artist.name}](${artist.link})`;
                                    })
                                    .join(", ");
                        })
                        .catch((error) => {
                            console.log(error);
                            status.done = false;
                            status.message = `Unable to pause for all session members`;
                        });
                } catch {
                    status.done = false;
                    status.message = `Unable to pause for all session members`;
                }
            } else {
                status.done = false;
                status.message = "Please fetch";
            }
        })
        .catch((error) => {
            console.log(error);
            status.done = false;
            status.message = `Unable to pause`;
        });

    return status;
}
