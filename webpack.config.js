const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  mode: isProduction ? 'production' : 'development',
  entry: {
    main: './src/index.js',
    admin: './src/admin/index.js',
    user: './src/user-ui/index.js',
    auth: './src/auth/index.js'
  },
  output: {
    filename: 'js/[name].[contenthash].js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: [
          isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
          'css-loader',
          'postcss-loader'
        ],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'assets/images/[name].[hash][ext][query]'
        }
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'assets/fonts/[name].[hash][ext][query]'
        }
      }
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/auth/login.html',
      filename: 'auth/login.html',
      chunks: ['auth'],
      minify: isProduction ? {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true
      } : false,
    }),
    new HtmlWebpackPlugin({
      template: './src/admin/index.html',
      filename: 'admin/index.html',
      chunks: ['admin'],
      minify: isProduction ? {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true
      } : false,
    }),
    new HtmlWebpackPlugin({
      template: './src/user-ui/index.html',
      filename: 'user/index.html',
      chunks: ['user'],
      minify: isProduction ? {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true
      } : false,
    }),
    new CopyPlugin({
      patterns: [
        { 
          from: 'public', 
          to: 'assets',
          globOptions: {
            ignore: ['**/.DS_Store', '**/Thumbs.db']
          }
        },
      ],
    }),
    new MiniCssExtractPlugin({
      filename: 'css/[name].[contenthash].css',
      chunkFilename: 'css/[id].[contenthash].css',
    }),
  ],
  optimization: {
    moduleIds: 'deterministic',
    runtimeChunk: 'single',
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
    minimize: isProduction,
  },
  devtool: isProduction ? 'source-map' : 'eval-source-map',
  performance: {
    hints: isProduction ? 'warning' : false,
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
  },
  resolve: {
    extensions: ['.js', '.jsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, 'src/'),
    },
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
      publicPath: '/',
    },
    compress: true,
    port: 3000,
    hot: true,
    open: true,
    historyApiFallback: true,
    client: {
      overlay: {
        errors: true,
        warnings: false,
      },
      progress: true,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        secure: false,
        changeOrigin: true,
      },
    },
  },
};
