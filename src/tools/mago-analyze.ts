import {ToolExecutionType} from '../enum/toolExecutionType';
import {ToolType} from '../enum/toolType';

export const MagoAnalyzeTool = {
    executionType : ToolExecutionType.STATIC,
    name          : 'Mago Analyze',
    command       : './vendor/bin/mago analyze --reporting-format=github',
    filesToCheck  : [ 'mago.toml' ],
    toolType      : ToolType.CODE_CHECK,
}
