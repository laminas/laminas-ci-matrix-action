import fs, { PathLike } from 'fs';

export const SPACES_TO_INDENT_JSON = 2;

export function parseJsonFile(configFile: PathLike, allowMissing = true): object {
    if (allowMissing && !fs.existsSync(configFile)) {
        return {};
    }

    let parsedJsonFile;

    try {
        parsedJsonFile = fs.readFileSync(configFile).toJSON();
    } catch (error) {
        let failedReason = JSON.stringify(error);

        if (error instanceof SyntaxError) {
            failedReason = `${error.message}`;
        }

        throw new Error(`Failed to parse ${configFile}: ${failedReason}`);
    }

    const jsonFileContentType = typeof parsedJsonFile;

    if (jsonFileContentType !== 'object') {
        throw new Error(`Expected that "${configFile}" contains a JSON object. Got: ${jsonFileContentType}`);
    }

    return parsedJsonFile;
}

export default parseJsonFile;
