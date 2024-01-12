import { Dependencies } from '../src/dependencies'
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

    execCommandReturnValue = 0
    execCommandCallHistory: { command: string; envVars: EnvironmentVariables }[] = []
    async execCommand(command: string, envVars: EnvironmentVariables): Promise<number> {
        this.execCommandCallHistory.push({ command, envVars })
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

    warnCallHistory: { warnMessage: string }[] = []
    warn(warnMessage: string): void {
        this.warnCallHistory.push({ warnMessage })
    }

    failCallHistory: { failMessage: string }[] = []
    fail(failMessage: string): void {
        this.failCallHistory.push({ failMessage })
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

    runCodeAnalyzerReturnValue = 0
    runCodeAnalyzerCallHistory: { runCmd: string; runArgs: string; internalOutfile: string }[] = []
    async runCodeAnalyzer(runCmd: string, runArgs: string, internalOutfile: string): Promise<number> {
        this.runCodeAnalyzerCallHistory.push({ runCmd, runArgs, internalOutfile })
        return this.runCodeAnalyzerReturnValue
    }
}
