export const PORT: string =
    typeof process.env.PORT != "undefined"
        ? // @ts-ignore
          (process.env.PORT as string)
        : "8888";
export const SERVER_URL: string =
    process.env["SYNCIFY_SERVER_BASE_URL"] != undefined
        ? process.env["SYNCIFY_SERVER_BASE_URL"] + "/auth"
        : "http://localhost:" + PORT + "/auth";
