import core from "@actions/core";
import fs from "fs";
import checkRequirements from "./src/check-requirements.js";
import configGatherer from "./src/config.js";
import createJobs from "./src/create-jobs.js";
import validateJsonSchema from "./src/json-schema-validation.js";

/**
 * Do early json schema validation to avoid unnecessary ramp-ups of jobs
 */
if (fs.existsSync('composer.json') && fs.existsSync('/action/composer.schema.json')) {
    validateJsonSchema('composer.json', '/action/composer.schema.json');
}
if (fs.existsSync('.laminas-ci.json') && fs.existsSync('/action/laminas-ci.schema.json')) {
    validateJsonSchema('.laminas-ci.json', '/action/laminas-ci.schema.json');
}

const requirements = checkRequirements(process.argv.slice(2));
const config       = configGatherer(
    requirements,
    '.laminas-ci.json',
    'composer.json',
    'composer.lock',
);

core.info(`Running code checks: ${config.code_checks ? "Yes" : "No"}`);
core.info(`Running doc linting: ${config.doc_linting ? "Yes" : "No"}`);
core.info(`Versions found: ${JSON.stringify(config.versions)}`);
core.info(`Using stable PHP version: ${config.stable_version}`);
core.info(`Using minimum PHP version: ${config.minimum_version}`);
core.info(`Using php extensions: ${JSON.stringify(config.extensions)}`);
core.info(`Providing php.ini settings: ${JSON.stringify(config.php_ini)}`);
core.info(`Additional checks found: ${JSON.stringify(config.additional_checks)}`);
for (const [IGNORE_PLATFORM_REQS_PHP_VERSION, IGNORE_PLATFORM_REQS] of Object.entries(config.ignore_php_platform_requirements)) {
    core.info(`Ignoring php platform requirement for PHP ${IGNORE_PLATFORM_REQS_PHP_VERSION}: ${IGNORE_PLATFORM_REQS ? "Yes" : "No"}`);
}
core.info(`Strict exclusion policy: ${JSON.stringify(config.exclude_strict_matching)}`);

let matrix = {include: createJobs(config)};

core.info(`Matrix: ${JSON.stringify(matrix)}`);
core.setOutput('matrix', JSON.stringify(matrix));
