import {InstallablePhpVersionType} from './php';
import {ComposerDependencySet, Job} from './app';

export interface JobDefinitionForMatrix
{
    command: string,
    php: InstallablePhpVersionType,
    extensions: Array<string>,
    ini: Array<string>,
    dependencies: ComposerDependencySet,
    ignore_platform_reqs_8: boolean,
    ignore_php_platform_requirement: boolean,
    additional_composer_arguments: Array<string>,
    before_script: Array<string>,
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
            ignore_platform_reqs_8          : job.job.ignorePhpPlatformRequirement,
            ignore_php_platform_requirement : job.job.ignorePhpPlatformRequirement,
            additional_composer_arguments   : job.job.additionalComposerArguments,
            before_script                   : job.job.beforeScript,
        }
    };
}
