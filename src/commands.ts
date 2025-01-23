import { CommandOutput, EnvironmentVariables } from './types'
import { Dependencies } from './dependencies'
import { gte } from 'semver'
import { MESSAGE_FCNS } from './constants'

type PluginMetadata = { name: string; version: string }

export interface CommandExecutor {
    isSalesforceCliInstalled(): Promise<boolean>
    installSalesforceCli(): Promise<boolean>
    isMinimumCodeAnalyzerPluginInstalled(minVersion: string): Promise<boolean>
    installCodeAnalyzerPlugin(): Promise<boolean>
    runCodeAnalyzer(runArgs: string): Promise<CommandOutput>
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

    async isMinimumCodeAnalyzerPluginInstalled(minVersion: string): Promise<boolean> {
        const pluginName = '@salesforce/plugin-code-analyzer'
        const command = `sf plugins inspect ${pluginName} --json`
        const runSilently = true
        const cmdOut: CommandOutput = await this.dependencies.execCommand(command, {}, runSilently)
        if (cmdOut.exitCode !== 0) {
            return false
        }
        try {
            const pluginsFound: PluginMetadata[] = JSON.parse(cmdOut.stdout) as PluginMetadata[]
            if (pluginsFound.length !== 1 || pluginsFound[0].name !== pluginName) {
                return false
            }
            this.dependencies.info(MESSAGE_FCNS.PLUGIN_FOUND(pluginName, pluginsFound[0].version))
            return gte(pluginsFound[0].version, minVersion)
        } catch (_err) {
            return false
        }
    }

    async installCodeAnalyzerPlugin(): Promise<boolean> {
        const command = 'sf plugins install code-analyzer@latest'
        const cmdOut: CommandOutput = await this.dependencies.execCommand(command)
        return cmdOut.exitCode === 0
    }

    async runCodeAnalyzer(runArgs: string): Promise<CommandOutput> {
        const command = `sf code-analyzer run ${runArgs}`

        // Note that setting environment variables here is safe because any variables that already exist in process.env
        // will be used instead of the ones we set here when we do our mergeWithProcessEnvVars step.
        const envVars: EnvironmentVariables = {
            // Without increasing the heap allocation, node often fails. So we increase it to 8gb which should be enough
            NODE_OPTIONS: '--max-old-space-size=8192'
        }
        if (process.env['JAVA_HOME_11_X64']) {
            // We prefer to run on java 11 if available since the default varies across the different GitHub runners.
            envVars['JAVA_HOME'] = process.env['JAVA_HOME_11_X64']
        }
        return await this.dependencies.execCommand(command, envVars)
    }
}
