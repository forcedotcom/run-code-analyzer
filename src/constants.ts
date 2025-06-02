export const MIN_CODE_ANALYZER_VERSION_REQUIRED = '5.0.0-beta.0'

/* eslint-disable prettier/prettier, prefer-template */
export const MESSAGES = {
    STEP_LABELS: {
        PREPARING_ENVIRONMENT: 'Preparing Environment',
        RUNNING_CODE_ANALYZER: 'Running Salesforce Code Analyzer',
        UPLOADING_ARTIFACT: 'Uploading Results Artifact',
        ANALYZING_RESULTS: 'Analyzing Results',
        CREATING_SUMMARY: 'Creating Summary'
    },
    CALCULATING_CHANGED_FILES: 'Attempting to calculate the list of changed files.',
    CALCULATED_CHANGED_FILES: 'Successfully calculated the files that changed in this pull request.',
    ATTEMPTING_TO_CREATE_PR_REVIEW: 'Attempting to create pull request review...',
    PR_FOUND_WITHOUT_GH_TOKEN:
        'Pull request identified but no GitHub token provided. Creating job summary without a pull request review.',
    NOT_PR: 'Not running on a pull request. Creating job summary without a pull request review.',
    SF_CLI_NOT_INSTALLED:
        `Salesforce CLI (sf) wasn't found.\n` +
        `Salesforce CLI must be installed in the environment to run Salesforce Code Analyzer.\n` +
        `We recommend that you include a separate step in your GitHub workflow to install it. For example:\n` +
        `  - name: Install Salesforce CLI\n` +
        `    run: npm install -g @salesforce/cli@latest\n` +
        `We will attempt to install the latest version of Salesforce CLI on your behalf.`,
    SF_CLI_INSTALL_FAILED: `Failed to install the latest version of Salesforce CLI on your behalf.`,
    MINIMUM_CODE_ANALYZER_PLUGIN_NOT_INSTALLED:
        `Version ${MIN_CODE_ANALYZER_VERSION_REQUIRED} or greater of the code-analyzer plugin wasn't found.\n` +
        `We recommend that you include a separate step in your GitHub workflow to install it. For example:\n` +
        `  - name: Install Salesforce Code Analyzer Plugin\n` +
        `    run: sf plugins install code-analyzer@latest\n` +
        `We will attempt to install the latest code-analyzer plugin on your behalf.`,
    CODE_ANALYZER_PLUGIN_INSTALL_FAILED: `Failed to install the latest code-analyzer plugin on your behalf.`,
    CODE_ANALYZER_FAILED: 'Salesforce Code Analyzer failed.',
    UNEXPECTED_ERROR:
        `An unexpected error was thrown (see below). First check to make sure you're providing valid ` +
        `inputs. If you can't resolve the error, then create an issue at ` +
        `https://github.com/forcedotcom/run-code-analyzer/issues.`
}
export const MESSAGE_FCNS = {
    PLUGIN_FOUND: (pluginName: string, pluginVersion: string) =>
        `Found version ${pluginVersion} of the ${pluginName} plugin installed.`,
    FILE_NOT_FOUND: (fileName: string) => `The file ${fileName} wasn't found. Check the logs for an error.`,
    FAILED_TO_GET_CHANGED_FILES: (stack: string) =>
        `Couldn't get changed files associated with the pull request. This error can occur if the supplied GitHub token is invalid or lacks the 'pull-requests: write' permission. Error: ${stack}`,
    FAILED_TO_READ_JOBS: (stack: string) =>
        `Couldn't read the jobs associated with this workflow. This error can occur if the supplied GitHub token is invalid or lacks the 'actions: read' permission. Error: ${stack}`,
    FAILED_TO_CREATE_REVIEW: (stack: string) =>
        `Couldn't create the pull request review. This error can occur if the supplied GitHub token is invalid or lacks the 'pull-requests: write' permission. Error: ${stack}`,
    REVIEW_BODY: (resultsCount: number, resultsInChangedFilesCount: number, summaryLink: string) =>
        `${resultsInChangedFilesCount > 0 ? ':warning: ' : ''}Salesforce Code Analyzer found ${resultsCount} violations, including ${resultsInChangedFilesCount} in files changed by this pull request. See [job summary page](${summaryLink}).`,
    CREATED_PR_REVIEW: (reviewId: number) => `Created pull request review with ID ${reviewId}`
}
/* eslint-enable */
