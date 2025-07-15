import { EnvironmentVariables } from './types'

/**
 * Returns a copy of the current process environment variables with the supplied environment variables added.
 * Any supplied environment variables are only added if they do not already exist. This means we give preference to
 * the values for the variables that the user has set always.
 */
export function mergeWithProcessEnvVars(envVars: EnvironmentVariables): EnvironmentVariables {
    const mergedEnvVars: EnvironmentVariables = {}
    for (const k in envVars) {
        mergedEnvVars[k] = envVars[k]
    }
    for (const k in process.env) {
        /* istanbul ignore else */
        if (process.env[k] !== undefined) {
            mergedEnvVars[k] = process.env[k]
        }
    }
    return mergedEnvVars
}

/**
 * Utility class to help ask questions regarding the users input arguments
 */
export class InputArguments {
    private readonly inputArgs: InputArgument[]
    constructor(argumentsText: string) {
        this.inputArgs = extractInputArguments(argumentsText)
    }

    containsFlag(longFlag: string, shortFlag?: string): boolean {
        const flagsToMatch: string[] = [longFlag, ...(shortFlag ? [shortFlag] : [])]
        return this.inputArgs.some(ia => flagsToMatch.includes(ia.flag))
    }

    getValuesFor(longFlag: string, shortFlag?: string): string[] {
        const flagsToMatch: string[] = [longFlag, ...(shortFlag ? [shortFlag] : [])]
        return this.inputArgs
            .filter(ia => flagsToMatch.includes(ia.flag) && ia.value !== undefined)
            .map(ia => ia.value as string)
    }
}
type InputArgument = {
    flag: string
    value?: string
}
const SPACE_MARKER = '<<SPACE>>'
function extractInputArguments(argumentsText: string): InputArgument[] {
    const inputArgs: InputArgument[] = []

    const parts: string[] = markSpacesBetweenQuotes(argumentsText.trim(), SPACE_MARKER)
        .replace(/ +/g, ' ')
        .split(' ')
        .map(p => p.replaceAll(SPACE_MARKER, ' '))

    for (let i = 0; i < parts.length; i++) {
        if (i === parts.length - 1 || parts[i + 1].startsWith('-')) {
            if (parts[i].includes('=')) {
                const idx: number = parts[i].indexOf('=')
                inputArgs.push({ flag: parts[i].toLowerCase().substring(0, idx), value: parts[i].substring(idx + 1) })
            } else {
                inputArgs.push({ flag: parts[i].toLowerCase() })
            }
        } else {
            inputArgs.push({ flag: parts[i].toLowerCase(), value: parts[i + 1] })
            i++
        }
    }

    return inputArgs
}
function markSpacesBetweenQuotes(value: string, spaceMarker: string): string {
    let insideQuotes = false
    let currentQuote = '"'
    let output = ''
    for (const c of value) {
        if (!insideQuotes && (c === '"' || c === "'")) {
            insideQuotes = true
            currentQuote = c
        } else if (insideQuotes && c === currentQuote) {
            insideQuotes = false
        } else if (insideQuotes && c === ' ') {
            output += spaceMarker
        } else {
            output += c
        }
    }
    return output
}

export function getFullErrorMessage(err: unknown): string {
    return err instanceof Error
        ? (err.stack ?? /* istanbul ignore next */ err.message)
        : /* istanbul ignore next */ String(err)
}
