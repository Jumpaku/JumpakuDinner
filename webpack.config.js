module.exports = {
  /**mode: "production",/*/
  mode: 'development',//*/

  watch: true,

  entry: './src/index.tsx',
  output: {
      path: `${__dirname}/dist`,
      filename: 'bundle.js'
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader'
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]',
              outputPath : 'images/',
              publicPath : (path)=> './images/' + path
            }
          } 
        ],
      },
      {
        test: /\.css/,
        use: ["style-loader", "css-loader"],
      }
    ]
  },
  resolve: {
    extensions: [
      '.ts', '.tsx', '.js', '.json'
    ],
  },

  // When importing a module whose path matches one of the following, just
  // assume a corresponding global variable exists and use that instead.
  // This is important because it allows us to avoid bundling all of our
  // dependencies, which allows browsers to cache those libraries between builds.
  externals: {
      "react": "React",
      "react-dom": "ReactDOM"
  },

  devServer: {
      contentBase: '/workdir',
      compress: true,
      port: 9000,
      host: "0.0.0.0"
  }
};