const path = require('path')
const HtmlPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const ImageminPlugin = require('imagemin-webpack-plugin').default

module.exports = {
  performance: {
    hints: false,
    maxEntrypointSize: 512000,
    maxAssetSize: 512000
  },

  //context directory is src
  context: path.join(__dirname, 'src'),
  
  //entry file of the project,(relative to context)
  entry: ['./main.js'],
  output: {

    //distribution directory
    path: path.resolve(__dirname, 'dist'),

    /**
     * webpack will import the file for the index.html automatically,though the js file does not exist on disk.
     * the js file will generated after webpack build the project, and the js will inserted at index.html automatically.
     * [hash:8] means unique 8 digit hash generated everytime.
     **/
    filename: 'game.min.[hash:8].js',
  },
  target: 'web',

plugins: [
  new CopyWebpackPlugin(
    { 
      patterns: [
        { from: path.resolve('./src/assets/'), to: './assets/' },
        { from: path.resolve('./src/style/'), to: './style/' },
      ]
    }),
  //copy html to dist and insert the js reference.
  new HtmlPlugin({
    file:path.join(__dirname,'dist','index.html'),
    template:'./index.html'
  })
]
}