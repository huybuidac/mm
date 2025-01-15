const path = require('path')
const CopyWebpackPlugin = require('copy-webpack-plugin')

// Function to get the path of an npm package
// function getPackagePath(packageName) {
//   try {
//     // Resolve the package path
//     const packagePath = require.resolve(packageName)
//     console.log(`Package path for ${packageName}: ${packagePath}`)
//   } catch (error) {
//     console.error(`Could not find package: ${packageName}`)
//   }
// }

// Example usage
getPackagePath('@prisma/client')

const isLocal = process.env.LOCAL_DEV
const distPath = 'layer/nodejs/node_modules'

module.exports = {
  name: 'layer',
  mode: 'development',
  stats: 'minimal',
  target: 'node',
  watch: false,
  entry: {
    [`${distPath}/.prisma/client/index`]: './node_modules/.prisma/client/index',
    [`${distPath}/@prisma/client/index`]: './node_modules/@prisma/client/index',
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: './prisma/schema.prisma',
          to: `./${distPath}/.prisma/client/schema.prisma`,
        },
        {
          from: './prisma/schema.prisma',
          to: `./${distPath}/@prisma/client/schema.prisma`,
        },
        {
          from: `./node_modules/.prisma/client/libquery_engine${isLocal ? '' : '-rhel-openssl-'}*`,
          to({ context, absoluteFilename }) {
            return Promise.resolve(`${distPath}/.prisma/client/[name][ext]`)
          },
        },
        {
          from: `./node_modules/.prisma/client/libquery_engine${isLocal ? '' : '-rhel-openssl-'}*`,
          to({ context, absoluteFilename }) {
            return Promise.resolve(`${distPath}/@prisma/client/[name][ext]`)
          },
        },
      ],
    }),
  ],
  module: {},
  optimization: {
    // minimize: true,
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'commonjs2',
  },
}
