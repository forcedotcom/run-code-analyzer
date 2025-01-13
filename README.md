# Run Salesforce Code Analyzer - GitHub Action

[![GitHub Super-Linter](https://github.com/actions/typescript-action/actions/workflows/linter.yml/badge.svg)](https://github.com/super-linter/super-linter)
![CI](https://github.com/actions/typescript-action/actions/workflows/ci.yml/badge.svg)
[![Check dist/](https://github.com/actions/typescript-action/actions/workflows/check-dist.yml/badge.svg)](https://github.com/actions/typescript-action/actions/workflows/check-dist.yml)
[![CodeQL](https://github.com/actions/typescript-action/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/actions/typescript-action/actions/workflows/codeql-analysis.yml)
[![Coverage](./badges/coverage.svg)](./badges/coverage.svg)

The `run-code-analyzer` GitHub Action scans your code for violations using
[Salesforce Code Analyzer](https://developer.salesforce.com/docs/platform/salesforce-code-analyzer/overview), uploads the results as an artifact, and displays
the results as a job summary.

# Version: v2
The `forcedotcom/run-code-analyzer@v2` GitHub Action is based on [Salesforce Code Analyzer v5.x (Beta)](https://developer.salesforce.com/docs/platform/salesforce-code-analyzer/guide/code-analyzer.html), which is the new `code-analyzer` Salesforce CLI plugin.

## v2 Inputs
* <b>`run-arguments`</b> *(Default: `--view detail --output-file sfca_results.json`)*
  * Specifies the arguments passed to the `run` command.
    * For a full list of acceptable arguments for the `run` command, see the [code-analyzer Command Reference](https://developer.salesforce.com/docs/atlas.en-us.sfdx_cli_reference.meta/sfdx_cli_reference/cli_reference_code-analyzer_commands_unified.htm).
  * The stdout text from the `run` command is written to the [GitHub workflow run logs](https://docs.github.com/en/actions/monitoring-and-troubleshooting-workflows/monitoring-workflows/using-workflow-run-logs).
  * Each output file specified by a `--output-file` (or `-f`) flag is included in the ZIP archive [GitHub workflow run artifact](https://docs.github.com/en/actions/managing-workflow-runs-and-deployments/managing-workflow-runs/downloading-workflow-artifacts) for you to download.
* <b>`results-artifact-name`</b>  *(Default: `salesforce-code-analyzer-results`)*
  * Specifies the name of the ZIP archive [GitHub workflow run artifact](https://docs.github.com/en/actions/managing-workflow-runs-and-deployments/managing-workflow-runs/downloading-workflow-artifacts) where the results output files are uploaded.

## v2 Outputs
* `exit-code`
  * The Salesforce Code Analyzer execution exit code.
* `num-violations`
  * The total number of violations found.
* `num-sev1-violations`
  * The number of Critical (1) severity violations found.
* `num-sev2-violations`
  * The number of High (2) severity violations found.
* `num-sev3-violations`
  * The number of Medium (3) severity violations found.
* `num-sev4-violations`
  * The number of Low (4) severity violations found.
* `num-sev5-violations`
  * The number of Info (5) severity violations found.

This `run-code-analyzer@v2` action won't exit your GitHub workflow when it finds violations. We recommend that you add a subsequent step to your workflow that uses the available outputs to determine how your workflow should proceed.

## Environment Prerequisites
The [Salesforce Code Analyzer v5.x (Beta)](https://developer.salesforce.com/docs/platform/salesforce-code-analyzer/guide/code-analyzer.html) and its bundled engines can each have their own set of requirements in order to run successfully. So we recommend that you set up your GitHub runner(s) with this software:
* `node` version 20 or greater
  * Required by all engines.
* `java` version 11 or greater
  * Required by some engines, such as `pmd` and `cpd`, unless those engines have been explicitly disabled in your `code-analyzer.yml` configuration file.
* `python` version 3.10 or greater
  * Required by some engines, such as `flowtest`, unless those engines have been explicitly disabled in your `code-analyzer.yml` configuration file.

## Example v2 Usage

    name: Salesforce Code Analyzer Workflow
    on: push
    jobs:
      salesforce-code-analyzer-workflow:
        runs-on: ubuntu-latest
        steps:
          - name: Check out files
            uses: actions/checkout@v4

          # PREREQUISITES - Only needed if runner doesn't already satisfy these requirements
          - name: Ensure node v20 or greater
            uses: actions/setup-node@v4
            with:
              node-version: '>=20'
          - name: Ensure java v11 or greater
            uses: actions/setup-java@v4
            with:
              java-version: '>=11'
              distribution: 'zulu'
          - name: Ensure python v3.10 or greater
            uses: actions/setup-python@v5
            with:
              python-version: '>=3.10'

          - name: Install Salesforce CLI
            run: npm install -g @salesforce/cli@latest
    
          - name: Install Latest Salesforce Code Analyzer CLI Plugin
            run: sf plugins install code-analyzer@latest
    
          - name: Run Salesforce Code Analyzer
            id: run-code-analyzer
            uses: forcedotcom/run-code-analyzer@v2
            with:
              run-arguments: --workspace . --view detail --output-file sfca_results.html --output-file sfca_results.json
              results-artifact-name: salesforce-code-analyzer-results
    
          - name: Check the outputs to determine whether to fail
            if: |
              steps.run-code-analyzer.outputs.exit-code > 0 ||
              steps.run-code-analyzer.outputs.num-sev1-violations > 0 ||
              steps.run-code-analyzer.outputs.num-sev2-violations > 0 ||
              steps.run-code-analyzer.outputs.num-violations > 10
            run: exit 1

# Version: v1
The `forcedotcom/run-code-analyzer@v1` GitHub Action is based on [Salesforce Code Analyzer v4.x](https://developer.salesforce.com/docs/platform/salesforce-code-analyzer/guide/code-analyzer-3x.html), which is the original `@salesforce/sfdx-scanner` Salesforce CLI plugin.

**Note:**
> We plan to stop supporting v4.x of Code Analyzer in the coming months. We highly recommend that you start using v5.x, which is currently in Beta. For information on v5.x, see https://developer.salesforce.com/docs/platform/salesforce-code-analyzer/guide/code-analyzer.html.
>
> Because we'll soon stop supporting v4.x, we also recommend that you use the `run-code-analyzer@v2` GitHub Action, because it's based on v5.x. (see [above](./README.md#run-salesforce-code-analyzer---github-action))

* <b>`run-command`</b>  *(Default: `run`)*
  * Specifies the Salesforce Code Analyzer command to run.<br/>
    Possible values are: *`run`, `run dfa`*.<br/>
  * For more info on Code Analyzer, read our [documentation](https://forcedotcom.github.io/sfdx-scanner).
* <b>`run-arguments`</b>  *(Default: `--normalize-severity`)*
  * Specifies arguments passed to the specified `run-command` value.<br/>
    The arguments provided must include *`--normalize-severity`*.<br/>
    To control the output file included in the uploaded artifact, specify an output file with the *`--outfile`* argument.<br/>
    If an output file isn’t specified, results are written to GitHub workflow run logs and a
    *SalesforceCodeAnalyzerResults.json* file is included in the uploaded artifact.
  * For a full list of acceptable arguments, read the appropriate Command Reference:
    * [sf scanner run](https://forcedotcom.github.io/sfdx-scanner/en/v3.x/scanner-commands/run)
    * [sf scanner run dfa](https://forcedotcom.github.io/sfdx-scanner/en/v3.x/scanner-commands/dfa)
* <b>`results-artifact-name`</b>  *(Default: `code-analyzer-results`)*
  * Specifies the name of the zip archive job artifact where the results output file is uploaded.

## v1 Outputs
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

## Example v1 Usage

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
    
          - name: Install Salesforce Code Analyzer v4.x CLI Plugin
            run: sf plugins install @salesforce/sfdx-scanner@latest
    
          - name: Run Salesforce Code Analyzer
            id: run-code-analyzer
            uses: forcedotcom/run-code-analyzer@v1
            with:
              run-command: run
              run-arguments: --normalize-severity --target . --outfile results.html
              results-artifact-name: salesforce-code-analyzer-results
    
          - name: Check the outputs to determine whether to fail
            if: |
              steps.run-code-analyzer.outputs.exit-code > 0 ||
              steps.run-code-analyzer.outputs.num-sev1-violations > 0 ||
              steps.run-code-analyzer.outputs.num-violations > 10
            run: exit 1

# Contributing
To contribute to the `run-code-analyzer` GitHub Action, see [CONTRIBUTING.md](https://github.com/forcedotcom/run-code-analyzer/blob/main/CONTRIBUTING.md).
