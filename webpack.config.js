// Not using cozy-konnector-build/webpack.config because of the dual entry point on L39
const fs = require('fs')
var path = require('path')

const CopyPlugin = require('copy-webpack-plugin')
const SvgoInstance = require('svgo')
const webpack = require('webpack')

const currentDirectory = process.cwd()

const readManifest = () =>
  JSON.parse(
    fs.readFileSync(path.join(currentDirectory, './manifest.konnector'))
  )

const manifest = readManifest()

const svgo = new SvgoInstance({
  plugins: [
    {
      inlineStyles: { onlyMatchedOnce: false }
    }
  ]
})

let iconName
try {
  iconName = manifest.icon
  // we run optimize only on SVG
  if (!iconName.match(/\.svg$/)) iconName = null
} catch (e) {
  // console.error(`Unable to read the icon path from manifest: ${e}`)
}
const appIconRX = iconName && new RegExp(`[^/]*/${iconName}`)

module.exports = {
  entry: {
    index: './src/index.js',
    onDeleteAccount: './src/onDeleteAccount.js'
  },
  target: 'node',
  mode: 'none',
  node: {
    // to avoid __dirname to be defaulted to "/" and allow cozy-konnector-libs to read a JSON payload next to the current file. https://codeburst.io/use-webpack-with-dirname-correctly-4cad3b265a92
    __dirname: false,
    __filename: false
  },
  output: {
    path: path.join(currentDirectory, 'build'),
    filename: '[name].js',
    clean: true
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'manifest.konnector' },
        { from: 'assets', transform: optimizeSVGIcon, noErrorOnMissing: true }
      ]
    }),
    new webpack.DefinePlugin({
      __WEBPACK_PROVIDED_MANIFEST__: JSON.stringify(manifest)
    })
  ],
  module: {
    // to ignore the warnings like :
    // WARNING in ../libs/node_modules/bindings/bindings.js 76:22-40
    // Critical dependency: the request of a dependency is an expression
    // Since we cannot change this dependency. I think it won't hide more important messages
    exprContextCritical: false
  },
  externals: {
    canvas: 'commonjs canvas'
  }
}

function optimizeSVGIcon(buffer, path) {
  if (appIconRX && path.match(appIconRX)) {
    return svgo.optimize(buffer).then(resp => resp.data)
  } else {
    return buffer
  }
}
