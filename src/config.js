import fs from 'fs';
import core from '@actions/core';
import semver from 'semver';
import parseJsonFile from './json.js';

const CURRENT_STABLE = '7.4';

/** NOTE: Please keep this list ordered as the ordering is used to detect the minimum supported version of a project */
const INSTALLABLE_VERSIONS = [
    '5.6',
    '7.0',
    '7.1',
    '7.2',
    '7.3',
    '7.4',
    '8.0',
    '8.1'
];

/**
 * @param {Object} composerJson
 * @return {Array<string>}
 */
function gatherVersions(composerJson) {
    if (JSON.stringify(composerJson) === '{}') {
        return [];
    }

    const versions = [];
    const composerPhpVersion = composerJson.require.php.replace(/,\s/, ' ');

    INSTALLABLE_VERSIONS.forEach((version) => {
        if (semver.satisfies(`${version  }.0`, composerPhpVersion)) {
            versions.push(version);
        }
    });

    return versions;
}

/**
 * @param {Object} requirements
 * @return {Set<string>}
 */
function extractPhpExtensionsFromComposerRequirements(requirements) {
    const EXTENSION_EXPRESSION = /^ext-/;

    let extensions = new Set();

    Object.keys(requirements).forEach((requirement) => {
        if (EXTENSION_EXPRESSION.test(requirement)) {
            extensions = extensions.add(requirement.replace(EXTENSION_EXPRESSION, ''));
        }
    });

    return extensions;
}

/**
 * @param {Object} composerJson
 * @return {Array<string>}
 */
function gatherExtensions(composerJson) {
    let extensions = new Set();

    if (typeof composerJson.require === 'object') {
        extensions = new Set([ ...extensions, ...extractPhpExtensionsFromComposerRequirements(composerJson.require) ]);
    }

    if (typeof composerJson['require-dev'] === 'object') {
        extensions = new Set([ ...extensions, ...extractPhpExtensionsFromComposerRequirements(composerJson['require-dev']) ]);
    }

    return [ ...extensions ];
}

class Config {
    codeChecks = true;

    docLinting = true;

    versions = [];

    stableVersion = CURRENT_STABLE;

    minimumVersion = CURRENT_STABLE;

    latestVersion = CURRENT_STABLE;

    lockedDependencies = false;

    extensions = [];

    phpIni = [ 'memory_limit        = -1' ];

    dependencies = [ 'lowest', 'latest' ];

    checks = [];

    exclude = [];

    additionalChecks = [];

    ignorePhpPlatformRequirements = {
        '8.0' : true
    };

    additionalComposerArguments = [];

    /**
     * @param {Requirements} requirements
     * @param {Object} configuration
     * @param {Object} composerJson
     * @param {String} composerLockFile
     */
    constructor(requirements, configuration, composerJson, composerLockFile) {
        this.codeChecks = requirements.codeChecks;
        this.docLinting = requirements.docLinting;
        this.versions = gatherVersions(composerJson);
        this.extensions = gatherExtensions(composerJson);

        if (configuration.stablePHP !== undefined) {
            this.stableVersion = configuration.stablePHP;
            this.minimumVersion = this.stableVersion;
            this.latestVersion = this.stableVersion;
        }

        if (this.versions.length > 0) {
            this.minimumVersion = this.versions[0];
            this.latestVersion = this.versions[this.versions.length - 1];
        }

        if (configuration.extensions !== undefined && Array.isArray(configuration.extensions)) {
            let extensions = new Set(this.extensions);

            configuration.extensions.forEach((extension) => {
                extensions = extensions.add(extension);
            });

            this.extensions = [ ...extensions ];
        }

        if (configuration.ini !== undefined && Array.isArray(configuration.ini)) {
            this.phpIni = [ ...this.phpIni, ...configuration.ini ];
        }

        if (fs.existsSync(composerLockFile)) {
            this.lockedDependencies = true;
        }

        if (configuration.checks !== undefined && Array.isArray(configuration.checks)) {
            this.checks = configuration.checks;
        }

        if (configuration.exclude !== undefined && Array.isArray(configuration.exclude)) {
            this.exclude = configuration.exclude;
        }

        if (configuration.additional_checks !== undefined && Array.isArray(configuration.additional_checks)) {
            this.additionalChecks = configuration.additional_checks;
        }

        if (configuration.ignore_php_platform_requirements !== undefined && typeof configuration.ignore_php_platform_requirements === 'object') {
            this.ignorePhpPlatformRequirements = Object.assign(
                this.ignorePhpPlatformRequirements,
                configuration.ignore_php_platform_requirements
            );
        }

        if (configuration.ignore_platform_reqs_8 !== undefined && typeof configuration.ignore_platform_reqs_8 === 'boolean') {
            core.warning('WARNING: You are using `ignore_platform_reqs_8` in your projects configuration.');
            core.warning('This is deprecated as of v1.9.0 of the matrix action and will be removed in future versions.');
            core.warning('Please use `ignore_php_platform_requirements` instead.');
            this.ignorePhpPlatformRequirements['8.0'] = configuration.ignore_platform_reqs_8;
        }

        if (
            configuration.additional_composer_arguments !== undefined
            && Array.isArray(configuration.additional_composer_arguments)
        ) {
            const unifiedAdditionalComposerArguments = new Set(configuration.additional_composer_arguments);

            this.additionalComposerArguments = [ ...unifiedAdditionalComposerArguments ];
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
    return new Config(requirements, parseJsonFile(configFile), parseJsonFile(composerJsonFile), composerLockFile);
};

export {
    CURRENT_STABLE,
    Config,
    INSTALLABLE_VERSIONS
};
export default createConfig;
