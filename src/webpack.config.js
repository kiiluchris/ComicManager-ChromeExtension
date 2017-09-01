'use strict';

const path = require('path');
const webpack = require('webpack');

module.exports = {
    entry: {
        content_scripts: [
          "babel-polyfill",
          path.join(__dirname, 'content_scripts'),
        ],
        background_scripts: [
          "babel-polyfill",
          path.join(__dirname, 'background_scripts'),
        ],
    },
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
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['env'],
                        plugins: [
                          "transform-object-rest-spread",
                          "transform-async-to-generator"
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
      })
    ]
}