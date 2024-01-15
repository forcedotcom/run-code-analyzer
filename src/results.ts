import * as fs from 'fs'
import { toRelativeFile } from './utils'

export interface ResultsFactory {
    createResults(resultsFile: string, isDfa: boolean): Results
}

export interface Results {
    getTotalViolationCount(): number
    getSev1ViolationCount(): number
    getSev2ViolationCount(): number
    getSev3ViolationCount(): number
    getViolationsSortedBySeverity(): Violation[]
}

export interface Violation {
    getSeverity(): number
    getLocation(): ViolationLocation
    getRuleEngine(): string
    getRuleName(): string
    getRuleUrl(): string | undefined
    getMessage(): string
    compareTo(other: Violation): number
}

export interface ViolationLocation {
    toString(): string
    compareTo(other: ViolationLocation): number
}

export class RuntimeResultsFactory implements ResultsFactory {
    createResults(resultsFile: string, isDfa: boolean): Results {
        const jsonStr: string = fs.readFileSync(resultsFile, { encoding: 'utf8' })
        const resultArray = JSON.parse(jsonStr)

        const violations: Violation[] = []
        for (const resultObj of resultArray) {
            for (const violationObj of resultObj['violations']) {
                let violationLocation: ViolationLocation
                if (isDfa) {
                    violationLocation = new RunDfaViolationLocation(
                        toRelativeFile(resultObj['fileName']),
                        violationObj['sourceLine'],
                        violationObj['sourceColumn'],
                        toRelativeFile(violationObj['sinkFileName']),
                        violationObj['sinkLine'],
                        violationObj['sinkObj']
                    )
                } else {
                    violationLocation = new RunViolationLocation(
                        toRelativeFile(resultObj['fileName']),
                        violationObj['line'],
                        violationObj['column']
                    )
                }

                violations.push(
                    new RuntimeViolation(
                        violationObj['normalizedSeverity'],
                        resultObj['engine'],
                        violationObj['ruleName'],
                        violationObj['url'],
                        violationObj['message'],
                        violationLocation
                    )
                )
            }
        }
        return new RuntimeResults(violations)
    }
}

export class RuntimeResults implements Results {
    private readonly violations: Violation[]
    private sorted = false

    constructor(violations: Violation[]) {
        this.violations = violations
    }

    getTotalViolationCount(): number {
        return this.violations.length
    }

    getSev1ViolationCount(): number {
        return this.violations.filter(v => v.getSeverity() === 1).length
    }

    getSev2ViolationCount(): number {
        return this.violations.filter(v => v.getSeverity() === 2).length
    }

    getSev3ViolationCount(): number {
        return this.violations.filter(v => v.getSeverity() === 3).length
    }

    getViolationsSortedBySeverity(): Violation[] {
        if (!this.sorted) {
            this.violations.sort((v1, v2) => v1.compareTo(v2))
            this.sorted = true
        }
        return this.violations
    }
}

export class RuntimeViolation implements Violation {
    private readonly severity: number
    private readonly ruleEngine: string
    private readonly ruleName: string
    private readonly ruleUrl?: string
    private readonly message: string
    private readonly location: ViolationLocation

    constructor(
        severity: number,
        ruleEngine: string,
        ruleName: string,
        ruleUrl: string | undefined,
        message: string,
        location: ViolationLocation
    ) {
        this.severity = severity
        this.ruleEngine = ruleEngine
        this.ruleName = ruleName
        this.ruleUrl = ruleUrl
        this.message = message
        this.location = location
    }

    getSeverity(): number {
        return this.severity
    }

    getLocation(): ViolationLocation {
        return this.location
    }

    getRuleEngine(): string {
        return this.ruleEngine
    }

    getRuleName(): string {
        return this.ruleName
    }

    getRuleUrl(): string | undefined {
        return this.ruleUrl
    }

    getMessage(): string {
        return this.message
    }

    compareTo(other: Violation): number {
        if (this.getSeverity() !== other.getSeverity()) {
            return this.getSeverity() - other.getSeverity()
        }
        const locationCompare: number = this.getLocation().compareTo(other.getLocation())
        if (locationCompare !== 0) {
            return locationCompare
        }
        if (this.getRuleEngine() !== other.getRuleEngine()) {
            return this.getRuleEngine() < other.getRuleEngine() ? -1 : 1
        }
        if (this.getRuleName() !== other.getRuleName()) {
            return this.getRuleName() < other.getRuleName() ? -1 : 1
        }
        return 0
    }
}

export class RunViolationLocation implements ViolationLocation {
    private readonly fileName: string
    private readonly line: number | undefined
    private readonly column: number | undefined

    constructor(fileName: string, line: number | undefined, column: number | undefined) {
        this.fileName = fileName
        this.line = line
        this.column = column
    }

    toString(): string {
        let locStr = this.fileName
        if (this.line !== undefined) {
            locStr += `:${this.line}`
            if (this.column !== undefined) {
                locStr += `:${this.column}`
            }
        }
        return locStr
    }

    compareTo(other: ViolationLocation): number {
        if (!(other instanceof RunViolationLocation)) {
            return -1
        }
        if (this.fileName !== other.fileName) {
            return this.fileName < other.fileName ? -1 : 1
        } else if (this.line !== other.line) {
            if (this.line === undefined) {
                return 1
            } else if (other.line === undefined) {
                return -1
            }
            return this.line < other.line ? -1 : 1
        } else if (this.column !== other.column) {
            if (this.column === undefined) {
                return 1
            } else if (other.column === undefined) {
                return -1
            }
            return this.column < other.column ? -1 : 1
        }
        return 0
    }
}

export class RunDfaViolationLocation implements ViolationLocation {
    private readonly sourceFileName: string
    private readonly sourceLine: number | undefined
    private readonly sourceColumn: number | undefined
    private readonly sinkFileName: string
    private readonly sinkLine: number | undefined
    private readonly sinkColumn: number | undefined

    constructor(
        sourceFileName: string,
        sourceLine: number | undefined,
        sourceColumn: number | undefined,
        sinkFileName: string,
        sinkLine: number | undefined,
        sinkColumn: number | undefined
    ) {
        this.sourceFileName = sourceFileName
        this.sourceLine = sourceLine
        this.sourceColumn = sourceColumn
        this.sinkFileName = sinkFileName
        this.sinkLine = sinkLine
        this.sinkColumn = sinkColumn
    }

    toString(): string {
        let locStr = `Source: ${this.sourceFileName}`
        if (this.sourceLine !== undefined) {
            locStr += `:${this.sourceLine}`
            if (this.sourceColumn !== undefined) {
                locStr += `:${this.sourceColumn}`
            }
        }
        locStr += `\nSink: ${this.sinkFileName}`
        if (this.sinkLine !== undefined) {
            locStr += `:${this.sinkLine}`
            if (this.sinkColumn !== undefined) {
                locStr += `:${this.sinkColumn}`
            }
        }
        return locStr
    }

    compareTo(other: ViolationLocation): number {
        if (!(other instanceof RunDfaViolationLocation)) {
            return 1
        }
        if (this.sourceFileName !== other.sourceFileName) {
            return this.sourceFileName < other.sourceFileName ? -1 : 1
        } else if (this.sourceLine !== other.sourceLine) {
            if (this.sourceLine === undefined) {
                return 1
            } else if (other.sourceLine === undefined) {
                return -1
            }
            return this.sourceLine < other.sourceLine ? -1 : 1
        } else if (this.sourceColumn !== other.sourceColumn) {
            if (this.sourceColumn === undefined) {
                return 1
            } else if (other.sourceColumn === undefined) {
                return -1
            }
            return this.sourceColumn < other.sourceColumn ? -1 : 1
        } else if (this.sinkFileName !== other.sinkFileName) {
            return this.sinkFileName < other.sinkFileName ? -1 : 1
        } else if (this.sinkLine !== other.sinkLine) {
            if (this.sinkLine === undefined) {
                return 1
            } else if (other.sinkLine === undefined) {
                return -1
            }
            return this.sinkLine < other.sinkLine ? -1 : 1
        } else if (this.sinkColumn !== other.sinkColumn) {
            if (this.sinkColumn === undefined) {
                return 1
            } else if (other.sinkColumn === undefined) {
                return -1
            }
            return this.sinkColumn < other.sinkColumn ? -1 : 1
        }
        return 0
    }
}
