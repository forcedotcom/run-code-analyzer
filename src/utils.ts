import { EnvironmentVariables } from './types'

/**
 * Returns a copy of the current process environment variables with the supplied environment variables added
 */
export function mergeWithProcessEnvVars(envVars: EnvironmentVariables): EnvironmentVariables {
    const mergedEnvVars: EnvironmentVariables = {}
    for (const k in envVars) {
        mergedEnvVars[k] = envVars[k]
    }
    for (const k in process.env) {
        if (process.env[k] !== undefined) {
            mergedEnvVars[k] = process.env[k] as string
        }
    }
    return mergedEnvVars
}

/**
 * Extracts the value of the outfile from the run arguments or returns an empty string if not found
 */
export function extractOutfileFromRunArguments(runArgs: string): string {
    const spaceMarker = '<<SPACE>>'
    let markedRunArgs: string = markSpacesBetweenQuotes(runArgs, spaceMarker)
    markedRunArgs = markedRunArgs.replace(/ +/g, ' ')
    const parts: string[] = markedRunArgs.split(' ')
    for (let i = 0; i < parts.length; i++) {
        const partLower = parts[i].toLowerCase()
        if ((partLower === '-o' || partLower === '--outfile') && i < parts.length - 1) {
            return parts[i + 1].replaceAll(spaceMarker, ' ')
        } else if (partLower.startsWith('-o=')) {
            return parts[i].substring(3)
        } else if (partLower.startsWith('--outfile=')) {
            return parts[i].substring(10)
        }
    }
    return ''
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
