import core from '@actions/core';
import {Command} from "./command.js";
import {Config, CURRENT_STABLE} from "./config.js";
import {Job} from "./job.js";

/**
 * @param {Object} checkConfig
 * @return {Boolean}
 */
const validateCheck = function (checkConfig) {
    if (checkConfig.job.command === undefined) {
        // Job is missing a command
        core.warning("Invalid job provided for check; missing command property: " + JSON.stringify(checkConfig.job));
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
        return [CURRENT_STABLE];
    }

    if (job.php === '*') {
        return config.versions;
    }

    if (job.php === '@lowest') {
        return [config.minimum_version];
    }

    if (job.php === '@latest') {
        return [config.latest_version];
    }

    return [job.php];
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

    return config.php_ini;
};

/**
 * @param {Object} job
 * @param {Config} config
 * @return {(Array|Boolean)} Array of dependency sets to run against, or boolean false if malformed
 */
const discoverDependencySetsForCheck = function (job, config) {
    if (job.dependencies === undefined) {
        return ['locked'];
    }

    if (job.dependencies === '*') {
        return config.dependencies;
    }

    return [job.dependencies];
};

/**
 * @param {Object} job
 * @param {Object} ignore_php_platform_requirements
 * @return {Object}
 */
const discoverIgnorePhpPlatformDetailsForCheck = function (job, ignore_php_platform_requirements) {
    let ignore_php_platform_requirements_for_job = ignore_php_platform_requirements;

    if (job.php === undefined) {
        return ignore_php_platform_requirements_for_job;
    }

    if (job.php === '*') {
        ignore_php_platform_requirements_for_job = Object.assign(
            ignore_php_platform_requirements_for_job,
            job.ignore_php_platform_requirements ?? {}
        );

        return ignore_php_platform_requirements_for_job;
    }

    if (job.ignore_php_platform_requirement !== undefined) {
        ignore_php_platform_requirements_for_job[job.php] = job.ignore_php_platform_requirement;
    } else if (job.ignore_platform_reqs_8 !== undefined) {
        core.warning('WARNING: You are using `ignore_platform_reqs_8` in your projects configuration.');
        core.warning('This is deprecated as of v1.9.0 of the matrix action and will be removed in future versions.');
        core.warning('Please use `ignore_php_platform_requirement` or `ignore_php_platform_requirements` in your additional check configuration instead.');

        ignore_php_platform_requirements_for_job['8.0'] = job.ignore_platform_reqs_8;
    }

    return Object.assign(ignore_php_platform_requirements, ignore_php_platform_requirements_for_job);
};

/**
 * @param {Object} job
 * @param {Array<String>} additional_composer_arguments
 * @return {Array<String>}
 */
const discoverAdditionalComposerArgumentsForCheck = function (job, additional_composer_arguments) {
    let unified_additional_composer_arguments = new Set(additional_composer_arguments);

    if (job.additional_composer_arguments !== undefined) {
        job.additional_composer_arguments.forEach(
            (argument) => unified_additional_composer_arguments = unified_additional_composer_arguments.add(argument)
        );
    }

    return Array.from(unified_additional_composer_arguments);
};

/**
 * @param {String} name
 * @param {String} command
 * @param {Array} versions
 * @param {Array} dependencies
 * @param {Array} extensions
 * @param {Array} ini
 * @param {Object} ignore_php_platform_requirements
 * @param {Array<String>} additional_composer_arguments
 * @return {Array} Array of jobs
 */
const createAdditionalJobList = function (
    name,
    command,
    versions,
    dependencies,
    extensions,
    ini,
    ignore_php_platform_requirements,
    additional_composer_arguments
) {
    return versions.reduce(function (jobs, version) {
        return jobs.concat(dependencies.reduce(function (jobs, deps) {
            return jobs.concat(new Job(
                name + " on PHP " + version + " with " + deps + " dependencies",
                JSON.stringify(new Command(
                    command,
                    version,
                    extensions,
                    ini,
                    deps,
                    ignore_php_platform_requirements[version] ?? false,
                    additional_composer_arguments
                ))
            ));
        }, []));
    }, []);
};

/**
 * @param {Array} checks
 * @param {Config} config
 * @return {Array} Array of jobs
 */
export default function (checks, config) {
    return checks.reduce(function (jobs, checkConfig) {
        if (! validateCheck(checkConfig)) {
            return jobs;
        }

        let versions = discoverPhpVersionsForCheck(checkConfig.job, config);
        if (versions === false) {
            return jobs;
        }

        let dependencies = discoverDependencySetsForCheck(checkConfig.job, config);
        if (dependencies === false) {
            return jobs;
        }

        return jobs.concat(createAdditionalJobList(
            checkConfig.name,
            checkConfig.job.command,
            versions,
            dependencies,
            discoverExtensionsForCheck(checkConfig.job, config),
            discoverIniSettingsForCheck(checkConfig.job, config),
            discoverIgnorePhpPlatformDetailsForCheck(checkConfig.job, config.ignore_php_platform_requirements),
            discoverAdditionalComposerArgumentsForCheck(checkConfig.job, config.additional_composer_arguments)
        ));
    }, []);
};
