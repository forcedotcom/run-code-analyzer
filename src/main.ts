import { InputArguments, getFullErrorMessage } from './utils'
import { Dependencies } from './dependencies'
import { CommandOutput, Inputs } from './types'
import { CommandExecutor } from './commands'
import { MESSAGE_FCNS, MESSAGES, MIN_CODE_ANALYZER_VERSION_REQUIRED } from './constants'
import { Results, ResultsFactory, Violation } from './results'
import { Summarizer } from './summary'

const STDERR_ERROR_MARKER = 'Error'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(
    dependencies: Dependencies,
    commandExecutor: CommandExecutor,
    resultsFactory: ResultsFactory,
    summarizer: Summarizer
): Promise<void> {
    try {
        dependencies.startGroup(MESSAGES.STEP_LABELS.PREPARING_ENVIRONMENT)
        const inputs: Inputs = dependencies.getInputs()
        await installSalesforceCliIfNeeded(dependencies, commandExecutor)
        await installMinimumCodeAnalyzerPluginVersionIfNeeded(dependencies, commandExecutor)
        dependencies.endGroup()

        dependencies.startGroup(MESSAGES.STEP_LABELS.RUNNING_CODE_ANALYZER)
        const runArgsInfo = new InputArguments(inputs.runArguments)
        const userOutputFiles: string[] = runArgsInfo.getValuesFor('--output-file', '-f')
        let jsonOutputFile: string | undefined = userOutputFiles.find(f => f.toLowerCase().endsWith('.json'))
        let modifiedRunArgs: string = inputs.runArguments
        if (jsonOutputFile === undefined) {
            jsonOutputFile = 'sfca_results.json'
            modifiedRunArgs += ' --output-file sfca_results.json'
            // If the user didn't specify any view or output files, then we shouldn't kill the output when we add in our
            // sfca_results.json, so we add in the default view again
            if (userOutputFiles.length === 0 && !runArgsInfo.containsFlag('--view', '-v')) {
                modifiedRunArgs += ' --view table'
            }
        }
        const codeAnalyzerOutput: CommandOutput = await commandExecutor.runCodeAnalyzer(modifiedRunArgs)
        dependencies.setOutput('exit-code', codeAnalyzerOutput.exitCode.toString())
        if (codeAnalyzerOutput.exitCode !== 0 && codeAnalyzerOutput.stderr.includes(STDERR_ERROR_MARKER)) {
            const errorText: string = codeAnalyzerOutput.stderr.substring(
                codeAnalyzerOutput.stderr.indexOf(STDERR_ERROR_MARKER)
            )
            dependencies.error(`${MESSAGES.CODE_ANALYZER_FAILED} \n${errorText}`)
        }
        dependencies.endGroup()

        dependencies.startGroup(MESSAGES.STEP_LABELS.UPLOADING_ARTIFACT)
        userOutputFiles.map(f => assertFileExists(dependencies, f))
        assertFileExists(dependencies, jsonOutputFile)
        await dependencies.uploadArtifact(
            inputs.resultsArtifactName,
            userOutputFiles.length > 0 ? userOutputFiles : [jsonOutputFile]
        )
        dependencies.endGroup()

        dependencies.startGroup(MESSAGES.STEP_LABELS.ANALYZING_RESULTS)
        assertFileExists(dependencies, jsonOutputFile)
        const results: Results = resultsFactory.createResults(jsonOutputFile)
        dependencies.endGroup()

        dependencies.startGroup(MESSAGES.STEP_LABELS.CREATING_SUMMARY)
        let changedFiles: string[] = []
        let couldReadChangedFiles = false

        // Get changed files for PR context
        if (dependencies.isPullRequest() && inputs.githubToken) {
            try {
                dependencies.info(MESSAGES.CALCULATING_CHANGED_FILES)
                changedFiles = await dependencies.getChangedFiles(inputs.githubToken)
                couldReadChangedFiles = true
                dependencies.info(MESSAGES.CALCULATED_CHANGED_FILES)
            } catch (error) {
                dependencies.warn(MESSAGE_FCNS.FAILED_TO_GET_CHANGED_FILES(getFullErrorMessage(error)))
            }
        } else {
            if (dependencies.isPullRequest()) {
                dependencies.info(MESSAGES.PR_FOUND_WITHOUT_GH_TOKEN)
            } else {
                dependencies.info(MESSAGES.NOT_PR)
            }
        }

        // Calculate violation counts based on mode
        const violationCounts = calculateViolationCounts(
            results,
            inputs.changedFilesOnly && couldReadChangedFiles ? changedFiles : undefined
        )

        // Set outputs with final counts
        dependencies.setOutput('num-violations', violationCounts.total.toString())
        dependencies.setOutput('num-sev1-violations', violationCounts.sev1.toString())
        dependencies.setOutput('num-sev2-violations', violationCounts.sev2.toString())
        dependencies.setOutput('num-sev3-violations', violationCounts.sev3.toString())
        dependencies.setOutput('num-sev4-violations', violationCounts.sev4.toString())
        dependencies.setOutput('num-sev5-violations', violationCounts.sev5.toString())
        dependencies.info(
            `outputs:\n` +
                `  exit-code: ${codeAnalyzerOutput.exitCode}\n` +
                `  num-violations: ${violationCounts.total}\n` +
                `  num-sev1-violations: ${violationCounts.sev1}\n` +
                `  num-sev2-violations: ${violationCounts.sev2}\n` +
                `  num-sev3-violations: ${violationCounts.sev3}\n` +
                `  num-sev4-violations: ${violationCounts.sev4}\n` +
                `  num-sev5-violations: ${violationCounts.sev5}`
        )

        // Generate summary
        const summaryMarkdown = summarizer.createSummaryMarkdown(results, changedFiles, inputs.changedFilesOnly)

        // Create PR review if applicable
        if (dependencies.isPullRequest() && inputs.githubToken && couldReadChangedFiles) {
            const summaryLink: string = await dependencies.createActionSummaryLink(inputs.githubToken)
            const changedFilesSet: Set<string> = new Set(changedFiles)
            const violationsInChangedFilesCount: number = results
                .getViolationsSortedBySeverity()
                .filter((v: Violation): boolean =>
                    v
                        .getLocations()
                        .map(l => l.getFile())
                        .some(f => f && changedFilesSet.has(f))
                ).length

            const summaryBody = MESSAGE_FCNS.REVIEW_BODY(
                results.getTotalViolationCount(),
                violationsInChangedFilesCount,
                summaryLink
            )
            try {
                dependencies.info(MESSAGES.ATTEMPTING_TO_CREATE_PR_REVIEW)
                const reviewId: number = await dependencies.createPullRequestReview(inputs.githubToken, summaryBody)
                dependencies.setOutput('review-id', `${reviewId}`)
                dependencies.info(MESSAGE_FCNS.CREATED_PR_REVIEW(reviewId))
            } catch (error) {
                dependencies.warn(MESSAGE_FCNS.FAILED_TO_CREATE_REVIEW(getFullErrorMessage(error)))
            }
        }

        await dependencies.writeSummary(summaryMarkdown)
        dependencies.endGroup()
    } catch (error) {
        dependencies.fail(`${MESSAGES.UNEXPECTED_ERROR}\n\n${getFullErrorMessage(error)}`)
    }
}

/**
 * Calculate violation counts, optionally filtered by changed files
 * @param results - The full results from the code analyzer
 * @param changedFiles - Optional array of changed file paths to filter by
 * @returns Object containing counts for each severity level and total
 */
function calculateViolationCounts(
    results: Results,
    changedFiles?: string[]
): { total: number; sev1: number; sev2: number; sev3: number; sev4: number; sev5: number } {
    let violations: Violation[]

    if (changedFiles && changedFiles.length > 0) {
        // Filter to only violations in changed files
        const changedFilesSet = new Set(changedFiles)
        violations = results.getViolationsSortedBySeverity().filter((v: Violation): boolean =>
            v
                .getLocations()
                .map(l => l.getFile())
                .some(f => f && changedFilesSet.has(f))
        )
    } else {
        // Use all violations
        violations = results.getViolationsSortedBySeverity()
    }

    return {
        total: violations.length,
        sev1: violations.filter(v => v.getSeverity() === 1).length,
        sev2: violations.filter(v => v.getSeverity() === 2).length,
        sev3: violations.filter(v => v.getSeverity() === 3).length,
        sev4: violations.filter(v => v.getSeverity() === 4).length,
        sev5: violations.filter(v => v.getSeverity() === 5).length
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

async function installMinimumCodeAnalyzerPluginVersionIfNeeded(
    dependencies: Dependencies,
    commandExecutor: CommandExecutor
): Promise<void> {
    if (!(await commandExecutor.isMinimumCodeAnalyzerPluginInstalled(MIN_CODE_ANALYZER_VERSION_REQUIRED))) {
        dependencies.warn(MESSAGES.MINIMUM_CODE_ANALYZER_PLUGIN_NOT_INSTALLED)
        if (!(await commandExecutor.installCodeAnalyzerPlugin())) {
            throw new Error(MESSAGES.CODE_ANALYZER_PLUGIN_INSTALL_FAILED)
        }
    }
}

function assertFileExists(dependencies: Dependencies, file: string): void {
    if (!dependencies.fileExists(file)) {
        throw new Error(MESSAGE_FCNS.FILE_NOT_FOUND(file))
    }
}
