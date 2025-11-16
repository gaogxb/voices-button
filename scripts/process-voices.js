const fs = require('fs-extra')
const path = require('path')

/**
 * 处理 voices 目录下的 mp3 文件：
 * 1. 如果文件名含有 "no_vocals_split_by_lalalai" 则删除该文件
 * 2. 删除文件的序号前缀（如 "1-"）和 "_vocals_split_by_lalalai" 后缀
 *    例如: "1-牛牛~哞~_vocals_split_by_lalalai.mp3" -> "牛牛~哞~.mp3"
 */

const VOICES_DIR = path.join(__dirname, '../public/voices')

/**
 * 递归遍历目录，处理所有 mp3 文件
 */
function processDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.error(`错误: ${dirPath} 目录不存在`)
    return
  }

  const items = fs.readdirSync(dirPath)
  let deletedCount = 0
  let renamedCount = 0

  for (const item of items) {
    const itemPath = path.join(dirPath, item)
    const stat = fs.statSync(itemPath)

    if (stat.isDirectory()) {
      // 递归处理子目录
      const result = processDirectory(itemPath)
      deletedCount += result.deletedCount
      renamedCount += result.renamedCount
    } else if (stat.isFile() && /\.mp3$/i.test(item)) {
      // 处理 mp3 文件
      const result = processFile(itemPath, item)
      if (result.deleted) {
        deletedCount++
      } else if (result.renamed) {
        renamedCount++
      }
    }
  }

  return { deletedCount, renamedCount }
}

/**
 * 处理单个 mp3 文件
 */
function processFile(filePath, fileName) {
  // 1. 如果文件名含有 "no_vocals_split_by_lalalai"，删除该文件
  if (fileName.includes('no_vocals_split_by_lalalai')) {
    fs.removeSync(filePath)
    console.log(`删除: ${filePath}`)
    return { deleted: true, renamed: false }
  }

  // 2. 删除序号前缀和 "_vocals_split_by_lalalai" 后缀
  let newFileName = fileName

  // 删除序号前缀（格式：数字 + "-"，如 "1-", "123-"）
  newFileName = newFileName.replace(/^\d+-/, '')

  // 删除 "_vocals_split_by_lalalai" 后缀（在扩展名之前）
  newFileName = newFileName.replace(/_vocals_split_by_lalalai(?=\.mp3$)/i, '')

  // 如果文件名有变化，进行重命名
  if (newFileName !== fileName) {
    const newFilePath = path.join(path.dirname(filePath), newFileName)
    
    // 检查新文件名是否已存在
    if (fs.existsSync(newFilePath)) {
      console.log(`警告: 目标文件已存在，跳过重命名: ${filePath} -> ${newFilePath}`)
      return { deleted: false, renamed: false }
    }

    fs.moveSync(filePath, newFilePath)
    console.log(`重命名: ${fileName} -> ${newFileName}`)
    return { deleted: false, renamed: true }
  }

  return { deleted: false, renamed: false }
}

/**
 * 主函数
 */
function main() {
  console.log('开始处理 voices 目录...\n')
  console.log(`目标目录: ${VOICES_DIR}\n`)

  const result = processDirectory(VOICES_DIR)

  console.log(`\n处理完成！`)
  console.log(`删除文件数: ${result.deletedCount}`)
  console.log(`重命名文件数: ${result.renamedCount}`)
}

// 运行脚本
try {
  main()
} catch (error) {
  console.error('发生错误:', error)
  process.exit(1)
}

