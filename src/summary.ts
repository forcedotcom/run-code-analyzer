import { Results, Violation, ViolationLocation } from './results'
import { EOL } from 'os'

// We need to keep the overall summary underneath 1mb which is roughly 1024*1024 characters, therefore setting
// the character limit for the table rows to be roughly to 900000 characters to safely stay roughly around 900kb.
const TABLE_ROWS_CHAR_LIMIT = 900000

const SEVERITY_EMOJIS: Map<number, string> = new Map<number, string>([
    [1, ':black_circle:'],
    [2, ':red_circle:'],
    [3, ':orange_circle:'],
    [4, ':yellow_circle:'],
    [5, ':white_circle:']
])

export interface Summarizer {
    createSummaryMarkdown(results: Results, changedFiles?: string[]): string
}

export class RuntimeSummarizer implements Summarizer {
    createSummaryMarkdown(results: Results, changedFiles: string[] = []): string {
        let summary = `## Salesforce Code Analyzer Results${EOL}`
        if (results.getTotalViolationCount() === 0) {
            summary += `### :white_check_mark: 0 Violations Found${EOL}`
            return summary
        }

        summary +=
            `### :warning: ${results.getTotalViolationCount()} Violation(s) Found${EOL}` +
            `<blockquote>${EOL}` +
            `${SEVERITY_EMOJIS.get(1)} ${results.getSev1ViolationCount()} Critical severity violation(s)<br/>${EOL}` +
            `${SEVERITY_EMOJIS.get(2)} ${results.getSev2ViolationCount()} High severity violation(s)<br/>${EOL}` +
            `${SEVERITY_EMOJIS.get(3)} ${results.getSev3ViolationCount()} Medium severity violation(s)<br/>${EOL}` +
            `${SEVERITY_EMOJIS.get(4)} ${results.getSev4ViolationCount()} Low severity violation(s)<br/>${EOL}` +
            `${SEVERITY_EMOJIS.get(5)} ${results.getSev5ViolationCount()} Info severity violation(s)${EOL}` +
            `</blockquote>${EOL}`

        const violations: Violation[] = results.getViolationsSortedBySeverity()
        const changedFilesSet = new Set(changedFiles)
        const violationsInChangedFiles: Violation[] = []
        const violationsOutsideChangedFiles: Violation[] = []
        for (const violation of violations) {
            const hasLocationInChangedFile: boolean = violation
                .getLocations()
                .map(l => l.getFile())
                .some(f => f && changedFilesSet.has(f))
            if (hasLocationInChangedFile) {
                violationsInChangedFiles.push(violation)
            } else {
                violationsOutsideChangedFiles.push(violation)
            }
        }

        if (violationsInChangedFiles.length > 0 && violationsOutsideChangedFiles.length > 0) {
            const violationsInsideFilesTable: string = createTable(violationsInChangedFiles, TABLE_ROWS_CHAR_LIMIT)
            const violationsOutsideFilesTable: string = createTable(
                violationsOutsideChangedFiles,
                TABLE_ROWS_CHAR_LIMIT - violationsInsideFilesTable.length
            )
            summary +=
                // eslint-disable-next-line prefer-template
                `<details>${EOL}` +
                `<summary>${violationsInChangedFiles.length} violations in files changed by this pull request</summary>${EOL}` +
                violationsInsideFilesTable +
                `</details>${EOL}` +
                `<details>${EOL}` +
                `<summary>${violationsOutsideChangedFiles.length} violations in files unchanged by this pull request</summary>${EOL}` +
                violationsOutsideFilesTable +
                `</details>${EOL}`
        } else {
            summary += createTable(violations, TABLE_ROWS_CHAR_LIMIT)
        }

        return summary
    }
}

function createTable(violations: Violation[], tableRowsCharLimit: number): string {
    let tableRows = ''
    let numViolationsIncluded = 0
    for (const violation of violations) {
        const severityEmoji: string | undefined = SEVERITY_EMOJIS.get(violation.getSeverity())
        const locationStr: string = makeSmaller(
            makeSourceAndSinkBold(
                trimAndBreakNewlines(makeLocationsString(violation.getLocations(), violation.getPrimaryLocationIndex()))
            )
        )
        const ruleLink: string = createRuleLink(violation.getRuleName(), violation.getRuleUrl())
        const engineAndRule = makeSmaller(`${violation.getRuleEngine()}:${ruleLink}`)
        const message: string = makeSmaller(trimAndBreakNewlines(escapeHtml(violation.getMessage())))
        const tableRow: string =
            `<tr>` +
            `<td>${severityEmoji}</td>` +
            `<td>${locationStr}</td>` +
            `<td>${engineAndRule}</td>` +
            `<td>${message}</td>` +
            `</tr>${EOL}`
        if (tableRows.length + tableRow.length > tableRowsCharLimit) {
            break
        }
        tableRows += tableRow
        numViolationsIncluded++
    }

    let summary = ''
    if (numViolationsIncluded < violations.length) {
        summary += `Showing ${numViolationsIncluded} of ${violations.length} violations (unable to show all results since max summary char limit reached):${EOL}`
    }
    summary +=
        `<table>` +
        `<tr><th> </th><th>Location</th><th>Rule</th><th>Message</th></tr>${EOL}` +
        `${tableRows}` +
        `</table>${EOL}`

    return summary
}

function makeLocationsString(locations: ViolationLocation[], primaryIdx: number): string {
    const locationStrings: string[] = []
    for (let i = 0; i < locations.length; i++) {
        locationStrings.push(`${locations.length > 1 && i === primaryIdx ? '(main) ' : ''}${locations[i].toString()}`)
    }
    return locationStrings.join('\n')
}

function escapeHtml(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function trimAndBreakNewlines(text: string): string {
    return text.trim().replaceAll('\n', '<br/>')
}

function createRuleLink(ruleName: string, ruleUrl: string | undefined): string {
    return ruleUrl !== undefined ? `<a href="${ruleUrl}">${ruleName}</a>` : ruleName
}

function makeSmaller(text: string): string {
    // Unfortunately font-size styles are not supported. We can only make text smaller with sub or sup tags.
    return `<sup>${text}</sup>`
}

function makeSourceAndSinkBold(text: string): string {
    return text.replace('Source: ', '<b>Source</b>: ').replace('Sink: ', '<b>Sink</b>: ')
}
