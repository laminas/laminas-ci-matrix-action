import { ConfigurationFromFile } from './config/input';
import { Config, gatherChecks, Job } from './config/app';
import { Tool } from './tools';
import {Logger} from './logging';

export interface JobCreator {
    createJobs(config: ConfigurationFromFile, appConfig: Config): [Job, ...Job[]];
}

export class DefaultJobCreator implements JobCreator {
    constructor(
        private readonly tools: Tool[],
        private readonly logger: Logger
    ) {}

    createJobs(config: ConfigurationFromFile, appConfig: Config): [Job, ...Job[]] {
        return gatherChecks(
            config,
            appConfig,
            this.tools,
            this.logger
        );
    }
}
