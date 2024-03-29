const webpack = require('webpack');
const Dotenv = require('dotenv-webpack');


module.exports = function override(config) {
    const fallback = config.resolve.fallback || {};
    Object.assign(fallback, {
        "crypto": require.resolve("crypto-browserify"),
        "stream": require.resolve("stream-browserify"),
        "assert": require.resolve("assert"),
        "http": require.resolve("stream-http"),
        "https": require.resolve("https-browserify"),
        "os": require.resolve("os-browserify"),
        "url": require.resolve("url"),
        "path": require.resolve("path-browserify"),
        "zlib": require.resolve("browserify-zlib"),
        "fs": require.resolve("browserify-fs"),
    })
    config.resolve.fallback = fallback;
    config.plugins = (config.plugins || []).concat([
        new Dotenv({
            systemvars: true,
            allowEmptyValues: true,
        }),
        new webpack.ProvidePlugin({
            process: 'process/browser',
            Buffer: ['buffer', 'Buffer']
        })
    ])
    return config;
}