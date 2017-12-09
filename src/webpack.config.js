'use strict';

const path = require('path');
const webpack = require('webpack');
const HTMLWebpackPlugin = require('html-webpack-plugin');
const UglifyJSWebpackPlugin = require('uglifyjs-webpack-plugin');
const {optionsUITemplatePath} = require('extension-kitchen-sink/import-export-storage');
require('dotenv').config();

const config = {
  entry: {
    content_scripts: [
      "babel-polyfill",
      path.join(__dirname, 'content_scripts'),
    ],
    background_scripts: [
      "babel-polyfill",
      path.join(__dirname, 'background_scripts'),
    ],
    options: [
      "babel-polyfill",
      path.join(__dirname, 'options.js'),
    ],
  },
  devtool: 'source-map',
  output: {
    path: path.join(__dirname, "../dist"),
    filename: '[name].js',
    publicPath: '/'
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        loaders: ['style-loader', 'css-loader']
      },
      {
        test: /\.js$/,
        exclude: /node_modules\/(?!extension-kitchen-sink)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [["env", {
              targets: {
                browsers: ['last 2 Chrome versions']
              }
            }]],
            plugins: [
              "transform-object-rest-spread",
              // "transform-async-to-generator"
            ]
          }
        }
      }
    ]
  },
  plugins: [
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
    }),
    new HTMLWebpackPlugin({
      template: optionsUITemplatePath,
      filename: 'options.html',
      chunks: ['options']
    }),
    new UglifyJSWebpackPlugin({
      sourceMap: true,
      uglifyOptions: { ecma: 8 },
    })
  ]
};


module.exports = config;