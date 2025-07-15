/**
 * We can't really unit test the runtime dependencies, so this file is basically just for code coverage purposes.
 */
import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as github from '@actions/github'
import { Dependencies, RuntimeDependencies } from '../src/dependencies'
import { CommandOutput, Inputs } from '../src/types'
import { ExecOptions, ExecOutput } from '@actions/exec'
import { ArtifactClient } from '@actions/artifact/lib/internal/client'
import { DefaultArtifactClient } from '@actions/artifact'
import { UploadArtifactOptions, UploadArtifactResponse } from '@actions/artifact/lib/internal/shared/interfaces'

jest.mock('@actions/github', () => ({
    context: {
        payload: {},
        repo: {
            owner: 'test-owner',
            repo: 'test-repo'
        },
        runId: 12345,
        runAttempt: 1,
        job: 'test-job'
    },
    getOctokit: jest.fn()
}))

describe('RuntimeDependencies Code Coverage', () => {
    let dependencies: Dependencies

    beforeEach(async () => {
        dependencies = new RuntimeDependencies()
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('startGroup Code Coverage', async () => {
        const startGroupSpy = jest.spyOn(core, 'startGroup').mockImplementation()
        dependencies.startGroup('hello world')
        expect(startGroupSpy).toHaveBeenCalledWith('hello world')
    })

    it('endGroup Code Coverage', async () => {
        const endGroupSpy = jest.spyOn(core, 'endGroup').mockImplementation()
        dependencies.endGroup()
        expect(endGroupSpy).toHaveBeenCalled()
    })

    it('isPullRequest returns true when pull_request is defined', async () => {
        github.context.payload.pull_request = { number: 123 }
        expect(dependencies.isPullRequest()).toBe(true)
    })

    it('isPullRequest returns false when pull_request is not defined', async () => {
        github.context.payload.pull_request = undefined
        expect(dependencies.isPullRequest()).toBe(false)
    })

    it('getInputs Code Coverage', () => {
        jest.spyOn(core, 'getInput').mockImplementation((name: string): string => {
            return `${name} Value`
        })
        const inputs: Inputs = dependencies.getInputs()
        expect(inputs).toEqual({
            runArguments: 'run-arguments Value',
            resultsArtifactName: 'results-artifact-name Value',
            githubToken: 'github-token Value'
        })
    })

    it('execCommand Code Coverage', async () => {
        jest.spyOn(exec, 'getExecOutput').mockImplementation(
            async (
                commandLine: string,
                _args?: string[] | undefined,
                _options?: ExecOptions | undefined
            ): Promise<ExecOutput> => {
                if (commandLine === 'doesNotExist') {
                    throw new Error('dummyErrorMsg')
                }
                return { exitCode: 123, stdout: 'stdoutValue', stderr: 'stderrValue' }
            }
        )
        const cmdOut1: CommandOutput = await dependencies.execCommand('command1', {
            someField: 'someValue'
        })
        expect(cmdOut1).toEqual({ exitCode: 123, stdout: 'stdoutValue', stderr: 'stderrValue' })
        const cmdOut2: CommandOutput = await dependencies.execCommand('command2')
        expect(cmdOut2).toEqual({ exitCode: 123, stdout: 'stdoutValue', stderr: 'stderrValue' })
        const cmdOut3: CommandOutput = await dependencies.execCommand('doesNotExist')
        expect(cmdOut3).toEqual({ exitCode: 127, stdout: '', stderr: 'dummyErrorMsg' })
    })

    it('uploadArtifact Code Coverage', async () => {
        let suppliedName = ''
        let suppliedFiles: string[] = []
        let suppliedRootDirectory = ''
        const artifactClient: ArtifactClient = new (class extends DefaultArtifactClient {
            override async uploadArtifact(
                name: string,
                files: string[],
                rootDirectory: string,
                _opts?: UploadArtifactOptions
            ): Promise<UploadArtifactResponse> {
                suppliedName = name
                suppliedFiles = files
                suppliedRootDirectory = rootDirectory
                return {}
            }
        })()
        dependencies = new RuntimeDependencies(artifactClient)
        dependencies.uploadArtifact('someArtifactName', ['someFile.txt'])
        expect(suppliedName).toEqual('someArtifactName')
        expect(suppliedFiles).toEqual(['someFile.txt'])
        expect(suppliedRootDirectory).toEqual('.')
    })

    it('setOutput Code Coverage', async () => {
        const setOutputSpy = jest.spyOn(core, 'setOutput').mockImplementation()
        dependencies.setOutput('someField', 'someValue')
        expect(setOutputSpy).toHaveBeenCalledWith('someField', 'someValue')
    })

    it('info Code Coverage', async () => {
        const infoSpy = jest.spyOn(core, 'info').mockImplementation()
        dependencies.info('someInfoMessage')
        expect(infoSpy).toHaveBeenCalledWith('someInfoMessage')
    })

    it('warn Code Coverage', async () => {
        const warningSpy = jest.spyOn(core, 'warning').mockImplementation()
        dependencies.warn('someWarnMessage')
        expect(warningSpy).toHaveBeenCalledWith('someWarnMessage')
    })

    it('error Code Coverage', async () => {
        const errorSpy = jest.spyOn(core, 'error').mockImplementation()
        dependencies.error('someErrorMessage')
        expect(errorSpy).toHaveBeenCalledWith('someErrorMessage')
    })

    it('fail Code Coverage', async () => {
        const setFailedSpy = jest.spyOn(core, 'setFailed').mockImplementation()
        dependencies.fail('someFailMsg')
        expect(setFailedSpy).toHaveBeenCalledWith('someFailMsg')
    })

    it('fileExists Code Coverage', async () => {
        expect(dependencies.fileExists('action.yml')).toEqual(true)
        expect(dependencies.fileExists('thisFileDoesNotExist.html')).toEqual(false)
    })

    it('writeSummary Code Coverage', async () => {
        const coreSummaryAddRawSpy = jest.spyOn(core.summary, 'addRaw').mockImplementation()
        const coreSummaryWriteSpy = jest.spyOn(core.summary, 'write').mockImplementation()
        await dependencies.writeSummary('someSummaryMarkdown')
        expect(coreSummaryAddRawSpy).toHaveBeenCalledWith('someSummaryMarkdown')
        expect(coreSummaryWriteSpy).toHaveBeenCalled()
    })

    it('getChangedFiles Code Coverage - single page', async () => {
        const mockOctokit = {
            rest: {
                pulls: {
                    listFiles: jest.fn().mockResolvedValue({
                        data: [{ filename: 'file1.ts' }, { filename: 'file2.js' }, { filename: 'file3.md' }]
                    })
                }
            }
        }
        ;(github.getOctokit as jest.Mock).mockReturnValue(mockOctokit)
        github.context.payload.pull_request = { number: 123 }

        const result = await dependencies.getChangedFiles('test-token')

        expect(github.getOctokit).toHaveBeenCalledWith('test-token')
        expect(mockOctokit.rest.pulls.listFiles).toHaveBeenCalledWith({
            owner: 'test-owner',
            repo: 'test-repo',
            pull_number: 123,
            per_page: 100,
            page: 1
        })
        expect(result).toEqual(['file1.ts', 'file2.js', 'file3.md'])
    })

    it('getChangedFiles - multiple pages', async () => {
        const mockOctokit = {
            rest: {
                pulls: {
                    listFiles: jest
                        .fn()
                        .mockResolvedValueOnce({
                            data: Array.from({ length: 100 }, (_, i) => ({ filename: `file${i}.ts` }))
                        })
                        .mockResolvedValueOnce({
                            data: [{ filename: 'file100.ts' }, { filename: 'file101.ts' }]
                        })
                }
            }
        }
        ;(github.getOctokit as jest.Mock).mockReturnValue(mockOctokit)
        github.context.payload.pull_request = { number: 456 }

        const result = await dependencies.getChangedFiles('test-token')

        expect(mockOctokit.rest.pulls.listFiles).toHaveBeenCalledTimes(2)
        expect(mockOctokit.rest.pulls.listFiles).toHaveBeenNthCalledWith(1, {
            owner: 'test-owner',
            repo: 'test-repo',
            pull_number: 456,
            per_page: 100,
            page: 1
        })
        expect(mockOctokit.rest.pulls.listFiles).toHaveBeenNthCalledWith(2, {
            owner: 'test-owner',
            repo: 'test-repo',
            pull_number: 456,
            per_page: 100,
            page: 2
        })
        expect(result).toHaveLength(102)
    })

    it('createActionSummaryLink - with matching job', async () => {
        const mockOctokit = {
            rest: {
                actions: {
                    listJobsForWorkflowRun: jest.fn().mockResolvedValue({
                        data: {
                            jobs: [
                                { id: 1, name: 'other-job' },
                                { id: 2, name: 'test-job' },
                                { id: 3, name: 'another-job' }
                            ]
                        }
                    })
                }
            }
        }
        ;(github.getOctokit as jest.Mock).mockReturnValue(mockOctokit)

        const result = await dependencies.createActionSummaryLink('test-token')

        expect(github.getOctokit).toHaveBeenCalledWith('test-token')
        expect(mockOctokit.rest.actions.listJobsForWorkflowRun).toHaveBeenCalledWith({
            owner: 'test-owner',
            repo: 'test-repo',
            run_id: 12345
        })
        expect(result).toEqual('https://github.com/test-owner/test-repo/actions/runs/12345/attempts/1#summary-2')
    })

    it('createActionSummaryLink - with matrix job', async () => {
        const originalMatrix = process.env.matrix
        process.env.matrix = JSON.stringify({ os: 'ubuntu-latest', node: '18' })

        const mockOctokit = {
            rest: {
                actions: {
                    listJobsForWorkflowRun: jest.fn().mockResolvedValue({
                        data: {
                            jobs: [{ id: 1, name: 'test-job (ubuntu-latest, 18)' }]
                        }
                    })
                }
            }
        }
        ;(github.getOctokit as jest.Mock).mockReturnValue(mockOctokit)

        const result = await dependencies.createActionSummaryLink('test-token')

        expect(result).toEqual('https://github.com/test-owner/test-repo/actions/runs/12345/attempts/1#summary-1')

        // Restore original matrix value
        if (originalMatrix !== undefined) {
            process.env.matrix = originalMatrix
        } else {
            delete process.env.matrix
        }
    })

    it('createActionSummaryLink - no matching job', async () => {
        const mockOctokit = {
            rest: {
                actions: {
                    listJobsForWorkflowRun: jest.fn().mockResolvedValue({
                        data: {
                            jobs: [
                                { id: 1, name: 'other-job' },
                                { id: 2, name: 'different-job' }
                            ]
                        }
                    })
                }
            }
        }
        ;(github.getOctokit as jest.Mock).mockReturnValue(mockOctokit)

        const result = await dependencies.createActionSummaryLink('test-token')

        expect(result).toEqual('https://github.com/test-owner/test-repo/actions/runs/12345/attempts/1')
    })

    it('createActionSummaryLink - API error', async () => {
        const mockOctokit = {
            rest: {
                actions: {
                    listJobsForWorkflowRun: jest.fn().mockRejectedValue(new Error('API Error'))
                }
            }
        }
        ;(github.getOctokit as jest.Mock).mockReturnValue(mockOctokit)
        const warningSpy = jest.spyOn(core, 'warning').mockImplementation()

        const result = await dependencies.createActionSummaryLink('test-token')

        expect(warningSpy).toHaveBeenCalledWith(expect.stringContaining('API Error'))
        expect(result).toEqual('https://github.com/test-owner/test-repo/actions/runs/12345/attempts/1')
    })

    it('createPullRequestReview', async () => {
        const mockOctokit = {
            rest: {
                pulls: {
                    createReview: jest.fn().mockResolvedValue({
                        data: { id: 789 }
                    })
                }
            }
        }
        ;(github.getOctokit as jest.Mock).mockReturnValue(mockOctokit)
        github.context.payload.pull_request = { number: 123 }

        const result = await dependencies.createPullRequestReview('test-token', 'Test review body')

        expect(github.getOctokit).toHaveBeenCalledWith('test-token')
        expect(mockOctokit.rest.pulls.createReview).toHaveBeenCalledWith({
            owner: 'test-owner',
            repo: 'test-repo',
            pull_number: 123,
            event: 'COMMENT',
            body: 'Test review body'
        })
        expect(result).toEqual(789)
    })
})
