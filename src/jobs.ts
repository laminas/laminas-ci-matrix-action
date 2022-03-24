import { ConfigurationFromFile } from './config/input';
import { Config, gatherChecks, Job } from './config/app';
import { Tool } from './tools';

export interface JobCreator {
    createJobs(config: ConfigurationFromFile, appConfig: Config): [Job, ...Job[]];
}

export class DefaultJobCreator implements JobCreator {
    constructor(
        private readonly tools: Tool[]
    ) {}

    createJobs(config: ConfigurationFromFile, appConfig: Config): [Job, ...Job[]] {
        return gatherChecks(
            config,
            appConfig,
            this.tools
        );
    }
}
