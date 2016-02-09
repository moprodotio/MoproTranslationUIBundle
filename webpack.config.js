var path = require('path');
var webpack = require('webpack');
 
module.exports = {
  entry: './Resources/js/main.js',
  output: { path: './Resources/public', filename: 'mopro_translation_ui.js' },
  module: {
    loaders: [
      {
        test: /.jsx?$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        query: {
          presets: ['es2015', 'react']
        }
      }
    ]
  },
  plugins: [
    new webpack.ProvidePlugin({
        'fetch': 'imports?this=>global!exports?global.fetch!whatwg-fetch'
    })
  ]
};
