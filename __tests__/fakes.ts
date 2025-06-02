import { Dependencies } from '../src/dependencies'
import { CommandOutput, EnvironmentVariables, Inputs } from '../src/types'
import { CommandExecutor } from '../src/commands'
import { Results, ResultsFactory, Violation, ViolationLocation } from '../src/results'
import { Summarizer } from '../src/summary'

export class FakeDependencies implements Dependencies {
    startGroupCallHistory: { name: string }[] = []
    startGroup(name: string): void {
        this.startGroupCallHistory.push({ name })
    }

    endGroupCallCount = 0
    endGroup(): void {
        this.endGroupCallCount++
    }

    isPullRequestReturnValue = false
    isPullRequestCallCount = 0
    isPullRequest(): boolean {
        this.isPullRequestCallCount++
        return this.isPullRequestReturnValue
    }

    execCommandReturnValue: CommandOutput = { exitCode: 0, stdout: '', stderr: '' }
    execCommandCallHistory: { command: string; envVars: EnvironmentVariables; runSilently: boolean }[] = []
    async execCommand(command: string, envVars: EnvironmentVariables, runSilently: boolean): Promise<CommandOutput> {
        this.execCommandCallHistory.push({ command, envVars, runSilently })
        return this.execCommandReturnValue
    }

    // We should match the default input values from action.yml here:
    getInputsReturnValue: Inputs = {
        runArguments: '--view detail --output-file sfca_results.json',
        resultsArtifactName: 'salesforce-code-analyzer-results',
        githubToken: 'dummyToken'
    }
    getInputsCallCount = 0
    getInputs(): Inputs {
        this.getInputsCallCount++
        return this.getInputsReturnValue
    }

    getChangedFilesCallback: () => Promise<string[]> = async () => []
    getChangedFilesCallCount = 0
    async getChangedFiles(_githubToken: string): Promise<string[]> {
        this.getChangedFilesCallCount++
        return this.getChangedFilesCallback()
    }

    createActionSummaryLinkReturnValue = 'www.example.com'
    createActionSummaryLinkCallCount = 0
    async createActionSummaryLink(_githubToken: string): Promise<string> {
        this.createActionSummaryLinkCallCount++
        return this.createActionSummaryLinkReturnValue
    }

    createPullRequestReviewCallback: () => Promise<number> = async () => 7
    createPullRequestReviewCallCount = 0
    async createPullRequestReview(_githubToken: string, _reviewBody: string): Promise<number> {
        this.createPullRequestReviewCallCount++
        return this.createPullRequestReviewCallback()
    }

    uploadArtifactCallHistory: { artifactName: string; artifactFiles: string[] }[] = []
    async uploadArtifact(artifactName: string, artifactFiles: string[]): Promise<void> {
        this.uploadArtifactCallHistory.push({ artifactName, artifactFiles })
        return Promise.resolve()
    }

    setOutputCallHistory: { name: string; value: string }[] = []
    setOutput(name: string, value: string): void {
        this.setOutputCallHistory.push({ name, value })
    }

    infoCallHistory: { infoMessage: string }[] = []
    info(infoMessage: string): void {
        this.infoCallHistory.push({ infoMessage })
    }

    warnCallHistory: { warnMessage: string }[] = []
    warn(warnMessage: string): void {
        this.warnCallHistory.push({ warnMessage })
    }

    errorCallHistory: { errorMessage: string }[] = []
    error(errorMessage: string): void {
        this.errorCallHistory.push({ errorMessage })
    }

    failCallHistory: { failMessage: string }[] = []
    fail(failMessage: string): void {
        this.failCallHistory.push({ failMessage })
    }

    fileExistsReturnValue = true
    fileExistsCallHistory: { file: string }[] = []
    fileExists(file: string): boolean {
        this.fileExistsCallHistory.push({ file })
        return this.fileExistsReturnValue
    }

    writeSummaryCallHistory: { summaryMarkdown: string }[] = []
    async writeSummary(summaryMarkdown: string): Promise<void> {
        this.writeSummaryCallHistory.push({ summaryMarkdown })
    }
}

export class FakeCommandExecutor implements CommandExecutor {
    isSalesforceCliInstalledCallCount = 0
    isSalesforceCliInstalledReturnValue = true
    async isSalesforceCliInstalled(): Promise<boolean> {
        this.isSalesforceCliInstalledCallCount++
        return this.isSalesforceCliInstalledReturnValue
    }

    installSalesforceCliCallCount = 0
    installSalesforceCliReturnValue = true
    async installSalesforceCli(): Promise<boolean> {
        this.installSalesforceCliCallCount++
        return this.installSalesforceCliReturnValue
    }

    isMinimumCodeAnalyzerPluginInstalledReturnValue = true
    isMinimumCodeAnalyzerPluginInstalledCallHistory: { minVersion: string }[] = []
    async isMinimumCodeAnalyzerPluginInstalled(minVersion: string): Promise<boolean> {
        this.isMinimumCodeAnalyzerPluginInstalledCallHistory.push({ minVersion })
        return this.isMinimumCodeAnalyzerPluginInstalledReturnValue
    }

    installCodeAnalyzerPluginCallCount = 0
    installCodeAnalyzerPluginReturnValue = true
    async installCodeAnalyzerPlugin(): Promise<boolean> {
        this.installCodeAnalyzerPluginCallCount++
        return this.installCodeAnalyzerPluginReturnValue
    }

    runCodeAnalyzerReturnValue: CommandOutput = { exitCode: 0, stdout: '', stderr: '' }
    runCodeAnalyzerCallHistory: { runArguments: string }[] = []
    async runCodeAnalyzer(runArguments: string): Promise<CommandOutput> {
        this.runCodeAnalyzerCallHistory.push({ runArguments })
        return this.runCodeAnalyzerReturnValue
    }
}

export class FakeResultsFactory implements ResultsFactory {
    createResultsReturnValue: Results = new FakeResults()
    createResultsCallHistory: { resultsFile: string }[] = []
    createResults(resultsFile: string): Results {
        this.createResultsCallHistory.push({ resultsFile })
        return this.createResultsReturnValue
    }
}

export class FakeResults implements Results {
    getSev1ViolationCountReturnValue = 1
    getSev1ViolationCountCallCount = 0
    getSev1ViolationCount(): number {
        this.getSev1ViolationCountCallCount++
        return this.getSev1ViolationCountReturnValue
    }

    getSev2ViolationCountReturnValue = 2
    getSev2ViolationCountCallCount = 0
    getSev2ViolationCount(): number {
        this.getSev2ViolationCountCallCount++
        return this.getSev2ViolationCountReturnValue
    }

    getSev3ViolationCountReturnValue = 3
    getSev3ViolationCountCallCount = 0
    getSev3ViolationCount(): number {
        this.getSev3ViolationCountCallCount++
        return this.getSev3ViolationCountReturnValue
    }

    getSev4ViolationCountReturnValue = 4
    getSev4ViolationCountCallCount = 0
    getSev4ViolationCount(): number {
        this.getSev4ViolationCountCallCount++
        return this.getSev4ViolationCountReturnValue
    }

    getSev5ViolationCountReturnValue = 5
    getSev5ViolationCountCallCount = 0
    getSev5ViolationCount(): number {
        this.getSev5ViolationCountCallCount++
        return this.getSev5ViolationCountReturnValue
    }

    getTotalViolationCountReturnValue = 15
    getTotalViolationCountCallCount = 0
    getTotalViolationCount(): number {
        this.getTotalViolationCountCallCount++
        return this.getTotalViolationCountReturnValue
    }

    getViolationsSortedBySeverityReturnValue: Violation[] = []
    getViolationsSortedBySeverityCallCount = 0
    getViolationsSortedBySeverity(): Violation[] {
        this.getViolationsSortedBySeverityCallCount++
        return this.getViolationsSortedBySeverityReturnValue
    }
}

export class FakeViolationLocation implements ViolationLocation {
    compareToReturnValue = 0
    compareToCallHistory: { other: ViolationLocation }[] = []
    compareTo(other: ViolationLocation): number {
        this.compareToCallHistory.push({ other })
        return this.compareToReturnValue
    }

    getFileReturnValue = 'fakeFile'
    getFile(): string {
        return this.getFileReturnValue
    }

    toStringReturnValue = 'someLocation'
    toStringCallCount = 0
    toString(): string {
        this.toStringCallCount++
        return this.toStringReturnValue
    }
}

export class FakeSummarizer implements Summarizer {
    createSummaryMarkdownReturnValue = 'someSummaryMarkdown'
    createSummaryMarkdownCallHistory: { results: Results }[] = []
    createSummaryMarkdown(results: Results): string {
        this.createSummaryMarkdownCallHistory.push({ results })
        return this.createSummaryMarkdownReturnValue
    }
}
