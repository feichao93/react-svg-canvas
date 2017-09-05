const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  context: __dirname,
  target: 'web',
  devtool: 'source-map',

  entry: __dirname + '/src/test.tsx',

  output: {
    path: path.resolve(__dirname, 'build'),
    filename: '[name].js',
  },

  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [{
          loader: 'awesome-typescript-loader',
          options: {
            transpileOnly: true,
          },
        }],
        exclude: /node_modules/,
      },
    ],
  },

  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    // new webpack.EnvironmentPlugin({ NODE_ENV: 'production' }),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: path.resolve(__dirname, 'src/index.html'),
    }),
  ],

  devServer: {
    contentBase: __dirname,
    host: '0.0.0.0',
    hot: true,
  }
}
