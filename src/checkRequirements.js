import core from '@actions/core';

export class Requirements {
    codeChecks = true;

    docLinting = true;

    /**
     * @param {Boolean} codeChecks
     * @param {Boolean} docLinting
     */
    constructor(codeChecks, docLinting) {
        this.codeChecks = codeChecks;
        this.docLinting = docLinting;
    }
}

const CODE_CHECKS_ENABLED_MESSAGE = '- Enabling code checks';
/**
 * @param {Array} diff
 * @return {Requirements}
 */

export default function (diff) {
    let requireCodeChecks = true;

    let requireDocLinting = true;

    let requireAll = false;

    if (diff.length > 0) {
        core.info('Performing selective checks based on pull request patch diff');
        requireCodeChecks = false;
        requireDocLinting = false;

        diff.forEach(
            /**
             * @param {String} filename
             */
            (filename) => {
                if (requireCodeChecks && requireDocLinting) {
                    return;
                }

                if (/\.laminas-ci.json$/.test(filename)) {
                    core.info('- Enabling all checks as .laminas-ci.json has changed.');
                    requireAll = true;

                    return;
                }

                if (!requireCodeChecks && /\.php$/.test(filename)) {
                    core.info(CODE_CHECKS_ENABLED_MESSAGE);
                    requireCodeChecks = true;
                }

                if (!requireCodeChecks && /(phpunit|phpcs|psalm)\.xml(\.dist)?$/.test(filename)) {
                    core.info(CODE_CHECKS_ENABLED_MESSAGE);
                    requireCodeChecks = true;
                }

                if (!requireCodeChecks && /composer\.(json|lock)$/.test(filename)) {
                    core.info(CODE_CHECKS_ENABLED_MESSAGE);
                    requireCodeChecks = true;
                }

                if (!requireCodeChecks && /composer-require-checker\.json$/.test(filename)) {
                    core.info(CODE_CHECKS_ENABLED_MESSAGE);
                    requireCodeChecks = true;
                }

                if (!requireCodeChecks && /(^|[/\\])(\.github|src|lib|tests?|config|bin)[/\\]/.test(filename)) {
                    core.info(CODE_CHECKS_ENABLED_MESSAGE);
                    requireCodeChecks = true;
                }

                if (!requireDocLinting && /(^mkdocs.yml|docs?\/book\/.*\.md$)/.test(filename)) {
                    core.info('- Enabling doc linting');
                    requireDocLinting = true;
                }
            }
        );
    }

    if (requireAll) {
        return new Requirements(true, true);
    }

    return new Requirements(requireCodeChecks, requireDocLinting);
}
