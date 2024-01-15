import {
    Results,
    ResultsFactory,
    RunDfaViolationLocation,
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
            path.join('.', '__tests__', 'data', 'sampleRunResults.json'),
            false
        )
        expect(results.getTotalViolationCount()).toEqual(131)
        expect(results.getSev1ViolationCount()).toEqual(55)
        expect(results.getSev2ViolationCount()).toEqual(0)
        expect(results.getSev3ViolationCount()).toEqual(76)

        const violations: Violation[] = results.getViolationsSortedBySeverity()
        expect(violations).toHaveLength(131)

        // Check sorted by severity
        for (let i = 0; i < 55; i++) {
            expect(violations[i].getSeverity()).toEqual(1)
        }
        for (let i = 55; i < violations.length; i++) {
            expect(violations[i].getSeverity()).toEqual(3)
        }

        // Check one of the violations as a sanity check
        expect(violations[5].getRuleEngine()).toEqual('eslint')
        expect(violations[5].getRuleName()).toEqual('no-unused-vars')
        expect(violations[5].getRuleUrl()).toEqual('https://eslint.org/docs/latest/rules/no-unused-vars')
        expect(violations[5].getMessage()).toEqual("'helper' is defined but never used.")
        expect(violations[5].getLocation().toString()).toEqual(
            '/Users/runner/work/sample-sf-project/sample-sf-project/force-app/main/default/aura/CSPattr/CSPattrController.js:2:40'
        )
    })

    it('Check that createResults correctly constructs run dfa results', () => {
        const results: Results = resultsFactory.createResults(
            path.join('.', '__tests__', 'data', 'sampleRunDfaResults.json'),
            true
        )
        expect(results.getTotalViolationCount()).toEqual(22)
        expect(results.getSev1ViolationCount()).toEqual(18)
        expect(results.getSev2ViolationCount()).toEqual(0)
        expect(results.getSev3ViolationCount()).toEqual(4)

        const violations: Violation[] = results.getViolationsSortedBySeverity()

        // Check sorted by severity
        expect(violations).toHaveLength(22)
        for (let i = 0; i < 18; i++) {
            expect(violations[i].getSeverity()).toEqual(1)
        }
        for (let i = 18; i < violations.length; i++) {
            expect(violations[i].getSeverity()).toEqual(3)
        }

        // Check one of the violations as a sanity check
        expect(violations[1].getRuleEngine()).toEqual('sfge')
        expect(violations[1].getRuleName()).toEqual('UseWithSharingOnDatabaseOperation')
        expect(violations[1].getRuleUrl()).toEqual(
            'https://forcedotcom.github.io/sfdx-scanner/en/v3.x/salesforce-graph-engine/rules/#UseWithSharingOnDatabaseOperation'
        )
        expect(violations[1].getMessage()).toEqual(
            'Database operation must be executed from a class that enforces sharing rules.'
        )
        expect(violations[1].getLocation().toString()).toEqual(
            'Source: /Users/runner/work/sample-sf-project/sample-sf-project/force-app/main/default/classes/NameController.cls:5:26\n' +
                'Sink: /Users/runner/work/sample-sf-project/sample-sf-project/force-app/main/default/classes/UnsafeSOQL.cls:4'
        )
    })
})

describe('RuntimeViolation Tests', () => {
    it('Test getters', () => {
        const loc: FakeViolationLocation = new FakeViolationLocation()
        const violation: Violation = new RuntimeViolation(2, 'engine', 'name', 'url', 'msg', loc)
        expect(violation.getSeverity()).toEqual(2)
        expect(violation.getRuleEngine()).toEqual('engine')
        expect(violation.getRuleName()).toEqual('name')
        expect(violation.getRuleUrl()).toEqual('url')
        expect(violation.getMessage()).toEqual('msg')
        expect(violation.getLocation()).toEqual(loc)
    })

    it('Test compareTo when severity is not the same', () => {
        const loc1: FakeViolationLocation = new FakeViolationLocation()
        loc1.compareToReturnValue = -1
        const loc2: FakeViolationLocation = new FakeViolationLocation()
        loc2.compareToReturnValue = 1
        const v1: Violation = new RuntimeViolation(2, 'engine1', 'name1', 'url1', 'msg1', loc1)
        const v2: Violation = new RuntimeViolation(1, 'engine2', 'name2', 'url2', 'msg2', loc2)

        expect(v1.compareTo(v2)).toEqual(1)
        expect(v2.compareTo(v1)).toEqual(-1)
    })

    it('Test compareTo when severity the same but location is different', () => {
        const loc1: FakeViolationLocation = new FakeViolationLocation()
        loc1.compareToReturnValue = 1
        const loc2: FakeViolationLocation = new FakeViolationLocation()
        loc2.compareToReturnValue = -1
        const v1: Violation = new RuntimeViolation(2, 'engine1', 'name1', 'url1', 'msg1', loc1)
        const v2: Violation = new RuntimeViolation(2, 'engine2', 'name2', 'url2', 'msg2', loc2)

        expect(v1.compareTo(v2)).toEqual(1)
        expect(v2.compareTo(v1)).toEqual(-1)
    })

    it('Test compareTo when severity and location are the same but engine is different', () => {
        const loc1: FakeViolationLocation = new FakeViolationLocation()
        const loc2: FakeViolationLocation = new FakeViolationLocation()
        const v1: Violation = new RuntimeViolation(2, 'engineB', 'name1', 'url1', 'msg1', loc1)
        const v2: Violation = new RuntimeViolation(2, 'engineA', 'name2', 'url2', 'msg2', loc2)

        expect(v1.compareTo(v2)).toEqual(1)
        expect(v2.compareTo(v1)).toEqual(-1)
    })

    it('Test compareTo when severity, location, and engine are the same but rule name is different', () => {
        const loc1: FakeViolationLocation = new FakeViolationLocation()
        const loc2: FakeViolationLocation = new FakeViolationLocation()
        const v1: Violation = new RuntimeViolation(2, 'engine', 'name1', 'url1', 'msg1', loc1)
        const v2: Violation = new RuntimeViolation(2, 'engine', 'name2', 'url2', 'msg2', loc2)

        expect(v1.compareTo(v2)).toEqual(-1)
        expect(v2.compareTo(v1)).toEqual(1)
    })

    it('Test compareTo when severity, location, engine, and rule name are the same', () => {
        const loc1: FakeViolationLocation = new FakeViolationLocation()
        const loc2: FakeViolationLocation = new FakeViolationLocation()
        const v1: Violation = new RuntimeViolation(2, 'engine', 'name', 'url1', 'msg1', loc1)
        const v2: Violation = new RuntimeViolation(2, 'engine', 'name', 'url2', 'msg2', loc2)

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

    it('Test RunViolationLocation always comes before another ViolationLocation', () => {
        // This will never happen in production, but best to cover this case for code coverage purposes
        const loc1: ViolationLocation = new RunViolationLocation('file', 12, 34)
        const loc2: ViolationLocation = new FakeViolationLocation()
        expect(loc1.compareTo(loc2)).toEqual(-1)
    })
})

describe('RunDfaViolationLocation Tests', () => {
    it('Test toString value', () => {
        /* fileName: string, line: number, column: number, endLine: number, endColumn: number */
        const loc: ViolationLocation = new RunDfaViolationLocation(
            '/some/sourceFile.apex',
            12,
            34,
            '/some/sinkFile.apex',
            56,
            78
        )
        expect(loc.toString()).toEqual('Source: /some/sourceFile.apex:12:34\nSink: /some/sinkFile.apex:56:78')
    })

    it('Test toString value with undefined source lines and columns', () => {
        /* fileName: string, line: number, column: number, endLine: number, endColumn: number */
        const loc: ViolationLocation = new RunDfaViolationLocation(
            '/some/sourceFile.apex',
            undefined,
            undefined,
            '/some/sinkFile.apex',
            12,
            13
        )
        expect(loc.toString()).toEqual('Source: /some/sourceFile.apex\nSink: /some/sinkFile.apex:12:13')
    })

    it('Test toString value with undefined sink lines and columns', () => {
        /* fileName: string, line: number, column: number, endLine: number, endColumn: number */
        const loc: ViolationLocation = new RunDfaViolationLocation(
            '/some/sourceFile.apex',
            99,
            22,
            '/some/sinkFile.apex',
            undefined,
            undefined
        )
        expect(loc.toString()).toEqual('Source: /some/sourceFile.apex:99:22\nSink: /some/sinkFile.apex')
    })

    it('Test toString value with defined lines but undefined columns', () => {
        /* fileName: string, line: number, column: number, endLine: number, endColumn: number */
        const loc: ViolationLocation = new RunDfaViolationLocation(
            '/some/sourceFile.apex',
            443,
            undefined,
            '/some/sinkFile.apex',
            331,
            undefined
        )
        expect(loc.toString()).toEqual('Source: /some/sourceFile.apex:443\nSink: /some/sinkFile.apex:331')
    })

    it('Test compareTo when source file names are different', () => {
        const loc1: ViolationLocation = new RunDfaViolationLocation('sourceB', 12, 34, 'sinkA', 12, 34)
        const loc2: ViolationLocation = new RunDfaViolationLocation('sourceA', 56, 78, 'sinkB', 56, 78)
        expect(loc1.compareTo(loc2)).toEqual(1)
        expect(loc2.compareTo(loc1)).toEqual(-1)
    })

    it('Test compareTo when source file names are same but source lines are different', () => {
        const loc1: ViolationLocation = new RunDfaViolationLocation('sourceA', 56, 34, 'sinkA', 12, 34)
        const loc2: ViolationLocation = new RunDfaViolationLocation('sourceA', 12, 78, 'sinkB', 56, 78)
        const loc3: ViolationLocation = new RunDfaViolationLocation('sourceA', undefined, 78, 'sinkB', 56, 78)
        expect(loc1.compareTo(loc2)).toEqual(1)
        expect(loc2.compareTo(loc1)).toEqual(-1)
        expect(loc2.compareTo(loc3)).toEqual(-1)
        expect(loc3.compareTo(loc2)).toEqual(1)
    })

    it('Test compareTo when source file names line are same but source columns are different', () => {
        const loc1: ViolationLocation = new RunDfaViolationLocation('sourceA', 56, 34, 'sinkA', 12, 34)
        const loc2: ViolationLocation = new RunDfaViolationLocation('sourceA', 56, 78, 'sinkB', 56, 78)
        const loc3: ViolationLocation = new RunDfaViolationLocation('sourceA', 56, undefined, 'sinkB', 56, 78)
        expect(loc1.compareTo(loc2)).toEqual(-1)
        expect(loc2.compareTo(loc1)).toEqual(1)
        expect(loc2.compareTo(loc3)).toEqual(-1)
        expect(loc3.compareTo(loc2)).toEqual(1)
    })

    it('Test compareTo when sources are the same but sink file names are different', () => {
        const loc1: ViolationLocation = new RunDfaViolationLocation('sourceA', 56, 34, 'sinkB', 12, 34)
        const loc2: ViolationLocation = new RunDfaViolationLocation('sourceA', 56, 34, 'sinkA', 56, 78)
        expect(loc1.compareTo(loc2)).toEqual(1)
        expect(loc2.compareTo(loc1)).toEqual(-1)
    })

    it('Test compareTo when sources and sink file names are same but sink lines are different', () => {
        const loc1: ViolationLocation = new RunDfaViolationLocation('sourceA', 56, 34, 'sinkA', 12, 78)
        const loc2: ViolationLocation = new RunDfaViolationLocation('sourceA', 56, 34, 'sinkA', 56, 34)
        const loc3: ViolationLocation = new RunDfaViolationLocation('sourceA', 56, 34, 'sinkA', undefined, 34)
        expect(loc1.compareTo(loc2)).toEqual(-1)
        expect(loc2.compareTo(loc1)).toEqual(1)
        expect(loc2.compareTo(loc3)).toEqual(-1)
        expect(loc3.compareTo(loc2)).toEqual(1)
    })

    it('Test compareTo when sources and sink file names and lines are same but sink columns are different', () => {
        const loc1: ViolationLocation = new RunDfaViolationLocation('sourceA', 56, 34, 'sinkA', 12, 78)
        const loc2: ViolationLocation = new RunDfaViolationLocation('sourceA', 56, 34, 'sinkA', 12, 34)
        const loc3: ViolationLocation = new RunDfaViolationLocation('sourceA', 56, 34, 'sinkA', 12, undefined)
        expect(loc1.compareTo(loc2)).toEqual(1)
        expect(loc2.compareTo(loc1)).toEqual(-1)
        expect(loc2.compareTo(loc3)).toEqual(-1)
        expect(loc3.compareTo(loc2)).toEqual(1)
    })

    it('Test compareTo when sources and sinks are the same', () => {
        const loc1: ViolationLocation = new RunDfaViolationLocation('sourceA', 56, 34, 'sinkA', 12, 78)
        const loc2: ViolationLocation = new RunDfaViolationLocation('sourceA', 56, 34, 'sinkA', 12, 78)
        expect(loc1.compareTo(loc2)).toEqual(0)
        expect(loc2.compareTo(loc1)).toEqual(0)
    })

    it('Test RunDfaViolationLocation always comes after another ViolationLocation', () => {
        // This will never happen in production, but best to cover this case for code coverage purposes
        const loc1: ViolationLocation = new RunDfaViolationLocation('source', 12, 34, 'sink', 56, 78)
        const loc2: ViolationLocation = new FakeViolationLocation()
        expect(loc1.compareTo(loc2)).toEqual(1)
    })
})
