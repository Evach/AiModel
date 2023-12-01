// 需要安装依赖:  npm i eslint-define-config
const {defineConfig} = require('eslint-define-config')

module.exports = defineConfig({
    root: true,
    /* 指定如何解析语法。*/
    parser: 'vue-eslint-parser',
    /* 优先级低于parse的语法解析配置 */
    parserOptions: {
        parser: '@typescript-eslint/parser',
        //模块化方案
        sourceType: 'module',
    },
    env: {
        browser: true,
        es2021: true,
        node: true,
        // 解决 defineProps and defineEmits generate no-undef warnings
        'vue/setup-compiler-macros': true,
    },
    // https://eslint.bootcss.com/docs/user-guide/configuring#specifying-globals
    globals: {},
    extends: [
        'plugin:vue/vue3-recommended',
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended', // typescript-eslint推荐规则,
        'prettier',
        'plugin:prettier/recommended',
        './.eslintrc-auto-import.json',
    ],
    // https://cn.eslint.org/docs/rules/
    rules: {
        'no-undef': 'off',
        'no-console': 'off',
        'no-debugger': 'off',
        'no-case-declarations': 'off',
        'no-empty': 'off',
        'prettier/prettier': 'off',
        'prefer-template': 'off',
        'vue/no-reserved-component-names': 'off',
        '@typescript-eslint/no-this-alias': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-empty-function': 'off',
        '@typescript-eslint/ban-ts-comment': 'off',
        'vue/no-v-html': 'off',
        'vue/v-on-event-hyphenation': 'off',
        'vue/html-self-closing': [
            'error',
            {
                html: {
                    void: 'any',
                    normal: 'any',
                    component: 'always',
                },
                svg: 'always',
                math: 'always',
            },
        ],
        // 多字组件名称
        'vue/multi-word-component-names': 'off',
        // Vue.js风格指南(https://cn.vuejs.org/v2/style-guide/)
        // Vue组件排序
        'vue/order-in-components': [
            'warn',
            {
                order: [
                    'el',
                    'name',
                    'key',
                    'parent',
                    'functional',
                    ['delimiters', 'comments'],
                    ['components', 'directives', 'filters'],
                    'extends',
                    'mixins',
                    ['provide', 'inject'],
                    'ROUTER_GUARDS',
                    'layout',
                    'middleware',
                    'validate',
                    'scrollToTop',
                    'transition',
                    'loading',
                    'inheritAttrs',
                    'model',
                    ['props', 'propsData'],
                    'emits',
                    'setup',
                    'fetch',
                    'asyncData',
                    'data',
                    'head',
                    'computed',
                    'watch',
                    'watchQuery',
                    'LIFECYCLE_HOOKS',
                    'methods',
                    ['template', 'render'],
                    'renderError',
                ],
            },
        ],
        // Vue属性排序
        'vue/attributes-order': [
            'warn',
            {
                order: [
                    'DEFINITION',
                    'LIST_RENDERING',
                    'CONDITIONALS',
                    'RENDER_MODIFIERS',
                    'GLOBAL',
                    'UNIQUE',
                    'TWO_WAY_BINDING',
                    'OTHER_DIRECTIVES',
                    'OTHER_ATTR',
                    'EVENTS',
                    'CONTENT',
                ],
                alphabetical: false, //字母顺序
            },
        ],
    },
})
