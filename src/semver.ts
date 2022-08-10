import {execSync} from 'child_process';

export function satisfies(version: string, constraint: string): boolean {
    try {
        execSync(`/usr/local/bin/composer-semver.phar semver:match "${version}" "${constraint}" > /dev/null`);

        return true;
    } catch {
        return false;
    }
}
