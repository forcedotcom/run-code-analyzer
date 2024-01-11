import { extractOutfileFromRunArguments } from './utils'
import { Dependencies } from './dependencies'
import { EnvironmentVariables, Inputs } from './types'

const INTERNAL_OUTFILE = 'SalesforceCodeAnalyzerResults.json'

export const MESSAGES = {
    MISSING_NORMALIZE_SEVERITY: 'Missing required --normalize-severity option from run-arguments input.'
}

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(dependencies: Dependencies): Promise<void> {
    try {
        dependencies.startGroup('Preparing Environment')
        // TODO: NICE TO HAVES:
        // * Verify that Salesforce CLI "sf" is installed
        // * Verify that sfdx-scanner plugin is installed (and if not, then install it as a separate step)
        // * Echo version of sfdx-scanner in use
        const inputs: Inputs = dependencies.getInputs()
        validateInputs(inputs)
        dependencies.endGroup()

        dependencies.startGroup('Running Salesforce Code Analyzer')
        const command = `sf scanner ${inputs.runCommand} ${inputs.runArgs}`
        const envVars: EnvironmentVariables = {
            // Without increasing the heap allocation, node often fails. So we increase it to 8gb which should be enough
            NODE_OPTIONS: '--max-old-space-size=8192',
            // We always want to control our own internal outfile for reliable processing
            SCANNER_INTERNAL_OUTFILE: INTERNAL_OUTFILE
        }
        if (process.env['JAVA_HOME_11_X64']) {
            // We prefer to run on java 11 if available since the default varies across the different GitHub runners.
            envVars['JAVA_HOME'] = process.env['JAVA_HOME_11_X64']
        }
        const exitCode: number = await dependencies.execCommand(command, envVars)
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
        dependencies.setOutput('exit-code', exitCode.toString())
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
