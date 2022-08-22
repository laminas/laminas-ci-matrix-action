import {InstallablePhpVersionType} from './php';
import {ComposerDependencySet, Job} from './app';

export interface JobDefinitionForMatrix
{
    command: string,
    php: InstallablePhpVersionType,
    extensions: Array<string>,
    ini: Array<string>,
    dependencies: ComposerDependencySet,
    ignore_platform_reqs_8: boolean, // eslint-disable-line camelcase
    ignore_php_platform_requirement: boolean, // eslint-disable-line camelcase
    additional_composer_arguments: Array<string>, // eslint-disable-line camelcase
    before_script: Array<string>, // eslint-disable-line camelcase
}

export interface JobForMatrix {
    name: string;
    job: JobDefinitionForMatrix;
    operatingSystem: string;
    action: string;
}

export interface Output {
    include: JobForOutput[]
}

interface JobForOutput {
    name: string,
    job: string,
    operatingSystem: string,
    action: string
}

export function createJobForMatrixFromJob(job: Job): JobForMatrix {
    return {
        name            : job.name,
        operatingSystem : job.operatingSystem,
        action          : job.action,
        job             : {
            command                         : job.job.command,
            php                             : job.job.php,
            extensions                      : job.job.phpExtensions,
            ini                             : job.job.phpIni,
            dependencies                    : job.job.composerDependencySet,
            /* eslint-disable-next-line camelcase */
            ignore_platform_reqs_8          : job.job.ignorePhpPlatformRequirement,
            /* eslint-disable-next-line camelcase */
            ignore_php_platform_requirement : job.job.ignorePhpPlatformRequirement,
            /* eslint-disable-next-line camelcase */
            additional_composer_arguments   : job.job.additionalComposerArguments,
            /* eslint-disable-next-line camelcase */
            before_script                   : job.job.beforeScript,
        }
    };
}
