import { run } from './main'
import { Dependencies, RuntimeDependencies } from './dependencies'
import { CommandExecutor, RuntimeCommandExecutor } from './commands'
import { ResultsFactory, RuntimeResultsFactory } from './results'
import { RuntimeSummarizer, Summarizer } from './summary'

/**
 * The entrypoint for the action.
 */
const runtimeDependencies: Dependencies = new RuntimeDependencies()
const commandExecutor: CommandExecutor = new RuntimeCommandExecutor(runtimeDependencies)
const resultsFactory: ResultsFactory = new RuntimeResultsFactory()
const summarizer: Summarizer = new RuntimeSummarizer()
run(runtimeDependencies, commandExecutor, resultsFactory, summarizer)
