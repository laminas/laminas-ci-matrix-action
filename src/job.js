const OS     = 'ubuntu-latest';
const ACTION = 'laminas/laminas-continuous-integration-action@v1';

export class Job {
    name = '';
    job = '';
    os = OS;
    action = ACTION;
    deprecatedName = '';

    constructor(name, job, deprecatedName = '') {
        this.name = name;
        this.job = job;
        this.deprecatedName = deprecatedName;
    }

    toJSON() {
        return {
            name: this.name,
            job: this.job,
            operatingSystem: this.os,
            action: this.action,
        };
    }
};
