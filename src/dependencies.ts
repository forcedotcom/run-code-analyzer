import { mergeWithProcessEnvVars, getFullErrorMessage } from './utils'
import { DefaultArtifactClient } from '@actions/artifact'
import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as github from '@actions/github'
import { CommandOutput, EnvironmentVariables, Inputs } from './types'
import { ArtifactClient } from '@actions/artifact/lib/internal/client'
import fs from 'fs'
import { MESSAGE_FCNS } from './constants'

const COMMAND_NOT_FOUND_EXIT_CODE = 127

/**
 * Interface to extract out dependencies used by the action
 */
export interface Dependencies {
    startGroup(name: string): void

    endGroup(): void

    isPullRequest(): boolean

    getInputs(): Inputs

    getChangedFiles(githubToken: string): Promise<string[]>

    execCommand(command: string, envVars?: EnvironmentVariables, runSilently?: boolean): Promise<CommandOutput>

    uploadArtifact(artifactName: string, artifactFiles: string[]): Promise<void>

    createActionSummaryLink(githubToken: string): Promise<string>

    createPullRequestReview(githubToken: string, reviewBody: string): Promise<number>

    setOutput(name: string, value: string): void

    info(infoMessage: string): void

    warn(warnMessage: string): void

    error(errorMessage: string): void

    fail(failMessage: string): void

    fileExists(file: string): boolean

    writeSummary(summaryMarkdown: string): Promise<void>
}

/**
 * Class that wires up the runtime dependencies
 */
export class RuntimeDependencies implements Dependencies {
    private readonly artifactClient: ArtifactClient

    constructor(artifactClient: ArtifactClient = new DefaultArtifactClient()) {
        this.artifactClient = artifactClient
    }

    startGroup(name: string): void {
        core.startGroup(name)
    }

    endGroup(): void {
        core.endGroup()
    }

    isPullRequest(): boolean {
        return github.context.payload.pull_request !== undefined
    }

    getInputs(): Inputs {
        return {
            runArguments: core.getInput('run-arguments'),
            resultsArtifactName: core.getInput('results-artifact-name'),
            githubToken: core.getInput('github-token')
        }
    }

    async getChangedFiles(githubToken: string): Promise<string[]> {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const prNumber: number = github.context.payload.pull_request!.number
        const octokit = github.getOctokit(githubToken)
        const changedFiles: string[] = []
        const perPage = 100
        let page = 1
        let files

        do {
            const response = await octokit.rest.pulls.listFiles({
                owner: github.context.repo.owner,
                repo: github.context.repo.repo,
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

    async createActionSummaryLink(githubToken: string): Promise<string> {
        const owner = github.context.repo.owner
        const repo = github.context.repo.repo
        const runId = github.context.runId
        const runAttempt = github.context.runAttempt
        const octokit = github.getOctokit(githubToken)
        let matchingJob: { id: number } | undefined
        try {
            const { data: workflow_run } = await octokit.rest.actions.listJobsForWorkflowRun({
                owner,
                repo,
                run_id: runId
            })
            const matrix = process.env.matrix ? JSON.parse(process.env.matrix) : undefined
            const jobName = `${github.context.job}${matrix ? ` (${Object.values(matrix).join(', ')})` : ''}`
            matchingJob = workflow_run.jobs.find(job => job.name === jobName)
        } catch (error) {
            core.warning(MESSAGE_FCNS.FAILED_TO_READ_JOBS(getFullErrorMessage(error)))
            matchingJob = undefined
        }
        // Infuriatingly, there's no way to get the job's display name from within the action context, and the github API
        // call _only_ returns the display name. So if the user assigns the job a custom name, or does shenanigans with
        // matrices, then we can't link directly to the table, and have to link to just the page itself and expect the user]
        // to scroll down the table themselves.
        if (matchingJob) {
            return `https://github.com/${owner}/${repo}/actions/runs/${runId}/attempts/${runAttempt}#summary-${matchingJob.id}`
        } else {
            return `https://github.com/${owner}/${repo}/actions/runs/${runId}/attempts/${runAttempt}`
        }
    }

    async createPullRequestReview(githubToken: string, reviewBody: string): Promise<number> {
        const owner = github.context.repo.owner
        const repo = github.context.repo.repo
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const prNumber: number = github.context.payload.pull_request!.number
        const octokit = github.getOctokit(githubToken)
        const {
            data: { id }
        } = await octokit.rest.pulls.createReview({
            owner,
            repo,
            pull_number: prNumber,
            event: 'COMMENT',
            body: reviewBody
        })
        return id
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
