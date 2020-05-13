'use strict';

const path = require('path');
const webpack = require('webpack');
const HTMLWebpackPlugin = require('html-webpack-plugin');
const UglifyJSWebpackPlugin = require('uglifyjs-webpack-plugin');
const {
  optionsUITemplatePath
} = require('extension-kitchen-sink/import-export-storage');
const {
  CheckerPlugin
} = require('awesome-typescript-loader')
require('dotenv').config();

const config = {
  mode: 'development',
  // mode: 'production',
  entry: {
    content_scripts: [
      "babel-polyfill",
      path.join(__dirname, 'src', 'content_scripts'),
    ],
    background_scripts: [
      "babel-polyfill",
      path.join(__dirname, 'src', 'background_scripts'),
    ],
    options: [
      "babel-polyfill",
      path.join(__dirname, 'src', 'options'),
    ],
  },
  devtool: 'inline-source-map',
  output: {
    path: path.join(__dirname, "extension"),
    filename: '[name].js',
    publicPath: '/'
  },
  module: {
    rules: [{
        test: /\.css$/,
        loaders: ['style-loader', 'css-loader']
      },
      {
        test: /\.tsx?$/,
        use: 'awesome-typescript-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  plugins: [
    // new (require('./chrome-reloader'))({
    //   bgScript: 'background_scripts.js',
    // }),
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
    }),
    new HTMLWebpackPlugin({
      template: optionsUITemplatePath,
      filename: 'options.html',
      chunks: ['options']
    }),
    new CheckerPlugin()
    // new UglifyJSWebpackPlugin({
    //   sourceMap: true,
    //   uglifyOptions: { ecma: 8 },
    // }),
  ]
};


module.exports = config;