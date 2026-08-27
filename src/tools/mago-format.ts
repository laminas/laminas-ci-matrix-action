import {ToolExecutionType} from '../enum/toolExecutionType';
import {ToolType} from '../enum/toolType';

export const MagoFormatTool = {
    executionType : ToolExecutionType.STATIC,
    name          : 'Mago Format',
    command       : './vendor/bin/mago format --check',
    filesToCheck  : [ 'mago.toml' ],
    toolType      : ToolType.CODE_CHECK,
}
