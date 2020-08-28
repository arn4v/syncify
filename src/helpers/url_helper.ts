export const PORT: string = process.env.PORT ?? "8888";

export const SERVER_URL: string =
    process.env["SYNCIFY_SERVER_BASE_URL"] != undefined
        ? process.env["SYNCIFY_SERVER_BASE_URL"] + "/auth"
        : "http://localhost:" + PORT + "/auth";
