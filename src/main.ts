import { extractOutfileFromRunArguments } from './utils'
import { Dependencies } from './dependencies'
import { Inputs } from './types'
import { CommandExecutor } from './commands'
import { INTERNAL_OUTFILE, MESSAGES, MIN_SCANNER_VERSION_REQUIRED } from './constants'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(dependencies: Dependencies, commandExecutor: CommandExecutor): Promise<void> {
    try {
        dependencies.startGroup(MESSAGES.STEP_LABELS.PREPARING_ENVIRONMENT)
        const inputs: Inputs = dependencies.getInputs()
        validateInputs(inputs)
        await installSalesforceCliIfNeeded(dependencies, commandExecutor)
        await installMinimumScannerPluginVersionIfNeeded(dependencies, commandExecutor)
        dependencies.endGroup()

        dependencies.startGroup(MESSAGES.STEP_LABELS.RUNNING_CODE_ANALYZER)
        const codeAnalyzerExitCode: number = await commandExecutor.runCodeAnalyzer(
            inputs.runCommand,
            inputs.runArgs,
            INTERNAL_OUTFILE
        )
        dependencies.endGroup()

        dependencies.startGroup(MESSAGES.STEP_LABELS.UPLOADING_ARTIFACT)
        const userOutfile: string = extractOutfileFromRunArguments(inputs.runArgs)
        const artifactFile: string = userOutfile.length > 0 ? userOutfile : INTERNAL_OUTFILE
        await dependencies.uploadArtifact(inputs.resultsArtifactName, [artifactFile])
        dependencies.endGroup()

        dependencies.startGroup(MESSAGES.STEP_LABELS.ANALYZING_RESULTS)
        // TODO: Process the internal outfile
        dependencies.endGroup()

        dependencies.startGroup(MESSAGES.STEP_LABELS.FINALIZING_OUTPUT)
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
