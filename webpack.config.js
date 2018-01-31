const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

module.exports = env => {
  env = env || {}

  const isProduction = Boolean(env.prod)

  return {
    context: __dirname,
    target: 'web',
    devtool: 'source-map',

    entry: __dirname + '/src/__tests__/index.tsx',

    output: {
      path: path.resolve(__dirname, 'build'),
      filename: isProduction ? '[name].[chunkhash:6].js' : '[name].js',
    },

    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
    },

    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: [
            {
              loader: 'awesome-typescript-loader',
              options: {
                transpileOnly: true,
              },
            },
          ],
          exclude: /node_modules/,
        },
      ],
    },

    plugins: [
      new webpack.DefinePlugin({
        'node.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
      }),
      new HtmlWebpackPlugin({
        filename: 'index.html',
        template: path.resolve(__dirname, 'src/__tests__/index.html'),
      }),
    ].concat(isProduction ? [new UglifyJsPlugin()] : [new webpack.HotModuleReplacementPlugin()]),

    devServer: {
      contentBase: __dirname,
      host: '0.0.0.0',
      hot: true,
    },
  }
}
