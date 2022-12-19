import {PathLike} from 'fs';
import createConfig, {gatherVersions} from './app';

describe('config/app', () => {
    describe('gatherVersions()', () => {
        test.each`
            constraint                     | expected
            ${'7.0'}                       | ${[ '7.0' ]}
            ${'^7.0'}                      | ${[ '7.0', '7.1', '7.2', '7.3', '7.4' ]}
            ${'8.1'}                       | ${[ '8.1' ]}
            ${'8.1.0'}                     | ${[ '8.1' ]}
            ${'8.1.12'}                    | ${[ '8.1' ]}
            ${'^8.1'}                      | ${[ '8.1', '8.2' ]}
            ${'^8.1.0'}                    | ${[ '8.1', '8.2' ]}
            ${'^8.1.12'}                   | ${[ '8.1', '8.2' ]}
            ${'~8.1'}                      | ${[ '8.1' ]}
            ${'~8.1.0'}                    | ${[ '8.1' ]}
            ${'~8.1.12'}                   | ${[ '8.1' ]}
            ${'^7.4 || ~8.0.0 || ~8.1.12'} | ${[ '7.4', '8.0', '8.1' ]}
            ${'<=8.1.0'}                   | ${[ '5.6', '7.0', '7.1', '7.2', '7.3', '7.4', '8.0', '8.1' ]}
        `('for "$constraint" === $expected', ({constraint, expected}) => {
            expect(gatherVersions({require: {php: constraint}})).toEqual(expected);
        });
    });

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
                stablePhpVersion              : '8.0',
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
