import typescript from 'rollup-plugin-typescript2';
// import tslint from 'rollup-plugin-tslint';
import { uglify } from 'rollup-plugin-uglify';
import json from '@rollup/plugin-json';
import image from '@rollup/plugin-image';

export default {
  input: 'lib/index.ts',
  output: {
    file: 'dist/index.js',
    format: 'esm',
    sourcemap: true,
    exports: "named",
  },
  name: "@colorverse/client-core",
  plugins: [
    typescript(),
    // tslint(),
    uglify(),
    json(),
    image(),
  ]
}