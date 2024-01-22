import { RuntimeSummarizer, Summarizer } from '../src/summary'
import { Results, ResultsFactory, RuntimeResultsFactory, RuntimeViolation, Violation } from '../src/results'
import * as path from 'path'
import * as fs from 'fs'
import { FakeResults, FakeViolationLocation } from './fakes'

describe('RuntimeSummarizer Tests', () => {
    const resultsFactory: ResultsFactory = new RuntimeResultsFactory()
    const summarizer: Summarizer = new RuntimeSummarizer()

    it('Test createSummaryMarkdown with sample run results', () => {
        const results: Results = resultsFactory.createResults(
            path.join('.', '__tests__', 'data', 'sampleRunResults.json'),
            false
        )
        const summaryMarkdown = summarizer.createSummaryMarkdown(results)

        const expectedSummaryMarkdown = fs.readFileSync(
            path.join('.', '__tests__', 'data', 'sampleRunResults_expectedSummary.md'),
            { encoding: 'utf8' }
        )
        expect(summaryMarkdown).toEqual(expectedSummaryMarkdown)
    })

    it('Test createSummaryMarkdown with sample run dfa results', () => {
        const results: Results = resultsFactory.createResults(
            path.join('.', '__tests__', 'data', 'sampleRunDfaResults.json'),
            true
        )
        const summaryMarkdown = summarizer.createSummaryMarkdown(results)

        const expectedSummaryMarkdown = fs.readFileSync(
            path.join('.', '__tests__', 'data', 'sampleRunDfaResults_expectedSummary.md'),
            { encoding: 'utf8' }
        )
        expect(summaryMarkdown).toEqual(expectedSummaryMarkdown)
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
        results.getSev2ViolationCountReturnValue = numViolations
        results.getSev3ViolationCountReturnValue = 0
        results.getViolationsSortedBySeverityReturnValue = []
        for (let i = 0; i < numViolations; i++) {
            const dummyLocation: FakeViolationLocation = new FakeViolationLocation()
            dummyLocation.toStringReturnValue = `/some/file.ts:${i + 1}:0`
            const dummyViolation: Violation = new RuntimeViolation(
                2,
                'someEngine',
                'someRule',
                undefined,
                `some message ${i + 1}`,
                dummyLocation
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
