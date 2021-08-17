import core from '@actions/core';
import fs from "fs";
import process from 'process';
import checkRequirements from './src/check-requirements.js';
import configGatherer from './src/config.js';
import createJobs from './src/create-jobs.js';
import {Validator} from "@cfworker/json-schema";

/**
 * Do early composer.json schema validation to avoid unnecessary ramp-ups of jobs which may fail
 * due to an incompatible composer.json.
 */
if (fs.existsSync('composer.json') && fs.existsSync('/action/composer.schema.json')) {
    core.info(`Running composer.json linting.`);
    const composerJsonContents = fs.readFileSync('composer.json');
    const composerJsonSchemaString = fs.readFileSync('/action/composer.schema.json');
    const composerJsonSchema = JSON.parse(composerJsonSchemaString);
    const jsonSchemaValidator = new Validator(composerJsonSchema);
    const validationResult = jsonSchemaValidator.validate(JSON.parse(composerJsonContents));

    if (!validationResult.valid) {
        validationResult.errors.forEach(function (outputUnit) {
           core.error("There is an error in the keyword located by {0}: {1}".format(
               outputUnit.keywordLocation,
               outputUnit.error
           ));
        });
        core.setFailed('composer.json schema validation failed');
        process.exit(1);
    }
    core.info(`composer.json schema validation passed.`);
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
core.info(`Dependency sets found: ${JSON.stringify(config.dependencies)}`);
core.info(`Additional checks found: ${JSON.stringify(config.additional_checks)}`);
core.info(`Ignore platform reqs on version 8: ${config.ignore_platform_reqs_8 ? "Yes" : "No"}`);

let matrix = {include: createJobs(config)};

core.info(`Matrix: ${JSON.stringify(matrix)}`);
core.setOutput('matrix', JSON.stringify(matrix));
