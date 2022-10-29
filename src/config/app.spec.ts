import {PathLike} from 'fs';
import createConfig from './app';

describe('config/app', () => {
    describe('createConfig()', () => {
        const phpIniFromConfigurationPath: PathLike = 'tests/php-ini-from-configuration';

        it('should return valid config', () => {
            expect(createConfig(
                {
                    codeChecks : true,
                    docLinting : true,
                },
                `${phpIniFromConfigurationPath}/composer.json`,
                `${phpIniFromConfigurationPath}/composer.lock`,
                `${phpIniFromConfigurationPath}/.laminas-ci.json`
            )).toEqual({
                codeChecks                    : true,
                docLinting                    : true,
                versions                      : [ '8.1' ],
                stablePhpVersion              : '8.1',
                minimumPhpVersion             : '8.1',
                latestPhpVersion              : '8.1',
                lockedDependenciesExists      : false,
                phpExtensions                 : [ 'mbstring', 'json' ],
                phpIni                        : [ 'error_reporting=E_ALL' ],
                ignorePhpPlatformRequirements : {},
                additionalComposerArguments   : [],
            });
        });
    });
});
