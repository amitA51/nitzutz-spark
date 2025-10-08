import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Disallow raw dangerouslySetInnerHTML usage anywhere.
      // Use SafeHTML component instead.
      'no-restricted-syntax': [
        'error',
        {
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message:
            'Do not use dangerouslySetInnerHTML. Use SafeHTML component instead.',
        },
      ],
    },
  },
  // Allow the SafeHTML component to use dangerouslySetInnerHTML internally.
  {
    files: ['src/components/SafeHTML.tsx'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
])
