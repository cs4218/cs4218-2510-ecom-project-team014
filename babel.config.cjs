module.exports = {
  presets: [
    ['@babel/preset-env', {
      targets: { node: 'current' },
      modules: false // Keep ES modules syntax
    }],
    '@babel/preset-react'
  ],
  plugins: [
    '@babel/plugin-syntax-import-meta'
  ],
  env: {
    test: {
      presets: [
        ['@babel/preset-env', {
          targets: { node: 'current' },
          modules: 'commonjs' // Use CommonJS for tests
        }]
      ],
      plugins: [
        'babel-plugin-transform-import-meta'
      ]
    }
  }
};
