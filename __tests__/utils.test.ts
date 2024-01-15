import { extractOutfileFromRunArguments, mergeWithProcessEnvVars, toRelativeFile } from '../src/utils'
import { EnvironmentVariables } from '../src/types'
import * as path from 'path'

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

describe('Tests for extractOutfileFromRunArguments', () => {
    it('Test no outfile specified', async () => {
        const outfile = extractOutfileFromRunArguments('--target . --normalize-severity')
        expect(outfile).toEqual('')
    })

    it('Test --outfile specified', async () => {
        const outfile = extractOutfileFromRunArguments('--outfile=someFile.txt --normalize-severity')
        expect(outfile).toEqual('someFile.txt')
    })

    it('Test -o specified', async () => {
        const outfile = extractOutfileFromRunArguments('--target . -o  someFile.html --normalize-severity')
        expect(outfile).toEqual('someFile.html')
    })

    it('Test single quotes wraps name', async () => {
        const outfile = extractOutfileFromRunArguments("--target . -o 'someFile.json' --normalize-severity")
        expect(outfile).toEqual('someFile.json')
    })

    it('Test double quotes wraps name', async () => {
        const outfile = extractOutfileFromRunArguments('-t . --normalize-severity -o "someFile.xml"')
        expect(outfile).toEqual('someFile.xml')
    })

    it('Test space in file name with quotes', async () => {
        const outfile = extractOutfileFromRunArguments(
            '-o "some file  with spaces.and.multiple.ext" --normalize-severity'
        )
        expect(outfile).toEqual('some file  with spaces.and.multiple.ext')
    })

    it('Test equal sign in file name', async () => {
        const outfile1 = extractOutfileFromRunArguments('--normalize-severity -o     some=file.json')
        expect(outfile1).toEqual('some=file.json')
        const outfile2 = extractOutfileFromRunArguments('-o=some==other=file.json')
        expect(outfile2).toEqual('some==other=file.json')
    })

    it('Test quote in file name', async () => {
        const outfile1 = extractOutfileFromRunArguments('--outfile "some\'file.json"')
        expect(outfile1).toEqual("some'file.json")
    })

    it('Test trailing -o', async () => {
        const outfile1 = extractOutfileFromRunArguments('--normalize-severity -o  ')
        expect(outfile1).toEqual('')
    })

    it('Test trailing --outfile', async () => {
        const outfile1 = extractOutfileFromRunArguments('--normalize-severity --outfile')
        expect(outfile1).toEqual('')
    })
})

describe('Tests for toRelativeFile', () => {
    it('Relative stays relative', () => {
        expect(toRelativeFile('some/file.json')).toEqual('some/file.json')
    })

    it('Absolute converts to relative', () => {
        expect(toRelativeFile(path.resolve('.', 'action.yml'))).toEqual('action.yml')
    })
})
