import path from 'path';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

const production = !process.env.ROLLUP_WATCH;

const inputs = {
  background: 'src/background/index.js',
  defaultPopup: 'src/default-popup/index.js',
  options: 'src/options/index.js',
};

const outputDir = path.resolve(__dirname, 'dist');

export default Object.keys(inputs).map(name => ({
  name,
  input: inputs[name],
  output: {
    file: path.resolve(outputDir, inputs[name]),
    format: 'iife',
  },
  plugins: [
    resolve(),
    commonjs(),
  ],
}));
