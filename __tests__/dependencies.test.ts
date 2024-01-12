/**
 * We can't really unit test the runtime dependencies, so this file is basically just for code coverage purposes.
 */
import * as core from '@actions/core'
import * as exec from '@actions/exec'
import { Dependencies, RuntimeDependencies } from '../src/dependencies'
import { Inputs } from '../src/types'
import { ExecOptions } from '@actions/exec'
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

    it('getInputs Code Coverage', async () => {
        jest.spyOn(core, 'getInput').mockImplementation((name: string): string => {
            return `${name} Value`
        })
        const inputs: Inputs = dependencies.getInputs()
        expect(inputs).toEqual({
            runCommand: 'run-command Value',
            runArgs: 'run-arguments Value',
            resultsArtifactName: 'results-artifact-name Value'
        })
    })

    it('execCommand Code Coverage', async () => {
        jest.spyOn(exec, 'exec').mockImplementation(
            async (
                commandLine: string,
                _args?: string[] | undefined,
                _options?: ExecOptions | undefined
            ): Promise<number> => {
                if (commandLine === 'doesNotExist') {
                    throw new Error('To help with throwing case')
                }
                return 123
            }
        )
        const exitCode1: number = await dependencies.execCommand('command1', {
            someField: 'someValue'
        })
        expect(exitCode1).toEqual(123)
        const exitCode2: number = await dependencies.execCommand('command2')
        expect(exitCode2).toEqual(123)
        const exitCode3: number = await dependencies.execCommand('doesNotExist')
        expect(exitCode3).toEqual(127)
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

    it('warn Code Coverate', async () => {
        const warningSpy = jest.spyOn(core, 'warning').mockImplementation()
        dependencies.warn('someWarnMessage')
        expect(warningSpy).toHaveBeenCalledWith('someWarnMessage')
    })

    it('fail Code Coverage', async () => {
        const setFailedSpy = jest.spyOn(core, 'setFailed').mockImplementation()
        dependencies.fail('someFailMsg')
        expect(setFailedSpy).toHaveBeenCalledWith('someFailMsg')
    })
})
