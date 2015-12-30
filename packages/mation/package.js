Package.describe({
  name: 'nathanwallis:mation',
  version: '0.0.1',
  summary: 'mation core code',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.2.1');
  api.use('ecmascript');
  api.use('underscore');
  api.use('ejson');
  api.use('mongo', ['client','server']);
  api.export(['MationFile', 'Mation']);
  api.addFiles('mation-file.js');
  api.addFiles('mation-client.js', 'client');
  api.addFiles('mation-server.js', 'server');
  api.addFiles('mation-tokens.js', 'server');
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('nathanwallis:mation');
  api.addFiles('mation-tests.js');
});

Npm.depends({
  "kue":"0.10.4",
  "mkdirp":"0.5.1",
  "googleapis":"2.1.7",
  "aws-sdk":"2.2.23"
});
