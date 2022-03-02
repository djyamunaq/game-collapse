const path = require('path')
const { merge } = require('webpack-merge')
const common = require('./webpack.common.js')
module.exports = merge(common, {
  devtool: 'inline-source-map',
  mode: 'none',
  devServer: {

    static: {
        directory: path.join(__dirname, 'src'),
    },
    port: 8080,

    //if host set to 127.0.0.1, you cannot access the server on local network.
    host: '0.0.0.0',
    hot: true
  }
})