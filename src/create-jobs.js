import core from '@actions/core';
import fs from 'fs';
import { Check } from './check.js';
import { Command } from './command.js';
import { Config } from './config.js';
import { Job } from './job.js';

/**
 * @param {String} filename
 * @return {Boolean}
 */
const fileTest = function (filename) {
    return function () {
        if (fs.existsSync(filename)) {
            return true;
        }
        return false;
    };
};

/**
 * @param {String} command
 * @param {Config} config
 * @return {Array}
 */
const createQaJobs = function (command, config) {
    return [new Job(
        command + ' on PHP ' + config.stable_version,
        JSON.stringify(new Command(
            command,
            config.stable_version,
            config.extensions,
            config.php_ini,
            'locked'
        ))
    )];
};

/**
 * @param {String} version
 * @param {String} deps
 * @param {Config} config
 * @return {Job}
 */
const createPHPUnitJob = function (version, deps, config) {
    return new Job(
        'PHPUnit on PHP ' + version + ' with ' + deps + ' dependencies',
        JSON.stringify(new Command(
            './vendor/bin/phpunit',
            version,
            config.extensions,
            config.php_ini,
            deps,
        )),
    );
};

/**
 * @param {Config} config
 * @return {Array}
 */
const createNoOpJob = function (config) {
    return [new Job(
        'No checks',
        JSON.stringify(new Command(
            "echo 'No checks discovered'",
            config.stable_version,
            [],
            [],
            'locked',
        )),
    )];
};

/**
 * @param {Config} config
 * @return {Array}
 */
function checks (config) {
    return [
        new Check(
            config.code_checks,
            [fileTest('phpunit.xml.dist'), fileTest('phpunit.xml')],
            /**
             * @param {Config} config
             * @return {Array}
             */
            function (config) {
                let jobs = [];
                config.versions.forEach(
                    /**
                     * @param {String} version
                     */
                    function (version) {
                        config.dependencies.forEach(
                            /**
                             * @param {String} deps
                             */
                            function (deps) {
                                jobs.push(createPHPUnitJob(version, deps, config));
                            }
                        );
                    }
                );
                return jobs;
            }
        ),
        new Check(
            config.code_checks,
            [fileTest('phpcs.xml.dist'), fileTest('phpcs.xml')],
            /**
             * @param {Config} config
             * @return {Array}
             */
            function (config) {
                return createQaJobs('./vendor/bin/phpcs -q --report=checkstyle | cs2pr', config);
            }
        ),
        new Check(
            config.code_checks,
            [fileTest('psalm.xml.dist'), fileTest('psalm.xml')],
            /**
             * @param {Config} config
             * @return {Array}
             */
            function (config) {
                return createQaJobs('./vendor/bin/psalm --shepherd --stats --output-format=github', config);
            }
        ),
        new Check(
            config.code_checks,
            [fileTest('phpbench.json')],
            /**
             * @param {Config} config
             * @return {Array}
             */
            function (config) {
                return createQaJobs('./vendor/bin/phpbench run --revs=2 --iterations=2 --report=aggregate', config);
            }
        ),
        new Check(
            config.doc_linting,
            [fileTest('mkdocs.yml')],
            /**
             * @param {Config} config
             * @return {Array}
             */
            function (config) {
                return createQaJobs('yamllint -d relaxed --no-warnings mkdocs.yml', config);
            }
        ),
        new Check(
            config.doc_linting,
            [fileTest('doc/book/')],
            /**
             * @param {Config} config
             * @return {Array}
             */
            function (config) {
                return createQaJobs('markdownlint doc/book/**/*.md', config);
            }
        ),
        new Check(
            config.doc_linting,
            [fileTest('docs/book/')],
            /**
             * @param {Config} config
             * @return {Array}
             */
            function (config) {
                return createQaJobs('markdownlint docs/book/**/*.md', config);
            }
        ),
    ];
}

/**
 * @param {Config} config
 * @return {Array}
 */
export default function (config) {
    if (config.checks.length) {
        core.info('Using checks found in configuration');
        return config.checks;
    }

    /** @var {Array} jobs */
    let jobs = checks(config).reduce(function (jobs, check) {
        return jobs.concat(check.jobs(config));
    }, []);

    const exclude = function (job, exclusion) {
        let matches = 0;
        Object.keys(job).forEach(function (jobKey) {
            Object.keys(exclusion).forEach(function (excludeKey) {
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

    jobs = jobs.filter(
        function (job) {
            let keep = true;
            config.exclude.forEach(function (exclusion) {
                keep = keep && ! exclude(job, exclusion);
            });

            if (! keep) {
                console.log('Excluding job', job.toJSON());
            }

            return keep;
        }
    );

    return jobs.length ? jobs : createNoOpJob(config);
};
