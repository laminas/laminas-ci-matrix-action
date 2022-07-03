import core from '@actions/core';
import {Action} from '../action';
import {Output} from '../config/output';
import {Logger} from '../logging';

export class Github implements Action {
    publish(variable: string, output: Output): void {
        core.setOutput(variable, JSON.stringify(output));
    }

    markFailed(reason: string): never {
        core.setFailed(reason);
        process.exit(1);
    }

    getLogger(): Logger {
        return {
            debug(message: string): void {
                core.debug(message);
            },

            info(message: string): void {
                core.info(message);
            },

            error(message: string): void {
                core.error(message);
            },

            warning(message: string): void {
                core.warning(message);
            }
        };
    }
}
