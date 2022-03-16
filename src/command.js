import { CURRENT_STABLE } from './config.js';

export class Command {
    command = '';

    php = CURRENT_STABLE;

    extensions = [];

    ini = [];

    dependencies = 'locked';

    ignorePhpPlatformRequirement = false;

    additionalComposerArguments = [];

    /**
     * @param {String} command
     * @param {String} php
     * @param {Array<String>} extensions
     * @param {Array<String>} ini
     * @param {String} dependencies
     * @param {Boolean} ignorePhpPlatformRequirement
     * @param {Array<String>} additionalComposerArguments
     */
    constructor(
        command,
        php,
        extensions,
        ini,
        dependencies,
        ignorePhpPlatformRequirement,
        additionalComposerArguments
    ) {
        this.command = command;
        this.php = php;
        this.extensions = extensions;
        this.ini = ini;
        this.dependencies = dependencies;
        this.ignorePhpPlatformRequirement = ignorePhpPlatformRequirement;
        this.additionalComposerArguments = additionalComposerArguments;
    }

    /* eslint camelcase: "off" */
    toJSON() {
        return {
            command                         : this.command,
            php                             : this.php,
            extensions                      : this.extensions,
            ini                             : this.ini,
            dependencies                    : this.dependencies,
            ignore_platform_reqs_8          : this.ignorePhpPlatformRequirement, // eslint-disable-line camelcase
            ignore_php_platform_requirement : this.ignorePhpPlatformRequirement, // eslint-disable-line camelcase
            additional_composer_arguments   : this.additionalComposerArguments // eslint-disable-line camelcase
        };
    }
}
