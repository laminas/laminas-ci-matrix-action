import { CURRENT_STABLE } from './config.js';

export class Command {
    command      = null;
    php          = CURRENT_STABLE;
    extensions   = [];
    ini          = [];
    dependencies = 'locked';

    /**
     * @param {String|null} command
     * @param {String} php
     * @param {Array<String>} extensions
     * @param {Array<String>} ini
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
