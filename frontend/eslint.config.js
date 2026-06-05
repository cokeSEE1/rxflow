import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import tseslint from 'typescript-eslint'
import stylistic from '@stylistic/eslint-plugin'
import vueParser from 'vue-eslint-parser'

export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'public/**'],
  },

  {
    languageOptions: {
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        FileReader: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        localStorage: 'readonly',
        navigator: 'readonly',
        fetch: 'readonly',
        HTMLElement: 'readonly',
        HTMLDivElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLTextAreaElement: 'readonly',
        HTMLSelectElement: 'readonly',
        HTMLFormElement: 'readonly',
        Blob: 'readonly',
        File: 'readonly',
        FormData: 'readonly',
        URLSearchParams: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        addEventListener: 'readonly',
        removeEventListener: 'readonly',
        IntersectionObserver: 'readonly',
        MutationObserver: 'readonly',
        ResizeObserver: 'readonly',
      },
    },
  },

  js.configs.recommended,

  ...tseslint.configs.recommended,

  ...pluginVue.configs['flat/recommended'],

  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
  },

  {
    plugins: {
      '@stylistic': stylistic,
    },
    rules: {
      '@stylistic/semi': ['error', 'never'],
      '@stylistic/quotes': ['error', 'single'],
      '@stylistic/comma-dangle': ['error', 'always-multiline'],
      '@stylistic/no-multiple-empty-lines': ['error', { max: 1 }],
      '@stylistic/eol-last': ['error', 'always'],
      '@stylistic/no-trailing-spaces': 'error',
      '@stylistic/indent': ['error', 2],
      '@stylistic/arrow-parens': ['error', 'always'],
      '@stylistic/block-spacing': ['error', 'always'],

      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',

      'vue/multi-word-component-names': 'off',
    },
  },
]
