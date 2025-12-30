import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default [
  // UMD Bundle
  {
    input: 'src/core/index.ts',
    output: {
      file: 'dist/alphabet.js',
      format: 'umd',
      name: 'Alphabet',
      exports: 'named',
      sourcemap: true
    },
    plugins: [
      nodeResolve(),
      commonjs(),
      typescript({ tsconfig: './tsconfig.json' })
    ]
  },
  // ES Module Bundle
  {
    input: 'src/core/index.ts',
    output: {
      file: 'dist/alphabet.esm.js',
      format: 'es',
      sourcemap: true
    },
    plugins: [
      nodeResolve(),
      commonjs(),
      typescript({ tsconfig: './tsconfig.json' })
    ]
  },
  // Great Framework JS
  {
    input: 'src/great/great-framework.ts',
    output: {
      file: 'dist/great.js',
      format: 'umd',
      name: 'Great',
      exports: 'named'
    },
    plugins: [
      typescript({ tsconfig: './tsconfig.json' })
    ]
  }
];