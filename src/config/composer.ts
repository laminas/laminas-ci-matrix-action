export interface ComposerRequirements {
    [key: string]: string
}

/**
 * @title Package
 */
export interface ComposerJson {
    /**
     * @description This is a hash of package name (keys) and version constraints (values) that are required to run this package.
     */
    require?: ComposerRequirements

    /**
     * @description This is a hash of package name (keys) and version constraints (values) that this package requires for developing it (testing tools and such).
     */
    "require-dev"?: ComposerRequirements

    [key: string]: unknown
}
