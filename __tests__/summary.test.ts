import { RuntimeSummarizer, Summarizer } from '../src/summary'
import { Results, ResultsFactory, RuntimeResultsFactory, RuntimeViolation, Violation } from '../src/results'
import * as path from 'path'
import * as fs from 'fs'
import { FakeResults, FakeViolationLocation } from './fakes'

describe('RuntimeSummarizer Tests', () => {
    const resultsFactory: ResultsFactory = new RuntimeResultsFactory()
    const summarizer: Summarizer = new RuntimeSummarizer()

    describe('Tests using sampleRunResults.json', () => {
        const results: Results = resultsFactory.createResults(path.join(__dirname, 'data', 'sampleRunResults.json'))

        it('Sorts violations into tables based on whether they occur in changed files', () => {
            const changedFiles: string[] = [
                'force-app/main/default/aura/AccountRepeat/AccountRepeatController.js',
                'force-app/main/default/aura/DOMXSS/DOMXSSController.js',
                'force-app/main/default/classes/NameController.cls',
                'force-app/main/default/classes/SimpleAccount.cls'
            ]

            const summaryMarkdown: string = summarizer.createSummaryMarkdown(results, changedFiles)

            const expectedSummaryMarkdown: string = fs.readFileSync(
                path.join(__dirname, 'data', 'sampleRunResults_twoTablesSummary.md'),
                'utf-8'
            )
            expect(summaryMarkdown).toEqual(expectedSummaryMarkdown)
        })

        it.each([
            { case: 'all violations are in changed files', changedFiles: getAllFilesInSample() },
            {
                case: 'all violations are in unchanged files',
                changedFiles: ['force-app/main/default/classes/DoNoUseThisClassName.cls']
            },
            { case: 'no changed files are reported', changedFiles: [] } // This case is relevant for when the action is used outside the context of a Pull Request
        ])('When $case, only one table is displayed', ({ changedFiles }) => {
            const summaryMarkdown: string = summarizer.createSummaryMarkdown(results, changedFiles)

            const expectedSummaryMarkdown: string = fs.readFileSync(
                path.join(__dirname, 'data', 'sampleRunResults_oneTableSummary.md'),
                'utf-8'
            )
            expect(summaryMarkdown).toEqual(expectedSummaryMarkdown)
        })

        function getAllFilesInSample(): string[] {
            return [
                ...new Set(
                    results
                        .getViolationsSortedBySeverity()
                        .flatMap(v => v.getLocations())
                        .map(v => v.getFile())
                        .filter(f => f !== undefined)
                ).keys()
            ]
        }
    })

    describe('Table size limit enforcement', () => {
        it("First table's size is deducted from the limit available to the second table", () => {
            const numViolations = 7000
            const results: FakeResults = new FakeResults()
            results.getTotalViolationCountReturnValue = numViolations
            results.getSev1ViolationCountReturnValue = 0
            results.getSev2ViolationCountReturnValue = 0
            results.getSev3ViolationCountReturnValue = numViolations
            results.getSev4ViolationCountReturnValue = 0
            results.getSev5ViolationCountReturnValue = 0
            results.getViolationsSortedBySeverityReturnValue = []
            const dummyFiles: string[] = ['/some/file1.ts', '/some/file2.ts', '/some/file3.ts']
            for (let i = 0; i < numViolations; i++) {
                const dummyLocation: FakeViolationLocation = new FakeViolationLocation()
                dummyLocation.getFileReturnValue = dummyFiles[i % 3]
                dummyLocation.toStringReturnValue = `${dummyFiles[i % 3]}:${i + 1}:0`
                const dummyViolation: Violation = new RuntimeViolation(
                    3,
                    'someEngine',
                    'someRule',
                    undefined,
                    `some message ${i + 1}`,
                    0,
                    [dummyLocation]
                )
                results.getViolationsSortedBySeverityReturnValue.push(dummyViolation)
            }
            const summaryMarkdown = summarizer.createSummaryMarkdown(results, dummyFiles.slice(0, 1))

            const expectedSummaryMarkdown = fs.readFileSync(
                path.join('.', '__tests__', 'data', 'secondTableTruncated_expectedSummary.md'),
                { encoding: 'utf8' }
            )
            expect(summaryMarkdown).toEqual(expectedSummaryMarkdown)
        })

        it('When the first table exceeds limit, the second table is not displayed', () => {
            const numViolations = 50000
            const results: FakeResults = new FakeResults()
            results.getTotalViolationCountReturnValue = numViolations
            results.getSev1ViolationCountReturnValue = 0
            results.getSev2ViolationCountReturnValue = 0
            results.getSev3ViolationCountReturnValue = numViolations
            results.getSev4ViolationCountReturnValue = 0
            results.getSev5ViolationCountReturnValue = 0
            results.getViolationsSortedBySeverityReturnValue = []
            const dummyFiles: string[] = ['/some/file1.ts', '/some/file2.ts', '/some/file3.ts']
            for (let i = 0; i < numViolations; i++) {
                const dummyLocation: FakeViolationLocation = new FakeViolationLocation()
                dummyLocation.getFileReturnValue = dummyFiles[i % 3]
                dummyLocation.toStringReturnValue = `${dummyFiles[i % 3]}:${i + 1}:0`
                const dummyViolation: Violation = new RuntimeViolation(
                    3,
                    'someEngine',
                    'someRule',
                    undefined,
                    `some message ${i + 1}`,
                    0,
                    [dummyLocation]
                )
                results.getViolationsSortedBySeverityReturnValue.push(dummyViolation)
            }
            const summaryMarkdown = summarizer.createSummaryMarkdown(results, dummyFiles.slice(0, 1))

            const expectedSummaryMarkdown = fs.readFileSync(
                path.join('.', '__tests__', 'data', 'secondTableSqueezedOut_expectedSummary.md'),
                { encoding: 'utf8' }
            )
            expect(summaryMarkdown).toEqual(expectedSummaryMarkdown)
        })
    })

    it('Test createSummaryMarkdown with results that have no violations', () => {
        const results: FakeResults = new FakeResults()
        results.getTotalViolationCountReturnValue = 0
        results.getSev1ViolationCountReturnValue = 0
        results.getSev2ViolationCountReturnValue = 0
        results.getSev3ViolationCountReturnValue = 0
        results.getViolationsSortedBySeverityReturnValue = []
        const summaryMarkdown = summarizer.createSummaryMarkdown(results)

        const expectedSummaryMarkdown = fs.readFileSync(
            path.join('.', '__tests__', 'data', 'zeroViolations_expectedSummary.md'),
            { encoding: 'utf8' }
        )
        expect(summaryMarkdown).toEqual(expectedSummaryMarkdown)
    })

    it('Test that createSummaryMarkdown trims table when too many results to fit into 1mb summary', () => {
        const numViolations = 12345
        const results: FakeResults = new FakeResults()
        results.getTotalViolationCountReturnValue = numViolations
        results.getSev1ViolationCountReturnValue = 0
        results.getSev2ViolationCountReturnValue = 0
        results.getSev3ViolationCountReturnValue = numViolations
        results.getSev4ViolationCountReturnValue = 0
        results.getSev5ViolationCountReturnValue = 0
        results.getViolationsSortedBySeverityReturnValue = []
        for (let i = 0; i < numViolations; i++) {
            const dummyLocation: FakeViolationLocation = new FakeViolationLocation()
            dummyLocation.toStringReturnValue = `/some/file.ts:${i + 1}:0`
            const dummyViolation: Violation = new RuntimeViolation(
                3,
                'someEngine',
                'someRule',
                undefined,
                `some message ${i + 1}`,
                0,
                [dummyLocation]
            )
            results.getViolationsSortedBySeverityReturnValue.push(dummyViolation)
        }
        const summaryMarkdown = summarizer.createSummaryMarkdown(results)

        const expectedSummaryMarkdown = fs.readFileSync(
            path.join('.', '__tests__', 'data', 'tooManyViolations_expectedSummary.md'),
            { encoding: 'utf8' }
        )
        expect(summaryMarkdown).toEqual(expectedSummaryMarkdown)
    })
})
