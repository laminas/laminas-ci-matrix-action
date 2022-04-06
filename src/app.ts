import fs, { PathLike } from 'fs';
import { ValidationResult, Validator } from '@cfworker/json-schema';
import parseJsonFile, { SPACES_TO_INDENT_JSON } from './json';
import createConfig, { Config, Job, Requirements } from './config/app';
import { createJobForMatrixFromJob, JobForMatrix } from './config/output';
import { ConfigurationFromFile } from './config/input';
import createTools from './tools';
import { Action } from './action';
import { DefaultJobCreator } from './jobs';

export class App {
    private readonly composerJsonFileName: PathLike = 'composer.json';

    private readonly composerLockJsonFileName: PathLike = 'composer.lock';

    private readonly continousIntegrationConfigurationJsonFileName: PathLike = '.laminas-ci.json';

    public constructor(
        private readonly action: Action
    ) {}

    public sanityChecksPassing(): boolean {
        let schemaValidationResult = this.projectContainsValidJsonConfiguration(
            'composer.json.schema',
            this.composerJsonFileName
        );

        if (!schemaValidationResult.valid) {
            return this.failWithLoggedJsonSchemaValidationErrors(this.composerJsonFileName, schemaValidationResult);
        }

        schemaValidationResult = this.projectContainsValidJsonConfiguration(
            'laminas-ci.schema.json',
            this.continousIntegrationConfigurationJsonFileName
        );

        if (!schemaValidationResult.valid) {
            return this.failWithLoggedJsonSchemaValidationErrors(
                this.continousIntegrationConfigurationJsonFileName,
                schemaValidationResult
            );
        }

        return true;
    }

    private validateJsonSchema(
        pathToJsonToValidate: PathLike,
        pathToSchemaJsonForValidation: PathLike
    ): ValidationResult {
        this.action.debug(`Running ${pathToJsonToValidate} linting using ${pathToSchemaJsonForValidation}.`);

        const jsonSchema = parseJsonFile(pathToSchemaJsonForValidation, false);
        const jsonSchemaValidator = new Validator(jsonSchema);
        const validationResult = jsonSchemaValidator.validate(parseJsonFile(pathToJsonToValidate, false));

        if (validationResult.valid) {
            this.action.debug(`${pathToJsonToValidate} schema validation passed.`);
        }

        return validationResult;
    }

    createJobs(
        appConfig: Config
    ): [JobForMatrix, ...JobForMatrix[]] {
        const config = parseJsonFile(this.continousIntegrationConfigurationJsonFileName, true) as ConfigurationFromFile;
        const tools = createTools(appConfig);

        this.action.debug(`Tools detected: ${JSON.stringify(tools, null, SPACES_TO_INDENT_JSON)}`);
        const jobs: [Job, ...Job[]] = (new DefaultJobCreator(tools))
            .createJobs(config, appConfig);

        this.action.debug(`Jobs created: ${JSON.stringify(jobs, null, SPACES_TO_INDENT_JSON)}`);

        return jobs.map((job) => createJobForMatrixFromJob(job)) as [JobForMatrix, ...JobForMatrix[]];
    }

    createConfiguration(filesFromDiff: string[]): Config {
        return createConfig(
            this.checkRequirements(filesFromDiff),
            this.composerJsonFileName,
            this.composerLockJsonFileName,
            this.continousIntegrationConfigurationJsonFileName
        );
    }

    private projectContainsValidJsonConfiguration(schemaName: PathLike, fileName: PathLike): ValidationResult {
        const schemaPath = `${this.action.getApplicationDirectory()}/${schemaName}`;

        if (!fs.existsSync(schemaPath) || !fs.existsSync(fileName)) {
            return { valid: true, errors: [] };
        }

        return this.validateJsonSchema(fileName, schemaPath);
    }

    private failWithLoggedJsonSchemaValidationErrors(
        filePath: PathLike,
        schemaValidationResult: ValidationResult
    ): boolean {
        this.action.markFailed(`${filePath} schema validation failed.`);

        schemaValidationResult.errors.forEach((outputUnit) => {
            this.action.error(`There is an error in the keyword located by ${outputUnit.keywordLocation}: ${outputUnit.error}`);
        });

        return false;
    }

    private checkRequirements(diff: string[]): Requirements {
        const CODE_CHECKS_ENABLED_MESSAGE = '- Enabling code checks';

        if (diff.length === 0) {
            return {
                codeChecks : true,
                docLinting : true
            };
        }

        if (diff.includes('.laminas-ci.json')) {
            this.action.info('Performing all checks as CI configuration has changed.');

            return {
                codeChecks : true,
                docLinting : true
            };
        }

        this.action.info('Performing selective checks based on pull request patch diff');
        let requireCodeChecks = false;
        let requireDocLinting = false;

        const codeCheckRegularExpressions: RegExp[] = [
            /\.php$/,
            /(phpunit|phpcs|psalm)\.xml(\.dist)?$/,
            /composer\.(json|lock)$/,
            /composer-require-checker\.json$/,
            /(^|[/\\])(\.github|src|lib|tests?|config|bin|\.laminas-ci)[/\\]/
        ];

        const docLintingRegularExpressions: RegExp[] = [
            /(^mkdocs.yml|docs?\/book\/.*\.md$)/
        ];

        diff.forEach(
            (filename) => {
                if (requireCodeChecks && requireDocLinting) {
                    return;
                }

                if (codeCheckRegularExpressions.some((expression) => expression.test(filename))) {
                    requireCodeChecks = true;
                }

                if (docLintingRegularExpressions.some((expression) => expression.test(filename))) {
                    requireDocLinting = true;
                }
            }
        );

        if (requireCodeChecks) {
            this.action.info(CODE_CHECKS_ENABLED_MESSAGE);
        }

        if (requireDocLinting) {
            this.action.info('- Enabling doc linting');
        }

        return {
            codeChecks : requireCodeChecks,
            docLinting : requireDocLinting
        };
    }
}
