import { FakeDependencies } from './fakes'
import { CommandExecutor, RuntimeCommandExecutor } from '../src/commands'
import { CommandOutput } from '../src/types'

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
            const commandOutput: CommandOutput = await commandExecutor.runCodeAnalyzer(
                '--output-file results.json -v detail'
            )

            expect(dependencies.execCommandCallHistory).toContainEqual({
                command: 'sf code-analyzer run --output-file results.json -v detail',
                envVars: {
                    NODE_OPTIONS: '--max-old-space-size=8192'
                }
            })
            expect(commandOutput.exitCode).toEqual(0)
        })

        it('Confirm command is build correctly and nonzero exit code', async () => {
            dependencies.execCommandReturnValue = { exitCode: 123, stdout: '', stderr: '' }
            const commandOutput: CommandOutput = await commandExecutor.runCodeAnalyzer('-f results.json')

            expect(dependencies.execCommandCallHistory).toContainEqual({
                command: 'sf code-analyzer run -f results.json',
                envVars: {
                    NODE_OPTIONS: '--max-old-space-size=8192'
                }
            })
            expect(commandOutput.exitCode).toEqual(123)
        })

        it('Test JAVA_HOME_11_X64 is used as JAVA_HOME if available', async () => {
            process.env['JAVA_HOME_11_X64'] = 'SomeJavaHome11X64Value'
            const ce: CommandExecutor = new RuntimeCommandExecutor(dependencies)
            const commandOutput: CommandOutput = await ce.runCodeAnalyzer('--view detail -f user.xml')

            expect(dependencies.execCommandCallHistory).toContainEqual({
                command: 'sf code-analyzer run --view detail -f user.xml',
                envVars: {
                    NODE_OPTIONS: '--max-old-space-size=8192',
                    JAVA_HOME: 'SomeJavaHome11X64Value'
                }
            })
            expect(commandOutput.exitCode).toEqual(0)
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

    describe('isMinimumCodeAnalyzerPluginInstalled Tests', () => {
        const createSampleResponse = (versionNumber: string): string =>
            '[\n' +
            '  {\n' +
            '    "name": "@salesforce/plugin-code-analyzer",\n' +
            `    "version": "${versionNumber}",\n` +
            '    "aBunchOfOtherFields": "thatWeDon\'tCareAbout"\n' +
            '  }\n' +
            ']'

        it('Check when scanner plugin is installed with a version less than the minimum version', async () => {
            dependencies.execCommandReturnValue = {
                exitCode: 0,
                stdout: createSampleResponse('5.0.0-alpha.2'),
                stderr: ''
            }
            const tf: boolean = await commandExecutor.isMinimumCodeAnalyzerPluginInstalled('5.0.0-beta.0')

            expect(dependencies.execCommandCallHistory).toHaveLength(1)
            expect(dependencies.execCommandCallHistory).toContainEqual({
                command: 'sf plugins inspect @salesforce/plugin-code-analyzer --json',
                envVars: {},
                runSilently: true
            })
            expect(tf).toEqual(false)
        })

        it('Check when code-analyzer plugin is installed with a version exactly same as minimum version', async () => {
            dependencies.execCommandReturnValue = {
                exitCode: 0,
                stdout: createSampleResponse('5.0.0-beta.0'),
                stderr: ''
            }
            const tf: boolean = await commandExecutor.isMinimumCodeAnalyzerPluginInstalled('5.0.0-beta.0')

            expect(dependencies.execCommandCallHistory).toHaveLength(1)
            expect(dependencies.execCommandCallHistory).toContainEqual({
                command: 'sf plugins inspect @salesforce/plugin-code-analyzer --json',
                envVars: {},
                runSilently: true
            })
            expect(tf).toEqual(true)
        })

        it.each(['5.0.0-beta.2', '5.0.0', '5.1.3'])(
            'Check when code-analyzer plugin is installed with a version %s greater than the minimum version',
            async versionToTest => {
                dependencies.execCommandReturnValue = {
                    exitCode: 0,
                    stdout: createSampleResponse(versionToTest),
                    stderr: ''
                }
                const tf: boolean = await commandExecutor.isMinimumCodeAnalyzerPluginInstalled('5.0.0-beta.0')

                expect(dependencies.execCommandCallHistory).toHaveLength(1)
                expect(dependencies.execCommandCallHistory).toContainEqual({
                    command: 'sf plugins inspect @salesforce/plugin-code-analyzer --json',
                    envVars: {},
                    runSilently: true
                })
                expect(tf).toEqual(true)
            }
        )

        it('Check when code-analyzer plugin is not installed', async () => {
            dependencies.execCommandReturnValue = { exitCode: 1, stdout: '', stderr: '{ "error": {} }' }
            const tf: boolean = await commandExecutor.isMinimumCodeAnalyzerPluginInstalled('5.0.0-beta.0')

            expect(dependencies.execCommandCallHistory).toHaveLength(1)
            expect(dependencies.execCommandCallHistory).toContainEqual({
                command: 'sf plugins inspect @salesforce/plugin-code-analyzer --json',
                envVars: {},
                runSilently: true
            })
            expect(tf).toEqual(false)
        })

        it('When sf command unexpectedly gives invalid json back we should not blow up', async () => {
            dependencies.execCommandReturnValue = { exitCode: 0, stdout: 'oops: this not valid json', stderr: '' }
            const tf: boolean = await commandExecutor.isMinimumCodeAnalyzerPluginInstalled('5.0.0-beta.0')

            expect(dependencies.execCommandCallHistory).toHaveLength(1)
            expect(dependencies.execCommandCallHistory).toContainEqual({
                command: 'sf plugins inspect @salesforce/plugin-code-analyzer --json',
                envVars: {},
                runSilently: true
            })
            expect(tf).toEqual(false)
        })

        it('When sf command unexpectedly gives multiple plugin results back we should not blow up', async () => {
            dependencies.execCommandReturnValue = { exitCode: 0, stdout: '[{},{}]', stderr: '' }
            const tf: boolean = await commandExecutor.isMinimumCodeAnalyzerPluginInstalled('5.0.0-beta.0')

            expect(dependencies.execCommandCallHistory).toHaveLength(1)
            expect(dependencies.execCommandCallHistory).toContainEqual({
                command: 'sf plugins inspect @salesforce/plugin-code-analyzer --json',
                envVars: {},
                runSilently: true
            })
            expect(tf).toEqual(false)
        })
    })

    describe('installCodeAnalyzerPlugin', () => {
        it('Check command and output for zero return', async () => {
            const success: boolean = await commandExecutor.installCodeAnalyzerPlugin()

            expect(dependencies.execCommandCallHistory).toHaveLength(1)
            expect(dependencies.execCommandCallHistory).toContainEqual({
                command: 'sf plugins install code-analyzer@latest'
            })
            expect(success).toEqual(true)
        })

        it('Check command and output for nonzero return', async () => {
            dependencies.execCommandReturnValue = { exitCode: 1, stdout: '', stderr: '' }
            const success: boolean = await commandExecutor.installCodeAnalyzerPlugin()

            expect(dependencies.execCommandCallHistory).toHaveLength(1)
            expect(dependencies.execCommandCallHistory).toContainEqual({
                command: 'sf plugins install code-analyzer@latest'
            })
            expect(success).toEqual(false)
        })
    })
})
