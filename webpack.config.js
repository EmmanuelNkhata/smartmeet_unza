const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    main: './src/index.js',
    admin: './src/admin/index.js',
    user: './src/user-ui/index.js',
    auth: './src/auth/index.js'
  },
  output: {
    filename: 'js/[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'images/[hash][ext][query]'
        }
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/auth/login.html',
      filename: 'auth/login.html',
      chunks: ['auth'],
    }),
    new HtmlWebpackPlugin({
      template: './src/admin/index.html',
      filename: 'admin/index.html',
      chunks: ['admin'],
    }),
    new HtmlWebpackPlugin({
      template: './src/user-ui/index.html',
      filename: 'user/index.html',
      chunks: ['user'],
    }),
    new CopyPlugin({
      patterns: [
        { from: 'public', to: '' },
      ],
    }),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    compress: true,
    port: 3000,
    historyApiFallback: true,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
};
