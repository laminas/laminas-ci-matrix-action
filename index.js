import fs from 'fs';
import core from '@actions/core';
import checkRequirements from './src/checkRequirements.js';
import createConfiguration from './src/config.js';
import createJobs from './src/createJobs.js';
import validateJsonSchema from './src/jsonSchemaValidation.js';

/**
 * Do early json schema validation to avoid unnecessary ramp-ups of jobs
 */
const composerJsonSchemaPath = '/action/composer.schema.json';

const composerJsonPath = 'composer.json';

if (fs.existsSync(composerJsonPath) && fs.existsSync(composerJsonSchemaPath)) {
    validateJsonSchema(composerJsonPath, composerJsonSchemaPath);
}

const continuousIntegrationConfigurationSchemaPath = '/action/laminas-ci.schema.json';

const continuousIntegrationConfigurationJsonPath = '.laminas-ci.json';

if (
    fs.existsSync(continuousIntegrationConfigurationJsonPath)
    && fs.existsSync(continuousIntegrationConfigurationSchemaPath)
) {
    validateJsonSchema(continuousIntegrationConfigurationJsonPath, continuousIntegrationConfigurationSchemaPath);
}

/* eslint-disable-next-line no-magic-numbers */
const requirements = checkRequirements(process.argv.slice(2));
const config = createConfiguration(
    requirements,
    continuousIntegrationConfigurationJsonPath,
    composerJsonPath,
    'composer.lock'
);

core.info(`Running code checks: ${config.codeChecks ? 'Yes' : 'No'}`);
core.info(`Running doc linting: ${config.docLinting ? 'Yes' : 'No'}`);
core.info(`Versions found: ${JSON.stringify(config.versions)}`);
core.info(`Using stable PHP version: ${config.stableVersion}`);
core.info(`Using minimum PHP version: ${config.minimumVersion}`);
core.info(`Using php extensions: ${JSON.stringify(config.extensions)}`);
core.info(`Providing php.ini settings: ${JSON.stringify(config.phpIni)}`);
core.info(`Additional checks found: ${JSON.stringify(config.additionalChecks)}`);
for (
    const [ IGNORE_PLATFORM_REQS_PHP_VERSION, IGNORE_PLATFORM_REQS ]
    of Object.entries(config.ignorePhpPlatformRequirements)
) {
    core.info(`Ignoring php platform requirement for PHP ${IGNORE_PLATFORM_REQS_PHP_VERSION}: ${IGNORE_PLATFORM_REQS ? 'Yes' : 'No'}`);
}

const matrix = { include: createJobs(config) };

core.info(`Matrix: ${JSON.stringify(matrix)}`);
core.setOutput('matrix', JSON.stringify(matrix));
