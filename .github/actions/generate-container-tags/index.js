const core = require('@actions/core');
const semver = require('semver')

const package = 'ghcr.io/laminas/laminas-ci-matrix';

let tagRef = core.getInput('tag-ref');
let tag    = tagRef.split('/').pop();

let major = semver.major(tag);
let minor = major + '.' + semver.minor(tag);
let patch = minor + '.' + semver.patch(tag);

let tags = [
    package + ':' + major,
    package + ':' + minor,
    package + ':' + patch,
];

core.info(`Tags: ${JSON.stringify(tags)}`);
core.setOutput('tags', tags.join("\n"));
