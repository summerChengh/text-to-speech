// 引入工具函数
const util = require('../../utils/util.js');

// 获取全局应用实例
const app = getApp();

Page({
  // 页面的初始数据
  data: {
    textContent: '', // 文本内容
    textLength: 0, // 文本长度
    
    // 文件信息
    fileName: '', // 文件名
    fileType: '', // 文件类型
    
    // 语音设置
    voiceList: [], // 音色列表
    voiceIndex: 0, // 当前选中的音色索引
    currentVoice: {}, // 当前选中的音色
    speed: 50, // 语速，范围0-100
    
    // 状态
    isProcessing: false, // 是否在处理中
    isPlaying: false, // 是否在播放
    progressPercent: 0, // 进度百分比
    progressText: '', // 进度文本
    errorMsg: '', // 错误信息
    
    // 音频控制
    audioContext: null // 音频上下文
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 初始化音色列表
    this.initVoiceList();
  },

  /**
   * 初始化音色列表
   */
  initVoiceList: function () {
    // 合并预设音色和用户自定义音色
    let allVoices = [...app.globalData.voiceList];
    
    // 如果有自定义音色，添加分割线和自定义音色
    if (app.globalData.customVoiceList && app.globalData.customVoiceList.length > 0) {
      allVoices.push({ id: 'divider', name: '--- 我的音色 ---', category: 'divider', disabled: true });
      allVoices = allVoices.concat(app.globalData.customVoiceList);
    }
    
    // 设置默认音色
    const defaultVoice = app.globalData.defaultVoice;
    const defaultIndex = allVoices.findIndex(v => v.id === defaultVoice.id && v.category === defaultVoice.category);
    
    this.setData({
      voiceList: allVoices,
      voiceIndex: defaultIndex >= 0 ? defaultIndex : 0,
      currentVoice: defaultIndex >= 0 ? allVoices[defaultIndex] : allVoices[0]
    });
  },

  /**
   * 选择文件
   */
  chooseFile: function () {
    const that = this;
    
    wx.chooseMessageFile({
      count: 1, // 可选择文件的数量
      type: 'file', // 可选择的文件类型，file表示所有文件
      extension: ['txt', 'docx'], // 允许的文件类型
      success: function (res) {
        const file = res.tempFiles[0];
        
        // 检查文件类型
        const fileType = util.getFileExt(file.name);
        if (!util.isValidFileType(file.name, ['txt', 'docx'])) {
          that.setData({
            errorMsg: '文件格式不支持，请上传txt或docx格式的文件'
          });
          return;
        }
        
        // 清除错误信息
        that.setData({
          errorMsg: '',
          fileName: file.name,
          fileType: fileType,
          isProcessing: true,
          progressPercent: 10,
          progressText: '正在解析文件...'
        });
        
        // 根据文件类型处理文件内容
        if (fileType === 'txt') {
          that.readTxtFile(file.path);
        } else if (fileType === 'docx') {
          that.handleDocxFile(file.path);
        }
      }
    });
  },

  /**
   * 读取TXT文件
   */
  readTxtFile: function (filePath) {
    const that = this;
    
    // 显示加载中
    util.showLoading('解析文件中...');
    
    // 使用FileSystemManager读取文件
    const fs = wx.getFileSystemManager();
    
    fs.readFile({
      filePath: filePath,
      encoding: 'utf-8',
      success: function (res) {
        util.hideLoading();
        
        // 限制文本长度为5000字
        let content = res.data;
        if (content.length > 5000) {
          content = content.substring(0, 5000);
          that.setData({
            errorMsg: '文本过长，已截取前5000字'
          });
        }
        
        that.setData({
          textContent: content,
          textLength: content.length,
          isProcessing: false,
          progressPercent: 100,
          progressText: '文件解析完成'
        });
        
        // 延迟隐藏进度条
        setTimeout(() => {
          that.setData({
            isProcessing: false
          });
        }, 1000);
      },
      fail: function (err) {
        util.hideLoading();
        console.error('读取文件失败', err);
        that.setData({
          errorMsg: '读取文件失败: ' + err.errMsg,
          isProcessing: false
        });
      }
    });
  },

  /**
   * 处理DOCX文件
   * 注意: 微信小程序不能直接解析docx文件，这里模拟一个简单的处理过程
   * 实际项目中可能需要上传到服务器处理或使用第三方插件
   */
  handleDocxFile: function (filePath) {
    const that = this;
    
    // 显示加载提示
    util.showLoading('解析文件中...');
    
    // 模拟处理过程
    setTimeout(() => {
      util.hideLoading();
      
      that.setData({
        errorMsg: 'DOCX格式暂不支持直接解析，可转换为TXT后上传',
        isProcessing: false
      });
    }, 2000);
  },

  /**
   * 音色变更
   */
  onVoiceChange: function (e) {
    const index = e.detail.value;
    const voice = this.data.voiceList[index];
    
    // 跳过分隔符
    if (voice.disabled) {
      return;
    }
    
    this.setData({
      voiceIndex: index,
      currentVoice: voice
    });
  },

  /**
   * 语速变更
   */
  onSpeedChange: function (e) {
    this.setData({
      speed: e.detail.value
    });
  },

  /**
   * 切换播放/暂停
   */
  togglePlay: function () {
    if (this.data.isPlaying) {
      this.pausePlay();
    } else {
      this.startPlay();
    }
  },

  /**
   * 开始播放
   */
  startPlay: function () {
    // 如果已经有音频上下文，恢复播放
    if (this.data.audioContext) {
      this.data.audioContext.play();
      this.setData({
        isPlaying: true
      });
      return;
    }
    
    // 这里应该调用语音合成API
    // 这是一个示例，实际应用中需要对接语音合成服务，如科大讯飞、百度等
    const that = this;
    
    util.showLoading('正在合成语音...');
    
    // 模拟合成过程
    setTimeout(() => {
      util.hideLoading();
      
      // 创建内部音频上下文
      const audioContext = wx.createInnerAudioContext();
      
      // 使用系统TTS功能（仅作为示例，实际项目中应对接第三方语音合成服务）
      audioContext.src = 'https://example.com/tts-output.mp3'; // 这是一个示例URL，实际应替换为真实的合成音频URL
      audioContext.onPlay(() => {
        console.log('开始播放');
      });
      
      audioContext.onEnded(() => {
        console.log('播放结束');
        that.setData({
          isPlaying: false,
          audioContext: null
        });
      });
      
      audioContext.onError((err) => {
        console.error('播放错误', err);
        that.setData({
          isPlaying: false,
          errorMsg: '播放失败，请稍后再试',
          audioContext: null
        });
      });
      
      // 设置状态并开始播放
      that.setData({
        isPlaying: true,
        audioContext: audioContext
      });
      
      // 由于这只是一个示例，我们会模拟一个错误，提示用户需要对接真实的语音服务
      setTimeout(() => {
        that.setData({
          isPlaying: false,
          errorMsg: '示例应用：需要对接实际的语音合成服务',
          audioContext: null
        });
      }, 2000);
    }, 2000);
  },

  /**
   * 暂停播放
   */
  pausePlay: function () {
    if (this.data.audioContext) {
      this.data.audioContext.pause();
    }
    
    this.setData({
      isPlaying: false
    });
  },

  /**
   * 停止播放
   */
  stopPlay: function () {
    if (this.data.audioContext) {
      this.data.audioContext.stop();
    }
    
    this.setData({
      isPlaying: false,
      audioContext: null
    });
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    // 页面卸载时停止播放
    if (this.data.audioContext) {
      this.data.audioContext.stop();
    }
  }
}); 