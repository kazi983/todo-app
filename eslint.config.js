import jsdoc from 'eslint-plugin-jsdoc';

export default [
  {
    plugins: {
      jsdoc: jsdoc,
    },
    rules: {
      'jsdoc/require-jsdoc': 'error',
      'jsdoc/check-param-names': 'error',
      'jsdoc/require-param-type': 'error',
      'jsdoc/require-returns-type': 'error',
    },
  },
];
