import { ExecOutput } from '@actions/exec'

export type Inputs = {
    runArguments: string
    resultsArtifactName: string
}

export type EnvironmentVariables = { [key: string]: string }

export type CommandOutput = ExecOutput
