import {PathLike} from 'fs';
import {configDotenv} from 'dotenv';
import createConfig, {gatherVersions} from './app';

beforeEach(() => {
    jest.resetModules();

    // Clean enviroment to avoid side-effects
    process.env = {};
});

describe('config/app', () => {
    describe('gatherVersions()', () => {
        test.each`
            constraint                     | expected
            ${'7.0'}                       | ${[ '7.0' ]}
            ${'^7.0'}                      | ${[ '7.0', '7.1', '7.2', '7.3', '7.4' ]}
            ${'8.1'}                       | ${[ '8.1' ]}
            ${'8.1.0'}                     | ${[ '8.1' ]}
            ${'8.1.12'}                    | ${[ '8.1' ]}
            ${'^8.1'}                      | ${[ '8.1', '8.2', '8.3', '8.4', '8.5' ]}
            ${'^8.1.0'}                    | ${[ '8.1', '8.2', '8.3', '8.4', '8.5' ]}
            ${'^8.1.12'}                   | ${[ '8.1', '8.2', '8.3', '8.4', '8.5' ]}
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
        const roaveBackwardCompatibilityPath: PathLike = 'tests/code-check-roave-backward-compatibility';

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
                backwardCompatibilityCheck    : false,
                baseReference                 : null,
            });
        });

        it('should detect GITHUB_BASE_REF', () => {
            const environment = process.env;

            configDotenv({path: `${roaveBackwardCompatibilityPath}/test.env`});

            expect(createConfig(
                {
                    codeChecks : true,
                    docLinting : true,
                },
                `${roaveBackwardCompatibilityPath}/composer.json`,
                `${roaveBackwardCompatibilityPath}/composer.lock`,
                `${roaveBackwardCompatibilityPath}/.laminas-ci.json`
            )).toEqual({
                codeChecks                    : true,
                docLinting                    : true,
                versions                      : [],
                stablePhpVersion              : '7.4',
                minimumPhpVersion             : '7.4',
                latestPhpVersion              : '7.4',
                lockedDependenciesExists      : false,
                phpExtensions                 : [],
                phpIni                        : [],
                ignorePhpPlatformRequirements : {},
                additionalComposerArguments   : [],
                backwardCompatibilityCheck    : true,
                baseReference                 : '1111222233334444aaaabbbbccccdddd',
            });

            process.env = environment;
        });

        it('should auto-enable backwardCompatibilityCheck for Laminas-related repositories', () => {
            const originalEnv = process.env;

            // Mock GITHUB_REPOSITORY for a Laminas repo
            process.env = {
                GITHUB_REPOSITORY: 'laminas/laminas-diactoros'
            };

            const config = createConfig(
                { codeChecks: true, docLinting: true },
                `${phpIniFromConfigurationPath}/composer.json`,
                `${phpIniFromConfigurationPath}/composer.lock`,
                `${phpIniFromConfigurationPath}/.laminas-ci.json`
            );

            expect(config.backwardCompatibilityCheck).toBe(true);

            // Mock GITHUB_REPOSITORY for a Mezzio repo
            process.env = {
                GITHUB_REPOSITORY: 'mezzio/mezzio-swoole'
            };

            const mezzioConfig = createConfig(
                { codeChecks: true, docLinting: true },
                `${phpIniFromConfigurationPath}/composer.json`,
                `${phpIniFromConfigurationPath}/composer.lock`,
                `${phpIniFromConfigurationPath}/.laminas-ci.json`
            );

            expect(mezzioConfig.backwardCompatibilityCheck).toBe(true);

            // Mock GITHUB_REPOSITORY for a laminas-api-tools repo
            process.env = {
                GITHUB_REPOSITORY: 'laminas-api-tools/api-tools-skeleton'
            };

            const apiToolsConfig = createConfig(
                { codeChecks: true, docLinting: true },
                `${phpIniFromConfigurationPath}/composer.json`,
                `${phpIniFromConfigurationPath}/composer.lock`,
                `${phpIniFromConfigurationPath}/.laminas-ci.json`
            );

            expect(apiToolsConfig.backwardCompatibilityCheck).toBe(true);

            process.env = originalEnv;
        });

        it('should NOT auto-enable backwardCompatibilityCheck for non-Laminas repositories', () => {
            const originalEnv = process.env;

            process.env = {
                GITHUB_REPOSITORY: 'some-user/some-repo'
            };

            const config = createConfig(
                { codeChecks: true, docLinting: true },
                `${phpIniFromConfigurationPath}/composer.json`,
                `${phpIniFromConfigurationPath}/composer.lock`,
                `${phpIniFromConfigurationPath}/.laminas-ci.json`
            );

            expect(config.backwardCompatibilityCheck).toBe(false);

            process.env = originalEnv;
        });

        it('should respect explicit false for backwardCompatibilityCheck even in Laminas repositories', () => {
            const originalEnv = process.env;

            process.env = {
                GITHUB_REPOSITORY: 'laminas/laminas-diactoros'
            };

            const bcCheckDisabledPath = 'tests/bc-check-disabled';
            const config = createConfig(
                { codeChecks: true, docLinting: true },
                `${bcCheckDisabledPath}/composer.json`,
                `${bcCheckDisabledPath}/composer.lock`,
                `${bcCheckDisabledPath}/.laminas-ci.json`
            );

            expect(config.backwardCompatibilityCheck).toBe(false);

            process.env = originalEnv;
        });
    });
});
