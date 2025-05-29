/**
 * We can't really unit test the runtime dependencies, so this file is basically just for code coverage purposes.
 */
import * as core from '@actions/core'
import * as exec from '@actions/exec'
import { Dependencies, RuntimeDependencies } from '../src/dependencies'
import { CommandOutput, Inputs } from '../src/types'
import { ExecOptions, ExecOutput } from '@actions/exec'
import { ArtifactClient } from '@actions/artifact/lib/internal/client'
import { DefaultArtifactClient } from '@actions/artifact'
import { UploadArtifactOptions, UploadArtifactResponse } from '@actions/artifact/lib/internal/shared/interfaces'

describe('RuntimeDependencies Code Coverage', () => {
    let dependencies: Dependencies

    beforeEach(async () => {
        dependencies = new RuntimeDependencies()
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
})
