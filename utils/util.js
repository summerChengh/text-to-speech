// 工具函数集合

/**
 * 格式化时间
 * @param {Date} date 日期对象
 * @return {String} 格式化后的时间字符串
 */
const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return `${[year, month, day].map(formatNumber).join('/')} ${[hour, minute, second].map(formatNumber).join(':')}`
}

/**
 * 格式化数字
 * @param {Number} n 数字
 * @return {String} 格式化后的字符串，如单位数字补0
 */
const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : `0${n}`
}

/**
 * 显示加载提示
 * @param {String} title 提示文本
 */
const showLoading = (title = '加载中...') => {
  wx.showLoading({
    title: title,
    mask: true
  })
}

/**
 * 隐藏加载提示
 */
const hideLoading = () => {
  wx.hideLoading()
}

/**
 * 显示成功提示
 * @param {String} message 提示文本
 */
const showSuccess = (message) => {
  wx.showToast({
    title: message,
    icon: 'success',
    duration: 2000
  })
}

/**
 * 显示错误提示
 * @param {String} message 提示文本
 */
const showError = (message) => {
  wx.showToast({
    title: message,
    icon: 'error',
    duration: 2000
  })
}

/**
 * 显示提示框
 * @param {String} title 标题
 * @param {String} content 内容
 * @return {Promise} Promise对象
 */
const showModal = (title, content) => {
  return new Promise((resolve, reject) => {
    wx.showModal({
      title,
      content,
      success: (res) => {
        if (res.confirm) {
          resolve(true)
        } else if (res.cancel) {
          resolve(false)
        }
      },
      fail: reject
    })
  })
}

/**
 * 获取文件扩展名
 * @param {String} filename 文件名
 * @return {String} 扩展名
 */
const getFileExt = (filename) => {
  return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase()
}

/**
 * 判断文件类型是否合法
 * @param {String} filePath 文件路径
 * @param {Array} allowTypes 允许的文件类型
 * @return {Boolean} 是否合法
 */
const isValidFileType = (filePath, allowTypes = ['txt', 'docx']) => {
  const ext = getFileExt(filePath)
  return allowTypes.includes(ext)
}

/**
 * 格式化音频时长
 * @param {Number} seconds 秒数
 * @return {String} 格式化后的时间
 */
const formatAudioTime = (seconds) => {
  const min = Math.floor(seconds / 60)
  const sec = Math.floor(seconds % 60)
  return `${formatNumber(min)}:${formatNumber(sec)}`
}

/**
 * 随机字符串生成
 * @param {Number} length 长度
 * @return {String} 随机字符串
 */
const randomString = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * 深拷贝对象
 * @param {Object} obj 待拷贝对象
 * @return {Object} 拷贝后的对象
 */
const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj))
}

/**
 * 限制文本长度
 * @param {String} text 文本内容
 * @param {Number} maxLength 最大长度
 * @return {String} 截断后的文本
 */
const truncateText = (text, maxLength) => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

/**
 * 判断是否为音频文件
 * @param {String} filePath 文件路径
 * @return {Boolean} 是否为音频文件
 */
const isAudioFile = (filePath) => {
  const ext = getFileExt(filePath)
  return ['mp3', 'wav'].includes(ext)
}

// 导出工具函数
module.exports = {
  formatTime,
  formatNumber,
  showLoading,
  hideLoading,
  showSuccess,
  showError,
  showModal,
  getFileExt,
  isValidFileType,
  formatAudioTime,
  randomString,
  deepClone,
  truncateText,
  isAudioFile
} 