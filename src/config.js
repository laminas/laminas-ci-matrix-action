import core from '@actions/core';
import fs from 'fs';
import semver from 'semver';
import { Requirements } from './check-requirements.js';

const CURRENT_STABLE       = '7.4';

/** NOTE: Please keep this list ordered as the ordering is used to detect the minimum supported version of a project */
const INSTALLABLE_VERSIONS = [
    '5.6',
    '7.0',
    '7.1',
    '7.2',
    '7.3',
    '7.4',
    '8.0',
    '8.1',
];

/**
 * @param {String} configFile
 * @return {Object}
 */
function parseConfig (configFile) {
    if (! fs.existsSync(configFile)) {
        return {};
    }
    try {
        return JSON.parse(fs.readFileSync(configFile));
    } catch (error) {
        core.setFailed('Failed to parse ' + configFile + ': ' + error.message);
    }
}

/**
 * @param {String} composerJsonFile
 * @return {Object}
 */
function parseComposerJson (composerJsonFile) {
    try {
        return JSON.parse(fs.readFileSync(composerJsonFile));
    } catch (error) {
        core.setFailed('Failed to parse ' + composerJsonFile + ': ' + error.message);
    }
}

/**
 * @param {Object} composerJson
 * @return {Array}
 */
function gatherVersions (composerJson) {
    let versions = [];
    INSTALLABLE_VERSIONS.forEach(function (version) {
        if (semver.satisfies(version + '.0', composerJson['require']['php'])) {
            versions.push(version);
        }
    });

    return versions;
}

class Config {
    code_checks                        = true;
    doc_linting                        = true;
    versions                           = [];
    stable_version                     = CURRENT_STABLE;
    minimum_version                    = CURRENT_STABLE;
    locked_dependencies                = false;
    extensions                         = [];
    php_ini                            = ['memory_limit        = -1'];
    dependencies                       = ['lowest', 'latest'];
    checks                             = [];
    exclude                            = [];
    additional_checks                  = [];
    ignore_php_platform_requirements   = {
        '8.0': true
    };

    /**
     * @param {Requirements} requirements
     * @param {Object} configuration
     * @param {Object} composerJson
     * @param {String} composerLockFile
     */
    constructor(requirements, configuration, composerJson, composerLockFile) {
        this.code_checks = requirements.code_checks;
        this.doc_linting = requirements.doc_linting;
        this.versions    = gatherVersions(composerJson);

        if (configuration["stablePHP"] !== undefined) {
            this.stable_version = configuration["stablePHP"];
            this.minimum_version = this.stable_version;
        }

        if (this.versions.length > 0) {
            this.minimum_version = this.versions[0]
        }

        if (configuration.extensions !== undefined && Array.isArray(configuration.extensions)) {
            this.extensions = configuration.extensions;
        }

        if (configuration.ini !== undefined && Array.isArray(configuration.ini)) {
            this.php_ini = this.php_ini.concat(configuration.ini);
        }

        if (fs.existsSync(composerLockFile)) {
            this.locked_dependencies = true;
        }

        if (configuration.checks !== undefined && Array.isArray(configuration.checks)) {
            this.checks = configuration.checks;
        }

        if (configuration.exclude !== undefined && Array.isArray(configuration.exclude)) {
            this.exclude = configuration.exclude;
        }

        if (configuration.additional_checks !== undefined && Array.isArray(configuration.additional_checks)) {
            this.additional_checks = configuration.additional_checks;
        }

        if (configuration.ignore_php_platform_requirements !== undefined && typeof configuration.ignore_php_platform_requirements === 'object') {
            this.ignore_php_platform_requirements = Object.assign(
                this.ignore_php_platform_requirements,
                configuration.ignore_php_platform_requirements
            );
        }

        if (configuration.ignore_platform_reqs_8 !== undefined && typeof configuration.ignore_platform_reqs_8 === 'boolean') {
            core.warning('WARNING: You are using `ignore_platform_reqs_8` in your projects configuration.');
            core.warning('This is deprecated as of v1.9.0 of the matrix action and will be removed in future versions.');
            core.warning('Please use `ignore_php_platform_requirements` instead.');
            this.ignore_php_platform_requirements['8.0'] = configuration.ignore_platform_reqs_8;
        }
    }
}

/**
 * @param {Requirements} requirements
 * @param {String} configFile
 * @param {String} composerJsonFile
 * @param {String} composerLockFile
 * @return {Config}
 */
const createConfig = function (requirements, configFile, composerJsonFile, composerLockFile) {
    return new Config(requirements, parseConfig(configFile), parseComposerJson(composerJsonFile), composerLockFile);
}

export {
    CURRENT_STABLE,
    Config,
};
export default createConfig;
