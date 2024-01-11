import { run } from './main'
import { RuntimeDependencies } from './dependencies'

/**
 * The entrypoint for the action.
 */
// eslint-disable-next-line @typescript-eslint/no-floating-promises
run(new RuntimeDependencies())
