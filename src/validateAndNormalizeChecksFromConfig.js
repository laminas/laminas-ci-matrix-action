import core from '@actions/core';
import { INSTALLABLE_VERSIONS } from './config.js';
import createAdditionalJobs from './additionalChecks.js';

/**
 * @param {(Object|String)} job
 * @return {(Object|Boolean)} Returns false if job is invalid; otherwise, returns normalized JSON object of job
 */
const normalizeJob = function (job) {
    let normalizedJob = job;

    if (typeof job === 'string') {
        let parsedJob;

        try {
            parsedJob = JSON.parse(job);
        } catch {
            core.warning(`Unparseable JSON job provided: ${  job}`);

            return false;
        }

        normalizedJob = parsedJob;
    }

    if (typeof normalizedJob !== 'object' || normalizedJob === null) {
        core.warning(`Invalid job provided; must be a JSON string or an object: ${  JSON.stringify(job)}`);

        return false;
    }

    if (typeof normalizedJob.php === 'undefined' || (normalizedJob.php !== '*' && !INSTALLABLE_VERSIONS.includes(normalizedJob.php))) {
        core.warning(`Invalid job provided; no PHP version or unknown PHP version specified: ${  JSON.stringify(normalizedJob)}`);

        return false;
    }

    if (typeof normalizedJob.command === 'undefined') {
        core.warning(`Invalid job provided; no command specified: ${  JSON.stringify(job)}`);

        return false;
    }

    if (typeof normalizedJob.extensions !== 'undefined' && !Array.isArray(normalizedJob.extensions)) {
        core.warning(`Invalid job provided; extensions is not an Array: ${  JSON.stringify(normalizedJob)}`);

        return false;
    }

    if (typeof normalizedJob.ini !== 'undefined' && !Array.isArray(normalizedJob.ini)) {
        core.warning(`Invalid job provided; ini is not an Array: ${  JSON.stringify(normalizedJob)}`);

        return false;
    }

    if (typeof normalizedJob.dependencies !== 'undefined' && ![ 'locked', 'latest', 'lowest', '*' ].includes(normalizedJob.dependencies)) {
        core.warning(`Invalid job provided; invalid dependency set: ${  JSON.stringify(normalizedJob)}`);

        return false;
    }

    return normalizedJob;
};

/**
 * @param {Object} check
 * @return {(null|Object)} null if invalid, object representing check otherwise
 */
const validateAndNormalizeCheck = function (check) {
    if (check.name === undefined) {
        core.warning(`Invalid check detected; missing name: ${  JSON.stringify(check)}`);

        return null;
    }

    if (check.job === undefined) {
        core.warning(`Invalid check detected; missing job: ${  JSON.stringify(check)}`);

        return null;
    }

    const job = normalizeJob(check.job);

    if (!job) {
        return null;
    }

    const normalizedCheck = check;

    normalizedCheck.job = job;

    if (typeof check.operatingSystem === 'undefined') {
        normalizedCheck.operatingSystem = 'ubuntu-latest';
    }

    return normalizedCheck;
};

/**
 * @param {Array<Object>} checks
 * @param {Config} config
 * @return {Array}
 */
export default function (checks, config) {
    return checks
        .map(validateAndNormalizeCheck)
        .filter((check) => {
            return typeof check === 'object' && check !== null;
        }).reduce((jobs, check) => {
            return [ ...jobs, ...createAdditionalJobs([ check ], config) ];
        }, [])
        .map((check) => {
            const preparedCheck = check;

            preparedCheck.job = JSON.stringify(check.job);

            return preparedCheck;
        });
}
