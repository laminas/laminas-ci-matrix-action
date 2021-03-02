import { CURRENT_STABLE } from './config.js';

export class Command {
    command      = '';
    php          = CURRENT_STABLE;
    extensions   = [];
    ini          = [];
    dependencies = 'locked';

    /**
     * @param {String} command
     * @param {String} php
     * @param {Array} extensions
     * @param {Array} ini
     * @param {String} dependencies
     */
    constructor(command, php, extensions, ini, dependencies) {
        this.command      = command;
        this.php          = php;
        this.extensions   = extensions;
        this.ini          = ini;
        this.dependencies = dependencies;
    }
    
    toJSON() {
        return {
            command: this.command,
            php: this.php,
            extensions: this.extensions,
            ini: this.ini,
            dependencies: this.dependencies,
        };
    }
};
