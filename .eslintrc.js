module.exports = {
    "env": {
        "es6": true
    },
    "extends": [
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
        "prettier/@typescript-eslint", // Uses eslint-config-prettier to disable ESLint rules from @typescript-eslint/eslint-plugin that would conflict with prettier
        // "plugin:prettier/recommended" // Enables eslint-plugin-prettier and eslint-config-prettier. This will display prettier errors as ESLint errors. Make sure this is always the last configuration in the extends array.
    ],
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "project": ["tsconfig.json", "test/tsconfig.json"],
        "sourceType": "module"
    },
    "plugins": [
        "@typescript-eslint",
        "jsdoc",
        "prefer-arrow"
    ],
    "rules": {
        "@typescript-eslint/array-type": [
            "error",
            {
                "default": "generic"
            }
        ],
        "@typescript-eslint/ban-types": [
            "error",
            {
                "types": {
                    "Object": {
                        "message": "Avoid using the `Object` type. Did you mean `object`?"
                    },
                    "Function": {
                        "message": "Avoid using the `Function` type. Prefer a specific function type, like `() => void`."
                    },
                    "Boolean": {
                        "message": "Avoid using the `Boolean` type. Did you mean `boolean`?"
                    },
                    "Number": {
                        "message": "Avoid using the `Number` type. Did you mean `number`?"
                    },
                    "String": {
                        "message": "Avoid using the `String` type. Did you mean `string`?"
                    },
                    "Symbol": {
                        "message": "Avoid using the `Symbol` type. Did you mean `symbol`?"
                    }
                }
            }
        ],
        "@typescript-eslint/unbound-method": "off",
        //     "@typescript-eslint/indent": "off",
        //     "@typescript-eslint/interface-name-prefix": "off",
        //     "@typescript-eslint/member-delimiter-style": [
        //         "error",
        //         {
        //             "multiline": {
        //                 "delimiter": "semi",
        //                 "requireLast": true
        //             },
        //             "singleline": {
        //                 "delimiter": "semi",
        //                 "requireLast": false
        //             }
        //         }
        //     ],
        //     "@typescript-eslint/no-explicit-any": "off",
        //     "@typescript-eslint/no-parameter-properties": "off",
        //     "@typescript-eslint/no-use-before-define": "off",
        //     "@typescript-eslint/no-var-requires": "off",
        //     "@typescript-eslint/prefer-for-of": "error",
        //     "@typescript-eslint/prefer-function-type": "error",
        "@typescript-eslint/quotes": [
            "error",
            "single"
        ],
        "@typescript-eslint/semi": [
            "error",
            "always"
        ],
        "@typescript-eslint/no-explicit-any": "off",
        "require-await": "off",
        "@typescript-eslint/require-await": "off",
        "@typescript-eslint/await-thenable": "off",
        "@typescript-eslint/triple-slash-reference": [
            "error",
            {
                "path": "always",
                "types": "prefer-import",
                "lib": "always"
            }
        ],
        //     "@typescript-eslint/type-annotation-spacing": "off",
        //     "@typescript-eslint/unified-signatures": "error",
        //     "arrow-parens": [
        //         "off",
        //         "always"
        //     ],
        //     "brace-style": [
        //         "off",
        //         "off"
        //     ],
        //     "camelcase": "error",
        //     "comma-dangle": "off",
        //     "complexity": "off",
        //     "constructor-super": "error",
        //     "dot-notation": "off",
        //     "eol-last": "off",
        //     "eqeqeq": [
        //         "error",
        //         "smart"
        //     ],
        //     "guard-for-in": "error",
        //     "id-blacklist": [
        //         "error",
        //         "any",
        //         "Number",
        //         "number",
        //         "String",
        //         "string",
        //         "Boolean",
        //         "boolean",
        //         "Undefined",
        //         "undefined"
        //     ],
        //     "id-match": "error",
        "jsdoc/check-alignment": "error",
        "jsdoc/check-indentation": "error",
        "jsdoc/newline-after-description": "off",
        "@typescript-eslint/explicit-function-return-type": "off",
        //     "linebreak-style": "off",
        //     "max-classes-per-file": "off",
        //     "max-len": "off",
        //     "new-parens": "off",
        //     "newline-per-chained-call": "off",
        //     "no-bitwise": "error",
        //     "no-caller": "error",
        //     "no-cond-assign": "error",
        "no-console": [
            "error",
            {
                "allow": [
                    "warn",
                    "dir",
                    "time",
                    "timeEnd",
                    "timeLog",
                    "trace",
                    "assert",
                    "clear",
                    "count",
                    "countReset",
                    "group",
                    "groupEnd",
                    "table",
                    "debug",
                    "info",
                    "dirxml",
                    "groupCollapsed",
                    "Console",
                    "profile",
                    "profileEnd",
                    "timeStamp",
                    "context"
                ]
            }
        ],
        //     "no-debugger": "error",
        "no-empty": "error",
        "no-eval": "error",
        //     "no-extra-semi": "off",
        //     "no-fallthrough": "off",
        //     "no-invalid-this": "off",
        //     "no-irregular-whitespace": "off",
        //     "no-multiple-empty-lines": "off",
        //     "no-new-wrappers": "error",
        //     "no-shadow": [
        //         "error",
        //         {
        //             "hoist": "all"
        //         }
        //     ],
        //     "no-throw-literal": "error",
        //     "no-trailing-spaces": "off",
        //     "no-undef-init": "error",
        //     "no-underscore-dangle": "error",
        //     "no-unsafe-finally": "error",
        //     "no-unused-expressions": "error",
        //     "no-unused-labels": "error",
        //     "object-shorthand": [
        //         "error",
        //         "never"
        //     ],
        //     "one-var": [
        //         "error",
        //         "never"
        //     ],
        "prefer-arrow/prefer-arrow-functions": "error",
        //     "quote-props": "off",
        //     "radix": "error",
        //     "space-before-function-paren": "off",
        //     "space-in-parens": [
        //         "off",
        //         "never"
        //     ],
        //     "spaced-comment": [
        //         "error",
        //         "always",
        //         {
        //             "markers": [
        //                 "/"
        //             ]
        //         }
        //     ],
        //     "use-isnan": "error",
        //     "valid-typeof": "off"
    }
};
