import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

/**
 * Custom ESLint plugin to prevent hardcoded hex color values in UI component
 * and page files. All colors must use CSS custom properties (var(--color-*))
 * or Tailwind causa-* utilities.
 */
const noHardcodedHexPlugin = {
  meta: { name: 'causa-custom-rules' },
  rules: {
    'no-hardcoded-hex': {
      meta: {
        type: 'suggestion',
        docs: { description: 'Disallow hardcoded hex colors in UI components — use CSS custom properties instead' },
        schema: [],
      },
      create(context) {
        return {
          Literal(node) {
            if (typeof node.value !== 'string') return;
            if (!/#[0-9a-fA-F]{3,8}\b/.test(node.value)) return;
            const filename = context.filename || context.getFilename();
            if (filename.includes('components/ui/') || filename.includes('pages/')) {
              context.report({
                node,
                message: 'Hardcoded hex color "{{value}}" found. Use CSS custom properties (var(--color-*)) or Tailwind causa-* utilities instead.',
                data: { value: node.value },
              });
            }
          },
        };
      },
    },
  },
};

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strict,
  prettier,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-non-null-assertion": "error",
    },
  },
  {
    plugins: { 'causa': noHardcodedHexPlugin },
    rules: { 'causa/no-hardcoded-hex': 'error' },
  },
  {
    ignores: ["**/dist/**", "**/node_modules/**", "**/*.js", "!eslint.config.js"],
  }
);
