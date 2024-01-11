import * as main from '../src/main'
import { FakeCommandExecutor, FakeDependencies } from './fakes'
import { Inputs } from '../src/types'
import { INTERNAL_OUTFILE, MESSAGES } from '../src/main'

describe('main run Tests', () => {
    let dependencies: FakeDependencies
    let commandExecutor: FakeCommandExecutor

    beforeEach(async () => {
        dependencies = new FakeDependencies()
        commandExecutor = new FakeCommandExecutor()
    })

    it('Test default values', async () => {
        await main.run(dependencies, commandExecutor)

        expect(commandExecutor.isSalesforceCliInstalledCallCount).toEqual(1)

        expect(commandExecutor.runCodeAnalyzerCallHistory).toHaveLength(1)
        expect(commandExecutor.runCodeAnalyzerCallHistory).toContainEqual({
            runCmd: 'run',
            runArgs: '--normalize-severity',
            internalOutfile: INTERNAL_OUTFILE
        })

        expect(dependencies.uploadArtifactCallHistory).toHaveLength(1)
        expect(dependencies.uploadArtifactCallHistory).toContainEqual({
            artifactName: 'code-analyzer-results',
            artifactFiles: ['SalesforceCodeAnalyzerResults.json']
        })

        expect(dependencies.setOutputCallHistory).toHaveLength(1)
        expect(dependencies.setOutputCallHistory).toContainEqual({
            name: 'exit-code',
            value: '0'
        })

        expect(dependencies.failCallHistory).toHaveLength(0)
    })

    it('Test user supplied outfile and other non-default inputs', async () => {
        dependencies.getInputsReturnValue = {
            runCommand: 'run dfa',
            runArgs: '-o myFile.html --normalize-severity -t ./src',
            resultsArtifactName: 'customArtifactName'
        }
        await main.run(dependencies, commandExecutor)

        expect(commandExecutor.isSalesforceCliInstalledCallCount).toEqual(1)

        expect(commandExecutor.runCodeAnalyzerCallHistory).toHaveLength(1)
        expect(commandExecutor.runCodeAnalyzerCallHistory).toContainEqual({
            runCmd: 'run dfa',
            runArgs: '-o myFile.html --normalize-severity -t ./src',
            internalOutfile: INTERNAL_OUTFILE
        })

        expect(dependencies.uploadArtifactCallHistory).toHaveLength(1)
        expect(dependencies.uploadArtifactCallHistory).toContainEqual({
            artifactName: 'customArtifactName',
            artifactFiles: ['myFile.html']
        })

        expect(dependencies.setOutputCallHistory).toHaveLength(1)
        expect(dependencies.setOutputCallHistory).toContainEqual({
            name: 'exit-code',
            value: '0'
        })

        expect(dependencies.failCallHistory).toHaveLength(0)
    })

    it('Test nonzero exit code from command call', async () => {
        commandExecutor.runCodeAnalyzerReturnValue = 987
        await main.run(dependencies, commandExecutor)

        expect(dependencies.setOutputCallHistory).toContainEqual({
            name: 'exit-code',
            value: '987'
        })

        expect(dependencies.failCallHistory).toHaveLength(0)
    })

    it('Test misc error thrown by action', async () => {
        class ThrowingDependencies extends FakeDependencies {
            override getInputs(): Inputs {
                throw new Error('bang')
            }
        }
        dependencies = new ThrowingDependencies()
        await main.run(dependencies, commandExecutor)

        expect(commandExecutor.runCodeAnalyzerCallHistory).toHaveLength(0)
        expect(dependencies.uploadArtifactCallHistory).toHaveLength(0)
        expect(dependencies.failCallHistory).toHaveLength(1)
        expect(dependencies.failCallHistory).toContainEqual({
            failMessage: 'bang'
        })
    })

    it('Test missing --normalize-severity from run arguments', async () => {
        dependencies.getInputsReturnValue.runArgs = '--outfile results.xml'
        await main.run(dependencies, commandExecutor)

        expect(commandExecutor.runCodeAnalyzerCallHistory).toHaveLength(0)
        expect(dependencies.uploadArtifactCallHistory).toHaveLength(0)
        expect(dependencies.failCallHistory).toHaveLength(1)
        expect(dependencies.failCallHistory).toContainEqual({
            failMessage: MESSAGES.MISSING_NORMALIZE_SEVERITY
        })
    })

    it('Test when Salesforce CLI is not installed', async () => {
        commandExecutor.isSalesforceCliInstalledReturnValue = false
        await main.run(dependencies, commandExecutor)
        expect(commandExecutor.runCodeAnalyzerCallHistory).toHaveLength(0)
        expect(dependencies.uploadArtifactCallHistory).toHaveLength(0)
        expect(dependencies.failCallHistory).toHaveLength(1)
        expect(dependencies.failCallHistory).toContainEqual({
            failMessage: MESSAGES.SF_NOT_INSTALLED
        })
    })
})
