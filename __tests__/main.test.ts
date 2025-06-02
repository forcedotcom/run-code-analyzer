import * as main from '../src/main'
import { FakeCommandExecutor, FakeDependencies, FakeResultsFactory, FakeSummarizer } from './fakes'
import { Inputs } from '../src/types'
import { MESSAGE_FCNS, MESSAGES, MIN_CODE_ANALYZER_VERSION_REQUIRED } from '../src/constants'

describe('main run Tests', () => {
    let dependencies: FakeDependencies
    let commandExecutor: FakeCommandExecutor
    let resultsFactory: FakeResultsFactory
    let summarizer: FakeSummarizer

    beforeEach(async () => {
        dependencies = new FakeDependencies()
        commandExecutor = new FakeCommandExecutor()
        resultsFactory = new FakeResultsFactory()
        summarizer = new FakeSummarizer()
    })

    it('Test default values', async () => {
        await main.run(dependencies, commandExecutor, resultsFactory, summarizer)

        expect(commandExecutor.isSalesforceCliInstalledCallCount).toEqual(1)

        expect(commandExecutor.runCodeAnalyzerCallHistory).toHaveLength(1)
        expect(commandExecutor.runCodeAnalyzerCallHistory).toContainEqual({
            runArguments: '--view detail --output-file sfca_results.json'
        })

        expect(dependencies.uploadArtifactCallHistory).toHaveLength(1)
        expect(dependencies.uploadArtifactCallHistory).toContainEqual({
            artifactName: 'salesforce-code-analyzer-results',
            artifactFiles: ['sfca_results.json']
        })

        expect(resultsFactory.createResultsCallHistory).toHaveLength(1)
        expect(resultsFactory.createResultsCallHistory).toContainEqual({
            resultsFile: 'sfca_results.json'
        })

        expect(dependencies.setOutputCallHistory).toHaveLength(7)
        expect(dependencies.setOutputCallHistory).toContainEqual({
            name: 'exit-code',
            value: '0'
        })
        expect(dependencies.setOutputCallHistory).toContainEqual({
            name: 'num-violations',
            value: '15'
        })
        expect(dependencies.setOutputCallHistory).toContainEqual({
            name: 'num-sev1-violations',
            value: '1'
        })
        expect(dependencies.setOutputCallHistory).toContainEqual({
            name: 'num-sev2-violations',
            value: '2'
        })
        expect(dependencies.setOutputCallHistory).toContainEqual({
            name: 'num-sev3-violations',
            value: '3'
        })
        expect(dependencies.setOutputCallHistory).toContainEqual({
            name: 'num-sev4-violations',
            value: '4'
        })
        expect(dependencies.setOutputCallHistory).toContainEqual({
            name: 'num-sev5-violations',
            value: '5'
        })

        expect(dependencies.infoCallHistory).toContainEqual({
            infoMessage:
                'outputs:\n' +
                '  exit-code: 0\n' +
                '  num-violations: 15\n' +
                '  num-sev1-violations: 1\n' +
                '  num-sev2-violations: 2\n' +
                '  num-sev3-violations: 3\n' +
                '  num-sev4-violations: 4\n' +
                '  num-sev5-violations: 5'
        })

        expect(summarizer.createSummaryMarkdownCallHistory).toHaveLength(1)
        expect(summarizer.createSummaryMarkdownCallHistory).toContainEqual({
            results: resultsFactory.createResultsReturnValue
        })

        expect(dependencies.writeSummaryCallHistory).toHaveLength(1)
        expect(dependencies.writeSummaryCallHistory).toContainEqual({ summaryMarkdown: 'someSummaryMarkdown' })

        expect(dependencies.failCallHistory).toHaveLength(0)
    })

    it('Test user supplies non-default inputs with various output files including json', async () => {
        dependencies.getInputsReturnValue = {
            runArguments: '-f myFile.html --output-file=another.xml -f=great.json --output-file  cool.sarif -w ./src',
            resultsArtifactName: 'customArtifactName'
        }
        await main.run(dependencies, commandExecutor, resultsFactory, summarizer)

        expect(commandExecutor.isSalesforceCliInstalledCallCount).toEqual(1)

        expect(commandExecutor.runCodeAnalyzerCallHistory).toHaveLength(1)
        expect(commandExecutor.runCodeAnalyzerCallHistory).toContainEqual({
            runArguments: '-f myFile.html --output-file=another.xml -f=great.json --output-file  cool.sarif -w ./src'
        })

        expect(dependencies.uploadArtifactCallHistory).toHaveLength(1)
        expect(dependencies.uploadArtifactCallHistory).toContainEqual({
            artifactName: 'customArtifactName',
            artifactFiles: ['myFile.html', 'another.xml', 'great.json', 'cool.sarif']
        })

        expect(resultsFactory.createResultsCallHistory).toHaveLength(1)
        expect(resultsFactory.createResultsCallHistory).toContainEqual({
            resultsFile: 'great.json' // We reuse the json file that the user supplied instead of supplying our own
        })

        expect(dependencies.setOutputCallHistory).toContainEqual({
            name: 'exit-code',
            value: '0'
        })

        expect(dependencies.failCallHistory).toHaveLength(0)
    })

    it('When running on a pull request with the correct permissions, a review is created', async () => {
        dependencies.getInputsReturnValue = {
            runArguments: '-f myFile.html --view table',
            resultsArtifactName: 'salesforce-code-analyzer-results',
            githubToken: 'dummyToken'
        }
        dependencies.isPullRequestReturnValue = true
        dependencies.getChangedFilesCallback = async () => ['dummyfile1.js', 'dummyfile2.js']
        dependencies.createPullRequestReviewCallback = async () => 7
        await main.run(dependencies, commandExecutor, resultsFactory, summarizer)

        expect(commandExecutor.isSalesforceCliInstalledCallCount).toEqual(1)

        expect(commandExecutor.runCodeAnalyzerCallHistory).toHaveLength(1)
        expect(commandExecutor.runCodeAnalyzerCallHistory).toContainEqual({
            runArguments: '-f myFile.html --view table --output-file sfca_results.json' // We add in at least one json file
        })

        expect(dependencies.uploadArtifactCallHistory).toHaveLength(1)
        expect(dependencies.uploadArtifactCallHistory).toContainEqual({
            artifactName: 'salesforce-code-analyzer-results',
            artifactFiles: ['myFile.html'] // Our json file doesn't get included since the user didn't specify it
        })

        expect(resultsFactory.createResultsCallHistory).toHaveLength(1)
        expect(resultsFactory.createResultsCallHistory).toContainEqual({
            resultsFile: 'sfca_results.json' // We have our added json file to parse
        })

        expect(dependencies.setOutputCallHistory).toContainEqual({
            name: 'review-id',
            value: `7`
        })
        expect(dependencies.warnCallHistory).toHaveLength(0)
    })

    it.each([
        {
            case: 'running on a pull request with a token that cannot READ pull requests',
            expectation: 'no review is created, and warnings are issued',
            isPullRequest: true,
            getChangedFilesCallback: async () => {
                throw new Error('Could not Read PR')
            },
            createPullRequestReviewCallback: async () => {
                throw new Error('Could not Write PR')
            },
            expectedWarnings: 1
        },
        {
            case: 'running on a pull request with a token that cannot WRITE to pull requests',
            expectation: 'no review is created, and warnings are issued',
            isPullRequest: true,
            getChangedFilesCallback: async () => [],
            createPullRequestReviewCallback: async () => {
                throw new Error('Could not Write PR')
            },
            expectedWarnings: 1
        },
        {
            case: 'NOT running on a pull request',
            expectation: 'no review is created',
            isPullRequest: false,
            getChangedFilesCallback: async () => [],
            createPullRequestReviewCallback: async () => 7,
            expectedWarnings: 0
        }
    ])(
        'When $case, $expectation',
        async ({ isPullRequest, getChangedFilesCallback, createPullRequestReviewCallback, expectedWarnings }) => {
            dependencies.getInputsReturnValue = {
                runArguments: '-f myFile.html --view table',
                resultsArtifactName: 'salesforce-code-analyzer-results',
                githubToken: 'dummyToken'
            }
            dependencies.isPullRequestReturnValue = isPullRequest
            dependencies.getChangedFilesCallback = getChangedFilesCallback
            dependencies.createPullRequestReviewCallback = createPullRequestReviewCallback
            await main.run(dependencies, commandExecutor, resultsFactory, summarizer)

            expect(commandExecutor.isSalesforceCliInstalledCallCount).toEqual(1)

            expect(commandExecutor.runCodeAnalyzerCallHistory).toHaveLength(1)
            expect(commandExecutor.runCodeAnalyzerCallHistory).toContainEqual({
                runArguments: '-f myFile.html --view table --output-file sfca_results.json' // We add in at least one json file
            })

            expect(dependencies.uploadArtifactCallHistory).toHaveLength(1)
            expect(dependencies.uploadArtifactCallHistory).toContainEqual({
                artifactName: 'salesforce-code-analyzer-results',
                artifactFiles: ['myFile.html'] // Our json file doesn't get included since the user didn't specify it
            })

            expect(resultsFactory.createResultsCallHistory).toHaveLength(1)
            expect(resultsFactory.createResultsCallHistory).toContainEqual({
                resultsFile: 'sfca_results.json' // We have our added json file to parse
            })

            expect(dependencies.warnCallHistory).toHaveLength(expectedWarnings)
        }
    )

    it('Test user supplies non-default inputs with non-json output file', async () => {
        dependencies.getInputsReturnValue = {
            runArguments: '-f myFile.html --view table',
            resultsArtifactName: 'salesforce-code-analyzer-results'
        }
        await main.run(dependencies, commandExecutor, resultsFactory, summarizer)

        expect(commandExecutor.isSalesforceCliInstalledCallCount).toEqual(1)

        expect(commandExecutor.runCodeAnalyzerCallHistory).toHaveLength(1)
        expect(commandExecutor.runCodeAnalyzerCallHistory).toContainEqual({
            runArguments: '-f myFile.html --view table --output-file sfca_results.json' // We add in at least one json file
        })

        expect(dependencies.uploadArtifactCallHistory).toHaveLength(1)
        expect(dependencies.uploadArtifactCallHistory).toContainEqual({
            artifactName: 'salesforce-code-analyzer-results',
            artifactFiles: ['myFile.html'] // Our json file doesn't get included since the user didn't specify it
        })

        expect(resultsFactory.createResultsCallHistory).toHaveLength(1)
        expect(resultsFactory.createResultsCallHistory).toContainEqual({
            resultsFile: 'sfca_results.json' // We have our added json file to parse
        })
    })

    it('Test user supplies non-default inputs with zero output files and no view', async () => {
        dependencies.getInputsReturnValue = {
            runArguments: '',
            resultsArtifactName: 'salesforce-code-analyzer-results'
        }
        await main.run(dependencies, commandExecutor, resultsFactory, summarizer)

        expect(commandExecutor.isSalesforceCliInstalledCallCount).toEqual(1)

        expect(commandExecutor.runCodeAnalyzerCallHistory).toHaveLength(1)
        expect(commandExecutor.runCodeAnalyzerCallHistory).toContainEqual({
            runArguments: ' --output-file sfca_results.json --view table' // We add in at least one json file and restore the view
        })

        expect(dependencies.uploadArtifactCallHistory).toHaveLength(1)
        expect(dependencies.uploadArtifactCallHistory).toContainEqual({
            artifactName: 'salesforce-code-analyzer-results',
            artifactFiles: ['sfca_results.json'] // Since the user didn't specify anything, we add in the json file that we specified on their behalf
        })

        expect(resultsFactory.createResultsCallHistory).toHaveLength(1)
        expect(resultsFactory.createResultsCallHistory).toContainEqual({
            resultsFile: 'sfca_results.json' // We have our added json file to parse
        })
    })

    it('Test user supplies non-default inputs with zero output files but supplies a view', async () => {
        dependencies.getInputsReturnValue = {
            runArguments: '-c someConfig.yml --view detail',
            resultsArtifactName: 'salesforce-code-analyzer-results'
        }
        await main.run(dependencies, commandExecutor, resultsFactory, summarizer)

        expect(commandExecutor.isSalesforceCliInstalledCallCount).toEqual(1)

        expect(commandExecutor.runCodeAnalyzerCallHistory).toHaveLength(1)
        expect(commandExecutor.runCodeAnalyzerCallHistory).toContainEqual({
            runArguments: '-c someConfig.yml --view detail --output-file sfca_results.json'
        })

        expect(dependencies.uploadArtifactCallHistory).toHaveLength(1)
        expect(dependencies.uploadArtifactCallHistory).toContainEqual({
            artifactName: 'salesforce-code-analyzer-results',
            artifactFiles: ['sfca_results.json'] // Since the user didn't specify anything, we add in the json file that we specified on their behalf
        })

        expect(resultsFactory.createResultsCallHistory).toHaveLength(1)
        expect(resultsFactory.createResultsCallHistory).toContainEqual({
            resultsFile: 'sfca_results.json' // We have our added json file to parse
        })
    })

    it('Test nonzero exit code with stderr not containing error from command call', async () => {
        commandExecutor.runCodeAnalyzerReturnValue = { exitCode: 987, stdout: '', stderr: 'just some warning' }
        await main.run(dependencies, commandExecutor, resultsFactory, summarizer)

        expect(dependencies.setOutputCallHistory).toContainEqual({
            name: 'exit-code',
            value: '987'
        })

        expect(dependencies.errorCallHistory).toHaveLength(0)
        expect(dependencies.failCallHistory).toHaveLength(0)
    })

    it('Test nonzero exit code with stderr from command call', async () => {
        commandExecutor.runCodeAnalyzerReturnValue = {
            exitCode: 2,
            stdout: '',
            stderr: 'some warning\nError (2): The following error occurred:\n  someError'
        }
        await main.run(dependencies, commandExecutor, resultsFactory, summarizer)

        expect(dependencies.setOutputCallHistory).toContainEqual({
            name: 'exit-code',
            value: '2'
        })

        expect(dependencies.errorCallHistory).toHaveLength(1)
        expect(dependencies.errorCallHistory).toContainEqual({
            errorMessage: `${MESSAGES.CODE_ANALYZER_FAILED} \nError (2): The following error occurred:\n  someError`
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
        await main.run(dependencies, commandExecutor, resultsFactory, summarizer)

        expect(commandExecutor.runCodeAnalyzerCallHistory).toHaveLength(0)
        expect(dependencies.uploadArtifactCallHistory).toHaveLength(0)
        expect(dependencies.failCallHistory).toHaveLength(1)
        expect(dependencies.failCallHistory[0].failMessage).toContain('bang')
    })

    it('Test when Salesforce CLI is not already installed and we install it successfully', async () => {
        commandExecutor.isSalesforceCliInstalledReturnValue = false
        await main.run(dependencies, commandExecutor, resultsFactory, summarizer)

        expect(dependencies.warnCallHistory).toHaveLength(1)
        expect(dependencies.warnCallHistory).toContainEqual({
            warnMessage: MESSAGES.SF_CLI_NOT_INSTALLED
        })
        expect(commandExecutor.installSalesforceCliCallCount).toEqual(1)
        expect(commandExecutor.runCodeAnalyzerCallHistory).toHaveLength(1)
        expect(dependencies.failCallHistory).toHaveLength(0)
    })

    it('Test when Salesforce CLI is not already installed and we fail to install it', async () => {
        commandExecutor.isSalesforceCliInstalledReturnValue = false
        commandExecutor.installSalesforceCliReturnValue = false
        await main.run(dependencies, commandExecutor, resultsFactory, summarizer)

        expect(dependencies.warnCallHistory).toHaveLength(1)
        expect(dependencies.warnCallHistory).toContainEqual({
            warnMessage: MESSAGES.SF_CLI_NOT_INSTALLED
        })
        expect(commandExecutor.installSalesforceCliCallCount).toEqual(1)
        expect(commandExecutor.runCodeAnalyzerCallHistory).toHaveLength(0)
        expect(dependencies.failCallHistory).toHaveLength(1)
        expect(dependencies.failCallHistory[0].failMessage).toContain(MESSAGES.SF_CLI_INSTALL_FAILED)
    })

    it('Test when code-analyzer plugin is not already installed and we install it successfully', async () => {
        commandExecutor.isMinimumCodeAnalyzerPluginInstalledReturnValue = false
        await main.run(dependencies, commandExecutor, resultsFactory, summarizer)

        expect(dependencies.warnCallHistory).toHaveLength(1)
        expect(dependencies.warnCallHistory).toContainEqual({
            warnMessage: MESSAGES.MINIMUM_CODE_ANALYZER_PLUGIN_NOT_INSTALLED
        })
        expect(commandExecutor.isMinimumCodeAnalyzerPluginInstalledCallHistory).toHaveLength(1)
        expect(commandExecutor.isMinimumCodeAnalyzerPluginInstalledCallHistory).toContainEqual({
            minVersion: MIN_CODE_ANALYZER_VERSION_REQUIRED
        })
        expect(commandExecutor.runCodeAnalyzerCallHistory).toHaveLength(1)
        expect(dependencies.failCallHistory).toHaveLength(0)
    })

    it('Test when code-analyzer plugin is not already installed and we fail to install it', async () => {
        commandExecutor.isMinimumCodeAnalyzerPluginInstalledReturnValue = false
        commandExecutor.installCodeAnalyzerPluginReturnValue = false
        await main.run(dependencies, commandExecutor, resultsFactory, summarizer)

        expect(dependencies.warnCallHistory).toHaveLength(1)
        expect(dependencies.warnCallHistory).toContainEqual({
            warnMessage: MESSAGES.MINIMUM_CODE_ANALYZER_PLUGIN_NOT_INSTALLED
        })
        expect(commandExecutor.isMinimumCodeAnalyzerPluginInstalledCallHistory).toHaveLength(1)
        expect(commandExecutor.isMinimumCodeAnalyzerPluginInstalledCallHistory).toContainEqual({
            minVersion: MIN_CODE_ANALYZER_VERSION_REQUIRED
        })
        expect(commandExecutor.runCodeAnalyzerCallHistory).toHaveLength(0)
        expect(dependencies.failCallHistory).toHaveLength(1)
        expect(dependencies.failCallHistory[0].failMessage).toContain(MESSAGES.CODE_ANALYZER_PLUGIN_INSTALL_FAILED)
    })

    it('Test when the internal outfile file does not exist after run then we fail', async () => {
        dependencies.fileExistsReturnValue = false
        await main.run(dependencies, commandExecutor, resultsFactory, summarizer)

        expect(commandExecutor.runCodeAnalyzerCallHistory).toHaveLength(1)
        expect(dependencies.failCallHistory).toHaveLength(1)
        expect(dependencies.failCallHistory[0].failMessage).toContain(MESSAGE_FCNS.FILE_NOT_FOUND('sfca_results.json'))
    })

    it('Test when the user output file does not exist after run then we fail', async () => {
        dependencies.getInputsReturnValue = {
            runArguments: '-f userResults.xml',
            resultsArtifactName: 'customArtifactName'
        }
        dependencies.fileExistsReturnValue = false
        await main.run(dependencies, commandExecutor, resultsFactory, summarizer)

        expect(commandExecutor.runCodeAnalyzerCallHistory).toHaveLength(1)
        expect(dependencies.failCallHistory).toHaveLength(1)
        expect(dependencies.failCallHistory[0].failMessage).toContain(MESSAGE_FCNS.FILE_NOT_FOUND('userResults.xml'))
    })
})
