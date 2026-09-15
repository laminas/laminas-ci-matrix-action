import {ToolExecutionType} from '../enum/toolExecutionType';
import {ToolType} from '../enum/toolType';

export const StructArmedTool = {
    executionType : ToolExecutionType.STATIC,
    name          : 'StructArmed',
    command       : './vendor/bin/structarmed analyse',
    filesToCheck  : [ 'structarmed.php' ],
    toolType      : ToolType.CODE_CHECK,
};
