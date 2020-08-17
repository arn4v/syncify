import request from "request";

module.exports = {
    name: "track",
    description: "Get the details of the current track",
    execute(message, args, firebase) {
        const loc = `${message.guild.id}/${message.member.id}`;
        firebase
            .database()
            .ref(loc)
            .once("value", (snapshot) => {
                var {
                    spotify_access_token = undefined,
                    spotify_refresh_token = undefined,
                } = snapshot.val();

                if (spotify_access_token) {
                    var options = {
                        url:
                            "https://api.spotify.com/v1/me/player/currently-playing",
                        headers: {
                            Authorization: "Bearer " + spotify_access_token,
                        },
                        json: true,
                    };

                    request.get(options, function (error, response, body) {
                        if (body.error) {
                            switch (body.error.status) {
                                case 401: {
                                    var authOptions = {
                                        url:
                                            "https://accounts.spotify.com/api/token",
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
                                            refresh_token: spotify_refresh_token,
                                        },
                                        json: true,
                                    };

                                    request.post(
                                        authOptions,
                                        (_error, _response, _body) => {
                                            if (
                                                !_error &&
                                                _response.statusCode === 200
                                            ) {
                                                firebase
                                                    .database()
                                                    .ref(loc)
                                                    .update({
                                                        spotify_access_token:
                                                            _body.access_token,
                                                    });

                                                options.headers = {
                                                    Authorization:
                                                        "Bearer " +
                                                        _body.access_token,
                                                };

                                                request.get(options, function (
                                                    __error,
                                                    __response,
                                                    __body
                                                ) {
                                                    var song = __body.item.name;
                                                    var artists = __body.item.artists
                                                        .map((e) => e.name)
                                                        .join(", ");
                                                    message.channel.send(
                                                        `> ${song} - ${artists}`
                                                    );
                                                });
                                            }
                                        }
                                    );
                                    break;
                                }
                                default:
                                    console.log(body.error);
                                    break;
                            }
                            return;
                        }
                        var song = body.item.name;
                        var artists = body.item.artists
                            .map((e) => e.name)
                            .join(", ");
                        message.channel.send(`> ${song} - ${artists}`);
                    });
                }
            });
    },
};
