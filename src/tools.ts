import fs, {PathLike} from 'fs';
import {Config} from './config/app';
import {CONTAINER_DEFAULT_PHP_VERSION} from './config/php';
import {PHPUnitTool} from './tools/phpunit';
import {InfectionTool} from './tools/infection';
import {PhpCodeSnifferTool} from './tools/codesniffer';
import {PsalmTool} from './tools/psalm';
import {ComposerRequireCheckerTool} from './tools/composerRequireChecker';
import {ComposerDependencyAnalyser} from './tools/composerDependencyAnalyser';
import {PhpBenchTool} from './tools/phpbench';
import {CodeceptionTool} from './tools/codeception';
import {PhpCsFixerTool} from './tools/phpCsFixer';
import {PHPStanTool} from './tools/phpstan';
import {ComposerValidateTool} from './tools/composerValidate';
import {ToolExecutionType} from './enum/toolExecutionType';
import {ToolType} from './enum/toolType';

export type Tool = {
    executionType: ToolExecutionType,
    toolType: ToolType,
    name: string;
    command: string;
    filesToCheck: PathLike[],
    lintConfigCommand?: string,
}

export type ToolRunningContainerDefaultPhpVersion = Tool & {
    php: typeof CONTAINER_DEFAULT_PHP_VERSION,
}

function backwardCompatibilityCheckTool(config: Config): ToolRunningContainerDefaultPhpVersion | null {
    if (!config.backwardCompatibilityCheck) {
        return null;
    }

    if (config.baseReference === null) {
        return null;
    }

    return {
        executionType : ToolExecutionType.STATIC,
        name          : 'Backward Compatibility Check',
        command       : `roave-backward-compatibility-check --from=${ config.baseReference } --install-development-dependencies`,
        filesToCheck  : [ 'composer.json' ],
        toolType      : ToolType.CODE_CHECK,
        php           : CONTAINER_DEFAULT_PHP_VERSION,
    } as ToolRunningContainerDefaultPhpVersion;
}

export default function createTools(config: Config): Array<Tool> {
    const tools = [
        {
            executionType : ToolExecutionType.STATIC,
            name          : 'Documentation Linting',
            command       : "markdownlint 'doc/book/**/*.md'",
            filesToCheck  : [ 'doc/book/' ],
            toolType      : ToolType.LINTER,
        },
        {
            executionType : ToolExecutionType.STATIC,
            name          : 'Documentation Linting',
            command       : "markdownlint 'docs/book/**/*.md'",
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
            executionType : ToolExecutionType.STATIC,
            name          : 'README Linting',
            command       : 'markdownlint README.md',
            filesToCheck  : [ 'README.md' ],
            toolType      : ToolType.LINTER,
        },
        PHPUnitTool,
        InfectionTool,
        PhpCodeSnifferTool,
        PsalmTool,
        ComposerRequireCheckerTool,
        ComposerDependencyAnalyser,
        PhpBenchTool,
        CodeceptionTool,
        PhpCsFixerTool,
        PHPStanTool,
        ComposerValidateTool,
        backwardCompatibilityCheckTool(config),
    ].filter((tool) => tool !== null) as Tool[];

    return tools
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

export function isToolRunningContainerDefaultPhpVersion(tool: Tool): tool is ToolRunningContainerDefaultPhpVersion {
    return (tool as ToolRunningContainerDefaultPhpVersion).php === CONTAINER_DEFAULT_PHP_VERSION;
}