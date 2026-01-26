import {ToolType} from '../enum/toolType';
import {ToolExecutionType} from '../enum/toolExecutionType';

export const TwigCsFixerTool = {
    executionType : ToolExecutionType.STATIC,
    name          : 'Twig CS Fixer',
    command       : './vendor/bin/twig-cs-fixer lint --report checkstyle | cs2pr',
    filesToCheck  : [ '.twig-cs-fixer.php', '.twig-cs-fixer.dist.php' ],
    toolType      : ToolType.CODE_CHECK,
};
