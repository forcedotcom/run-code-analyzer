export const MIN_SCANNER_VERSION_REQUIRED = '3.20.0'

export const INTERNAL_OUTFILE = 'SalesforceCodeAnalyzerResults.json'

/* eslint-disable prettier/prettier, prefer-template */
export const MESSAGES = {
    STEP_LABELS: {
        PREPARING_ENVIRONMENT: 'Preparing Environment',
        RUNNING_CODE_ANALYZER: 'Running the Salesforce Code Analyzer',
        UPLOADING_ARTIFACT: 'Uploading Artifact',
        ANALYZING_RESULTS: 'Analyzing Results',
        FINALIZING_OUTPUT: 'Finalizing Summary and Outputs'
    },
    MISSING_NORMALIZE_SEVERITY: `Missing required --normalize-severity option from run-arguments input.`,
    SF_CLI_NOT_INSTALLED:
        `The sf command was not found.\n` +
        `The Salesforce CLI must be installed in the environment to run the Salesforce Code Analyzer.\n` +
        `We recommend you include a separate step in your GitHub workflow to install it. For example:\n` +
        `  - name: Install the Salesforce CLI\n` +
        `    run: npm install -g @salesforce/cli@latest\n` +
        `We will attempt to install the latest Salesforce CLI on your behalf.`,
    SF_CLI_INSTALL_FAILED: `Failed to install the Salesforce CLI on your behalf.`,
    MINIMUM_SCANNER_PLUGIN_NOT_INSTALLED:
        `The @salesforce/sfdx-scanner plugin of version ${MIN_SCANNER_VERSION_REQUIRED} or greater was not found.\n` +
        `The Salesforce Code Analyzer plugin of version ${MIN_SCANNER_VERSION_REQUIRED} or greater is required.\n` +
        `We recommend you include a separate step in your GitHub workflow to install it. For example:\n` +
        `  - name: Install the Salesforce Code Analyzer plugin\n` +
        `    run: sf plugins install @salesforce/sfdx-scanner@latest\n` +
        `We will attempt to install the latest Salesforce Code Analyzer plugin on your behalf.`,
    SCANNER_PLUGIN_INSTALL_FAILED: `Failed to install the latest Salesforce Code Analyzer plugin on your behalf.`
}
/* eslint-enable */
