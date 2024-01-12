import { extractOutfileFromRunArguments } from './utils'
import { Dependencies } from './dependencies'
import { Inputs } from './types'
import { CommandExecutor } from './commands'

export const MIN_SCANNER_VERSION_REQUIRED = '3.20.0'

/* eslint-disable prettier/prettier, prefer-template */
export const MESSAGES = {
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

export const INTERNAL_OUTFILE = 'SalesforceCodeAnalyzerResults.json'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(dependencies: Dependencies, commandExecutor: CommandExecutor): Promise<void> {
    try {
        dependencies.startGroup('Preparing Environment')
        const inputs: Inputs = dependencies.getInputs()
        validateInputs(inputs)
        await installSalesforceCliIfNeeded(dependencies, commandExecutor)
        await installMinimumScannerPluginVersionIfNeeded(dependencies, commandExecutor)
        dependencies.endGroup()

        dependencies.startGroup('Running Salesforce Code Analyzer')
        const codeAnalyzerExitCode: number = await commandExecutor.runCodeAnalyzer(
            inputs.runCommand,
            inputs.runArgs,
            INTERNAL_OUTFILE
        )
        dependencies.endGroup()

        dependencies.startGroup('Uploading Artifact')
        const userOutfile: string = extractOutfileFromRunArguments(inputs.runArgs)
        const artifactFile: string = userOutfile.length > 0 ? userOutfile : INTERNAL_OUTFILE
        await dependencies.uploadArtifact(inputs.resultsArtifactName, [artifactFile])
        dependencies.endGroup()

        dependencies.startGroup('Analyzing Results')
        // TODO: Process the internal outfile
        dependencies.endGroup()

        dependencies.startGroup('Finalizing Summary and Outputs')
        // TODO: set the summary and remaining outputs
        dependencies.setOutput('exit-code', codeAnalyzerExitCode.toString())
        dependencies.endGroup()
    } catch (error) {
        if (error instanceof Error) {
            dependencies.fail(error.message)
        }
    }
}

function validateInputs(inputs: Inputs): void {
    if (!inputs.runArgs.toLowerCase().includes('--normalize-severity')) {
        throw new Error(MESSAGES.MISSING_NORMALIZE_SEVERITY)
    }
}

async function installSalesforceCliIfNeeded(
    dependencies: Dependencies,
    commandExecutor: CommandExecutor
): Promise<void> {
    if (!(await commandExecutor.isSalesforceCliInstalled())) {
        dependencies.warn(MESSAGES.SF_CLI_NOT_INSTALLED)
        if (!(await commandExecutor.installSalesforceCli())) {
            throw new Error(MESSAGES.SF_CLI_INSTALL_FAILED)
        }
    }
}

async function installMinimumScannerPluginVersionIfNeeded(
    dependencies: Dependencies,
    commandExecutor: CommandExecutor
): Promise<void> {
    if (!(await commandExecutor.isMinimumScannerPluginInstalled(MIN_SCANNER_VERSION_REQUIRED))) {
        dependencies.warn(MESSAGES.MINIMUM_SCANNER_PLUGIN_NOT_INSTALLED)
        if (!(await commandExecutor.installScannerPlugin())) {
            throw new Error(MESSAGES.SCANNER_PLUGIN_INSTALL_FAILED)
        }
    }
}
