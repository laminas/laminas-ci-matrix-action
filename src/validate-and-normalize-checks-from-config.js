import core from '@actions/core';
import {INSTALLABLE_VERSIONS} from "./config.js";
import create_additional_jobs from "./additional-checks.js";

/**
 * @param {(Object|String)} job
 * @return {(Object|Boolean)} Returns false if job is invalid; otherwise, returns normalized JSON object of job
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

    if (job.php === undefined || (job.php !== '*' && ! INSTALLABLE_VERSIONS.includes(job.php))) {
        core.warning("Invalid job provided; no PHP version or unknown PHP version specified: " + JSON.stringify(job));
        return false;
    }

    if (job.command === undefined) {
        core.warning("Invalid job provided; no command specified: " + JSON.stringify(job));
        return false;
    }

    if (job.extensions !== undefined && ! Array.isArray(job.extensions)) {
        core.warning("Invalid job provided; extensions is not an Array: " + JSON.stringify(job));
        return false;
    }

    if (job.ini !== undefined && ! Array.isArray(job.ini)) {
        core.warning("Invalid job provided; ini is not an Array: " + JSON.stringify(job));
        return false;
    }

    if (job.dependencies !== undefined && ! ["locked", "latest", "lowest", "*"].includes(job.dependencies)) {
        core.warning("Invalid job provided; invalid dependency set: " + JSON.stringify(job));
        return false;
    }

    return job;
};

/**
 * @param {Object} check
 * @return {(null|Object)} null if invalid, object representing check otherwise
 */
const validateAndNormalizeCheck = function (check) {
    if (check.name === undefined) {
        core.warning("Invalid check detected; missing name: " + JSON.stringify(check));
        return null;
    }

    if (check.job === undefined) {
        core.warning("Invalid check detected; missing job: " + JSON.stringify(check));
        return null;
    }

    let job = normalizeJob(check.job);
    if (! job) {
        return null;
    }

    check.job = job;

    if (check.operatingSystem === undefined) {
        check.operatingSystem = 'ubuntu-latest';
    }

    return check;
};

/**
 * @param {Array<Object>} checks
 * @param {Config} config
 * @return {Array}
 */
export default function (checks, config) {
    return checks
        .map(validateAndNormalizeCheck)
        .filter(function (check) {
            return typeof check === 'object' && check !== null;
        }).reduce(function (jobs, check) {
            return jobs.concat(create_additional_jobs([check], config));
        }, [])
        .map(function (check) {
            check.job = JSON.stringify(check.job);
            return check;
        });
};
