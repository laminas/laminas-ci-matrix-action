import { CURRENT_STABLE } from './config.js';

export class Command {
    command                         = '';
    php                             = CURRENT_STABLE;
    extensions                      = [];
    ini                             = [];
    dependencies                    = 'locked';
    ignore_php_platform_requirement = false;

    /**
     * @param {String} command
     * @param {String} php
     * @param {Array<String>} extensions
     * @param {Array<String>} ini
     * @param {String} dependencies
     * @param {Boolean} ignore_php_platform_requirement
     */
    constructor(command, php, extensions, ini, dependencies, ignore_php_platform_requirement) {
        this.command                          = command;
        this.php                              = php;
        this.extensions                       = extensions;
        this.ini                              = ini;
        this.dependencies                     = dependencies;
        this.ignore_php_platform_requirement = ignore_php_platform_requirement;
    }
    
    toJSON() {
        return {
            command: this.command,
            php: this.php,
            extensions: this.extensions,
            ini: this.ini,
            dependencies: this.dependencies,
            ignore_platform_reqs_8: this.ignore_php_platform_requirement,
            ignore_php_platform_requirement: this.ignore_php_platform_requirement,
        };
    }
};
