export const PHP_56 = '5.6';
export const PHP_70 = '7.0';
export const PHP_71 = '7.1';
export const PHP_72 = '7.2';
export const PHP_73 = '7.3';
export const PHP_74 = '7.4';
export const PHP_80 = '8.0';
export const PHP_81 = '8.1';
export const PHP_82 = '8.2';
export const PHP_83 = '8.3';

export const CURRENT_STABLE = PHP_80;
export const CONTAINER_DEFAULT_PHP_VERSION = '@default';

/**
 * NOTE: Please keep this list ordered as the ordering is used to detect the minimum supported version of a project
 *       If this list is being extended, please also update the `laminas-ci.schema.json` file as well.
 */
export const INSTALLABLE_VERSIONS = [
    PHP_56,
    PHP_70,
    PHP_71,
    PHP_72,
    PHP_73,
    PHP_74,
    PHP_80,
    PHP_81,
    PHP_82,
    PHP_83,
    CONTAINER_DEFAULT_PHP_VERSION,
] as const;

export type InstallablePhpVersionType = typeof INSTALLABLE_VERSIONS[number];

export function isInstallableVersion(version: string): version is InstallablePhpVersionType {
    return INSTALLABLE_VERSIONS.includes(version as InstallablePhpVersionType);
}
