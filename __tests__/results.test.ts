import {
    Results,
    ResultsFactory,
    RuntimeResultsFactory,
    RuntimeViolation,
    RunViolationLocation,
    Violation,
    ViolationLocation
} from '../src/results'
import * as path from 'path'
import { FakeViolationLocation } from './fakes'

describe('RuntimeResultsFactory Tests', () => {
    const resultsFactory: ResultsFactory = new RuntimeResultsFactory()

    it('Check that createResults correctly constructs run results', () => {
        const results: Results = resultsFactory.createResults(
            path.join('.', '__tests__', 'data', 'sampleRunResults.json')
        )
        expect(results.getTotalViolationCount()).toEqual(203)
        expect(results.getSev1ViolationCount()).toEqual(0)
        expect(results.getSev2ViolationCount()).toEqual(88)
        expect(results.getSev3ViolationCount()).toEqual(49)
        expect(results.getSev4ViolationCount()).toEqual(44)
        expect(results.getSev5ViolationCount()).toEqual(22)

        const violations: Violation[] = results.getViolationsSortedBySeverity()
        expect(violations).toHaveLength(203)

        // Check sorted by severity
        for (let i = 0; i < 88; i++) {
            expect(violations[i].getSeverity()).toEqual(2)
        }
        for (let i = 88; i < 137; i++) {
            expect(violations[i].getSeverity()).toEqual(3)
        }
        for (let i = 137; i < 181; i++) {
            expect(violations[i].getSeverity()).toEqual(4)
        }
        for (let i = 181; i < violations.length; i++) {
            expect(violations[i].getSeverity()).toEqual(5)
        }

        // Check one of the violations as a sanity check
        expect(violations[89].getRuleEngine()).toEqual('eslint')
        expect(violations[89].getRuleName()).toEqual('no-var')
        expect(violations[89].getRuleUrl()).toEqual('https://eslint.org/docs/latest/rules/no-var')
        expect(violations[89].getMessage()).toEqual('Unexpected var, use let or const instead.')
        expect(violations[89].getLocations()).toHaveLength(1)
        expect(violations[89].getLocations()[0].toString()).toEqual(
            'force-app/main/default/aura/AccountRepeat/AccountRepeatController.js:5:13'
        )
    })
})

describe('RuntimeViolation Tests', () => {
    it('Test getters', () => {
        const loc: FakeViolationLocation = new FakeViolationLocation()
        const violation: Violation = new RuntimeViolation(2, 'engine', 'name', 'url', 'msg', 0, [loc])
        expect(violation.getSeverity()).toEqual(2)
        expect(violation.getRuleEngine()).toEqual('engine')
        expect(violation.getRuleName()).toEqual('name')
        expect(violation.getRuleUrl()).toEqual('url')
        expect(violation.getMessage()).toEqual('msg')
        expect(violation.getLocations()).toHaveLength(1)
        expect(violation.getLocations()[0]).toEqual(loc)
    })

    it('Test compareTo when severity is not the same', () => {
        const loc1: FakeViolationLocation = new FakeViolationLocation()
        loc1.compareToReturnValue = -1
        const loc2: FakeViolationLocation = new FakeViolationLocation()
        loc2.compareToReturnValue = 1
        const v1: Violation = new RuntimeViolation(2, 'engine1', 'name1', 'url1', 'msg1', 0, [loc1])
        const v2: Violation = new RuntimeViolation(1, 'engine2', 'name2', 'url2', 'msg2', 0, [loc2])

        expect(v1.compareTo(v2)).toEqual(1)
        expect(v2.compareTo(v1)).toEqual(-1)
    })

    it('Test compareTo when severity the same but location is different', () => {
        const loc1: FakeViolationLocation = new FakeViolationLocation()
        loc1.compareToReturnValue = 1
        const loc2: FakeViolationLocation = new FakeViolationLocation()
        loc2.compareToReturnValue = -1
        const v1: Violation = new RuntimeViolation(2, 'engine1', 'name1', 'url1', 'msg1', 0, [loc1])
        const v2: Violation = new RuntimeViolation(2, 'engine2', 'name2', 'url2', 'msg2', 0, [loc2])

        expect(v1.compareTo(v2)).toEqual(1)
        expect(v2.compareTo(v1)).toEqual(-1)
    })

    it('Test compareTo when severity and location are the same but engine is different', () => {
        const loc1: FakeViolationLocation = new FakeViolationLocation()
        const loc2: FakeViolationLocation = new FakeViolationLocation()
        const v1: Violation = new RuntimeViolation(2, 'engineB', 'name1', 'url1', 'msg1', 0, [loc1])
        const v2: Violation = new RuntimeViolation(2, 'engineA', 'name2', 'url2', 'msg2', 0, [loc2])

        expect(v1.compareTo(v2)).toEqual(1)
        expect(v2.compareTo(v1)).toEqual(-1)
    })

    it('Test compareTo when severity, location, and engine are the same but rule name is different', () => {
        const loc1: FakeViolationLocation = new FakeViolationLocation()
        const loc2: FakeViolationLocation = new FakeViolationLocation()
        const v1: Violation = new RuntimeViolation(2, 'engine', 'name1', 'url1', 'msg1', 0, [loc1])
        const v2: Violation = new RuntimeViolation(2, 'engine', 'name2', 'url2', 'msg2', 0, [loc2])

        expect(v1.compareTo(v2)).toEqual(-1)
        expect(v2.compareTo(v1)).toEqual(1)
    })

    it('Test compareTo when severity, location, engine, and rule name are the same', () => {
        const loc1: FakeViolationLocation = new FakeViolationLocation()
        const loc2: FakeViolationLocation = new FakeViolationLocation()
        const v1: Violation = new RuntimeViolation(2, 'engine', 'name', 'url1', 'msg1', 0, [loc1])
        const v2: Violation = new RuntimeViolation(2, 'engine', 'name', 'url2', 'msg2', 0, [loc2])

        expect(v1.compareTo(v2)).toEqual(0)
        expect(v2.compareTo(v1)).toEqual(0)
    })
})

describe('RunViolationLocation Tests', () => {
    it('Test toString value', () => {
        /* fileName: string, line: number, column: number, endLine: number, endColumn: number */
        const loc: ViolationLocation = new RunViolationLocation('/some/file.apex', 12, 34)
        expect(loc.toString()).toEqual('/some/file.apex:12:34')
    })

    it('Test toString with undefined line', () => {
        /* fileName: string, line: number, column: number, endLine: number, endColumn: number */
        const loc: ViolationLocation = new RunViolationLocation('/some/file.apex', undefined, undefined)
        expect(loc.toString()).toEqual('/some/file.apex')
    })

    it('Test toString with defined line but undefined column', () => {
        /* fileName: string, line: number, column: number, endLine: number, endColumn: number */
        const loc: ViolationLocation = new RunViolationLocation('/some/file.apex', 12, undefined)
        expect(loc.toString()).toEqual('/some/file.apex:12')
    })

    it('Test when violation location has no file', () => {
        const loc: ViolationLocation = new RunViolationLocation(undefined, undefined, undefined)
        expect(loc.toString()).toEqual('(No Code Location)')
    })

    it('Test compareTo when file names are different', () => {
        const loc1: ViolationLocation = new RunViolationLocation('fileB', 12, 34)
        const loc2: ViolationLocation = new RunViolationLocation('fileA', 56, 78)
        expect(loc1.compareTo(loc2)).toEqual(1)
        expect(loc2.compareTo(loc1)).toEqual(-1)
    })

    it('Test compareTo when file names are same but lines are different', () => {
        const loc1: ViolationLocation = new RunViolationLocation('file', 12, 99)
        const loc2: ViolationLocation = new RunViolationLocation('file', 56, 11)
        const loc3: ViolationLocation = new RunViolationLocation('file', undefined, 11)
        expect(loc1.compareTo(loc2)).toEqual(-1)
        expect(loc2.compareTo(loc1)).toEqual(1)
        expect(loc2.compareTo(loc3)).toEqual(-1)
        expect(loc3.compareTo(loc2)).toEqual(1)
    })

    it('Test compareTo when file names and line are same but columns are different', () => {
        const loc1: ViolationLocation = new RunViolationLocation('file', 12, 99)
        const loc2: ViolationLocation = new RunViolationLocation('file', 12, 11)
        const loc3: ViolationLocation = new RunViolationLocation('file', 12, undefined)
        expect(loc1.compareTo(loc2)).toEqual(1)
        expect(loc2.compareTo(loc1)).toEqual(-1)
        expect(loc2.compareTo(loc3)).toEqual(-1)
        expect(loc3.compareTo(loc2)).toEqual(1)
    })

    it('Test compareTo when file names, lines, and columns are the same', () => {
        const loc1: ViolationLocation = new RunViolationLocation('file', 12, 34)
        const loc2: ViolationLocation = new RunViolationLocation('file', 12, 34)
        const loc3: ViolationLocation = new RunViolationLocation('file', undefined, undefined)
        expect(loc1.compareTo(loc2)).toEqual(0)
        expect(loc2.compareTo(loc1)).toEqual(0)
        expect(loc3.compareTo(loc3)).toEqual(0)
    })

    it('Test compareTo when both locations do not have a file', () => {
        const loc1: ViolationLocation = new RunViolationLocation(undefined, undefined, undefined)
        const loc2: ViolationLocation = new RunViolationLocation(undefined, undefined, undefined)
        expect(loc1.compareTo(loc2)).toEqual(0)
    })

    it('Test compareTo when first location does not have a file but the second one does', () => {
        const loc1: ViolationLocation = new RunViolationLocation(undefined, undefined, undefined)
        const loc2: ViolationLocation = new RunViolationLocation('file', 12, 34)
        expect(loc1.compareTo(loc2)).toEqual(1)
    })

    it('Test compareTo when first location does have a file but the second one does not', () => {
        const loc1: ViolationLocation = new RunViolationLocation('file', 12, 34)
        const loc2: ViolationLocation = new RunViolationLocation(undefined, undefined, undefined)
        expect(loc1.compareTo(loc2)).toEqual(-1)
    })

    it('Test RunViolationLocation always comes before another ViolationLocation', () => {
        // This will never happen in production, but best to cover this case for code coverage purposes
        const loc1: ViolationLocation = new RunViolationLocation('file', 12, 34)
        const loc2: ViolationLocation = new FakeViolationLocation()
        expect(loc1.compareTo(loc2)).toEqual(-1)
    })
})
