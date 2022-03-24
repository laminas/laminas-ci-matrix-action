import { PathLike } from 'fs';
import { Logger } from './logging';
import { Output } from './config/output';

export interface Action extends Logger {
    publish(variable: string, output: Output): void;
    markFailed(reason: string): void;
    getApplicationDirectory(): PathLike;
}
