import {InstallablePhpVersionType} from './php';
import {ComposerDependencySet, IgnorePhpPlatformRequirements} from './app';

export interface JobToExcludeFromFile {
    name: string;
    php?: InstallablePhpVersionType,
    dependencies?: ComposerDependencySet,
}

export interface ConfigurationFromFile {
    extensions?: string[];
    ini?: string[];
    ignore_php_platform_requirements?: IgnorePhpPlatformRequirements;
    stablePHP?: string;
    additional_composer_arguments?: string[];
}

export interface JobExclusionsFromFile {
    exclude?: [JobToExcludeFromFile, ...JobToExcludeFromFile[]];
}

export interface AdditionalChecksConfigurationFromFile extends ConfigurationFromFile, JobExclusionsFromFile {
    additional_checks?: [JobFromFile, ...JobFromFile[]];
}

export interface ExplicitChecksConfigurationFromFile extends ConfigurationFromFile {
    checks?: [JobFromFile, ...JobFromFile[]];
}

export function isAdditionalChecksConfiguration(
    config: ConfigurationFromFile
): config is AdditionalChecksConfigurationFromFile {
    return ((config as AdditionalChecksConfigurationFromFile).additional_checks ?? []).length > 0;
}

export function isExplicitChecksConfiguration(
    config: ConfigurationFromFile
): config is ExplicitChecksConfigurationFromFile {
    return ((config as ExplicitChecksConfigurationFromFile).checks ?? []).length > 0;
}

export function isConfigurationContainingJobExclusions(
    config: ConfigurationFromFile
): config is JobExclusionsFromFile&ConfigurationFromFile {
    return ((config as JobExclusionsFromFile).exclude ?? []).length > 0;
}

export const LOWEST_ALIAS = '@lowest' as const;
export const LATEST_ALIAS = '@latest' as const;
export const WILDCARD_ALIAS = '*' as const;

export type AnyPhpVersionType = typeof WILDCARD_ALIAS;
export function isAnyPhpVersionType(version: string): version is AnyPhpVersionType {
    return version === WILDCARD_ALIAS;
}

export type LowestPhpVersionType = typeof LOWEST_ALIAS;
export function isLowestPhpVersionType(version: string): version is LowestPhpVersionType {
    return version === LOWEST_ALIAS;
}

export type LatestPhpVersionType = typeof LATEST_ALIAS;
export function isLatestPhpVersionType(version: string): version is LatestPhpVersionType {
    return version === LATEST_ALIAS;
}

export interface JobFromFile {
    name: string;
    job: JobDefinitionFromFile;
    operatingSystem?: string;
    action?: string;
}

export interface JobDefinitionFromFile {
    php?: InstallablePhpVersionType | AnyPhpVersionType | LowestPhpVersionType | LatestPhpVersionType;
    extensions?: string[];
    ini?: string[];
    dependencies?: AnyComposerDependencySet | ComposerDependencySet;
    ignore_php_platform_requirement?: boolean;
    additional_composer_arguments: string[];
    command: string;
    before_script: string[];
}

export type AnyComposerDependencySet = typeof WILDCARD_ALIAS;
export function isAnyComposerDependencySet(dependency: string): dependency is AnyComposerDependencySet {
    return dependency === WILDCARD_ALIAS;
}
