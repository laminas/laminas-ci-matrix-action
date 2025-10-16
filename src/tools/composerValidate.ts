import {ToolType} from '../enum/toolType';
import {ToolExecutionType} from '../enum/toolExecutionType';

export const ComposerValidateTool = {
    executionType     : ToolExecutionType.STATIC,
    name              : 'Composer Validate',
    command           : 'composer validate --strict',
    filesToCheck      : [ 'composer.json' ],
    toolType          : ToolType.CODE_CHECK,
};
