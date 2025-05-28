import * as fs from 'fs'

export interface ResultsFactory {
    createResults(resultsFile: string): Results
}

export interface Results {
    getSev1ViolationCount(): number
    getSev2ViolationCount(): number
    getSev3ViolationCount(): number
    getSev4ViolationCount(): number
    getSev5ViolationCount(): number
    getTotalViolationCount(): number
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
    createResults(resultsFile: string): Results {
        const jsonStr: string = fs.readFileSync(resultsFile, { encoding: 'utf8' })
        const resultObj = JSON.parse(jsonStr)

        const violations: Violation[] = []
        for (const violationObj of resultObj['violations']) {
            const primaryLocationIndex: number = violationObj['primaryLocationIndex']
            const primaryLocation = violationObj['locations'][primaryLocationIndex]
            const violationLocation: ViolationLocation = new RunViolationLocation(
                primaryLocation['file'],
                primaryLocation['startLine'],
                primaryLocation['startColumn']
            )

            violations.push(
                new RuntimeViolation(
                    violationObj['severity'],
                    violationObj['engine'],
                    violationObj['rule'],
                    violationObj['resources'][0],
                    violationObj['message'],
                    violationLocation
                )
            )
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

    getSev1ViolationCount(): number {
        return this.violations.filter(v => v.getSeverity() === 1).length
    }

    getSev2ViolationCount(): number {
        return this.violations.filter(v => v.getSeverity() === 2).length
    }

    getSev3ViolationCount(): number {
        return this.violations.filter(v => v.getSeverity() === 3).length
    }

    getSev4ViolationCount(): number {
        return this.violations.filter(v => v.getSeverity() === 4).length
    }

    getSev5ViolationCount(): number {
        return this.violations.filter(v => v.getSeverity() === 5).length
    }

    getTotalViolationCount(): number {
        return this.violations.length
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
    private readonly fileName: string | undefined
    private readonly line: number | undefined
    private readonly column: number | undefined

    constructor(fileName: string | undefined, line: number | undefined, column: number | undefined) {
        this.fileName = fileName
        this.line = line
        this.column = column
    }

    toString(): string {
        let locStr = this.fileName ?? '(No Code Location)'
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
        if (this.fileName && other.fileName && this.fileName !== other.fileName) {
            return this.fileName < other.fileName ? -1 : 1
        } else if (this.fileName && !other.fileName) {
            return -1 // We want undefined code locations to go first
        } else if (!this.fileName && other.fileName) {
            return 1
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
