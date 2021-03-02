import { Config } from './config.js';

/**
 * @callback matchCallback
 * @return {Boolean}
 */

/**
 * @callback job_generator
 * @param {Config} config
 * @return {Array}
 */

/**
 * @param {Boolean} matches
 * @param {matchCallback} callback
 */
const testCheck = function (matches, callback) {
    return matches || callback();
};

export class Check {
    run_check = true;
    matchers  = [];
    job_generator;

    /**
     * @param {Boolean} run_check
     * @param {Array} matchers
     * @param {job_generator} job_generator
     */
    constructor(run_check, matchers, job_generator) {
        this.run_check     = run_check;
        this.matchers      = matchers;
        this.job_generator = job_generator;
    }

    /**
     * @param {Config} config
     * @return {Array}
     */
    jobs(config) {
        let job_generator = this.job_generator;
        return  this.matches() ? job_generator(config) : [];
    }

    matches() {
        return this.run_check && this.matchers.reduce(testCheck, false);
    }
};
