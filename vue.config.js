const path = require('path')
const Check = require('./plugins/check')
const Voives = require('./plugins/voices')

process.env.VUE_APP_LAST_UPDATE = Date.now()

/**
 *  @typedef { import("@vue/cli-service").ProjectOptions } Options
 *  @type { Options }
 */
module.exports = {
  publicPath: process.env.NODE_ENV === 'production'
    ? './'
    : '/',
  productionSourceMap: false,
  // 在开发模式下忽略 setting/translate 目录的变化，避免触发 memfs 错误
  devServer: process.env.NODE_ENV === 'development' ? {
    watchFiles: {
      options: {
        ignored: ['**/setting/translate/**', '**/node_modules/**']
      }
    }
  } : {},
  css: {
    loaderOptions: {
      stylus: {
        stylusOptions: {
          import: [path.join(__dirname, './setting/color.styl')]
        }
      }
    }
  },
  configureWebpack: (config) => {
    // 禁用缓存以确保 setting.json 的更改能够被检测到
    if (process.env.NODE_ENV === 'development') {
      config.cache = false
      // 忽略 memfs 相关的错误，这是 Node.js 22 的兼容性问题
      config.ignoreWarnings = [
        { module: /node_modules\/memfs/ }
      ]
      // 配置文件监听，忽略 setting/translate 目录的变化
      config.watchOptions = {
        ignored: ['**/setting/translate/**', '**/node_modules/**']
      }
    }
    const plugins = [new Voives()]
    // 在开发模式下禁用 Check 插件，避免文件系统冲突
    if (process.env.NODE_ENV === 'production') {
      plugins.push(new Check())
    }
    return {
      plugins,
      performance: {
        hints: false
      },
      optimization: {
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            libs: {
              name: 'chunk-libs',
              test: /[\\/]node_modules[\\/]/,
              priority: 10,
              chunks: 'initial' // 只打包初始时依赖的第三方
            },
            corejs: {
              name: 'chunk-corejs', // 单独将 core-js 拆包
              priority: 15,
              test: /[\\/]node_modules[\\/]core-js[\\/]/
            }
          }
        }
      }
    }
  }
}
