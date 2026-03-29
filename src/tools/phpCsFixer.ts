import {ToolType} from '../enum/toolType';
import {ToolExecutionType} from '../enum/toolExecutionType';

export const PhpCsFixerTool = {
    executionType : ToolExecutionType.STATIC,
    name          : 'PHP CS Fixer',
    command       : './vendor/bin/php-cs-fixer fix -v --diff --dry-run --format=checkstyle 2>/dev/null | cs2pr',
    filesToCheck  : [ '.php-cs-fixer.php', '.php-cs-fixer.dist.php' ],
    toolType      : ToolType.CODE_CHECK,
};
