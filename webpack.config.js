const path = require("path");
const glob = require("glob");
const nodeExternals = require("webpack-node-externals");
const { NODE_ENV } = process.env;

function getEntries(pattern) {
    const entries = {};
    pattern.forEach((pattern) => {
        glob.sync(pattern).forEach((file) => {
            entries[
                file.replace("src/", "").replace(path.extname(file), "")
            ] = path.join(__dirname, "..", file);
        });
    });
    console.log(entries);
    return entries;
}

module.exports = {
    entry: getEntries(["src/**/*.js", "src/**/*.ts"]),
    mode: NODE_ENV,
    target: "node",
    output: {
        filename: "[name].js",
        path: path.join(process.cwd(), "build"),
    },
    resolve: {
        extensions: [".ts", ".js"],
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: {
                    loader: "ts-loader",
                },
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                },
            },
        ],
    },
    externals: [nodeExternals()],
};
