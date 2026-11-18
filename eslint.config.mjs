import salesforceTypescript from 'eslint-config-salesforce-typescript';
import sfPlugin from 'eslint-plugin-sf-plugin';

export default [
  ...salesforceTypescript,
  ...sfPlugin.configs.recommended,
  {
    rules: {
      // This plugin's sources don't carry the Salesforce Apache license header.
      'header/header': 'off',
    },
  },
];
