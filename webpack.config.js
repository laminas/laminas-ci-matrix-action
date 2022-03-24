const nodeExternals = require('webpack-node-externals');

module.exports = {
    entry: './dist/compiled/main.js',
    output: {
        filename: 'main.js'
    },
    target: 'node',
    resolve: {
        extensions: ['.js']
    }
};
