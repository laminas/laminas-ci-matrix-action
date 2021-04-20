import core from '@actions/core';
import process from 'process';
import checkRequirements from './src/check-requirements.js';
import configGatherer from './src/config.js';
import createJobs from './src/create-jobs.js';

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
core.info(`Using php extensions: ${JSON.stringify(config.extensions)}`);
core.info(`Providing php.ini settings: ${JSON.stringify(config.php_ini)}`);
core.info(`Dependency sets found: ${JSON.stringify(config.dependencies)}`);
core.info(`Additional checks found: ${JSON.stringify(config.additional_checks)}`);
core.info(`Ignore platform reqs on version 8: ${config.ignore_platform_reqs_8 ? "Yes" : "No"}`);

let matrix = {include: createJobs(config)};

core.info(`Matrix: ${JSON.stringify(matrix)}`);
core.setOutput('matrix', JSON.stringify(matrix));
