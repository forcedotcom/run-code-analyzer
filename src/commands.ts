import { EnvironmentVariables } from './types'
import { CommandOutput, Dependencies } from './dependencies'
import * as semver from 'semver'

type PluginMetadata = { name: string; version: string }

export interface CommandExecutor {
    isSalesforceCliInstalled(): Promise<boolean>
    installSalesforceCli(): Promise<boolean>
    isMinimumScannerPluginInstalled(minVersion: string): Promise<boolean>
    installScannerPlugin(): Promise<boolean>
    runCodeAnalyzer(runCmd: string, runArgs: string, internalOutfile: string): Promise<number>
}

export class RuntimeCommandExecutor implements CommandExecutor {
    private readonly dependencies: Dependencies
    constructor(dependencies: Dependencies) {
        this.dependencies = dependencies
    }

    async isSalesforceCliInstalled(): Promise<boolean> {
        const cmdOut: CommandOutput = await this.dependencies.execCommand('sf --version')
        return cmdOut.exitCode === 0
    }

    async installSalesforceCli(): Promise<boolean> {
        const cmdOut: CommandOutput = await this.dependencies.execCommand('npm install -g @salesforce/cli@latest')
        return cmdOut.exitCode === 0
    }

    async isMinimumScannerPluginInstalled(minVersion: string): Promise<boolean> {
        const command = 'sf plugins inspect @salesforce/sfdx-scanner --json'
        const cmdOut: CommandOutput = await this.dependencies.execCommand(command)
        if (cmdOut.exitCode !== 0) {
            return false
        }
        try {
            const pluginMetadataArray: PluginMetadata[] = JSON.parse(cmdOut.stdout) as PluginMetadata[]
            if (pluginMetadataArray.length !== 1) {
                return false
            }
            const pluginMetadata: PluginMetadata = pluginMetadataArray[0]
            return semver.gte(pluginMetadata.version, minVersion)
        } catch (_err) {
            return false
        }
    }

    async installScannerPlugin(): Promise<boolean> {
        const command = 'sf plugins install @salesforce/sfdx-scanner@latest'
        const cmdOut: CommandOutput = await this.dependencies.execCommand(command)
        return cmdOut.exitCode === 0
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
        const cmdOut: CommandOutput = await this.dependencies.execCommand(command, envVars)
        return cmdOut.exitCode
    }
}
