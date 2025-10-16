import {ToolType} from '../enum/toolType';
import {ComposerJson} from '../config/composer';
import parseJsonFile from '../json';
import {ToolExecutionType} from '../enum/toolExecutionType';

export const InfectionTool = {
    executionType : ToolExecutionType.STATIC,
    name          : 'Infection',
    command       : detectInfectionCommand(),
    filesToCheck  : [ 'infection.json', 'infection.json.dist' ],
    toolType      : ToolType.CODE_CHECK,
};

function detectInfectionCommand(): string {
    const composerJson: ComposerJson = parseJsonFile('composer.json', true) as ComposerJson;

    if (composerJson['require-dev']?.['roave/infection-static-analysis-plugin'] !== undefined) {
        return './vendor/bin/roave-infection-static-analysis-plugin';
    }

    return './vendor/bin/infection';
}
