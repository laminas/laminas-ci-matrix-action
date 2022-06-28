import {PathLike} from 'fs';
import {Action} from '../action';
import {Output} from '../config/output';
import { Logger } from '../logging';
import {SPACES_TO_INDENT_JSON} from '../json';

export class Local implements Action {
    publish(variable: string, output: Output): void {
        console.log(`::set-output name=${variable}::${JSON.stringify(output)}`);
        console.log(`publish [${variable}]: ${JSON.stringify(output, null, SPACES_TO_INDENT_JSON)}`);
    }

    markFailed(reason: string): never {
        console.error(`failed: ${reason}`);
        process.exit(1);
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
