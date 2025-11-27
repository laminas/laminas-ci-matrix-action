import { ToolType } from '../enum/toolType';
import { ToolExecutionType } from '../enum/toolExecutionType';

export const ComposerDependencyAnalyser = {
    executionType: ToolExecutionType.STATIC,
    name: 'Composer Dependency Analyser',
    command: './vendor/bin/composer-dependency-analyser',
    filesToCheck: ['composer-dependency-analyser.php'],
    toolType: ToolType.CODE_CHECK,
};

