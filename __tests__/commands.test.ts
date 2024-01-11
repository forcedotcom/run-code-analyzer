import { FakeDependencies } from './fakes'
import { CommandExecutor, RuntimeCommandExecutor } from '../src/commands'

describe('RuntimeCommandExecutor Tests', () => {
    let dependencies: FakeDependencies
    let commandExecutor: CommandExecutor
    const originalJava11HomeValue: string | undefined = process.env['JAVA_HOME_11_X64']

    beforeEach(async () => {
        dependencies = new FakeDependencies()
        commandExecutor = new RuntimeCommandExecutor(dependencies)
        delete process.env['JAVA_HOME_11_X64']
    })

    afterEach(async () => {
        process.env['JAVA_HOME_11_X64'] = originalJava11HomeValue
    })

    describe('runCodeAnalyzer Tests', () => {
        it('Confirm command is build correctly and zero exit code', async () => {
            const exitCode: number = await commandExecutor.runCodeAnalyzer(
                'run',
                '--normalize-severity',
                'internalOutfile.json'
            )

            expect(dependencies.execCommandCallHistory).toContainEqual({
                command: 'sf scanner run --normalize-severity',
                envVars: {
                    NODE_OPTIONS: '--max-old-space-size=8192',
                    SCANNER_INTERNAL_OUTFILE: 'internalOutfile.json'
                }
            })
            expect(exitCode).toEqual(0)
        })

        it('Confirm command is build correctly and nonzero exit code', async () => {
            dependencies.execCommandReturnValue = 123
            const exitCode: number = await commandExecutor.runCodeAnalyzer(
                'run dfa',
                '--normalize-severity',
                'internalOutfile.json'
            )

            expect(dependencies.execCommandCallHistory).toContainEqual({
                command: 'sf scanner run dfa --normalize-severity',
                envVars: {
                    NODE_OPTIONS: '--max-old-space-size=8192',
                    SCANNER_INTERNAL_OUTFILE: 'internalOutfile.json'
                }
            })
            expect(exitCode).toEqual(123)
        })

        it('Test JAVA_HOME_11_X64 is used as JAVA_HOME if available', async () => {
            process.env['JAVA_HOME_11_X64'] = 'SomeJavaHome11X64Value'
            const ce: CommandExecutor = new RuntimeCommandExecutor(dependencies)
            const exitCode: number = await ce.runCodeAnalyzer(
                'run',
                '--normalize-severity -o user.xml',
                'internal.json'
            )

            expect(dependencies.execCommandCallHistory).toContainEqual({
                command: 'sf scanner run --normalize-severity -o user.xml',
                envVars: {
                    NODE_OPTIONS: '--max-old-space-size=8192',
                    SCANNER_INTERNAL_OUTFILE: 'internal.json',
                    JAVA_HOME: 'SomeJavaHome11X64Value'
                }
            })
            expect(exitCode).toEqual(0)
        })
    })

    describe('isSalesforceCliInstalled Tests', () => {
        it('Check command and output for zero return', async () => {
            const tf: boolean = await commandExecutor.isSalesforceCliInstalled()

            expect(dependencies.execCommandCallHistory).toHaveLength(1)
            expect(dependencies.execCommandCallHistory).toContainEqual({
                command: 'sf --version',
                envVars: undefined
            })
            expect(tf).toEqual(true)
        })

        it('Check command and output for nonzero return', async () => {
            dependencies.execCommandReturnValue = 123
            const tf: boolean = await commandExecutor.isSalesforceCliInstalled()

            expect(dependencies.execCommandCallHistory).toHaveLength(1)
            expect(dependencies.execCommandCallHistory).toContainEqual({
                command: 'sf --version',
                envVars: undefined
            })
            expect(tf).toEqual(false)
        })
    })
})
