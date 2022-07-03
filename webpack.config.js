const webpack = require('webpack');

module.exports = {
    entry: './dist/compiled/main.js',
    output: {
        filename: 'main.js'
    },
    target: 'node',
    resolve: {
        extensions: ['.js']
    },
    plugins: [
        new webpack.BannerPlugin({ banner: "#!/usr/bin/env node", raw: true }),
    ]
};
