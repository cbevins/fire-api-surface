// import { terser } from 'rollup-plugin-terser'

export default [
  // {
  //   input: 'index.js',
  //   plugins: [terser()],
  //   output: {
  //     file: 'umd/fancy-case.js',
  //     format: 'umd',
  //     name: 'fancyCase',
  //     esModule: false
  //   }
  // },
  {
    input: {
      index: 'index.js',
      astro: 'Astro/index.js',
      calendar: 'Calendar/index.js',
      fireforecast: 'FireForecast/index.js',
      globe: 'Globe/index.js',
      simple: 'SimpleSurfaceFire/index.js'
    },
    output: [
      {
        dir: 'dist/esm',
        format: 'esm'
      },
      {
        dir: 'dist/cjs',
        format: 'cjs'
      }
    ]
  }
]
