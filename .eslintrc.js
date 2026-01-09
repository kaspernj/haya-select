module.exports = {
  root: true,
  extends: ["universe/native", "universe/web"],
  ignorePatterns: ["build"],
  rules: {
    "prettier/prettier": [
      "warn",
      {
        bracketSpacing: false,
        printWidth: 2000,
        semi: false,
        trailingComma: "none"
      }
    ]
  },
  overrides: [
    {
      files: ["src/config.js", "src/select/**/*.jsx"],
      rules: {
        "prettier/prettier": "off",
        "import/order": "off",
        "react-hooks/rules-of-hooks": "off",
        eqeqeq: "off",
        "no-return-assign": "off",
        "import/no-duplicates": "off",
        "no-unused-vars": "off"
      }
    },
    {
      files: ["src/config/configuration.node.js"],
      rules: {
        "prettier/prettier": [
          "warn",
          {
            bracketSpacing: false,
            printWidth: 2000,
            semi: true,
            trailingComma: "none"
          }
        ],
        "import/order": "off"
      }
    }
  ]
}
