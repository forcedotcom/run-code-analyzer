import { extractOutfileFromRunArguments } from './utils'
import { Dependencies } from './dependencies'
import { Inputs } from './types'
import { CommandExecutor } from './commands'

export const MESSAGES = {
    MISSING_NORMALIZE_SEVERITY: 'Missing required --normalize-severity option from run-arguments input.',
    SF_CLI_NOT_INSTALLED:
        'The sf command was not found.\n' +
        'The Salesforce CLI must be installed in the environment to run the Salesforce Code Analyzer.\n' +
        'We recommend you include a step in your GitHub workflow that installs the Salesforce CLI. For example:\n' +
        '  - name: Install SalesforceCLI\n' +
        '     run: npm install -g @salesforce/cli@latest\n' +
        'We will attempt to install the Salesforce CLI on your behalf.',
    SF_CLI_INSTALL_FAILED: 'Failed to install the Salesforce CLI on your behalf.'
}

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

        // TODO: NICE TO HAVES:
        // * Verify that sfdx-scanner plugin is installed (and if not, then install it as a separate step)
        // * Echo version of sfdx-scanner in use
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
