import {ToolType} from '../enum/toolType';
import {ToolExecutionType} from '../enum/toolExecutionType';

export const PhpCodeSnifferTool = {
    executionType     : ToolExecutionType.STATIC,
    name              : 'PHPCodeSniffer',
    command           : './vendor/bin/phpcs -q --report=checkstyle 2>/dev/null | cs2pr',
    filesToCheck      : [ 'phpcs.xml', 'phpcs.xml.dist' ],
    toolType          : ToolType.CODE_CHECK,
    lintConfigCommand : 'xmllint --schema vendor/squizlabs/php_codesniffer/phpcs.xsd',
};
