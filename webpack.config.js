const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  
  entry: {
    main: './static/main/src/index.tsx',
    dashboard: './static/dashboard/src/index.tsx'
  },
  
  output: {
    path: path.resolve(__dirname, 'static'),
    filename: '[name]/[name].[contenthash].js',
    clean: true,
  },
  
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@/types': path.resolve(__dirname, 'src/types'),
      '@/utils': path.resolve(__dirname, 'src/utils'),
      '@/components': path.resolve(__dirname, 'src/ui/components'),
      '@/hooks': path.resolve(__dirname, 'src/ui/hooks'),
      '@/config': path.resolve(__dirname, 'src/config'),
      '@/notification-engine': path.resolve(__dirname, 'src/notification-engine'),
      '@/analytics': path.resolve(__dirname, 'src/analytics')
    }
  },
  
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-react']
          }
        }
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  
  plugins: [
    new HtmlWebpackPlugin({
      template: './static/main/index.html',
      filename: 'main/index.html',
      chunks: ['main'],
    }),
    new HtmlWebpackPlugin({
      template: './static/dashboard/index.html', 
      filename: 'dashboard/index.html',
      chunks: ['dashboard'],
    }),
  ],
  
  devtool: process.env.NODE_ENV === 'production' ? 'source-map' : 'eval-source-map',
  
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
  },
};