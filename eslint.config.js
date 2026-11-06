import tseslint from 'typescript-eslint';
export default tseslint.config({ignores:['dist/**','node_modules/**','test-results/**']},...tseslint.configs.recommended,{files:['**/*.mjs','demo/**/*.js'],rules:{'@typescript-eslint/no-require-imports':'off'}});
