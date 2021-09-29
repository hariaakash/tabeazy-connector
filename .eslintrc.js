module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: [
    'plugin:vue/vue3-essential',
    '@vue/airbnb',
  ],
  parserOptions: {
    parser: 'babel-eslint',
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'max-len': 0,
    'no-return-assign': 0,
    'import/no-extraneous-dependencies': 0,
    "linebreak-style": 0,
    "no-underscore-dangle": 0,
  },
  globals: {
    __resPath: true,
    __staticPath: true,
  }
};
