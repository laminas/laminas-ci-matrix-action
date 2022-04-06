import {PathLike} from 'fs';
import core from '@actions/core';
import {Action} from '../action';
import {Output} from '../config/output';

export class Github implements Action {
    debug(message: string): void {
        core.debug(message);
    }

    info(message: string): void {
        core.info(message);
    }

    error(message: string): void {
        core.error(message);
    }

    publish(variable: string, output: Output): void {
        core.setOutput(variable, JSON.stringify(output));
    }

    markFailed(reason: string): void {
        core.setFailed(reason);
    }

    getApplicationDirectory(): PathLike {
        return '/action';
    }
}
