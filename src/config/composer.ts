export interface ComposerRequirements {
    [key: string]: string
}

export interface ComposerJson {
    require?: ComposerRequirements
    'require-dev'?: ComposerRequirements
    [key: string]: unknown
}
