import core from '@actions/core';
import {Command} from "./command.js";
import {Config, CURRENT_STABLE} from "./config.js";
import {Job} from "./job.js";

/**
 * @param {Object} checkConfig
 * @return {Boolean}
 */
const validateCheck = function (checkConfig) {
    if (typeof checkConfig !== 'object' || checkConfig === null) {
        // NOT AN OBJECT!
        core.warning("Skipping additional check; not an object, or is null: " + JSON.stringify(checkConfig));
        return false;
    }

    if (checkConfig.name === undefined || checkConfig.job === undefined) {
        // Missing one or more required elements
        core.warning("Skipping additional check due to missing name or job keys: " + JSON.stringify(checkConfig));
        return false;
    }

    if (typeof checkConfig.job !== 'object' || checkConfig.job === null) {
        // Job is malformed
        core.warning("Invalid job provided for check; not an object, or is null: " + JSON.stringify(checkConfig.job));
        return false;
    }

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

    if (typeof job.php === 'string') {
        if (job.php === '@lowest') {
            return [config.minimum_version];
        }

        if (job.php === '@latest') {
            return [config.latest_version];
        }

        return [job.php];
    }

    core.warning("Invalid PHP version specified for check job; must be a string version or '*': " + JSON.stringify(job));
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

    if (typeof job.dependencies === 'string') {
        return [job.dependencies];
    }

    core.warning("Invalid dependencies specified for check job; must be a string version or '*': " + JSON.stringify(job));
    return false;
};

/**
 * @param {Object} job
 * @param {Object} ignore_php_platform_requirements
 * @return {Object}
 */
const discoverIgnorePhpPlatformDetailsForCheck = function (job, ignore_php_platform_requirements) {
    let ignore_php_platform_requirements_for_job = ignore_php_platform_requirements;

    if (typeof job.php !== 'string') {
        return ignore_php_platform_requirements_for_job;
    }

    if (job.php === '*') {
        ignore_php_platform_requirements_for_job = Object.assign(
            ignore_php_platform_requirements_for_job,
            job.ignore_php_platform_requirements ?? {}
        );

        return ignore_php_platform_requirements_for_job;
    }

    if (job.ignore_php_platform_requirement !== undefined && typeof job.ignore_php_platform_requirement === 'boolean') {
        ignore_php_platform_requirements_for_job[job.php] = job.ignore_php_platform_requirement;
    } else if (job.ignore_platform_reqs_8 !== undefined && typeof job.ignore_platform_reqs_8 === 'boolean') {
        core.warning('WARNING: You are using `ignore_platform_reqs_8` in your projects configuration.');
        core.warning('This is deprecated as of v1.9.0 of the matrix action and will be removed in future versions.');
        core.warning('Please use `ignore_php_platform_requirement` or `ignore_php_platform_requirements` in your additional check configuration instead.');

        ignore_php_platform_requirements_for_job['8.0'] = job.ignore_platform_reqs_8;
    }

    return Object.assign(ignore_php_platform_requirements, ignore_php_platform_requirements_for_job);
};

/**
 * @param {String} name
 * @param {String} command
 * @param {Array} versions
 * @param {Array} dependencies
 * @param {Array} extensions
 * @param {Array} ini
 * @param {Object} ignore_php_platform_requirements
 * @return {Array} Array of jobs
 */
const createAdditionalJobList = function (
    name,
    command,
    versions,
    dependencies,
    extensions,
    ini,
    ignore_php_platform_requirements
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
                    ignore_php_platform_requirements[version] ?? false
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
            discoverIgnorePhpPlatformDetailsForCheck(checkConfig.job, config.ignore_php_platform_requirements)
        ));
    }, []);
};
