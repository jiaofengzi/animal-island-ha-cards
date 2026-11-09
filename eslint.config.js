import tseslint from 'typescript-eslint';
export default tseslint.config(
  {ignores:['dist/**','node_modules/**','test-results/**']},
  ...tseslint.configs.recommended,
  {files:['**/*.mjs','demo/**/*.js'],rules:{'@typescript-eslint/no-require-imports':'off'}},
  // src/mushroom 派生自 Mushroom 5.2.3，沿用上游代码风格；只放宽上游本来就不遵守的几条风格规则。
  {files:['src/mushroom/**/*.ts'],linterOptions:{reportUnusedDisableDirectives:'off'},rules:{
    '@typescript-eslint/no-explicit-any':'off',
    '@typescript-eslint/no-unused-vars':'off',
    '@typescript-eslint/ban-ts-comment':'off',
    '@typescript-eslint/no-empty-object-type':'off',
    'prefer-const':'off',
    'no-var':'off',
  }},
);
