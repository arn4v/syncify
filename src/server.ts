import * as authUiRouter from "./auth_ui/router";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "@feathersjs/express";
import path from "path";

export function startServer() {
    const PORT = process.env.PORT || 8888;
    const app = express();

    app.use(express.static(path.join(path.resolve(__dirname), "../public")));
    app.use(cors());
    app.use(cookieParser());
    app.use(authUiRouter.default);

    app.listen(PORT, () => {
        console.log(`LOG: Express server running at at port ${PORT}`);
    });
}
