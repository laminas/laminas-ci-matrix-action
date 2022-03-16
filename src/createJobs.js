import fs from 'fs';
import core from '@actions/core';
import { Check } from './check.js';
import { Command } from './command.js';
import { Job } from './job.js';
import createAdditionalJobs from './additionalChecks.js';
import validateAndNormalizeChecks from './validateAndNormalizeChecksFromConfig.js';
import parseJsonFile from './json.js';

/**
 * @param {String} filename
 * @return {Boolean}
 */
const fileTest = function (filename) {
    return function () {
        return fs.existsSync(filename);
    };
};

/**
 * @param {String} command
 * @param {Config} config
 * @return {Array}
 */
const createQaJobs = function (command, config) {
    return [ new Job(
        `${command  } on PHP ${  config.minimumVersion}`,
        JSON.stringify(new Command(
            command,
            config.minimumVersion,
            config.extensions,
            config.phpIni,
            'locked',
            config.ignorePhpPlatformRequirements[config.minimumVersion] ?? false,
            config.additionalComposerArguments
        ))
    ) ];
};

/**
 * @param {Config} config
 * @return {Array}
 */
const createPHPUnitJobs = function (config) {
    const jobs = [];

    if (config.lockedDependencies) {
    /** Locked dependencies are always used with the minimum PHP version supported by the project. */
        jobs.push(createPHPUnitJob(config.minimumVersion, 'locked', config));
    }

    config.versions.forEach(
    /**
         * @param {String} version
         */
        (version) => {
            config.dependencies.forEach(
                /**
                 * @param {String} deps
                 */
                (deps) => {
                    jobs.push(createPHPUnitJob(version, deps, config));
                }
            );
        }
    );

    return jobs;
};

/**
 * @param {String} version
 * @param {String} deps
 * @param {Config} config
 * @return {Job}
 */
const createPHPUnitJob = function (version, deps, config) {
    return new Job(
        `PHPUnit on PHP ${  version  } with ${  deps  } dependencies`,
        JSON.stringify(new Command(
            './vendor/bin/phpunit',
            version,
            config.extensions,
            config.phpIni,
            deps,
            config.ignorePhpPlatformRequirements[version] ?? false,
            config.additionalComposerArguments
        ))
    );
};

/**
 * @param {Config} config
 * @return {Array}
 */
const createNoOpJob = function (config) {
    return [ new Job(
        'No checks',
        JSON.stringify(new Command(
            '',
            config.stableVersion,
            [],
            [],
            'locked',
            config.ignorePhpPlatformRequirements[config.stableVersion] ?? false,
            config.additionalComposerArguments
        ))
    ) ];
};

/**
 * @param {Config} config
 * @return {Array}
 */
function checks(config) {
    return [
        new Check(
            config.codeChecks,
            [ fileTest('phpunit.xml.dist'), fileTest('phpunit.xml') ],
            /**
             * @param {Config} config
             * @return {Array}
             */
            (config) => {
                return createPHPUnitJobs(config);
            }
        ),
        new Check(
            config.codeChecks,
            [ fileTest('phpcs.xml.dist'), fileTest('phpcs.xml') ],
            /**
             * @param {Config} config
             * @return {Array}
             */
            (config) => {
                return createQaJobs('./vendor/bin/phpcs -q --report=checkstyle | cs2pr', config);
            }
        ),
        new Check(
            config.codeChecks,
            [ fileTest('psalm.xml.dist'), fileTest('psalm.xml') ],
            /**
             * @param {Config} config
             * @return {Array}
             */
            (config) => {
                return createQaJobs('./vendor/bin/psalm --shepherd --stats --output-format=github --no-cache', config);
            }
        ),
        new Check(
            config.codeChecks,
            [ fileTest('composer-require-checker.json') ],
            /**
             * @param {Config} config
             * @return {Array}
             */
            (config) => {
                return createQaJobs('./vendor/bin/composer-require-checker check --config-file=composer-require-checker.json -n -v composer.json', config);
            }
        ),
        new Check(
            config.codeChecks,
            [ fileTest('phpbench.json') ],
            /**
             * @param {Config} config
             * @return {Array}
             */
            (config) => {
                return createQaJobs('./vendor/bin/phpbench run --revs=2 --iterations=2 --report=aggregate', config);
            }
        ),
        new Check(
            config.codeChecks,
            [ fileTest('infection.json'), fileTest('infection.json.dist') ],
            /**
             * @param {Config} config
             * @return {Array}
             */
            (config) => {
                const composerFile = parseJsonFile('composer.json', false);

                if (composerFile.hasOwnProperty.call('require-dev') && composerFile['require-dev'].hasOwnProperty.call('roave/infection-static-analysis-plugin')) {
                    return createQaJobs('phpdbg -qrr ./vendor/bin/roave-infection-static-analysis-plugin', config);
                }

                return createQaJobs('phpdbg -qrr ./vendor/bin/infection', config);
            }
        ),
        new Check(
            config.docLinting,
            [ fileTest('mkdocs.yml') ],
            /**
             * @param {Config} config
             * @return {Array}
             */
            (config) => {
                return createQaJobs('yamllint -d relaxed --no-warnings mkdocs.yml', config);
            }
        ),
        new Check(
            config.docLinting,
            [ fileTest('doc/book/') ],
            /**
             * @param {Config} config
             * @return {Array}
             */
            (config) => {
                return createQaJobs('markdownlint doc/book/**/*.md', config);
            }
        ),
        new Check(
            config.docLinting,
            [ fileTest('docs/book/') ],
            /**
             * @param {Config} config
             * @return {Array}
             */
            (config) => {
                return createQaJobs('markdownlint docs/book/**/*.md', config);
            }
        ),
        new Check(
            config.codeChecks,
            [ fileTest('codeception.yml.dist'), fileTest('codeception.yml') ],
            /**
             * @param {Config} config
             * @return {Array}
             */
            (config) => {
                return createQaJobs('./vendor/bin/codecept run', config);
            }
        )
    ];
}

const excludeJob = function (job, exclusion) {
    let matches = 0;

    Object.keys(job).forEach((jobKey) => {
        Object.keys(exclusion).forEach((excludeKey) => {
            if (excludeKey !== jobKey) {
                return;
            }

            if (job[jobKey] === exclusion[excludeKey]) {
                matches += 1;
            }
        });
    });

    return Object.keys(exclusion).length === matches;
};

/**
 * @param {Config} config
 * @return {Array}
 */
export default function (config) {
    if (config.checks.length > 0) {
        core.info('Using checks found in configuration');

        return validateAndNormalizeChecks(config.checks, config);
    }

    /** @var {Array} jobs */
    const jobs = checks(config)
        .reduce((jobs, check) => {
            return [ ...jobs, ...check.jobs(config) ];
        }, [])
        /* eslint-disable-next-line unicorn/prefer-spread */
        .concat(createAdditionalJobs(config.additionalChecks, config))
        .filter((job) => {
            let keep = true;

            config.exclude.forEach((exclusion) => {
                keep = keep && !excludeJob(job, exclusion);
            });

            if (!keep) {
                console.log('Excluding job', job.toJSON());
            }

            return keep;
        });

    return jobs.length > 0 ? jobs : createNoOpJob(config);
}
