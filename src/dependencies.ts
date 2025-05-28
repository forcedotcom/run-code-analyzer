import { mergeWithProcessEnvVars } from './utils'
import { DefaultArtifactClient } from '@actions/artifact'
import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as github from '@actions/github'
import { CommandOutput, EnvironmentVariables, Inputs } from './types'
import { ArtifactClient } from '@actions/artifact/lib/internal/client'
import fs from 'fs'

const COMMAND_NOT_FOUND_EXIT_CODE = 127

/**
 * Interface to extract out dependencies used by the action
 */
export interface Dependencies {
    startGroup(name: string): void

    endGroup(): void

    getInputs(): Promise<Inputs>

    execCommand(command: string, envVars?: EnvironmentVariables, runSilently?: boolean): Promise<CommandOutput>

    uploadArtifact(artifactName: string, artifactFiles: string[]): Promise<void>

    setOutput(name: string, value: string): void

    info(infoMessage: string): void

    warn(warnMessage: string): void

    error(errorMessage: string): void

    fail(failMessage: string): void

    fileExists(file: string): boolean

    writeSummary(summaryMarkdown: string): Promise<void>
}

export interface PullRequestClient {
    getChangedFiles(githubToken: string): Promise<string[]>
}

/**
 * Class that wires up the runtime dependencies
 */
export class RuntimeDependencies implements Dependencies {
    private readonly artifactClient: ArtifactClient
    private readonly pullRequestClient: PullRequestClient

    constructor(
        artifactClient: ArtifactClient = new DefaultArtifactClient(),
        pullRequestClient: PullRequestClient = new RuntimePullRequestClient()
    ) {
        this.artifactClient = artifactClient
        this.pullRequestClient = pullRequestClient
    }

    startGroup(name: string): void {
        core.startGroup(name)
    }

    endGroup(): void {
        core.endGroup()
    }

    async getInputs(): Promise<Inputs> {
        return {
            runArguments: core.getInput('run-arguments'),
            resultsArtifactName: core.getInput('results-artifact-name'),
            changedFiles: await this.pullRequestClient.getChangedFiles(core.getInput('github-token'))
        }
    }

    async execCommand(command: string, envVars: EnvironmentVariables = {}, silent = false): Promise<CommandOutput> {
        try {
            return await exec.getExecOutput(command, [], {
                env: mergeWithProcessEnvVars(envVars),
                ignoreReturnCode: true,
                failOnStdErr: false,
                silent
            })
        } catch (err) {
            // A try/catch is needed here due to issue: https://github.com/actions/toolkit/issues/1625
            return {
                exitCode: COMMAND_NOT_FOUND_EXIT_CODE,
                stdout: '',
                stderr: (err as Error).message
            }
        }
    }

    async uploadArtifact(artifactName: string, artifactFiles: string[]): Promise<void> {
        await this.artifactClient.uploadArtifact(artifactName, artifactFiles, '.')
    }

    setOutput(name: string, value: string): void {
        core.setOutput(name, value)
    }

    info(infoMessage: string): void {
        core.info(infoMessage)
    }

    warn(warnMessage: string): void {
        core.warning(warnMessage)
    }

    error(errorMessage: string): void {
        core.error(errorMessage)
    }

    fail(failMessage: string): void {
        core.setFailed(failMessage)
    }

    fileExists(file: string): boolean {
        return fs.existsSync(file)
    }

    async writeSummary(summaryMarkdown: string): Promise<void> {
        core.summary.addRaw(summaryMarkdown)
        await core.summary.write()
    }
}

// istanbul ignore next - Testing this is both difficult and excessive
class RuntimePullRequestClient implements PullRequestClient {
    private readonly context

    constructor() {
        this.context = github.context
    }

    async getChangedFiles(githubToken: string): Promise<string[]> {
        if (!this.context.payload.pull_request) {
            return []
        }

        const prNumber: number = this.context.payload.pull_request.number
        const octokit = github.getOctokit(githubToken)
        const changedFiles: string[] = []
        const perPage = 100
        let page = 1
        let files

        do {
            const response = await octokit.rest.pulls.listFiles({
                owner: this.context.repo.owner,
                repo: this.context.repo.repo,
                pull_number: prNumber,
                per_page: perPage,
                page
            })
            files = response.data
            for (const file of files) {
                changedFiles.push(file.filename)
            }
            page += 1
        } while (files.length === perPage)
        return changedFiles
    }
}
