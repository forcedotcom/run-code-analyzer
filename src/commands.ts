import { EnvironmentVariables } from './types'
import { Dependencies } from './dependencies'

export interface CommandExecutor {
    runCodeAnalyzer(runCmd: string, runArgs: string, internalOutfile: string): Promise<number>
    isSalesforceCliInstalled(): Promise<boolean>
}

export class RuntimeCommandExecutor implements CommandExecutor {
    private readonly dependencies: Dependencies
    constructor(dependencies: Dependencies) {
        this.dependencies = dependencies
    }

    async runCodeAnalyzer(runCmd: string, runArgs: string, internalOutfile: string): Promise<number> {
        const command = `sf scanner ${runCmd} ${runArgs}`
        const envVars: EnvironmentVariables = {
            // Without increasing the heap allocation, node often fails. So we increase it to 8gb which should be enough
            NODE_OPTIONS: '--max-old-space-size=8192',
            // We always want to control our own internal outfile for reliable processing
            SCANNER_INTERNAL_OUTFILE: internalOutfile
        }
        if (process.env['JAVA_HOME_11_X64']) {
            // We prefer to run on java 11 if available since the default varies across the different GitHub runners.
            envVars['JAVA_HOME'] = process.env['JAVA_HOME_11_X64']
        }
        return await this.dependencies.execCommand(command, envVars)
    }

    async isSalesforceCliInstalled(): Promise<boolean> {
        const exitCode: number = await this.dependencies.execCommand('sf --version')
        return exitCode === 0
    }
}
