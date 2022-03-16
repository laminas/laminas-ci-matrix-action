import core from '@actions/core';
import { Command } from './command.js';
import { CURRENT_STABLE } from './config.js';
import { Job } from './job.js';

/**
 * @param {Object} checkConfig
 * @return {Boolean}
 */
const validateCheck = function (checkConfig) {
    if (typeof checkConfig !== 'object' || checkConfig === null) {
        // NOT AN OBJECT!
        core.warning(`Skipping additional check; not an object, or is null: ${JSON.stringify(checkConfig)}`);

        return false;
    }

    if (checkConfig.name === undefined || checkConfig.job === undefined) {
        // Missing one or more required elements
        core.warning(`Skipping additional check due to missing name or job keys: ${JSON.stringify(checkConfig)}`);

        return false;
    }

    if (typeof checkConfig.job !== 'object' || checkConfig.job === null) {
        // Job is malformed
        core.warning(`Invalid job provided for check; not an object, or is null: ${JSON.stringify(checkConfig.job)}`);

        return false;
    }

    if (checkConfig.job.command === undefined) {
        // Job is missing a command
        core.warning(`Invalid job provided for check; missing command property: ${JSON.stringify(checkConfig.job)}`);

        return false;
    }

    return true;
};

/**
 * @param {Object} job
 * @param {Config} config
 * @return {(Array|Boolean)} Array of PHP versions to run against, or boolean false if malformed
 */
const discoverPhpVersionsForCheck = function (job, config) {
    if (job.php === undefined) {
        return [ CURRENT_STABLE ];
    }

    if (job.php === '*') {
        return config.versions;
    }

    if (typeof job.php === 'string') {
        if (job.php === '@lowest') {
            return [ config.minimumVersion ];
        }

        if (job.php === '@latest') {
            return [ config.latestVersion ];
        }

        return [ job.php ];
    }

    core.warning(`Invalid PHP version specified for check job; must be a string version or '*': ${JSON.stringify(job)}`);

    return false;
};

/**
 * @param {Object} job
 * @param {Config} config
 * @return {Array}
 */
const discoverExtensionsForCheck = function (job, config) {
    if (job.extensions !== undefined && Array.isArray(job.extensions)) {
        return job.extensions;
    }

    return config.extensions;
};

/**
 * @param {Object} job
 * @param {Config} config
 * @return {Array}
 */
const discoverIniSettingsForCheck = function (job, config) {
    if (job.ini !== undefined && Array.isArray(job.ini)) {
        return job.ini;
    }

    return config.phpIni;
};

/**
 * @param {Object} job
 * @param {Config} config
 * @return {(Array|Boolean)} Array of dependency sets to run against, or boolean false if malformed
 */
const discoverDependencySetsForCheck = function (job, config) {
    if (job.dependencies === undefined) {
        return [ 'locked' ];
    }

    if (job.dependencies === '*') {
        return config.dependencies;
    }

    if (typeof job.dependencies === 'string') {
        return [ job.dependencies ];
    }

    core.warning(`Invalid dependencies specified for check job; must be a string version or '*': ${JSON.stringify(job)}`);

    return false;
};

/**
 * @param {Object} job
 * @param {Object} ignorePhpPlatformRequirements
 * @return {Object}
 */
const discoverIgnorePhpPlatformDetailsForCheck = function (job, ignorePhpPlatformRequirements) {
    let ignorePhpPlatformRequirementsForJob = ignorePhpPlatformRequirements;

    if (typeof job.php !== 'string') {
        return ignorePhpPlatformRequirementsForJob;
    }

    if (job.php === '*') {
        ignorePhpPlatformRequirementsForJob = Object.assign(
            ignorePhpPlatformRequirementsForJob,
            job.ignore_php_platform_requirements ?? {}
        );

        return ignorePhpPlatformRequirementsForJob;
    }

    if (job.ignore_php_platform_requirement !== undefined && typeof job.ignore_php_platform_requirement === 'boolean') {
        ignorePhpPlatformRequirementsForJob[job.php] = job.ignore_php_platform_requirement;
    } else if (job.ignore_platform_reqs_8 !== undefined && typeof job.ignore_platform_reqs_8 === 'boolean') {
        core.warning('WARNING: You are using `ignore_platform_reqs_8` in your projects configuration.');
        core.warning('This is deprecated as of v1.9.0 of the matrix action and will be removed in future versions.');
        core.warning('Please use `ignore_php_platform_requirement` or `ignore_php_platform_requirements` in your additional check configuration instead.');

        ignorePhpPlatformRequirementsForJob['8.0'] = job.ignore_platform_reqs_8;
    }

    return Object.assign(ignorePhpPlatformRequirements, ignorePhpPlatformRequirementsForJob);
};

/**
 * @param {Object} job
 * @param {Array<String>} additionalComposerArguments
 * @return {Array<String>}
 */
const discoverAdditionalComposerArgumentsForCheck = function (job, additionalComposerArguments) {
    let unifiedAdditionalComposerArguments = new Set(additionalComposerArguments);

    if (typeof job.additional_composer_arguments !== 'undefined' && Array.isArray(job.additional_composer_arguments)) {
        job.additional_composer_arguments.forEach((argument) => {
            unifiedAdditionalComposerArguments = unifiedAdditionalComposerArguments.add(argument);
        });
    }

    return [ ...unifiedAdditionalComposerArguments ];
};

/**
 * @param {String} name
 * @param {String} command
 * @param {Array} versions
 * @param {Array} dependencies
 * @param {Array} extensions
 * @param {Array} ini
 * @param {Object} ignorePhpPlatformRequirements
 * @param {Array<String>} additionalComposerArguments
 * @return {Array} Array of jobs
 */
const createAdditionalJobList = function (
    name,
    command,
    versions,
    dependencies,
    extensions,
    ini,
    ignorePhpPlatformRequirements,
    additionalComposerArguments
) {
    return versions.reduce((jobs, version) => {
        return [ ...jobs, dependencies.reduce((jobs, deps) => {
            return [ ...jobs, new Job(
                `${name} on PHP ${version} with ${deps} dependencies`,
                JSON.stringify(new Command(
                    command,
                    version,
                    extensions,
                    ini,
                    deps,
                    ignorePhpPlatformRequirements[version] ?? false,
                    additionalComposerArguments
                ))
            ) ];
        }) ];
    }, []);
};

/**
 * @param {Array} checks
 * @param {Config} config
 * @return {Array} Array of jobs
 */
export default function (checks, config) {
    return checks.reduce((jobs, checkConfig) => {
        if (!validateCheck(checkConfig)) {
            return jobs;
        }

        const versions = discoverPhpVersionsForCheck(checkConfig.job, config);

        if (versions === false) {
            return jobs;
        }

        const dependencies = discoverDependencySetsForCheck(checkConfig.job, config);

        if (dependencies === false) {
            return jobs;
        }

        return [ ...jobs, ...createAdditionalJobList(
            checkConfig.name,
            checkConfig.job.command,
            versions,
            dependencies,
            discoverExtensionsForCheck(checkConfig.job, config),
            discoverIniSettingsForCheck(checkConfig.job, config),
            discoverIgnorePhpPlatformDetailsForCheck(checkConfig.job, config.ignorePhpPlatformRequirements),
            discoverAdditionalComposerArgumentsForCheck(checkConfig.job, config.additionalComposerArguments)
        ) ];
    }, []);
}
