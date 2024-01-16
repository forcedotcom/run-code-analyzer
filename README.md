# Run Salesforce Code Analyzer - GitHub Action

[![GitHub Super-Linter](https://github.com/actions/typescript-action/actions/workflows/linter.yml/badge.svg)](https://github.com/super-linter/super-linter)
![CI](https://github.com/actions/typescript-action/actions/workflows/ci.yml/badge.svg)
[![Check dist/](https://github.com/actions/typescript-action/actions/workflows/check-dist.yml/badge.svg)](https://github.com/actions/typescript-action/actions/workflows/check-dist.yml)
[![CodeQL](https://github.com/actions/typescript-action/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/actions/typescript-action/actions/workflows/codeql-analysis.yml)
[![Coverage](./badges/coverage.svg)](./badges/coverage.svg)

The `run-code-analyzer` GitHub Action scans your code for violations using 
[Salesforce Code Analyzer](https://forcedotcom.github.io/sfdx-scanner), uploads the results as an artifact, and displays
the results as a job summary.

# Inputs
* <b>`run-command`</b>  *(Default: `'run'`)*
  * Specifies the Salesforce Code Analyzer command to run.<br/>
    Possible values are: *`'run'`, `'run dfa'`*.<br/>
  * For more info on Code Analyzer, read our [documentation](https://forcedotcom.github.io/sfdx-scanner).
* <b>`run-arguments`</b>  *(Default: `'--normalize-severity'`)*
  * Specifies arguments passed to the specified `run-command` value.<br/>
    The arguments provided must include *`--normalize-severity`*.<br/>
    To control the output file included in the uploaded artifact, specify an output file with the *`--outfile`* argument.<br/>
    If an output file isn’t specified, results are written to GitHub workflow run logs and a
    *SalesforceCodeAnalyzerResults.json* file is included in the uploaded artifact.
  * For a full list of acceptable arguments, read the appropriate Command Reference:
    * [sf scanner run](https://forcedotcom.github.io/sfdx-scanner/en/v3.x/scanner-commands/run)
    * [sf scanner run dfa](https://forcedotcom.github.io/sfdx-scanner/en/v3.x/scanner-commands/dfa)
* <b>`results-artifact-name`</b>  *(Default: `'code-analyzer-results'`)*
  * Specifies the name of the zip archive job artifact where the results output file is uploaded.

# Outputs
* `exit-code`
  * The Salesforce Code Analyzer execution exit code.
* `num-violations`
  * The total number of violations found.
* `num-sev1-violations`
  * The number of normalized high-severity violations found.
* `num-sev2-violations`
  * The number of normalized medium-severity violations found.
* `num-sev3-violations`
  * The number of normalized low-severity violations found.

This `run-code-analyzer` action will not exit your GitHub workflow when violations are found. Instead, we recommend adding a subsequent step to your workflow that uses these outputs to determine how your workflow should proceed.

# Example Usage

    name: Salesforce Code Analyzer Workflow
    on: push
    jobs:
      salesforce-code-analyzer-workflow:
        runs-on: ubuntu-latest
        steps:
          - name: Check out files
            uses: actions/checkout@v4
    
          - name: Install Salesforce CLI
            run: npm install -g @salesforce/cli@latest
    
          - name: Install Salesforce Code Analyzer Plugin
            run: sf plugins install @salesforce/sfdx-scanner@latest
    
          - name: Run Salesforce Code Analyzer
            id: run-code-analyzer
            uses: forcedotcom/run-code-analyzer@v1
            with:
              run-command: run
              run-arguments: --normalize-severity --outfile results.html
              results-artifact-name: salesforce-code-analyzer-results
    
          - name: Check the outputs to determine whether to fail
            if: |
              steps.run-code-analyzer.outputs.exit-code > 0 ||
              steps.run-code-analyzer.outputs.num-sev1-violations > 0 ||
              steps.run-code-analyzer.outputs.num-violations > 10
            run: exit 1

# Contributing
To contribute to the `run-code-analyzer` GitHub Action, see [CONTRIBUTING.md](https://github.com/forcedotcom/run-code-analyzer/blob/main/CONTRIBUTING.md).
