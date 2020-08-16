import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "@feathersjs/express";
import router from "./router";

dotenv.config();
const PORT = process.env.PORT || 8888;
const app = express();

app.use(express.static(__dirname + "/public"));
app.use(cors());
app.use(cookieParser());

app.use(router);

app.listen(PORT, () => {
    console.log(`Listening at port ${PORT}`);
});
