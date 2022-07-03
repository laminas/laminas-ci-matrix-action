import {PathLike} from 'fs';
import { Logger } from './logging';
import { Output } from './config/output';

export const APPLICATION_IN_DOCKER_DIRECTORY: PathLike = '/action';

export interface Action {
    publish(variable: string, output: Output): void;
    markFailed(reason: string): never;
    getLogger(): Logger;
}
