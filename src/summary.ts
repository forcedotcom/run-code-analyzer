import { Results, Violation } from './results'
import { EOL } from 'os'

// We need to keep the overall summary underneath 1mb which is roughly 1024*1024 characters, therefore setting
// the character limit for the table rows to be roughly to 900000 characters to safely stay roughly around 900kb.
const TABLE_ROWS_CHAR_LIMIT = 900000

const SEVERITY_EMOJIS: Map<number, string> = new Map<number, string>([
    [1, ':red_circle:'],
    [2, ':orange_circle:'],
    [3, ':yellow_circle:']
])

export interface Summarizer {
    createSummaryMarkdown(results: Results): string
}

export class RuntimeSummarizer implements Summarizer {
    createSummaryMarkdown(results: Results): string {
        let summary = `## Salesforce Code Analyzer Results${EOL}`
        if (results.getTotalViolationCount() === 0) {
            summary += `### :white_check_mark: 0 Violations Found${EOL}`
            return summary
        }

        summary +=
            `### :warning: ${results.getTotalViolationCount()} Violation(s) Found${EOL}` +
            `<blockquote>${EOL}` +
            `${SEVERITY_EMOJIS.get(1)} ${results.getSev1ViolationCount()} High severity violation(s)<br/>${EOL}` +
            `${SEVERITY_EMOJIS.get(2)} ${results.getSev2ViolationCount()} Medium severity violation(s)<br/>${EOL}` +
            `${SEVERITY_EMOJIS.get(3)} ${results.getSev3ViolationCount()} Low severity violation(s)${EOL}` +
            `</blockquote>${EOL}`

        let tableRows = ''
        const violations: Violation[] = results.getViolationsSortedBySeverity()
        let numViolationsIncluded = 0
        for (const violation of violations) {
            const severityEmoji = SEVERITY_EMOJIS.get(violation.getSeverity())
            const locationStr: string = makeSmaller(
                makeSourceAndSinkBold(trimAndBreakNewlines(violation.getLocation().toString()))
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
            if (tableRows.length + tableRow.length > TABLE_ROWS_CHAR_LIMIT) {
                break
            }
            tableRows += tableRow
            numViolationsIncluded++
        }

        if (numViolationsIncluded < violations.length) {
            summary += `Showing ${numViolationsIncluded} of ${violations.length} violations:${EOL}`
        }
        summary +=
            `<table>` +
            `<tr><th> </th><th>Location</th><th>Rule</th><th>Message</th></tr>${EOL}` +
            `${tableRows}` +
            `</table>${EOL}`

        return summary
    }
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
