import { ExecOutput } from '@actions/exec'

export type Inputs = {
    runCommand: string
    runArgs: string
    resultsArtifactName: string
}

export type EnvironmentVariables = { [key: string]: string }

export type CommandOutput = ExecOutput
