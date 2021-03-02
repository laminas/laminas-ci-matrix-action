const OS     = 'ubuntu-latest';
const ACTION = 'laminas/laminas-continuous-integration-action@v1';

export class Job {
    name = '';
    job = '';
    os = OS;
    action = ACTION;

    constructor(name, job) {
        this.name = name;
        this.job = job;
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
