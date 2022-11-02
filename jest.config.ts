// eslint-disable-next-line node/no-unpublished-import
import {Config} from 'jest';

const config: Config = {
    reporters       : [ 'default', 'github-actions' ],
    transform       : {'^.+\\.ts?$': 'ts-jest'},
    testEnvironment : 'node',
    testRegex       : '/src/.*\\.spec\\.ts$',
};

export default config;
