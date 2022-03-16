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
    runCheck = true;

    matchers = [];

    jobGenerator;

    /**
     * @param {Boolean} runCheck
     * @param {Array} matchers
     * @param {jobGenerator} jobGenerator
     */
    constructor(runCheck, matchers, jobGenerator) {
        this.runCheck = runCheck;
        this.matchers = matchers;
        this.jobGenerator = jobGenerator;
    }

    /**
     * @param {Config} config
     * @return {Array}
     */
    jobs(config) {
        const jobGenerator = this.jobGenerator;


        return this.matches() ? jobGenerator(config) : [];
    }

    matches() {
        return this.runCheck && this.matchers.reduce(testCheck, false);
    }
}
