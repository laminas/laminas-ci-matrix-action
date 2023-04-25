# Create a CI matrix for use in a GitHub Action

> ## 🇷🇺 Русским гражданам
> 
> Мы, участники Laminas, родились и живем в разных странах. У многих из нас есть друзья, родственники и коллеги как в России, так и в Украине. Некоторые из нас родились в России. Некоторые из нас живут в России. У некоторых бабушки и дедушки сражались с фашистами во Второй мировой войне. Здесь никто не поддерживает фашизм.
> 
> У одного из нас есть украинская родственница, которая спаслась из дома вместе с сыном. Поезд задержался из-за бомбежки на дороге впереди. У нас есть друзья, которые прячутся в бомбоубежищах. Мы с тревогой ждем весточки от них после воздушных налетов, которые беспорядочно наносят удары и попадают по больницам, школам, детским садам и домам. Мы не берем это из каких-либо СМИ. Мы наблюдаем это напрямую.
> 
> Вы доверяете нам достаточно, чтоб использовать наши программы, и мы просим вас довериться нам вновь. Мы нуждаемся в помощи. Выходите и протестуйте против этой бесполезной войны. Остановите кровопролитие. Скажите "Нет войне!"
> 
> ## 🇺🇸 To Citizens of Russia
> 
> We at Laminas come from all over the world. Many of us have friends, family and colleagues in both Russia and Ukraine. Some of us were born in Russia. Some of us currently live in Russia. Some have grandparents who fought Nazis in World War II. Nobody here supports fascism.
> 
> One team member has a Ukrainian relative who fled her home with her son. The train was delayed due to bombing on the road ahead. We have friends who are hiding in bomb shelters. We anxiously follow up on them after the air raids, which indiscriminately fire at hospitals, schools, kindergartens and houses. We're not taking this from any media. These are our actual experiences.
> 
> You trust us enough to use our software. We ask that you trust us to say the truth on this. We need your help. Go out and protest this unnecessary war. Stop the bloodshed. Say "stop the war!"

This repository represents a GitHub action that allows you to introspect a PHP project in order to build up a test matrix which can later be run by the [laminas/laminas-continuous-integration-action](https://github.com/laminas/laminas-continuous-integration-action).

It identifies jobs to run based on presence or absence of configuration files in the package.
Currently, it identifies the following:

- PHP versions to run unit tests against based on the `php` constraint in the `composer.json` file.
- Whether to run against a "locked" set of dependencies based on the presence of a `composer.lock` file.
- PHPUnit tests based on the presence of `phpunit.xml.dist` or `phpunit.xml` files.
- phpcs checks based on the presence of `phpcs.xml.dist` or `phpcs.xml` files.
- Psalm checks based on the presence of `psalm.xml.dist` or `psalm.xml` files.
- ComposerRequireChecker checks based on the presence of `composer-require-checker.json` file.
- phpbench benchmarks based on the presence of a `phpbench.json`.
- Infection mutation tests based on the presence of `infection.json` or `infection.json.dist`. In case that `roave/infection-static-analysis-plugin` is installed, this will be used instead.
- Markdown documentation based on the presence of a `mkdocs.yml` and/or markdown files in the `doc/book/` or `doc/books/` trees.
- Codeception checks based on the presence of `codeception.yml.dist` or `codeception.yml` files.

Further, when triggered by a `pull_request` event, it determines what checks are necessary based on which files were affected.

## Usage

```yaml
jobs:
  matrix:
    name: Generate job matrix
    runs-on: ubuntu-latest
    outputs:
      matrix: ${{ steps.matrix.outputs.matrix }}
    steps:
      - name: Gather CI configuration
        id: matrix
        uses: laminas/laminas-ci-matrix-action@v1

  qa:
    name: QA Checks
    needs: [matrix]
    runs-on: ${{ matrix.operatingSystem }}
    strategy:
      fail-fast: false
      matrix: ${{ fromJSON(needs.matrix.outputs.matrix) }}
    steps:
      - name: ${{ matrix.name }}
        uses: laminas/laminas-continuous-integration-action@v1
        with:
          job: ${{ matrix.job }}
```

Generally, you will use this as a dependency of a job that uses [laminas/laminas-continuous-integration-action](https://github.com/laminas/laminas-continuous-integration-action), as demonstrated in the above configuration.

> ### actions/checkout not required
>
> An actions/checkout step prior to this action is not required, as it will perform a checkout into the WORKDIR on its own if none has been performed previously.
> We recommend using actions/checkout only if you need to access QA artifacts in a later step.

## Outputs

It spits out a single output, "matrix", which is a JSON string in the following format:

```json
{
  "include": [
    {
      "name": "(string) Name of the check being run",
      "operatingSystem": "(string) Name of the OS the job should be run on (generally ubuntu-latest)",
      "action": "(string) GHA to run the step on; currently ignored, as GHA does not support dynamic action selection",
      "job": "(string) JSON object detailing the job (more on this later)"
    }
  ],
  "exclude": [
    {
    }
  ]
}
```

The "exclude" element will only be present if the package using the action provides it via configuration.
Each item in the "exclude" array will be an object, with one or more of the keys listed in the "include" objects; when a job matches all elements specified in the "exclude" array, it will be excluded from runs.

The "job" element is a string JSON object detailing the job to run.
Note: it is **not** an object; it is a JSON string but it MUST have the structure as shown [here](#job-element).

### Job Element

The "job" element will have the following elements, but is not restricted to them:

```json
{
  "php": "(optional) string PHP minor version to run against; @lowest and @latest aliases point to the minimum and maximum PHP versions which are supported by the project",
  "extensions": [
    "(optional) extension names to install; names are from the ondrej PHP repository, minus the php{VERSION}- prefix"
  ],
  "ini": [
    "(optional) php.ini directives, one per element; e.g. 'memory_limit=-1'"
  ],
  "dependencies": "(optional) dependencies to test against; one of lowest, locked, latest. default: locked",
  "command": "(required) command to run to perform the check", 
  "ignore_platform_reqs_8": "(optional; deprecated) boolean; whether to add `--ignore-platform-req=php` to composer for PHP 8.0. default: true",
  "ignore_php_platform_requirement": "(optional) boolean; whether to add `--ignore-platform-req=php` to composer for this job.",
  "additional_composer_arguments": [
      "(optional) list of arguments to be passed to `composer install` and `composer update`"
  ],
   "debugCommand": "(optional) command to run to perform the check when github action is executed with debug enabled*"
}
```

\* [github action with debug enabled](https://docs.github.com/en/actions/monitoring-and-troubleshooting-workflows/enabling-debug-logging)

## Configuration

The package can include a configuration file in its root, `.laminas-ci.json`, which can provide the following:

```json
{
  "extensions": [
    "extension names to install"
  ],
  "ini": [
    "php.ini directives"
  ],
  "checks": [
    {
    }
  ],
  "additional_checks": [
    {
    }
  ],
  "exclude": [
    {
    }
  ],
  "ignore_php_platform_requirements": {
      "8.0": true
  },
  "stablePHP": "8.0",
  "additional_composer_arguments": [
  ]
}
```

### Providing specific checks to run

If you do not want to autodiscover checks to run, you can provide the "checks" configuration.
Each element in that array should be in the same format as listed above for the outputs:

```json
{
  "name": "(string) Name of the check being run",
  "operatingSystem": "(string) Name of the OS the job should be run on (generally ubuntu-latest)",
  "action": "(string) GHA to run the step on; currently ignored, as GHA does not support dynamic action selection",
  "job": "(object|string) JSON object detailing the job"
}
```

The "job" element can either be a JSON string representing a job, or an object.
In each case, it MUST have the structure as shown [here](#job-element) **but** the "php" element is mandatory in here and MUST contain
the minor PHP version to run the check against.

The action validates each check and its job to ensure it is structured correctly, and will provide warnings if not, omitting any check that is malformed from the output.

**If the `checks` element is populated, the matrix will not include any auto-detected checks, and will only output the jobs listed in that element.**

### Providing additional checks

The `additional_checks` key allows package authors to provide checks to run in addition to any discovered.
This allows providing checks for tools the matrix discovery tools do not know about, or providing one-off checks (such as benchmarks or mutation tests).

The syntax for the `additional_checks` key is as follows:

```json
{
    "additional_checks": [
        {
            "name": "(string; REQUIRED) name of the check to run",
            "job": "(object) JSON object detailing the job"
        }
    ]
}
```

A job per PHP version per dependency set will be created, and the "name" will be appended with "on PHP {VERSION} with {DEPS} dependencies" during an actual run.
The "job" element MUST have the structure as shown [here](#job-element) **but** the "php" element is mandatory in here and MUST contain either the minor PHP version to run the check against or a wildcard `*` to run the against **all** supported PHP versions.
You can pass the wildcard, "*", for the "php" element; when you do, the `ignore_php_platform_requirement` element will be ignored. It is possible to provide per-version flags by adding the `ignore_php_platform_requirements` element instead.

The tool discovers checks first, then appends any `additional_checks` are concatenated, and then any `exclude` rules are applied.

### Excluding specific jobs

The easiest way to exclude a single job is via the `name` parameter:

```json
{
  "exclude": [
    {
      "name": "PHPUnit on PHP 8.0 with latest dependencies"
    }
  ]
}
```

## Testing matrix generation locally using Docker

To test matrix generation in a local checkout on your own machine, you can do the following:

```bash
$ docker run -v $(realpath .):/github/workspace -w=/github/workspace ghcr.io/laminas/laminas-ci-matrix:1
```

This will run the action locally and detail what matrix will be produced; it can be particularly useful for debugging issues with your `.laminas-ci.json` configuration.

## Development

In case you want to contribute features, bugfixes, tests or JSONSchema enhancements, you might want to build the docker container locally.

To do so, you can follow these steps:

1. Build the docker container by executing `$ docker build -t laminas/laminas-ci-matrix-action:dev-local .`
2. Change to the `tests/` directory you want to create a matrix for
3. Run the docker container while overriding the `entrypoint.sh` to ensure the `diff` is being passed to the matrix generator
   - `docker run -it --entrypoint "/action/main.js" -v $(realpath .):/github/workspace -w=/github/workspace docker.io/laminas/laminas-ci-matrix-action:dev-local $(test -r diff && cat diff || echo "")`
