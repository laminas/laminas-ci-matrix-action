import core from '@actions/core';

const KNOWN_PHP_VERSIONS = [
    '5.6', 
    '7.0', 
    '7.1', 
    '7.2', 
    '7.3', 
    '7.4', 
    '8.0', 
];

/**
 * @param {(Object|String)} job
 * @return {(String|Boolean)} Returns false if job is invalid; otherwise, returns JSON representation of job
 */
const normalizeJob = function (job) {
    if (typeof job === 'string') {
        let parsedJob;
        try {
            parsedJob = JSON.parse(job);
        } catch(error) {
            core.warning("Unparseable JSON job provided: " + job);
            return false;
        }
        job = parsedJob;
    }

    if (typeof job !== 'object' || job === null) {
        core.warning("Invalid job provided; must be a JSON string or an object: " + JSON.stringify(job));
        return false;
    }

    if (! "php" in job || ! KNOWN_PHP_VERSIONS.includes(job.php)) {
        core.warning("Invalid job provided; no PHP version or unknown PHP version specified: " + JSON.stringify(job));
        return false;
    }

    if (! "command" in job) {
        core.warning("Invalid job provided; no command specified: " + JSON.stringify(job));
        return false;
    }

    if ("extensions" in job && ! Array.isArray(job.extensions)) {
        core.warning("Invalid job provided; extensions is not an Array: " + JSON.stringify(job));
        return false;
    }

    if ("ini" in job && ! Array.isArray(job.ini)) {
        core.warning("Invalid job provided; ini is not an Array: " + JSON.stringify(job));
        return false;
    }

    if ("dependencies" in job && ! ["locked", "latest", "lowest"].includes(job.dependencies)) {
        core.warning("Invalid job provided; invalid dependency set: " + JSON.stringify(job));
        return false;
    }

    return JSON.stringify(job);
};

/**
 * @param {Object} check
 * @return {(null|Object)} null if invalid, object representing check otherwise
 */
const validateAndNormalizeCheck = function (check) {
    if (! "name" in check) {
        core.warning("Invalid check detected; missing name: " + JSON.stringify(check));
        return null;
    }

    if (! "job" in check) {
        core.warning("Invalid check detected; missing job: " + JSON.stringify(check));
        return null;
    }

    let job = normalizeJob(check.job);
    if (! job) {
        return null;
    }

    check.job = job;

    if (! "operatingSystem" in check) {
        check.operatingSystem = 'ubuntu-latest';
    }

    return check;
};

/**
 * @param {Array} checks
 * @return {Array}
 */
export default function (checks) {
    return checks
        .map(validateAndNormalizeCheck)
        .filter(function (check) {
            return typeof check === 'object' && check !== null;
        });
};
