import * as main from '../src/main'
import { FakeDependencies } from './fakes'
import { Inputs } from '../src/types'
import * as process from 'process'
import { MESSAGES } from '../src/main'

describe('action', () => {
    let dependencies: FakeDependencies
    const originalJava11HomeValue: string | undefined = process.env['JAVA_HOME_11_X64']

    beforeEach(async () => {
        dependencies = new FakeDependencies()
        delete process.env['JAVA_HOME_11_X64']
    })

    afterEach(async () => {
        process.env['JAVA_HOME_11_X64'] = originalJava11HomeValue
    })

    it('Test default values', async () => {
        await main.run(dependencies)

        expect(dependencies.execCommandCallHistory).toHaveLength(1)
        expect(dependencies.execCommandCallHistory).toContainEqual({
            command: 'sf scanner run --normalize-severity',
            envVars: {
                NODE_OPTIONS: '--max-old-space-size=8192',
                SCANNER_INTERNAL_OUTFILE: 'SalesforceCodeAnalyzerResults.json'
            }
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

    it('Test JAVA_HOME_11_X64 is used as JAVA_HOME if available', async () => {
        process.env['JAVA_HOME_11_X64'] = 'SomeJavaHome11X64Value'
        await main.run(dependencies)
        expect(dependencies.execCommandCallHistory).toHaveLength(1)
        expect(dependencies.execCommandCallHistory).toContainEqual({
            command: 'sf scanner run --normalize-severity',
            envVars: {
                NODE_OPTIONS: '--max-old-space-size=8192',
                SCANNER_INTERNAL_OUTFILE: 'SalesforceCodeAnalyzerResults.json',
                JAVA_HOME: 'SomeJavaHome11X64Value'
            }
        })
    })

    it('Test user supplied outfile and other non-default inputs', async () => {
        dependencies.getInputsReturnValue = {
            runCommand: 'run dfa',
            runArgs: '-o myFile.html --normalize-severity -t ./src',
            resultsArtifactName: 'customArtifactName'
        }
        await main.run(dependencies)

        expect(dependencies.execCommandCallHistory).toHaveLength(1)
        expect(dependencies.execCommandCallHistory).toContainEqual({
            command: 'sf scanner run dfa -o myFile.html --normalize-severity -t ./src',
            envVars: {
                NODE_OPTIONS: '--max-old-space-size=8192',
                SCANNER_INTERNAL_OUTFILE: 'SalesforceCodeAnalyzerResults.json'
            }
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
        dependencies.execCommandReturnValue = 987
        await main.run(dependencies)

        expect(dependencies.setOutputCallHistory).toHaveLength(1)
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
        await main.run(dependencies)
        expect(dependencies.execCommandCallHistory).toHaveLength(0)
        expect(dependencies.uploadArtifactCallHistory).toHaveLength(0)
        expect(dependencies.failCallHistory).toHaveLength(1)
        expect(dependencies.failCallHistory).toContainEqual({
            failMessage: 'bang'
        })
    })

    it('Test missing --normalize-severity from run arguments', async () => {
        dependencies.getInputsReturnValue.runArgs = '--outfile results.xml'
        await main.run(dependencies)
        expect(dependencies.execCommandCallHistory).toHaveLength(0)
        expect(dependencies.uploadArtifactCallHistory).toHaveLength(0)
        expect(dependencies.failCallHistory).toHaveLength(1)
        expect(dependencies.failCallHistory).toContainEqual({
            failMessage: MESSAGES.MISSING_NORMALIZE_SEVERITY
        })
    })
})
