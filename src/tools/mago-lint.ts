import {ToolExecutionType} from '../enum/toolExecutionType';
import {ToolType} from '../enum/toolType';

export const MagoLintTool = {
    executionType : ToolExecutionType.STATIC,
    name          : 'Mago Lint',
    command       : './vendor/bin/mago lint --reporting-format=github',
    filesToCheck  : [ 'mago.toml' ],
    toolType      : ToolType.CODE_CHECK,
}
