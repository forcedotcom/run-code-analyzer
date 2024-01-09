import { Dependencies } from '../src/dependencies'
import { EnvironmentVariables, Inputs } from '../src/types'

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

    uploadArtifactCallHistory: {
        artifactName: string
        artifactFiles: string[]
    }[] = []
    async uploadArtifact(artifactName: string, artifactFiles: string[]): Promise<void> {
        this.uploadArtifactCallHistory.push({ artifactName, artifactFiles })
        return Promise.resolve()
    }

    setOutputCallHistory: { name: string; value: string }[] = []
    setOutput(name: string, value: string): void {
        this.setOutputCallHistory.push({ name, value })
    }

    failCallHistory: { failMessage: string }[] = []
    fail(failMessage: string): void {
        this.failCallHistory.push({ failMessage })
    }
}
