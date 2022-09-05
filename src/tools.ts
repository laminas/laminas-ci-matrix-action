import fs, { PathLike } from 'fs';
import { Config } from './config/app';
import { ComposerJson } from './config/composer';
import parseJsonFile from './json';

export enum ToolExecutionType {
    /**
     * @description Executed on every supported PHP version with lowest & latest dependencies.
     *              In case, a lock-file is present, the minimum supported PHP version will also run with LOCKED
     *              dependencies.
     */
    MATRIX = 'matrix',

    /**
     * @description Executed on the minimum PHP version with either LOCKED or LATEST dependencies.
     */
    STATIC = 'static',
}

enum ToolType {
    LINTER = 'linter',
    CODE_CHECK = 'code_check',
}

export type Tool = {
    executionType: ToolExecutionType,
    toolType: ToolType,
    name: string;
    command: string;
    filesToCheck: PathLike[],
    lintConfigCommand?: string,
}

function detectInfectionCommand(): string {
    const composerJson: ComposerJson = parseJsonFile('composer.json', true) as ComposerJson;

    if (composerJson['require-dev']?.['roave/infection-static-analysis-plugin'] !== undefined) {
        return 'phpdbg -qrr ./vendor/bin/roave-infection-static-analysis-plugin';
    }

    return 'phpdbg -qrr ./vendor/bin/infection';
}

export default function createTools(config: Config): Array<Tool> {
    return [
        {
            executionType : ToolExecutionType.STATIC,
            name          : 'Documentation Linting',
            command       : 'markdownlint doc/book/**/*.md',
            filesToCheck  : [ 'doc/book/' ],
            toolType      : ToolType.LINTER,
        },
        {
            executionType : ToolExecutionType.STATIC,
            name          : 'Documentation Linting',
            command       : 'markdownlint docs/book/**/*.md',
            filesToCheck  : [ 'docs/book/' ],
            toolType      : ToolType.LINTER,
        },
        {
            executionType : ToolExecutionType.STATIC,
            name          : 'MkDocs Linting',
            command       : 'yamllint -d relaxed --no-warnings mkdocs.yml',
            filesToCheck  : [ 'mkdocs.yml' ],
            toolType      : ToolType.LINTER,
        },
        {
            executionType     : ToolExecutionType.MATRIX,
            name              : 'PHPUnit',
            command           : './vendor/bin/phpunit',
            filesToCheck      : [ 'phpunit.xml.dist', 'phpunit.xml' ],
            toolType          : ToolType.CODE_CHECK,
            lintConfigCommand : 'xmllint --schema vendor/phpunit/phpunit/phpunit.xsd',
        },
        {
            executionType : ToolExecutionType.STATIC,
            name          : 'Infection',
            command       : detectInfectionCommand(),
            filesToCheck  : [ 'infection.json', 'infection.json.dist' ],
            toolType      : ToolType.CODE_CHECK,
        },
        {
            executionType     : ToolExecutionType.STATIC,
            name              : 'PHPCodeSniffer',
            command           : './vendor/bin/phpcs -q --report=checkstyle | cs2pr',
            filesToCheck      : [ 'phpcs.xml', 'phpcs.xml.dist' ],
            toolType          : ToolType.CODE_CHECK,
            lintConfigCommand : 'xmllint --schema vendor/squizlabs/php_codesniffer/phpcs.xsd',
        },
        {
            executionType     : ToolExecutionType.STATIC,
            name              : 'Psalm',
            command           : './vendor/bin/psalm --shepherd --stats --output-format=github --no-cache',
            filesToCheck      : [ 'psalm.xml.dist', 'psalm.xml' ],
            toolType          : ToolType.CODE_CHECK,
            lintConfigCommand : 'xmllint --schema vendor/vimeo/psalm/config.xsd',
        },
        {
            executionType : ToolExecutionType.STATIC,
            name          : 'Composer Require Checker',
            command       : './vendor/bin/composer-require-checker check --config-file=composer-require-checker.json -n -v composer.json',
            filesToCheck  : [ 'composer-require-checker.json' ],
            toolType      : ToolType.CODE_CHECK,
        },
        {
            executionType : ToolExecutionType.STATIC,
            name          : 'PHPBench',
            command       : './vendor/bin/phpbench run --revs=2 --iterations=2 --report=aggregate',
            filesToCheck  : [ 'phpbench.json' ],
            toolType      : ToolType.CODE_CHECK,
        },
        {
            executionType : ToolExecutionType.STATIC,
            name          : 'Codeception',
            command       : './vendor/bin/codecept run',
            filesToCheck  : [ 'codeception.yml.dist', 'codeception.yml' ],
            toolType      : ToolType.CODE_CHECK,
        },
        {
            executionType : ToolExecutionType.STATIC,
            name          : 'PHP CS Fixer',
            command       : './vendor/bin/php-cs-fixer fix -v --diff --dry-run',
            filesToCheck  : [ '.php-cs-fixer.php', '.php-cs-fixer.dist.php' ],
            toolType      : ToolType.CODE_CHECK,
        }
    ]
        // Remove all tools which do not need to run
        .filter((tool) =>
            (config.docLinting && tool.toolType === ToolType.LINTER)
            || (config.codeChecks && tool.toolType === ToolType.CODE_CHECK))
        // Remove all tools which are not used by the project
        .map((tool) => removeNonExistentFilesToCheck(tool))
        .filter((tool) => tool.filesToCheck.length > 0);
}

export function removeNonExistentFilesToCheck(tool: Tool): Tool {
    return {
        ...tool,
        filesToCheck : tool.filesToCheck.filter((file) => fs.existsSync(file))
    };
}
