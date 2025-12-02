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

    describe('Changed files only mode', () => {
        it('When changedFilesOnly is true, only violations in changed files are shown', () => {
            const results: FakeResults = new FakeResults()
            results.getTotalViolationCountReturnValue = 6
            results.getSev1ViolationCountReturnValue = 1
            results.getSev2ViolationCountReturnValue = 1
            results.getSev3ViolationCountReturnValue = 2
            results.getSev4ViolationCountReturnValue = 1
            results.getSev5ViolationCountReturnValue = 1
            results.getViolationsSortedBySeverityReturnValue = []

            // Create violations in changed files
            const changedFileLocation1 = new FakeViolationLocation()
            changedFileLocation1.getFileReturnValue = 'changed-file1.ts'
            changedFileLocation1.toStringReturnValue = 'changed-file1.ts:1:0'
            results.getViolationsSortedBySeverityReturnValue.push(
                new RuntimeViolation(1, 'engine1', 'rule1', undefined, 'message1', 0, [changedFileLocation1])
            )

            const changedFileLocation2 = new FakeViolationLocation()
            changedFileLocation2.getFileReturnValue = 'changed-file2.ts'
            changedFileLocation2.toStringReturnValue = 'changed-file2.ts:1:0'
            results.getViolationsSortedBySeverityReturnValue.push(
                new RuntimeViolation(2, 'engine1', 'rule2', undefined, 'message2', 0, [changedFileLocation2])
            )

            // Create violations in unchanged files
            const unchangedFileLocation1 = new FakeViolationLocation()
            unchangedFileLocation1.getFileReturnValue = 'unchanged-file1.ts'
            unchangedFileLocation1.toStringReturnValue = 'unchanged-file1.ts:1:0'
            results.getViolationsSortedBySeverityReturnValue.push(
                new RuntimeViolation(3, 'engine1', 'rule3', undefined, 'message3', 0, [unchangedFileLocation1])
            )

            const unchangedFileLocation2 = new FakeViolationLocation()
            unchangedFileLocation2.getFileReturnValue = 'unchanged-file2.ts'
            unchangedFileLocation2.toStringReturnValue = 'unchanged-file2.ts:1:0'
            results.getViolationsSortedBySeverityReturnValue.push(
                new RuntimeViolation(3, 'engine1', 'rule4', undefined, 'message4', 0, [unchangedFileLocation2])
            )

            results.getViolationsSortedBySeverityReturnValue.push(
                new RuntimeViolation(4, 'engine1', 'rule5', undefined, 'message5', 0, [unchangedFileLocation1])
            )

            results.getViolationsSortedBySeverityReturnValue.push(
                new RuntimeViolation(5, 'engine1', 'rule6', undefined, 'message6', 0, [unchangedFileLocation2])
            )

            const changedFiles = ['changed-file1.ts', 'changed-file2.ts']
            const summaryMarkdown = summarizer.createSummaryMarkdown(results, changedFiles, true)

            // Should only show 2 violations in changed files
            expect(summaryMarkdown).toContain('2 Violation(s) Found in Changed Files')
            expect(summaryMarkdown).toContain(':black_circle: 1 Critical severity violation(s)')
            expect(summaryMarkdown).toContain(':red_circle: 1 High severity violation(s)')
            expect(summaryMarkdown).toContain(':orange_circle: 0 Medium severity violation(s)')
            expect(summaryMarkdown).toContain(':yellow_circle: 0 Low severity violation(s)')
            expect(summaryMarkdown).toContain(':white_circle: 0 Info severity violation(s)')

            // Should show changed file violations
            expect(summaryMarkdown).toContain('changed-file1.ts')
            expect(summaryMarkdown).toContain('changed-file2.ts')

            // Should NOT show unchanged file violations
            expect(summaryMarkdown).not.toContain('unchanged-file1.ts')
            expect(summaryMarkdown).not.toContain('unchanged-file2.ts')

            // Should NOT show the collapsible sections
            expect(summaryMarkdown).not.toContain('violations in files changed by this pull request')
            expect(summaryMarkdown).not.toContain('violations in files unchanged by this pull request')
        })

        it('When changedFilesOnly is true but no changed files have violations, shows zero violations', () => {
            const results: FakeResults = new FakeResults()
            results.getTotalViolationCountReturnValue = 2
            results.getSev1ViolationCountReturnValue = 0
            results.getSev2ViolationCountReturnValue = 0
            results.getSev3ViolationCountReturnValue = 2
            results.getSev4ViolationCountReturnValue = 0
            results.getSev5ViolationCountReturnValue = 0
            results.getViolationsSortedBySeverityReturnValue = []

            // Create violations only in unchanged files
            const unchangedFileLocation = new FakeViolationLocation()
            unchangedFileLocation.getFileReturnValue = 'unchanged-file.ts'
            unchangedFileLocation.toStringReturnValue = 'unchanged-file.ts:1:0'
            results.getViolationsSortedBySeverityReturnValue.push(
                new RuntimeViolation(3, 'engine1', 'rule1', undefined, 'message1', 0, [unchangedFileLocation])
            )
            results.getViolationsSortedBySeverityReturnValue.push(
                new RuntimeViolation(3, 'engine1', 'rule2', undefined, 'message2', 0, [unchangedFileLocation])
            )

            const changedFiles = ['changed-file1.ts', 'changed-file2.ts']
            const summaryMarkdown = summarizer.createSummaryMarkdown(results, changedFiles, true)

            // Should show zero violations
            expect(summaryMarkdown).toContain('0 Violations Found in Changed Files')
            expect(summaryMarkdown).not.toContain('unchanged-file.ts')
        })

        it('When changedFilesOnly is false, shows both changed and unchanged file violations', () => {
            const results: FakeResults = new FakeResults()
            results.getTotalViolationCountReturnValue = 4
            results.getSev1ViolationCountReturnValue = 1
            results.getSev2ViolationCountReturnValue = 1
            results.getSev3ViolationCountReturnValue = 1
            results.getSev4ViolationCountReturnValue = 1
            results.getSev5ViolationCountReturnValue = 0
            results.getViolationsSortedBySeverityReturnValue = []

            // Create violations in changed files
            const changedFileLocation = new FakeViolationLocation()
            changedFileLocation.getFileReturnValue = 'changed-file.ts'
            changedFileLocation.toStringReturnValue = 'changed-file.ts:1:0'
            results.getViolationsSortedBySeverityReturnValue.push(
                new RuntimeViolation(1, 'engine1', 'rule1', undefined, 'message1', 0, [changedFileLocation])
            )
            results.getViolationsSortedBySeverityReturnValue.push(
                new RuntimeViolation(2, 'engine1', 'rule2', undefined, 'message2', 0, [changedFileLocation])
            )

            // Create violations in unchanged files
            const unchangedFileLocation = new FakeViolationLocation()
            unchangedFileLocation.getFileReturnValue = 'unchanged-file.ts'
            unchangedFileLocation.toStringReturnValue = 'unchanged-file.ts:1:0'
            results.getViolationsSortedBySeverityReturnValue.push(
                new RuntimeViolation(3, 'engine1', 'rule3', undefined, 'message3', 0, [unchangedFileLocation])
            )
            results.getViolationsSortedBySeverityReturnValue.push(
                new RuntimeViolation(4, 'engine1', 'rule4', undefined, 'message4', 0, [unchangedFileLocation])
            )

            const changedFiles = ['changed-file.ts']
            const summaryMarkdown = summarizer.createSummaryMarkdown(results, changedFiles, false)

            // Should show all 4 violations
            expect(summaryMarkdown).toContain('4 Violation(s) Found')
            expect(summaryMarkdown).not.toContain('in Changed Files')

            // Should show collapsible sections
            expect(summaryMarkdown).toContain('2 violations in files changed by this pull request')
            expect(summaryMarkdown).toContain('2 violations in files unchanged by this pull request')

            // Should show both changed and unchanged file violations
            expect(summaryMarkdown).toContain('changed-file.ts')
            expect(summaryMarkdown).toContain('unchanged-file.ts')
        })
    })
})
