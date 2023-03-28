<p align="center">
  <a href="https://github.com/actions/typescript-action/actions"><img alt="typescript-action status" src="https://github.com/actions/typescript-action/workflows/build-test/badge.svg"></a>
</p>

# Code Analyzer Action

Code Analyzer Action is a GitHub Action plugin to execute [Salesforce Code Analyzer](https://forcedotcom.github.io/sfdx-scanner/) and collect results. It takes parameters mostly equivalent to the Code Analyzer tool. When requested, it can render results as a markdown summary using Code Analyzer Translator plugin.
Overall, it takes care of:

* Installing dependencies such as Node LTS and JVM 11
* Installing Salesforce CLI
* Installing Code Analyzer
* Executing Code Analyzer and collecting results
* Rendering results if requested

This repository is maintained by Salesforce Code Analyzer team.

## Usage

Execute Code Analyzer and render output as markdown. By default, "simple" runtype is invoked. A previous step in the workflow has collected the list of target files that were changed in the PR. You can find the full example in [forcedotcom/tdx23-sfca-demo](https://github.com/forcedotcom/tdx23-sfca-demo).

```
          - name: Execute Code Analyzer
            id: execute-code-analyzer
            uses: forcedotcom/code-analyzer-action
            with:
              render-results: true
              target: "${{ steps.populate-target.outputs.Target }}"
```

Execute Code Analyzer and download CSV output file for further action. This example also overrides the default and include "dfa" runtype. Notice that `outfile-artifact-name` parameter on `code-analyzer-action` matches `name` parameter on `download-artifact` action, and `outfile` parameter on `code-analyzer-action` matches `path` parameter in `download-artifact` action.

```
          - name: Execute Code Analyzer
            id: execute-code-analyzer
            uses: forcedotcom/code-analyzer-action
            with:
              render-results: false
              outfile-artifact-name: "SFCA-Results"
              outfile: "results.csv"
              runtype: dfa
              projectdir: "force-app/main/default"
              target: "${{ steps.populate-target.outputs.Target }}"
              
          - uses: actions/download-artifact@v3
            with:
              name: "SFCA-Results"
              path: "results.csv"
```

## Parameters

### `target`

*(required)*

Glob pattern, directory, or comma separated list of files to execute Code Analyzer. See [scanner:run](https://forcedotcom.github.io/sfdx-scanner/en/v3.x/scanner-commands/run/) and [scanner:run:dfa](https://forcedotcom.github.io/sfdx-scanner/en/v3.x/scanner-commands/dfa/) for information.

### `render-results`

*(required)*

Takes "true" or "false" as values. If "true", Code Analyzer Action will render results as a markdown summary using [Code Analyzer Translator](). Else, `outfile-artifact-name` and `outfile` should be provided to upload results.

### `outfile-artifact-name`

*Default value:* "SFCA-Results"

Required only when `render-results` is "false".

Artifact name to be used for uploading results file. Defaults to "SFCA-Results". Use this name to download results if needed.

### `runtype`

*Default value:* "simple"

Valid values are "simple" and "dfa". Invokes [`scanner:run`](https://forcedotcom.github.io/sfdx-scanner/en/v3.x/scanner-commands/run/) with "simple" and [`scanner:run:dfa`](https://forcedotcom.github.io/sfdx-scanner/en/v3.x/scanner-commands/dfa/) with "dfa".

### `category`

Comma-separated categories to run. See [scanner:run](https://forcedotcom.github.io/sfdx-scanner/en/v3.x/scanner-commands/run/) and [scanner:run:dfa](https://forcedotcom.github.io/sfdx-scanner/en/v3.x/scanner-commands/dfa/) for information.

### `engine`

Provide comma-separated values of Code Analyzer engine(s) to excecute. Defaults to Code Analyzer defaults based on runtype. See [scanner:run](https://forcedotcom.github.io/sfdx-scanner/en/v3.x/scanner-commands/run/) for information.


### `env`

Override ESLint default environment variables, in JSON-formatted string. See [scanner:run](https://forcedotcom.github.io/sfdx-scanner/en/v3.x/scanner-commands/run/) for information.


### `eslintconfig`

Location of custom config to execute eslint engine. See [scanner:run](https://forcedotcom.github.io/sfdx-scanner/en/v3.x/scanner-commands/run/) for information.

### `outfile`

*Default value:* "sfca_results.json"

Output file to collect the results in. Format depends on the extension of the filename. See [scanner:run](https://forcedotcom.github.io/sfdx-scanner/en/v3.x/scanner-commands/run/) and [scanner:run:dfa](https://forcedotcom.github.io/sfdx-scanner/en/v3.x/scanner-commands/dfa/) for information.


### `pathexplimit`

Path expansion upper boundary limit. Can be used only when `runtype` is "dfa". See [scanner:run:dfa](https://forcedotcom.github.io/sfdx-scanner/en/v3.x/scanner-commands/dfa/) for information.

### `pmdconfig`

Location of PMD Rule Reference XML to customize PMD engine. See [scanner:run](https://forcedotcom.github.io/sfdx-scanner/en/v3.x/scanner-commands/run/) for information.

### `projectdir`

Path to project repository. Necessary when invoking `sfge` engine. Defaults to current directory. See [scanner:run](https://forcedotcom.github.io/sfdx-scanner/en/v3.x/scanner-commands/run/) and [scanner:run:dfa](https://forcedotcom.github.io/sfdx-scanner/en/v3.x/scanner-commands/dfa/) for information.


### `rule-disable-warning-violation`

Disables warning violations. Can be used only when `runtype` is "dfa". See [scanner:run:dfa](https://forcedotcom.github.io/sfdx-scanner/en/v3.x/scanner-commands/dfa/) for information.

### `rule-thread-count`

Number to threads to execute rules in Graph Engine. Can be used only when `runtype` is "dfa". See [scanner:run:dfa](https://forcedotcom.github.io/sfdx-scanner/en/v3.x/scanner-commands/dfa/) for information.

### `rule-thread-timeout`

Thread timeout in milliseconds on Graph Engine. Can be used only when `runtype` is "dfa". See [scanner:run:dfa](https://forcedotcom.github.io/sfdx-scanner/en/v3.x/scanner-commands/dfa/) for information.

### `severitythreshold`

*Default value:* 3

Fail run when violation severity equals or exceeds this number. See [scanner:run](https://forcedotcom.github.io/sfdx-scanner/en/v3.x/scanner-commands/run/) and [scanner:run:dfa](https://forcedotcom.github.io/sfdx-scanner/en/v3.x/scanner-commands/dfa/) for information.

### `sfgejvmargs`

JVM args to control Graph Engine run. Can be used only when `runtype` is "dfa". See [scanner:run:dfa](https://forcedotcom.github.io/sfdx-scanner/en/v3.x/scanner-commands/dfa/) for information.


### `tsconfig`

Location of tsconfig file while executing eslint-typescript engine. See [scanner:run](https://forcedotcom.github.io/sfdx-scanner/en/v3.x/scanner-commands/run/) for information.

## Development

Code Analyzer Action is implemented as a composite GitHub Actions plugin written with mostly bash shell.

## Contributing

We welcome external contributions for features and bug fixes.

### Publish to a distribution branch

See the [versioning documentation](https://github.com/actions/toolkit/blob/master/docs/action-versioning.md).
