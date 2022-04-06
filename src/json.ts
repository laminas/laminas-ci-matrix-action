import fs, { PathLike } from 'fs';

export const SPACES_TO_INDENT_JSON = 2;

export function parseJsonFile(jsonFile: PathLike, allowMissing: boolean = true): object {
    if (allowMissing && !fs.existsSync(jsonFile)) {
        return {};
    }

    let parsedJsonFile;

    try {
        parsedJsonFile = JSON.parse(fs.readFileSync(jsonFile).toString());
    } catch (error) {
        let failedReason = JSON.stringify(error);

        if (error instanceof SyntaxError) {
            failedReason = `${error.message}`;
        }

        throw new Error(`Failed to parse ${jsonFile}: ${failedReason}`);
    }

    const jsonFileContentType = typeof parsedJsonFile;

    if (jsonFileContentType !== 'object') {
        throw new Error(`Expected that "${jsonFile}" contains a JSON object. Got: ${jsonFileContentType}`);
    }

    return parsedJsonFile;
}

export default parseJsonFile;
