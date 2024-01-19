export const MIN_SCANNER_VERSION_REQUIRED = '3.20.0'

export const INTERNAL_OUTFILE = 'SalesforceCodeAnalyzerResults.json'

/* eslint-disable prettier/prettier, prefer-template */
export const MESSAGES = {
    STEP_LABELS: {
        PREPARING_ENVIRONMENT: 'Preparing Environment',
        RUNNING_CODE_ANALYZER: 'Running Salesforce Code Analyzer',
        UPLOADING_ARTIFACT: 'Uploading Artifact',
        ANALYZING_RESULTS: 'Analyzing Results',
        CREATING_SUMMARY: 'Creating Summary'
    },
    MISSING_NORMALIZE_SEVERITY: `Missing required --normalize-severity argument from run-arguments input.`,
    SF_CLI_NOT_INSTALLED:
        `The sf command was not found.\n` +
        `The Salesforce CLI must be installed in the environment to run Salesforce Code Analyzer.\n` +
        `We recommend you include a separate step in your GitHub workflow to install it. For example:\n` +
        `  - name: Install Salesforce CLI\n` +
        `    run: npm install -g @salesforce/cli@latest\n` +
        `We will attempt to install the latest Salesforce CLI on your behalf.`,
    SF_CLI_INSTALL_FAILED: `Failed to install the latest Salesforce CLI on your behalf.`,
    MINIMUM_SCANNER_PLUGIN_NOT_INSTALLED:
        `The @salesforce/sfdx-scanner plugin of version ${MIN_SCANNER_VERSION_REQUIRED} or greater was not found.\n` +
        `We recommend you include a separate step in your GitHub workflow to install it. For example:\n` +
        `  - name: Install Salesforce Code Analyzer plugin\n` +
        `    run: sf plugins install @salesforce/sfdx-scanner@latest\n` +
        `We will attempt to install the latest @salesforce/sfdx-scanner plugin on your behalf.`,
    SCANNER_PLUGIN_INSTALL_FAILED: `Failed to install the latest @salesforce/sfdx-scanner plugin on your behalf.`
}
export const MESSAGE_FCNS = {
    PLUGIN_FOUND: (pluginName: string, pluginVersion: string) =>
        `Found version ${pluginVersion} of the ${pluginName} plugin installed.`,
    FILE_NOT_FOUND: (fileName: string) => `The file ${fileName} was not found. Check the logs for an error.`
}
/* eslint-enable */
