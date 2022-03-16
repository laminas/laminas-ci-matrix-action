import core from '@actions/core';
import { Validator } from '@cfworker/json-schema';
import parseJsonFile from './json.js';

/**
 * @param {String} pathToJsonToValidate
 * @param {String} pathToSchemaJsonForValidation
 */
export default function (pathToJsonToValidate, pathToSchemaJsonForValidation) {
    core.info(`Running ${pathToJsonToValidate} linting using ${pathToSchemaJsonForValidation}.`);

    const jsonSchema = parseJsonFile(pathToSchemaJsonForValidation, false);

    core.debug(`JSON schema: ${  JSON.stringify(jsonSchema)}`);
    const jsonSchemaValidator = new Validator(jsonSchema);
    const validationResult = jsonSchemaValidator.validate(parseJsonFile(pathToJsonToValidate, false));

    if (validationResult.valid) {
        core.info(`${pathToJsonToValidate} schema validation passed.`);

        return;
    }

    validationResult.errors.forEach((outputUnit) => {
        core.error(`There is an error in the keyword located by ${outputUnit.keywordLocation}: ${outputUnit.error}`);
    });

    core.setFailed(`${pathToJsonToValidate} schema validation failed.`);
    process.exit(1);
}
