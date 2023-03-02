export const PHP_80 = '8.0';
export const PHP_81 = '8.1';
export const PHP_82 = '8.2';

export const CURRENT_STABLE = PHP_80;

/**
 * NOTE: Please keep this list ordered as the ordering is used to detect the minimum supported version of a project
 *       If this list is being extended, please also update the `laminas-ci.schema.json` file as well.
 */
export const INSTALLABLE_VERSIONS = [
    PHP_80,
    PHP_81,
    PHP_82
] as const;

export type InstallablePhpVersionType = typeof INSTALLABLE_VERSIONS[number];

export function isInstallableVersion(version: string): version is InstallablePhpVersionType {
    return INSTALLABLE_VERSIONS.includes(version as InstallablePhpVersionType);
}
