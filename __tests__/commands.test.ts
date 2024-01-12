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
            dependencies.execCommandReturnValue = { exitCode: 123, stdout: '', stderr: '' }
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
                command: 'sf --version'
            })
            expect(tf).toEqual(true)
        })

        it('Check command and output for nonzero return', async () => {
            dependencies.execCommandReturnValue = { exitCode: 123, stdout: '', stderr: '' }
            const tf: boolean = await commandExecutor.isSalesforceCliInstalled()

            expect(dependencies.execCommandCallHistory).toHaveLength(1)
            expect(dependencies.execCommandCallHistory).toContainEqual({
                command: 'sf --version'
            })
            expect(tf).toEqual(false)
        })
    })

    describe('installSalesforceCli Tests', () => {
        it('Check command and output for zero return', async () => {
            const success: boolean = await commandExecutor.installSalesforceCli()

            expect(dependencies.execCommandCallHistory).toHaveLength(1)
            expect(dependencies.execCommandCallHistory).toContainEqual({
                command: 'npm install -g @salesforce/cli@latest'
            })
            expect(success).toEqual(true)
        })

        it('Check command and output for nonzero return', async () => {
            dependencies.execCommandReturnValue = { exitCode: 1, stdout: '', stderr: '' }
            const success: boolean = await commandExecutor.installSalesforceCli()

            expect(dependencies.execCommandCallHistory).toHaveLength(1)
            expect(dependencies.execCommandCallHistory).toContainEqual({
                command: 'npm install -g @salesforce/cli@latest'
            })
            expect(success).toEqual(false)
        })
    })

    describe('isMinimumScannerPluginInstalled Tests', () => {
        const sampleResponseJson =
            '[\n' +
            '  {\n' +
            '    "name": "@salesforce/sfdx-scanner",\n' +
            '    "version": "3.21.0",\n' +
            '    "aBunchOfOtherFields": "thatWeDon\'tCareAbout"\n' +
            '  }\n' +
            ']'

        it('Check when scanner plugin is installed with a version less than the minimum version', async () => {
            dependencies.execCommandReturnValue = { exitCode: 0, stdout: sampleResponseJson, stderr: '' }
            const tf: boolean = await commandExecutor.isMinimumScannerPluginInstalled('3.22.0')

            expect(dependencies.execCommandCallHistory).toHaveLength(1)
            expect(dependencies.execCommandCallHistory).toContainEqual({
                command: 'sf plugins inspect @salesforce/sfdx-scanner --json',
                envVars: {},
                runSilently: true
            })
            expect(tf).toEqual(false)
        })

        it('Check when scanner plugin is installed with a version exactly same as minimum version', async () => {
            dependencies.execCommandReturnValue = { exitCode: 0, stdout: sampleResponseJson, stderr: '' }
            const tf: boolean = await commandExecutor.isMinimumScannerPluginInstalled('3.21.0')

            expect(dependencies.execCommandCallHistory).toHaveLength(1)
            expect(dependencies.execCommandCallHistory).toContainEqual({
                command: 'sf plugins inspect @salesforce/sfdx-scanner --json',
                envVars: {},
                runSilently: true
            })
            expect(tf).toEqual(true)
        })

        it('Check when scanner plugin is installed with a version greater than the minimum version', async () => {
            dependencies.execCommandReturnValue = { exitCode: 0, stdout: sampleResponseJson, stderr: '' }
            const tf: boolean = await commandExecutor.isMinimumScannerPluginInstalled('3.20.0')

            expect(dependencies.execCommandCallHistory).toHaveLength(1)
            expect(dependencies.execCommandCallHistory).toContainEqual({
                command: 'sf plugins inspect @salesforce/sfdx-scanner --json',
                envVars: {},
                runSilently: true
            })
            expect(tf).toEqual(true)
        })

        it('Check when scanner plugin is not installed', async () => {
            dependencies.execCommandReturnValue = { exitCode: 1, stdout: '', stderr: '{ "error": {} }' }
            const tf: boolean = await commandExecutor.isMinimumScannerPluginInstalled('3.20.0')

            expect(dependencies.execCommandCallHistory).toHaveLength(1)
            expect(dependencies.execCommandCallHistory).toContainEqual({
                command: 'sf plugins inspect @salesforce/sfdx-scanner --json',
                envVars: {},
                runSilently: true
            })
            expect(tf).toEqual(false)
        })

        it('When sf command unexpectedly gives invalid json back we should not blow up', async () => {
            dependencies.execCommandReturnValue = { exitCode: 0, stdout: 'oops: this not valid json', stderr: '' }
            const tf: boolean = await commandExecutor.isMinimumScannerPluginInstalled('3.21.0')

            expect(dependencies.execCommandCallHistory).toHaveLength(1)
            expect(dependencies.execCommandCallHistory).toContainEqual({
                command: 'sf plugins inspect @salesforce/sfdx-scanner --json',
                envVars: {},
                runSilently: true
            })
            expect(tf).toEqual(false)
        })

        it('When sf command unexpectedly gives multiple plugin results back we should not blow up', async () => {
            dependencies.execCommandReturnValue = { exitCode: 0, stdout: '[{},{}]', stderr: '' }
            const tf: boolean = await commandExecutor.isMinimumScannerPluginInstalled('3.21.0')

            expect(dependencies.execCommandCallHistory).toHaveLength(1)
            expect(dependencies.execCommandCallHistory).toContainEqual({
                command: 'sf plugins inspect @salesforce/sfdx-scanner --json',
                envVars: {},
                runSilently: true
            })
            expect(tf).toEqual(false)
        })
    })

    describe('installScannerPlugin', () => {
        it('Check command and output for zero return', async () => {
            const success: boolean = await commandExecutor.installScannerPlugin()

            expect(dependencies.execCommandCallHistory).toHaveLength(1)
            expect(dependencies.execCommandCallHistory).toContainEqual({
                command: 'sf plugins install @salesforce/sfdx-scanner@latest'
            })
            expect(success).toEqual(true)
        })

        it('Check command and output for nonzero return', async () => {
            dependencies.execCommandReturnValue = { exitCode: 1, stdout: '', stderr: '' }
            const success: boolean = await commandExecutor.installScannerPlugin()

            expect(dependencies.execCommandCallHistory).toHaveLength(1)
            expect(dependencies.execCommandCallHistory).toContainEqual({
                command: 'sf plugins install @salesforce/sfdx-scanner@latest'
            })
            expect(success).toEqual(false)
        })
    })
})
