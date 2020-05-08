module.exports = function (config) {
  config.set({
    mutator: 'typescript',
    packageManager: 'npm',
    reporters: ['html', 'clear-text', 'progress'],
    testRunner: 'jest',
    jest: {
      projectType: 'custom',
      config: require('./jest.config-unit.js'),
      enableFindRelatedTests: true,
    },
    transpilers: [],
    coverageAnalysis: 'off',
    tsconfigFile: 'tsconfig.json',
    mutate: ['src/**/*.ts'],
    thresholds: { break: 99 }
  });
};  