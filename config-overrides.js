const webpack = require("webpack");

module.exports = function override(config, env) {
    config.resolve.fallback = {
        ...config.resolve.fallback,
        stream: require.resolve("stream-browserify"),
        buffer: require.resolve("buffer"),
        'process/browser': require.resolve('process/browser'), // 14:50 수정. mx 스튜디오에서 three js 랑 충돌나서 추가했습니다
    };
    config.resolve.extensions = [...config.resolve.extensions, ".ts", ".js"];
    config.plugins = [
        ...config.plugins,
        new webpack.ProvidePlugin({
            process: "process/browser",
            Buffer: ["buffer", "Buffer"],
        }),
    ];

    return config;
};