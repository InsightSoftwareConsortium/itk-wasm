const path = require('path')

const webpack = require('webpack')
const CopyPlugin = require('copy-webpack-plugin')

const entry = path.join(__dirname, 'src', 'index.js')
const outputPath = path.join(__dirname, './dist')

module.exports = {
  node: {
    fs: 'empty'
  },
  entry,
  output: {
    path: outputPath,
    filename: 'index.js'
  },
  module: {
    rules: [
      { test: entry, loader: 'expose-loader?index' },
      { test: /\.js$/, loader: 'babel-loader' }
    ]
  },
  plugins: [
    new CopyPlugin([
      {
        from: path.join(__dirname, 'node_modules', 'itk', 'WebWorkers'),
        to: path.join(__dirname, 'dist', 'itk', 'WebWorkers')
      },
      {
        from: path.join(__dirname, 'node_modules', 'itk', 'ImageIOs'),
        to: path.join(__dirname, 'dist', 'itk', 'ImageIOs')
      }
    ])
  ],
  performance: {
    maxAssetSize: 10000000
  },
  devtool: 'source-map'
}
