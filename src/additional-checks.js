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
        console.log("Skipping additional check; not an object, or is null", checkConfig);
        return false;
    }

    if (! ("name" in checkConfig) || ! ("job" in checkConfig)) {
        // Missing one or more required elements
        console.log("Skipping additional check due to missing name or job keys", checkConfig);
        return false;
    }

    if (typeof checkConfig.job !== 'object' || checkConfig.job === null) {
        // Job is malformed
        console.log("Invalid job provided for check; not an object, or is null", checkConfig.job);
        return false;
    }

    if (! ("command" in checkConfig.job)) {
        // Job is missing a command
        console.log("Invalid job provided for check; missing command property", checkConfig.job);
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
    if (! ("php" in job)) {
        return [CURRENT_STABLE];
    }

    if (typeof job.php === 'string' && job.php !== '*') {
        return [job.php];
    }

    if (typeof job.php === 'string' && job.php === '*') {
        return config.versions;
    }

    console.log("Invalid PHP version specified for check job; must be a string version or '*'", job);
    return false;
};

/**
 * @param {Object} job
 * @param {Config} config
 * @return {Array}
 */
const discoverExtensionsForCheck = function (job, config) {
    if ("extensions" in job && Array.isArray(job.extensions)) {
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
    if ("ini" in job && Array.isArray(job.ini)) {
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
    if (! ("dependencies" in job)) {
        return ['locked'];
    }

    if (typeof job.dependencies === 'string' && job.dependencies !== '*') {
        return [job.dependencies];
    }

    if (typeof job.dependencies === 'string' && job.dependencies === '*') {
        return config.dependencies;
    }

    console.log("Invalid dependencies specified for check job; must be a string version or '*'", job);
    return false;
};

/**
 * @param {String} name
 * @param {String} command
 * @param {Array} versions
 * @param {Array} dependencies
 * @param {Array} extensions
 * @param {Array} ini
 * @return {Array} Array of jobs
 */
const createAdditionalJobList = function (name, command, versions, dependencies, extensions, ini) {
    return versions.reduce(function (jobs, version) {
        return jobs.concat(dependencies.reduce(function (jobs, deps) {
            return jobs.concat(new Job(
                name + " on PHP " + version + " with " + deps + " dependencies",
                JSON.stringify(new Command(
                    command,
                    version,
                    extensions,
                    ini,
                    deps
                ))
            ));
        }, []));
    }, []);
};

/**
 * @param {Config} config
 * @return {Array} Array of jobs
 */
export default function (config) {
    return config.additional_checks.reduce(function (jobs, checkConfig) {
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
            discoverIniSettingsForCheck(checkConfig.job, config)
        ));
    }, []);
};
