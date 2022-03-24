import { App } from './app';
import { Action } from './action';
import { Local } from './action/local';
import { Github } from './action/github';
import { SPACES_TO_INDENT_JSON } from './json';

let action: Action = new Local();

if (process.env.GITHUB_ACTION !== undefined) {
    action = new Github();
}

const app = new App(action);

if (!app.sanityChecksPassing()) {
    process.exit(1);
}

/* eslint-disable-next-line no-magic-numbers */
const FIRST_TWO_ARGUMENTS = 2;
const config = app.createConfiguration(process.argv.slice(FIRST_TWO_ARGUMENTS));

action.debug(`Generated configuration: ${JSON.stringify(config, null, SPACES_TO_INDENT_JSON)}`);
const checks = app.createJobs(config);

action.info(`Running code checks: ${config.codeChecks ? 'Yes' : 'No'}`);
action.info(`Running doc linting: ${config.docLinting ? 'Yes' : 'No'}`);
action.info(`Versions found: ${JSON.stringify(config.versions)}`);
action.info(`Using stable PHP version: ${config.stablePhpVersion}`);
action.info(`Using minimum PHP version: ${config.minimumPhpVersion}`);
action.info(`Using php extensions: ${JSON.stringify(config.phpExtensions)}`);
action.info(`Providing php.ini settings: ${JSON.stringify(config.phpIni)}`);
action.info(`Additional composer arguments: ${JSON.stringify(config.additionalComposerArguments)}`);

for (
    const [ IGNORE_PLATFORM_REQS_PHP_VERSION, IGNORE_PLATFORM_REQS ]
    of Object.entries(config.ignorePhpPlatformRequirements)
) {
    action.info(`Ignoring php platform requirement for PHP ${IGNORE_PLATFORM_REQS_PHP_VERSION}: ${IGNORE_PLATFORM_REQS ? 'Yes' : 'No'}`);
}

action.info(`Matrix: ${JSON.stringify(checks, null, SPACES_TO_INDENT_JSON)}`);
action.publish('matrix', ({
    include : checks.map((job) => ({
        name            : job.name,
        operatingSystem : job.operatingSystem,
        action          : job.action,
        job             : JSON.stringify(job.job)
    }))
}));
