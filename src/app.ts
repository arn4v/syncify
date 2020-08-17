import * as authUiRouter from "./auth_ui/router";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "@feathersjs/express";
import path from "path";

dotenv.config();
const PORT = process.env.PORT || 8888;
const app = express();

app.use(express.static(path.join(path.resolve(__dirname), "../public")));
app.use(cors());
app.use(cookieParser());
app.use(authUiRouter.default);

app.listen(PORT, () => {
    console.log(`Listening at port ${PORT}`);
});
