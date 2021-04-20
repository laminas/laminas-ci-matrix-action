import { CURRENT_STABLE } from './config.js';

export class Command {
    command                = '';
    php                    = CURRENT_STABLE;
    extensions             = [];
    ini                    = [];
    dependencies           = 'locked';
    ignore_platform_reqs_8 = true;

    /**
     * @param {String} command
     * @param {String} php
     * @param {Array<String>} extensions
     * @param {Array<String>} ini
     * @param {String} dependencies
     * @param {Boolean} ignore_platform_reqs_8
     */
    constructor(command, php, extensions, ini, dependencies, ignore_platform_reqs_8) {
        this.command                = command;
        this.php                    = php;
        this.extensions             = extensions;
        this.ini                    = ini;
        this.dependencies           = dependencies;
        this.ignore_platform_reqs_8 = ignore_platform_reqs_8;
    }
    
    toJSON() {
        return {
            command: this.command,
            php: this.php,
            extensions: this.extensions,
            ini: this.ini,
            dependencies: this.dependencies,
            ignore_platform_reqs_8: this.ignore_platform_reqs_8,
        };
    }
};
