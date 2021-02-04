# Create a CI matrix for use in a GitHub Action

This repository represents a GitHub action that allows you to introspect a PHP project in order to build up a test matrix which can later be run by the [laminas/laminas-continuous-integration-action](https://github.com/laminas/laminas-continuous-integration-action).

It identifies jobs to run based on presence or absence of configuration files in the package.
Currently, it identifies the following:

- PHP versions to run unit tests against based on the `php` constraint in the `composer.json` file.
- Whether to run against a "locked" set of dependencies based on the presence of a `composer.lock` file.
- PHPUnit tests based on the presence of `phpunit.xml.dist` or `phpunit.xml` files.
- phpcs checks based on the presence of `phpcs.xml.dist` or `phpcs.xml` files.
- Psalm checks based on the presence of `psalm.xml.dist` or `psalm.xml` files.
- phpbench benchmarks based on the presence of a `phpbench.json`.

## Usage

```yaml
jobs:
  matrix:
    name: Generate job matrix
    runs-on: ubuntu-latest
    outputs:
      matrix: ${{ steps.matrix.outputs.matrix }}
    steps:
      - uses: actions/checkout@v2
        name: Gather CI configuration
        id: matrix
        uses: laminas/laminas-ci-matrix-action@v0

  qa:
    name: QA Checks
    needs: [matrix]
    runs-on: ${{ matrix.operatingSystem }}
    strategy:
      fail-fast: false
      matrix: ${{ fromJSON(needs.matrix.outputs.matrix) }}
    steps:
      - name: ${{ matrix.name }}
        uses: laminas/laminas-continuous-integration-action@v0
        with:
          job: ${{ matrix.job }}
```

Generally, you will use this as a dependency of a job that uses [laminas/laminas-continuous-integration-action](https://github.com/laminas/laminas-continuous-integration-action), as demonstrated in the above configuration.

## Outputs

It spits out a single output, "matrix", which is a JSON string in the following format:

```json
{
  "include": [
    {
      "name": "(string) Name of the check being run",
      "operatingSystem": "(string) Name of the OS the job should be run on (generally ubuntu-latest)",
      "action": "(string) GHA to run the step on; currently ignored, as GHA does not support dynamic action selection",
      "job": "(string) JSON object detailing the job (more on this later)",
    },
  ],
  "exclude: [
    {
    }
  ]
}
```

The "exclude" element will only be present if the package using the action provides it via configuration.
Each item in the "exclude" array will be an object, with one or more of the keys listed in the "include" objects; when a job matches all elements specified in the "exclude" array, it will be excluded from runs.

The "job" element is a string JSON object detailing the job to run.
Note: it is **not** an object; it is a JSON string.
It will have the following elements, but is not restricted to them:

```json
{
  "php": "string PHP minor version to run against",
  "extensions": [
    "extension names to install; names are from the ondrej PHP repository, minus the php{VERSION}- prefix",
  ],
  "ini": [
    "php.ini directives, one per element; e.g. 'memory_limit=-1'",
  ],
  "dependencies": "dependencies to test against; one of lowest, locked, latest",
  "command": "command to run to perform the check",
}
```

## Configuration

The package can include a configuration file in its root, `.laminas-ci.json`, which can provide the following:

```json
{
  "extensions": [
    "extension names to install",
  ],
  "ini": [
    "php.ini directives",
  ],
  "checks": [
    {
    },
  ],
  "exclude": [
    {
    }
  ]
}
```

The "checks" array should be in the same format as listed above for the outputs.
Please remember that the **job** element **MUST** be a JSON **string**
