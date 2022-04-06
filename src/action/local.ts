import {PathLike} from 'fs';
import {Action} from '../action';
import {Output} from '../config/output';
import {SPACES_TO_INDENT_JSON} from '../json';
import { Logger } from '../logging';

export class Local implements Action {
    publish(variable: string, output: Output): void {
        console.log(`publish [${variable}]: ${JSON.stringify(output, null, SPACES_TO_INDENT_JSON)}`);
    }

    markFailed(reason: string): void {
        console.error(`failed: ${reason}`);
    }

    getApplicationDirectory(): PathLike {
        return '.';
    }

    getLogger(): Logger {
        return {
            debug(message: string): void {
                console.debug(`debug: ${message}`);
            },

            info(message: string): void {
                console.info(`info: ${message}`);
            },

            error(message: string): void {
                console.error(`error: ${message}`);
            },
        };
    }
}
