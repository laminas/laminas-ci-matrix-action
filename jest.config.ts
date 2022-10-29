// eslint-disable-next-line node/no-unpublished-import
import {Config} from 'jest';

const config: Config = {
    verbose         : true,
    transform       : {'^.+\\.ts?$': 'ts-jest'},
    testEnvironment : 'node',
    testRegex       : '/src/.*\\.spec\\.ts$',
};

export default config;
