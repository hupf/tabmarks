const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    background: './src/background/index.js',
    'default-popup': './src/default-popup/index.js',
    options: './src/options/index.js',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'src/[name]/index.js',
  },
  plugins: [
    new CopyWebpackPlugin([
      { from: '*.md', to: '.' },
      { from: 'manifest.json', to: '.' },
      { from: 'assets/**/*', to: '.' },
      { from: 'src/**/*.html', to: '.' },
      { from: 'src/**/*.css', to: '.' },
    ]),
  ],
};
