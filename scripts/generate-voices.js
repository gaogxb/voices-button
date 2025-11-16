const fs = require('fs-extra')
const path = require('path')

/**
 * 从 public/voices 目录自动生成对应的 JSON 配置文件
 * 
 * 文件夹结构：
 * public/voices/
 *   ├── 1_猫猫名言/
 *   │   └── 好耶.mp3
 *   └── 2_其他分类/
 *       └── 语音1.mp3
 * 
 * 生成的文件：
 * - setting/translate/category.json (分类列表)
 * - setting/translate/XX_voices.json (每个分类的语音列表)
 */

const VOICES_DIR = path.join(__dirname, '../public/voices')
const TRANSLATE_DIR = path.join(__dirname, '../setting/translate')

/**
 * 从文件夹名提取分类名（去掉序号前缀）
 * 例如: "1_猫猫名言" -> "猫猫名言"
 */
function extractCategoryName(folderName) {
  const match = folderName.match(/^\d+_(.+)$/)
  if (match) {
    return match[1]
  }
  return folderName
}

/**
 * 从文件夹名提取序号
 * 例如: "1_猫猫名言" -> "1"
 */
function extractCategoryIndex(folderName) {
  const match = folderName.match(/^(\d+)_/)
  if (match) {
    return match[1]
  }
  return null
}

/**
 * 从文件名提取语音名（去掉扩展名）
 * 例如: "好耶.mp3" -> "好耶"
 */
function extractVoiceName(fileName) {
  return fileName.replace(/\.(mp3|wav)$/i, '')
}

/**
 * 获取当前日期 (YYYY-MM-DD)
 */
function getCurrentDate() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 扫描 voices 目录，生成配置
 */
function generateConfig() {
  console.log('开始扫描 voices 目录...\n')
  
  if (!fs.existsSync(VOICES_DIR)) {
    console.error(`错误: ${VOICES_DIR} 目录不存在`)
    process.exit(1)
  }

  // 读取所有分类文件夹
  const folders = fs.readdirSync(VOICES_DIR)
    .filter(name => {
      const fullPath = path.join(VOICES_DIR, name)
      return fs.statSync(fullPath).isDirectory()
    })
    .sort() // 按名称排序

  if (folders.length === 0) {
    console.log('未找到任何分类文件夹')
    return
  }

  const categories = []
  const categoryMap = new Map() // 分类名 -> 文件夹名
  const processedFolders = new Set() // 记录已处理的文件夹索引

  // 处理每个分类文件夹
  for (const folderName of folders) {
    const folderPath = path.join(VOICES_DIR, folderName)
    const categoryIndex = extractCategoryIndex(folderName) || '00'
    processedFolders.add(categoryIndex) // 记录已处理的文件夹
    
    // 优先使用从文件夹名提取的分类名（完全根据文件夹内容更新）
    let categoryName = extractCategoryName(folderName)
    
    console.log(`处理分类: ${folderName} -> ${categoryName}`)
    
    // 读取该分类下的所有 mp3/wav 文件
    const audioFiles = fs.readdirSync(folderPath)
      .filter(name => /\.(mp3|wav)$/i.test(name))
      .sort()

    if (audioFiles.length === 0) {
      console.log(`  警告: ${folderName} 目录下没有音频文件\n`)
      continue
    }

    // 检查分类是否已存在
    const existingCategory = categories.find(cat => cat.name === categoryName)
    if (!existingCategory) {
      categories.push({
        name: categoryName,
        translate: {
          'zh-CN': categoryName, // 默认使用分类名作为中文翻译
          'en-US': categoryName  // 默认使用分类名作为英文翻译
        }
      })
      categoryMap.set(categoryName, folderName)
    }

    // 生成或更新 voices JSON 文件
    const voicesFileName = `${categoryIndex.padStart(2, '0')}_voices.json`
    const voicesFilePath = path.join(TRANSLATE_DIR, voicesFileName)
    
    // 如果文件已存在，尝试合并（保留已有的翻译和 mark 信息）
    let existingVoices = []
    
    if (fs.existsSync(voicesFilePath)) {
      try {
        existingVoices = fs.readJsonSync(voicesFilePath)
        console.log(`  读取已存在的文件: ${voicesFileName}`)
        
        // 如果已存在的分类名与文件夹名不一致，提示更新
        if (existingVoices.length > 0 && existingVoices[0].category && existingVoices[0].category !== categoryName) {
          console.log(`  更新分类名: ${existingVoices[0].category} -> ${categoryName}`)
        }
      } catch (e) {
        console.log(`  警告: 无法读取 ${voicesFileName}，将创建新文件`)
      }
    }

    // 生成该分类的语音列表
    const voices = []
    for (const fileName of audioFiles) {
      const voiceName = extractVoiceName(fileName)
      const voicePath = `${folderName}/${fileName}`
      
      voices.push({
        name: voiceName,
        path: voicePath,
        date: getCurrentDate(),
        translate: {
          'zh-CN': voiceName, // 默认使用文件名作为中文翻译
          'en-US': voiceName  // 默认使用文件名作为英文翻译
        },
        category: categoryName  // 使用从文件夹名提取的分类名
      })
      
      console.log(`  - ${fileName} -> ${voiceName}`)
    }

    if (fs.existsSync(voicesFilePath) && existingVoices.length > 0) {
      // 合并：保留已存在的语音配置，添加新语音
      const existingMap = new Map()
      existingVoices.forEach(voice => {
        existingMap.set(voice.name, voice)
      })
      
      voices.forEach(newVoice => {
        if (existingMap.has(newVoice.name)) {
          // 保留已存在的配置，只更新路径和分类名（如果不同）
          const existing = existingMap.get(newVoice.name)
          if (existing.path !== newVoice.path) {
            existing.path = newVoice.path
            console.log(`    更新路径: ${existing.name} -> ${newVoice.path}`)
          }
          if (existing.category !== categoryName) {
            existing.category = categoryName
            console.log(`    更新分类: ${existing.name} -> ${categoryName}`)
          }
        } else {
          // 添加新语音
          existingVoices.push(newVoice)
          console.log(`    添加新语音: ${newVoice.name}`)
        }
      })
      
      // 移除已不存在的语音（文件已删除）
      const currentFileNames = new Set(audioFiles.map(extractVoiceName))
      existingVoices = existingVoices.filter(voice => {
        if (!currentFileNames.has(voice.name)) {
          console.log(`    移除已删除的语音: ${voice.name}`)
          return false
        }
        return true
      })
    } else {
      existingVoices = voices
    }

    // 按名称排序
    existingVoices.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
    
    // 写入文件
    fs.ensureDirSync(TRANSLATE_DIR)
    fs.writeJsonSync(voicesFilePath, existingVoices, { spaces: 2 })
    console.log(`  生成文件: ${voicesFileName} (${existingVoices.length} 个语音)\n`)
  }

  // 删除不存在的 voices 文件（对应的文件夹已删除）
  // 注意：必须在所有文件夹处理完成后执行，并且要重新读取文件列表
  const existingVoicesFilesToCheck = fs.readdirSync(TRANSLATE_DIR)
    .filter(name => /^\d+_voices\.json$/.test(name))
  
  for (const voicesFile of existingVoicesFilesToCheck) {
    const index = voicesFile.match(/^(\d+)_/)[1]
    // 将索引转换为数字进行比较（01 -> 1）
    const indexNum = parseInt(index, 10).toString()
    if (!processedFolders.has(indexNum)) {
      // 对应的文件夹不存在，删除这个 voices 文件
      const filePath = path.join(TRANSLATE_DIR, voicesFile)
      fs.removeSync(filePath)
      console.log(`删除不存在的文件: ${voicesFile}`)
    }
  }

  // 更新 category.json
  const categoryFilePath = path.join(TRANSLATE_DIR, 'category.json')
  let existingCategories = []
  
  if (fs.existsSync(categoryFilePath)) {
    try {
      existingCategories = fs.readJsonSync(categoryFilePath)
      console.log('读取已存在的 category.json')
    } catch (e) {
      console.log('警告: 无法读取 category.json，将创建新文件')
    }
  }

  // 从所有 voices 文件中收集实际使用的分类名
  const actualCategoryNames = new Set()
  const allVoicesFiles = fs.readdirSync(TRANSLATE_DIR)
    .filter(name => /^\d+_voices\.json$/.test(name))
  
  for (const voicesFile of allVoicesFiles) {
    try {
      const voices = fs.readJsonSync(path.join(TRANSLATE_DIR, voicesFile))
      voices.forEach(voice => {
        if (voice.category) {
          actualCategoryNames.add(voice.category)
        }
      })
    } catch (e) {
      // 忽略错误
    }
  }

  // 合并分类：保留已存在的分类配置，添加新分类
  const existingCategoryMap = new Map()
  existingCategories.forEach(cat => {
    existingCategoryMap.set(cat.name, cat)
  })

  // 使用实际在 voices 文件中使用的分类名
  actualCategoryNames.forEach(categoryName => {
    if (!existingCategoryMap.has(categoryName)) {
      // 添加新分类
      existingCategories.push({
        name: categoryName,
        translate: {
          'zh-CN': categoryName,
          'en-US': categoryName
        }
      })
      console.log(`添加新分类: ${categoryName}`)
    } else {
      // 保留已存在的分类配置（包括翻译和 hide 属性）
      console.log(`保留已存在的分类: ${categoryName}`)
    }
  })

  // 移除已不存在的分类（voices 文件中不再使用）
  existingCategories = existingCategories.filter(cat => {
    if (!actualCategoryNames.has(cat.name)) {
      console.log(`移除已删除的分类: ${cat.name}`)
      return false
    }
    return true
  })

  // 按名称排序
  existingCategories.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))

  // 写入 category.json
  fs.writeJsonSync(categoryFilePath, existingCategories, { spaces: 2 })
  console.log(`\n生成文件: category.json (${existingCategories.length} 个分类)`)
  console.log('\n完成！')
  console.log('\n提示:')
  console.log('1. 请检查生成的 JSON 文件，手动更新翻译内容')
  console.log('2. 可以添加 mark 字段来记录语音来源')
  console.log('3. 运行 yarn build 重新构建项目')
}

// 运行脚本
try {
  generateConfig()
} catch (error) {
  console.error('发生错误:', error)
  process.exit(1)
}

