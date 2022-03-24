import {PathLike} from "fs";
import {Action} from "../action";
import {Output} from "../config/output";

export class Local implements Action {
    debug(message: string): void {
        console.debug(`debug: ${message}`);
    }

    info(message: string): void {
        console.info(`info: ${message}`);
    }

    error(message: string): void {
        console.error(`error: ${message}`)
    }

    publish(variable: string, output: Output): void {
        console.log(`publish [${variable}]: ${JSON.stringify(output, null, 2)}`);
    }

    markFailed(reason: string): void {
        console.error(`failed: ${reason}`);
    }

    getApplicationDirectory(): PathLike {
        return '.';
    }
}
