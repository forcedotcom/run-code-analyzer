import githubPlugin from 'eslint-plugin-github';
import jestPlugin from 'eslint-plugin-jest';
import eslintJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import { globalIgnores } from "eslint/config";

export default tseslint.config(
    eslintJs.configs.recommended,
    tseslint.configs.recommended,
    githubPlugin.getFlatConfigs().recommended,
    jestPlugin.configs['flat/recommended'],
    globalIgnores([
        "coverage/*",
        "dist/*",
        "lib/*",
        "node_modules/*",
        '*.json',
        'eslint.config.mjs'
    ]),
    {
        files: ['**/*.{js,cjs,mjs,ts,tsx}'],
        languageOptions: {
            ecmaVersion: 2023,
            sourceType: 'module',
            globals: {
                Atomics: 'readonly',
                SharedArrayBuffer: 'readonly',
                ...globals.node,
                ...globals.es2023
            },
            parserOptions: {
                projectService: true,
            }
        },
        rules: {
            camelcase: 'off',
            'eslint-comments/no-use': 'off',
            'eslint-comments/no-unused-disable': 'off',
            'i18n-text/no-en': 'off',
            'import/no-namespace': 'off',
            'no-console': 'off',
            'no-unused-vars': 'off',
            'prettier/prettier': 'error',
            semi: 'off',
            '@typescript-eslint/array-type': 'error',
            '@typescript-eslint/await-thenable': 'error',
            '@typescript-eslint/ban-ts-comment': 'error',
            '@typescript-eslint/consistent-type-assertions': 'error',
            '@typescript-eslint/explicit-member-accessibility': ['error', { accessibility: 'no-public' }],
            '@typescript-eslint/explicit-function-return-type': ['error', { allowExpressions: true }],
            '@typescript-eslint/no-array-constructor': 'error',
            '@typescript-eslint/no-empty-interface': 'error',
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/no-extraneous-class': 'error',
            '@typescript-eslint/no-for-in-array': 'error',
            '@typescript-eslint/no-inferrable-types': 'error',
            '@typescript-eslint/no-misused-new': 'error',
            '@typescript-eslint/no-namespace': 'error',
            '@typescript-eslint/no-non-null-assertion': 'warn',
            '@typescript-eslint/no-require-imports': 'error',
            '@typescript-eslint/no-unnecessary-qualifier': 'error',
            '@typescript-eslint/no-unnecessary-type-assertion': 'error',
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                },
            ],
            '@typescript-eslint/no-useless-constructor': 'error',
            '@typescript-eslint/no-var-requires': 'error',
            '@typescript-eslint/prefer-for-of': 'warn',
            '@typescript-eslint/prefer-function-type': 'warn',
            '@typescript-eslint/prefer-includes': 'error',
            '@typescript-eslint/prefer-string-starts-ends-with': 'error',
            '@typescript-eslint/promise-function-async': 'error',
            '@typescript-eslint/require-array-sort-compare': 'error',
            '@typescript-eslint/restrict-plus-operands': 'error',
            '@typescript-eslint/space-before-function-paren': 'off',
            '@typescript-eslint/unbound-method': 'error',
        },
    }
);