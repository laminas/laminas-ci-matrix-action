import core from "@actions/core";
import process from "process";
import {Validator} from "@cfworker/json-schema";

/**
 * @param {String} pathToJsonToValidate
 * @param {String} pathToSchemaJsonForValidation
 */
export default function (pathToJsonToValidate, pathToSchemaJsonForValidation) {
    core.info(`Running ${pathToJsonToValidate} linting using ${pathToSchemaJsonForValidation}.`);

    const jsonSchema = JSON.parse(fs.readFileSync(pathToSchemaJsonForValidation));
    const jsonSchemaValidator = new Validator(jsonSchema);
    const validationResult = jsonSchemaValidator.validate(JSON.parse(fs.readFileSync(pathToJsonToValidate)));

    if (validationResult.valid) {
        core.info(`${pathToJsonToValidate} schema validation passed.`);
        return;
    }

    validationResult.errors.forEach(function (outputUnit) {
        core.error(`There is an error in the keyword located by ${outputUnit.keywordLocation}: ${outputUnit.error}`);
    });

    core.setFailed(`${pathToJsonToValidate} schema validation failed.`);
    process.exit(1);
}
