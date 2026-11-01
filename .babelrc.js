module.exports = (api) => ({
  presets: [
    [
      'babel-preset-env-modules',
      api.env() !== 'test'
        ? {
            ignoreBrowserslistConfig: true,
            modules: api.env() === 'esm' ? false : 'commonjs',
            exclude: ['proposal-object-rest-spread'],
          }
        : {
            target: 'node',
            targets: { node: 'current' },
          },
    ],
    ['@babel/preset-typescript', { allowDeclareFields: true }],
  ],
});
