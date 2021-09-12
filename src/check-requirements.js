import core from '@actions/core';

export class Requirements {
    code_checks = true;
    doc_linting = true;

    /**
     * @param {Boolean} code_checks
     * @param {Boolean} doc_linting
     */
    constructor(code_checks, doc_linting) {
        this.code_checks = code_checks;
        this.doc_linting = doc_linting;
    }
}

/**
 * @param {Array} diff
 * @return {Requirements}
 */
export default function (diff) {
    let require_code_checks = true;
    let require_doc_linting = true;
    let require_all = false;

    if (diff.length) {
        core.info('Performing selective checks based on pull request patch diff');
        require_code_checks = false;
        require_doc_linting = false;

        diff.forEach(
            /**
             * @param {String} filename
             */
            function (filename) {
                if (require_code_checks && require_doc_linting) {
                    return;
                }

                if (filename.match(/\.laminas-ci.json$/)) {
                    core.info('- Enabling all checks as .laminas-ci.json has changed.');
                    require_all = true;
                    return;
                }

                if (! require_code_checks && filename.match(/\.php$/)) {
                    core.info('- Enabling code checks');
                    require_code_checks = true;
                }

                if (! require_code_checks && filename.match(/(phpunit|phpcs|psalm)\.xml(\.dist)?$/)) {
                    core.info('- Enabling code checks');
                    require_code_checks = true;
                }

                if (! require_code_checks && filename.match(/composer\.(json|lock)$/)) {
                    core.info('- Enabling code checks');
                    require_code_checks = true;
                }

                if (! require_code_checks && filename.match(/(^|[/\\])(\.github|src|lib|tests?|config|bin)[/\\]/)) {
                    core.info('- Enabling code checks');
                    require_code_checks = true;
                }

                if (! require_doc_linting && filename.match(/(^mkdocs.yml|docs?\/book\/.*\.md$)/)) {
                    core.info('- Enabling doc linting');
                    require_doc_linting = true;
                }
            }
        );
    }

    if (require_all) {
        return new Requirements(true, true);
    }

    return new Requirements(require_code_checks, require_doc_linting);
};
