const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

module.exports = {

    mode: "development",
    entry: "./src/index.ts",

    devtool: 'inline-source-map',

    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "[name].js",
        publicPath: "/",
        clean: true,
    },

    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            },
        ],
    },

    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },

    plugins: [
        new HtmlWebpackPlugin({
            title: 'thermodynamics-simulator',
        })
    ]

}