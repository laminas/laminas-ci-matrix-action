import fs, {PathLike} from 'fs';
import semver from 'semver';
import parseJsonFile from '../json';
import {Tool, ToolExecutionType} from '../tools';
import {Logger} from '../logging';
import {CURRENT_STABLE, INSTALLABLE_VERSIONS, InstallablePhpVersionType, isInstallableVersion} from './php';
import {ComposerJson} from './composer';
import {ConfigurationFromFile, isAdditionalChecksConfiguration, isAnyComposerDependencySet, isAnyPhpVersionType, isConfigurationContainingJobExclusions, isExplicitChecksConfiguration, isLatestPhpVersionType, isLowestPhpVersionType, JobDefinitionFromFile, JobFromFile, JobToExcludeFromFile} from './input';

export const OPERATING_SYSTEM = 'ubuntu-latest';
export const ACTION = 'laminas/laminas-continuous-integration-action@v1';

export enum ComposerDependencySet {
    LOWEST = 'lowest',
    LOCKED = 'locked',
}

export function gatherVersions(composerJson: ComposerJson): InstallablePhpVersionType[] {
    if (JSON.stringify(composerJson) === '{}') {
        return [];
    }

    const composerPhpVersion: string = (composerJson.require?.php ?? '')
        .replace(/,\s/, ' ')
        .replace(/(\d+)\.(\d+)\.([1-9]+)/g, '$1.$2.0');

    if (composerPhpVersion === '') {
        return [];
    }

    return INSTALLABLE_VERSIONS.filter((version) => semver.satisfies(`${version}.0`, composerPhpVersion));
}

function gatherExtensions(composerJson: ComposerJson): Set<string> {
    let extensions: Set<string> = new Set();
    const EXTENSION_EXPRESSION = new RegExp(/^ext-/);

    Object.keys(composerJson.require ?? {})
        .filter((requirement) => EXTENSION_EXPRESSION.test(requirement))
        .forEach((requirement) => extensions = extensions.add(requirement.replace(EXTENSION_EXPRESSION, '')));

    Object.keys(composerJson['require-dev'] ?? {})
        .filter((requirement) => EXTENSION_EXPRESSION.test(requirement))
        .forEach((requirement) => extensions = extensions.add(requirement.replace(EXTENSION_EXPRESSION, '')));

    return extensions;
}

export interface JobDefinition {
    command: string;
    php: InstallablePhpVersionType;
    phpExtensions: string[];
    phpIni: string[];
    composerDependencySet: ComposerDependencySet;
    ignorePhpPlatformRequirement: boolean;
    additionalComposerArguments: string[];
    beforeScript: string[];
}

export interface Job {
    name: string;
    job: JobDefinition;
    operatingSystem: string;
    action: string;
}

interface JobFromTool extends Job {
    tool: Tool
}

function isJobFromTool(job: Job): job is JobFromTool {
    return (job as JobFromTool).tool !== undefined;
}

export interface Config {
    readonly codeChecks: boolean;
    readonly docLinting: boolean;
    readonly versions: InstallablePhpVersionType[];
    readonly stablePhpVersion: InstallablePhpVersionType;
    readonly minimumPhpVersion: InstallablePhpVersionType;
    readonly latestPhpVersion: InstallablePhpVersionType;
    readonly lockedDependenciesExists: boolean;
    readonly phpExtensions: string[];
    readonly phpIni: string[];
    readonly ignorePhpPlatformRequirements: IgnorePhpPlatformRequirements;
    readonly additionalComposerArguments: string[];
}
export interface Requirements {
    readonly codeChecks: boolean;
    readonly docLinting: boolean;
}

function discoverPhpVersionsForJob(job: JobDefinitionFromFile, config: Config): InstallablePhpVersionType[] {
    const phpFromJob = job.php ?? config.stablePhpVersion;

    if (isAnyPhpVersionType(phpFromJob)) {
        return config.versions;
    }

    if (isLowestPhpVersionType(phpFromJob)) {
        return [ config.minimumPhpVersion ];
    }

    if (isLatestPhpVersionType(phpFromJob)) {
        return [ config.latestPhpVersion ];
    }

    return [ phpFromJob ];
}

function discoverComposerDependencySetsForJob(job: JobDefinitionFromFile, config: Config): ComposerDependencySet[] {
    const dependencySetFromConfig = job.dependencies
        ?? (config.lockedDependenciesExists ? ComposerDependencySet.LOCKED : ComposerDependencySet.LOWEST);

    if (isAnyComposerDependencySet(dependencySetFromConfig)) {
        return [ ComposerDependencySet.LOWEST ];
    }

    return [ dependencySetFromConfig ];
}

function discoverIgnorePhpPlatformRequirementForJobByVersion(
    job: JobDefinitionFromFile,
    phpVersion: InstallablePhpVersionType,
    config: Config
): boolean {
    if (job.ignore_php_platform_requirement ?? false) {
        return true;
    }

    return config.ignorePhpPlatformRequirements[phpVersion] ?? false;
}

function discoverAdditionalComposerArgumentsForCheck(job: JobDefinitionFromFile, config: Config): string[] {
    return [ ... new Set([
        ... config.additionalComposerArguments ?? [],
        ... job.additional_composer_arguments ?? []
    ]) ];
}

function convertJobDefinitionFromFileToJobDefinition(
    phpVersion: InstallablePhpVersionType,
    composerDependencySet: ComposerDependencySet,
    job: JobDefinitionFromFile,
    config: Config
): JobDefinition {
    return createJobDefinition(
        job.command,
        phpVersion,
        composerDependencySet,
        job.extensions ?? config.phpExtensions,
        job.ini ?? config.phpIni,
        discoverIgnorePhpPlatformRequirementForJobByVersion(job, phpVersion, config),
        discoverAdditionalComposerArgumentsForCheck(job, config),
        job.before_script
    );
}

function createJobDefinition(
    command: string,
    phpVersion: InstallablePhpVersionType,
    composerDependencySet: ComposerDependencySet,
    phpExtensions: string[],
    phpIniSettings: string[],
    ignorePlatformRequirements: boolean,
    additionalComposerArguments: string[],
    beforeScript: string[],
): JobDefinition {
    return {
        php                          : phpVersion,
        phpExtensions                : phpExtensions,
        command                      : command,
        phpIni                       : phpIniSettings,
        composerDependencySet        : composerDependencySet,
        ignorePhpPlatformRequirement : ignorePlatformRequirements,
        additionalComposerArguments  : additionalComposerArguments,
        beforeScript                 : beforeScript,
    };
}

function convertJobFromFileToJobs(job: JobFromFile, config: Config): Job[] {
    const jobDefinitionFromFile: JobDefinitionFromFile = job.job;
    const composerDependencySets = discoverComposerDependencySetsForJob(jobDefinitionFromFile, config);
    const phpVersionsToRunTheChecksWith = discoverPhpVersionsForJob(jobDefinitionFromFile, config);

    const jobs: Job[] = [];

    phpVersionsToRunTheChecksWith.forEach(
        (version) => composerDependencySets.forEach((dependencySet) => {
            const jobDefinition = convertJobDefinitionFromFileToJobDefinition(
                version,
                dependencySet,
                jobDefinitionFromFile,
                config
            );

            jobs.push(createJob(job.name, jobDefinition));
        })
    );

    return jobs;
}

function isJobExcludedByDeprecatedCommandName(job: Job, exclusions: JobToExcludeFromFile[], config: Config) {
    if (exclusions.some(
        (exclude) =>
            `${ job.job.command } on PHP ${ job.job.php } with ${ job.job.composerDependencySet } dependencies`
            === exclude.name
    )) {
        return true;
    }

    if (isJobFromTool(job) && exclusions.some(
        (exclude) =>
            `${ job.tool.name } on PHP ${ job.job.php } with ${ job.job.composerDependencySet } dependencies`
            === exclude.name
    )) {
        return true;
    }

    /**
     * Until v1.12.0, all QA checks did not contain the composer dependency set
     */
    if (exclusions.some(
        (exclude) =>
            `${ job.job.command } on PHP ${ job.job.php }` === exclude.name
    )) {
        return true;
    }

    /**
     * Until v1.12.0, all code checks were executed with `locked` dependencies even with missing `composer.lock`
     */
    return !config.lockedDependenciesExists && exclusions.some(
        (exclude) =>
            exclude.name.endsWith('locked dependencies')
            && `${job.job.command} on PHP ${job.job.php} with locked dependencies`
            === exclude.name
    );
}

function isJobExcluded(job: Job, exclusions: JobToExcludeFromFile[], config: Config, logger: Logger): boolean {
    if (exclusions.length === 0) {
        return false;
    }

    if (exclusions.some((exclude) => job.name === exclude.name)) {
        logger.info(`Job with name ${ job.name } is excluded due to application config.`);

        return true;
    }

    // Verify that deprecated exclusion does still work
    if (isJobExcludedByDeprecatedCommandName(job, exclusions, config)) {
        logger.warning(
            'Application uses deprecated job exclusion.'
            + ` Please modify the job exclusion for the job "${ job.name }" appropriately.`
        );

        return true;
    }

    return false;
}

function createJob(
    name: string,
    job: JobDefinition,
    tool: Tool|null = null
): Job | JobFromTool {
    let createdJob: Job | JobFromTool = {
        name            : `${ name } [${ job.php }, ${ job.composerDependencySet }]`,
        action          : ACTION,
        operatingSystem : OPERATING_SYSTEM,
        job             : job
    };

    if (tool !== null) {
        createdJob = { ...createdJob, tool: tool};
    }

    return createdJob;
}

function createJobsForTool(
    config: Config,
    tool: Tool
): JobFromTool[] {
    const jobs: JobFromTool[] = [];
    const beforeScript: string[] = tool.lintConfigCommand
        ? tool.filesToCheck.map((file) => `${tool.lintConfigCommand} ${file}`)
        : [];

    if (tool.executionType === ToolExecutionType.STATIC) {
        const lockedOrLatestDependencySet: ComposerDependencySet = config.lockedDependenciesExists
            ? ComposerDependencySet.LOCKED
            : ComposerDependencySet.LOWEST;

        return [
            createJob(
                tool.name,
                createJobDefinition(
                    tool.command,
                    config.minimumPhpVersion,
                    lockedOrLatestDependencySet,
                    config.phpExtensions,
                    config.phpIni,
                    config.ignorePhpPlatformRequirements[config.minimumPhpVersion] ?? false,
                    config.additionalComposerArguments,
                    beforeScript,
                ),
                tool
            ) as JobFromTool
        ];
    }

    if (tool.executionType === ToolExecutionType.MATRIX) {
        if (config.lockedDependenciesExists) {
            jobs.push(createJob(
                tool.name,
                createJobDefinition(
                    tool.command,
                    config.minimumPhpVersion,
                    ComposerDependencySet.LOCKED,
                    config.phpExtensions,
                    config.phpIni,
                    config.ignorePhpPlatformRequirements[config.minimumPhpVersion] ?? false,
                    config.additionalComposerArguments,
                    beforeScript,
                ),
                tool
            ) as JobFromTool);
        }

        config.versions.forEach((version) => jobs.push(
            createJob(tool.name, createJobDefinition(
                tool.command,
                version,
                ComposerDependencySet.LOWEST,
                config.phpExtensions,
                config.phpIni,
                config.ignorePhpPlatformRequirements[version] ?? false,
                config.additionalComposerArguments,
                beforeScript,
            ), tool) as JobFromTool
        ));
    }

    return jobs;
}

export function createChecksForKnownTools(config: Config, tools: Tool[]): JobFromTool[] {
    return tools
        .flatMap((tool) => createJobsForTool(config, tool));
}

function createNoOpCheck(config: Config): Job {
    return {
        name            : 'No checks',
        operatingSystem : OPERATING_SYSTEM,
        action          : ACTION,
        job             : {
            php                          : config.stablePhpVersion,
            phpExtensions                : [],
            command                      : '',
            composerDependencySet        : ComposerDependencySet.LOCKED,
            phpIni                       : [],
            ignorePhpPlatformRequirement : config.ignorePhpPlatformRequirements[config.stablePhpVersion] ?? false,
            additionalComposerArguments  : config.additionalComposerArguments,
            beforeScript                 : [],
        }
    };
}

export function gatherChecks(
    configurationFromFile: ConfigurationFromFile,
    config: Config,
    tools: Tool[],
    logger: Logger
): [Job, ...Job[]] {
    if (isExplicitChecksConfiguration(configurationFromFile)) {
        const checks = (configurationFromFile.checks?.map(
            (job) => convertJobFromFileToJobs(job, config)
        ) ?? []).flat(1);

        if (checks.length === 0) {
            return [ createNoOpCheck(config) ];
        }

        return checks as [Job, ...Job[]];
    }

    let checks: Job[] | JobFromTool[] = createChecksForKnownTools(config, tools);

    if (isAdditionalChecksConfiguration(configurationFromFile)) {
        const generatedChecksFromAdditionalChecksConfiguration = (
            configurationFromFile.additional_checks?.map((job) => convertJobFromFileToJobs(job, config)) ?? []
        ).flat(1).filter((check, index, carry) => carry.indexOf(check) === index);

        checks = [ ...checks, ...generatedChecksFromAdditionalChecksConfiguration ];
    }

    const exclusions = isConfigurationContainingJobExclusions(configurationFromFile)
        ? configurationFromFile.exclude ?? []
        : [];

    checks = checks.filter((job) => !isJobExcluded(job, exclusions, config, logger));
    if (checks.length === 0) {
        return [
            createNoOpCheck(config)
        ];
    }

    return checks as [Job, ...Job[]];
}

export default function createConfig(
    requirements: Requirements,
    composerJsonFileName: PathLike,
    composerLockJsonFileName: PathLike,
    continousIntegrationConfigurationJsonFileName: PathLike
): Config {
    const composerJson: ComposerJson = parseJsonFile(composerJsonFileName) as ComposerJson;
    const configurationFromFile: ConfigurationFromFile =
        parseJsonFile(continousIntegrationConfigurationJsonFileName) as ConfigurationFromFile;
    const phpVersionsSupportedByProject: InstallablePhpVersionType[] = gatherVersions(composerJson);
    let phpExtensions: Set<string> = gatherExtensions(composerJson);
    let stablePHPVersion: InstallablePhpVersionType = CURRENT_STABLE;

    if (isInstallableVersion(configurationFromFile.stablePHP ?? '')) {
        stablePHPVersion = configurationFromFile.stablePHP as InstallablePhpVersionType;
    }

    let minimumPHPVersion: InstallablePhpVersionType = stablePHPVersion;
    let maximumPHPVersion: InstallablePhpVersionType = stablePHPVersion;

    if (phpVersionsSupportedByProject.length > 0) {
        minimumPHPVersion = phpVersionsSupportedByProject[0] as InstallablePhpVersionType;
        maximumPHPVersion =
            phpVersionsSupportedByProject[phpVersionsSupportedByProject.length - 1] as InstallablePhpVersionType;
    }

    configurationFromFile.extensions?.forEach((extension) => phpExtensions = phpExtensions.add(extension));

    return {
        codeChecks                    : requirements.codeChecks,
        docLinting                    : requirements.docLinting,
        versions                      : phpVersionsSupportedByProject,
        phpExtensions                 : [ ...phpExtensions ],
        stablePhpVersion              : stablePHPVersion,
        minimumPhpVersion             : minimumPHPVersion,
        latestPhpVersion              : maximumPHPVersion,
        phpIni                        : configurationFromFile.ini ?? [],
        lockedDependenciesExists      : fs.existsSync(composerLockJsonFileName),
        ignorePhpPlatformRequirements : configurationFromFile.ignore_php_platform_requirements ?? {},
        additionalComposerArguments   : [ ... new Set(configurationFromFile.additional_composer_arguments ?? []) ],
    };
}

export type IgnorePhpPlatformRequirements = Partial<Record<typeof INSTALLABLE_VERSIONS[number], boolean>>
