import { CommandOutput, Dependencies } from '../src/dependencies'
import { EnvironmentVariables, Inputs } from '../src/types'
import { CommandExecutor } from '../src/commands'

export class FakeDependencies implements Dependencies {
    startGroupCallHistory: { name: string }[] = []
    startGroup(name: string): void {
        this.startGroupCallHistory.push({ name })
    }

    endGroupCallCount = 0
    endGroup(): void {
        this.endGroupCallCount++
    }

    execCommandReturnValue: CommandOutput = { exitCode: 0, stdout: '', stderr: '' }
    execCommandCallHistory: { command: string; envVars: EnvironmentVariables; runSilently: boolean }[] = []
    async execCommand(command: string, envVars: EnvironmentVariables, runSilently: boolean): Promise<CommandOutput> {
        this.execCommandCallHistory.push({ command, envVars, runSilently })
        return this.execCommandReturnValue
    }

    // We should match the default input values from action.yml here:
    getInputsReturnValue: Inputs = {
        runCommand: 'run',
        runArgs: '--normalize-severity',
        resultsArtifactName: 'code-analyzer-results'
    }
    getInputsCallCount = 0
    getInputs(): Inputs {
        this.getInputsCallCount++
        return this.getInputsReturnValue
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

    isMinimumScannerPluginInstalledReturnValue = true
    isMinimumScannerPluginInstalledCallHistory: { minVersion: string }[] = []
    async isMinimumScannerPluginInstalled(minVersion: string): Promise<boolean> {
        this.isMinimumScannerPluginInstalledCallHistory.push({ minVersion })
        return this.isMinimumScannerPluginInstalledReturnValue
    }

    installScannerPluginCallCount = 0
    installScannerPluginReturnValue = true
    async installScannerPlugin(): Promise<boolean> {
        this.installScannerPluginCallCount++
        return this.installScannerPluginReturnValue
    }

    runCodeAnalyzerReturnValue = 0
    runCodeAnalyzerCallHistory: { runCmd: string; runArgs: string; internalOutfile: string }[] = []
    async runCodeAnalyzer(runCmd: string, runArgs: string, internalOutfile: string): Promise<number> {
        this.runCodeAnalyzerCallHistory.push({ runCmd, runArgs, internalOutfile })
        return this.runCodeAnalyzerReturnValue
    }
}
