// 包装脚本：捕获 memfs 错误，防止服务崩溃
const originalEmit = process.emit.bind(process)

process.emit = function (event, ...args) {
  // 捕获 'error' 事件中的 memfs 错误
  if (event === 'error') {
    const error = args[0]
    if (error && error.message && error.message.includes('Cannot set property closed')) {
      // 忽略 memfs 的兼容性错误，这是 Node.js 22 的问题
      console.warn('警告: memfs 兼容性错误已忽略 (Node.js 22 问题)')
      return false // 阻止错误传播
    }
  }
  // 其他事件正常处理
  return originalEmit(event, ...args)
}

process.on('uncaughtException', (error) => {
  if (error.message && error.message.includes('Cannot set property closed')) {
    console.warn('警告: memfs 兼容性错误已忽略 (Node.js 22 问题)')
    return
  }
  throw error
})

// 运行 vue-cli-service
const args = process.argv.slice(2)
process.argv = ['node', '@vue/cli-service/bin/vue-cli-service.js', ...args]
require('@vue/cli-service/bin/vue-cli-service.js')

