import { InputArguments, mergeWithProcessEnvVars } from '../src/utils'
import { EnvironmentVariables } from '../src/types'

describe('Tests for mergeWithProcessEnvVars', () => {
    it('Test no new fields', async () => {
        const envVars: EnvironmentVariables = mergeWithProcessEnvVars({})
        expect(envVars).toEqual(process.env)
    })

    it('Test new fields are merged', async () => {
        process.env['existingField'] = 'someValue'
        const envVars: EnvironmentVariables = mergeWithProcessEnvVars({
            newField1: 'someValue1',
            newField2: 'someValue2'
        })
        expect(Object.keys(envVars).length).toEqual(Object.keys(process.env).length + 2)
        expect(envVars['existingField']).toEqual('someValue')
        expect(envVars['newField1']).toEqual('someValue1')
        expect(envVars['newField2']).toEqual('someValue2')
        expect(process.env['newField1']).toBeUndefined() // sanity check that we did not modify local environment
    })
})

describe('Tests for InputArguments', () => {
    describe('Tests for getValuesFor', () => {
        it('Test no outfile specified', async () => {
            const inputArguments = new InputArguments('--workspace . --view detail')
            expect(inputArguments.getValuesFor('--output-file', '-f')).toHaveLength(0)
        })

        it('Test --output-file specified once', async () => {
            const inputArguments = new InputArguments('--output-file=someFile.txt --bogus')
            expect(inputArguments.getValuesFor('--output-file', '-f')).toEqual(['someFile.txt'])
        })

        it('Test -f specified once', async () => {
            const inputArguments = new InputArguments('--workspace . -f  someFile.html --view detail')
            expect(inputArguments.getValuesFor('--output-file', '-f')).toEqual(['someFile.html'])
        })

        it('Test single and double quotes wrapping', async () => {
            const inputArguments = new InputArguments(
                '--workspace . -f \'someFile.json\' --miscFlag --output-file="some file with space.xml" -view table'
            )
            expect(inputArguments.getValuesFor('--output-file', '-f')).toEqual([
                'someFile.json',
                'some file with space.xml'
            ])
        })

        it('Test equal sign in file name', async () => {
            const inputArguments = new InputArguments('--miscFlag -f     some=file.json    -f=some==other=file.json')
            expect(inputArguments.getValuesFor('--output-file', '-f')).toEqual([
                'some=file.json',
                'some==other=file.json'
            ])
        })

        it('Test quote in file name', async () => {
            const inputArguments = new InputArguments('-f "some\'file.json"')
            expect(inputArguments.getValuesFor('--output-file', '-f')).toEqual(["some'file.json"])
        })

        it('Test trailing -f', async () => {
            const inputArguments = new InputArguments('--view detail -f  ')
            expect(inputArguments.getValuesFor('--output-file', '-f')).toHaveLength(0)
        })

        it('Test trailing --output-file', async () => {
            const inputArguments = new InputArguments('--view detail --output-file')
            expect(inputArguments.getValuesFor('--output-file')).toHaveLength(0)
        })
    })

    describe('Tests for containsFlag', () => {
        it('Test when user supplies --view flag', async () => {
            const inputArguments = new InputArguments('--view detail')
            expect(inputArguments.containsFlag('--view')).toEqual(true)
        })

        it('Test when user supplies -v flag', async () => {
            const inputArguments = new InputArguments('--output-file someFile.xml -v detail')
            expect(inputArguments.containsFlag('--view', '-v')).toEqual(true)
        })

        it('Test when user does not supply either --view or -v flag', async () => {
            const inputArguments = new InputArguments('--output-file someFile.xml --severity-threshold 3')
            expect(inputArguments.containsFlag('--view', '-v')).toEqual(false)
        })
    })
})
