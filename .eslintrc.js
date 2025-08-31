module.exports = {
  // ... sua configuração existente
  overrides: [
    {
      files: ["src/generated/prisma/**/*.js"],
      rules: {
        "@typescript-eslint/no-unused-vars": "off",
        "@typescript-eslint/no-require-imports": "off",
        "@typescript-eslint/no-unused-expressions": "off",
      },
    },
  ],
};
