// eslint-disable-next-line node/no-unpublished-import
import {Configuration, BannerPlugin} from 'webpack';

const config: Configuration = {
    entry   : './dist/compiled/main.js',
    output  : {filename: 'main.js'},
    target  : 'node',
    resolve : {extensions: [ '.js' ]},
    plugins : [ new BannerPlugin({ banner: '#!/usr/bin/env node', raw: true }) ]
};

export default config;
