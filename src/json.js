import core from "@actions/core";
import fs from "fs";

/**
 * @param {String} configFile
 * @param {Boolean} allowMissing
 * @return {Object}
 */
const parseJsonFile = function (configFile, allowMissing = true) {
    if (allowMissing && ! fs.existsSync(configFile)) {
        return {};
    }

    try {
        return JSON.parse(fs.readFileSync(configFile));
    } catch (error) {
        core.setFailed('Failed to parse ' + configFile + ': ' + error.message);
        process.exit(1);
    }
}

export default parseJsonFile;
