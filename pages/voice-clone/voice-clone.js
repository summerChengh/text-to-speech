// 引入工具函数
const util = require('../../utils/util.js');

// 获取全局应用实例
const app = getApp();

Page({
  // 页面的初始数据
  data: {
    // 录音信息
    isRecording: false, // 是否正在录音
    recordingTime: '00:00', // 录音时长
    recordTimeCount: 0, // 录音时长计数（秒）
    recordTimer: null, // 录音计时器
    
    // 文件信息
    isUploaded: false, // 是否已上传文件
    fileName: '', // 文件名
    filePath: '', // 文件路径
    fileSize: 0, // 文件大小
    
    // 处理状态
    isProcessing: false, // 是否正在处理
    progressPercent: 0, // 进度百分比
    estimatedTime: '计算中...', // 预计剩余时间
    progressTimer: null, // 进度计时器
    
    // 结果状态
    isCompleted: false, // 是否处理完成
    voiceName: '', // 音色名称
    
    // 播放状态
    isPlaying: false, // 是否正在播放
    playingText: '', // 播放提示文本
    
    // 音频控制
    audioContext: null, // 音频上下文
    recorderManager: null // 录音管理器
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 初始化录音管理器
    this.initRecorderManager();
  },

  /**
   * 初始化录音管理器
   */
  initRecorderManager: function () {
    const recorderManager = wx.getRecorderManager();
    
    // 监听录音开始事件
    recorderManager.onStart(() => {
      console.log('录音开始');
      this.startRecordTimer();
    });
    
    // 监听录音暂停事件
    recorderManager.onPause(() => {
      console.log('录音暂停');
    });
    
    // 监听录音恢复事件
    recorderManager.onResume(() => {
      console.log('录音恢复');
    });
    
    // 监听录音停止事件
    recorderManager.onStop((res) => {
      console.log('录音停止', res);
      
      // 清除计时器
      clearInterval(this.data.recordTimer);
      
      // 设置文件信息
      this.setData({
        isRecording: false,
        isUploaded: true,
        fileName: '我的录音.mp3',
        filePath: res.tempFilePath,
        fileSize: res.fileSize
      });
    });
    
    // 监听录音错误事件
    recorderManager.onError((err) => {
      console.error('录音错误', err);
      util.showError('录音失败');
      
      this.setData({
        isRecording: false
      });
      
      // 清除计时器
      if (this.data.recordTimer) {
        clearInterval(this.data.recordTimer);
      }
    });
    
    this.setData({
      recorderManager
    });
  },

  /**
   * 开始录音计时器
   */
  startRecordTimer: function () {
    const that = this;
    let count = 0;
    
    // 创建计时器
    const timer = setInterval(() => {
      count++;
      const minutes = Math.floor(count / 60);
      const seconds = count % 60;
      
      that.setData({
        recordTimeCount: count,
        recordingTime: `${util.formatNumber(minutes)}:${util.formatNumber(seconds)}`
      });
      
      // 如果录音时长超过5分钟，自动停止
      if (count >= 300) {
        that.stopRecord();
      }
    }, 1000);
    
    this.setData({
      recordTimer: timer
    });
  },

  /**
   * 选择录音文件
   */
  chooseRecord: function () {
    const that = this;
    
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['mp3', 'wav'],
      success: function (res) {
        const file = res.tempFiles[0];
        
        // 检查文件类型
        if (!util.isAudioFile(file.name)) {
          util.showError('文件格式不支持，请上传mp3或wav格式的文件');
          return;
        }
        
        // 设置文件信息
        that.setData({
          isUploaded: true,
          fileName: file.name,
          filePath: file.path,
          fileSize: file.size
        });
      }
    });
  },

  /**
   * 开始录音
   */
  startRecord: function () {
    // 检查麦克风权限
    wx.getSetting({
      success: (res) => {
        if (!res.authSetting['scope.record']) {
          wx.authorize({
            scope: 'scope.record',
            success: () => {
              this.beginRecording();
            },
            fail: () => {
              util.showModal('提示', '需要麦克风权限才能录音，请在设置中允许使用麦克风').then(confirmed => {
                if (confirmed) {
                  wx.openSetting();
                }
              });
            }
          });
        } else {
          this.beginRecording();
        }
      }
    });
  },

  /**
   * 开始录音
   */
  beginRecording: function () {
    this.setData({
      isRecording: true,
      recordingTime: '00:00',
      recordTimeCount: 0
    });
    
    // 开始录音
    const options = {
      duration: 300000, // 最长5分钟
      sampleRate: 44100,
      numberOfChannels: 1,
      encodeBitRate: 192000,
      format: 'mp3',
      frameSize: 50
    };
    
    this.data.recorderManager.start(options);
  },

  /**
   * 停止录音
   */
  stopRecord: function () {
    this.data.recorderManager.stop();
  },

  /**
   * 播放录音
   */
  playRecord: function () {
    // 如果正在播放，先停止
    if (this.data.isPlaying) {
      this.stopPlaying();
      return;
    }
    
    // 创建内部音频上下文
    const audioContext = wx.createInnerAudioContext();
    audioContext.src = this.data.filePath;
    
    // 监听播放开始事件
    audioContext.onPlay(() => {
      console.log('开始播放');
    });
    
    // 监听播放结束事件
    audioContext.onEnded(() => {
      console.log('播放结束');
      this.setData({
        isPlaying: false,
        audioContext: null
      });
    });
    
    // 监听播放错误事件
    audioContext.onError((err) => {
      console.error('播放错误', err);
      util.showError('播放失败');
      this.setData({
        isPlaying: false,
        audioContext: null
      });
    });
    
    // 设置状态并开始播放
    this.setData({
      isPlaying: true,
      audioContext: audioContext,
      playingText: '正在播放您的录音'
    });
    
    // 播放
    audioContext.play();
  },

  /**
   * 确认上传
   */
  confirmUpload: function () {
    // 开始处理
    this.startProcessing();
  },

  /**
   * 取消上传
   */
  cancelUpload: function () {
    this.setData({
      isUploaded: false,
      fileName: '',
      filePath: '',
      fileSize: 0
    });
  },

  /**
   * 开始处理
   */
  startProcessing: function () {
    this.setData({
      isProcessing: true,
      progressPercent: 0,
      estimatedTime: '计算中...'
    });
    
    // 模拟处理过程
    const that = this;
    let progress = 0;
    
    // 创建进度计时器
    const timer = setInterval(() => {
      // 模拟非线性进度增长
      if (progress < 30) {
        progress += 1;
      } else if (progress < 60) {
        progress += 0.8;
      } else if (progress < 90) {
        progress += 0.5;
      } else if (progress < 99) {
        progress += 0.1;
      } else {
        clearInterval(timer);
        
        // 处理完成
        setTimeout(() => {
          that.setData({
            isProcessing: false,
            isCompleted: true,
            voiceName: '我的声音' + util.formatNumber(Math.floor(Math.random() * 99) + 1)
          });
        }, 1000);
        
        return;
      }
      
      // 计算预计剩余时间
      const percent = Math.floor(progress);
      const estimatedSeconds = Math.ceil((100 - percent) * 0.6); // 假设每1%大约需要0.6秒
      const minutes = Math.floor(estimatedSeconds / 60);
      const seconds = estimatedSeconds % 60;
      
      that.setData({
        progressPercent: percent,
        estimatedTime: estimatedSeconds > 0 ? `${minutes}分${seconds}秒` : '即将完成'
      });
    }, 300);
    
    this.setData({
      progressTimer: timer
    });
  },

  /**
   * 预览效果
   */
  previewVoice: function () {
    // 如果正在播放，先停止
    if (this.data.isPlaying) {
      this.stopPlaying();
      return;
    }
    
    // 这里应该调用语音合成API，使用克隆的声音朗读示例文本
    // 这是一个示例，实际项目中需要对接语音克隆服务
    const that = this;
    
    util.showLoading('准备试听...');
    
    // 模拟加载过程
    setTimeout(() => {
      util.hideLoading();
      
      // 创建内部音频上下文
      const audioContext = wx.createInnerAudioContext();
      
      // 使用示例URL（实际项目中应替换为真实的克隆语音URL）
      audioContext.src = 'https://example.com/cloned-voice-sample.mp3';
      
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
        util.showError('播放失败');
        that.setData({
          isPlaying: false,
          audioContext: null
        });
      });
      
      // 设置状态并开始播放
      that.setData({
        isPlaying: true,
        audioContext: audioContext,
        playingText: '正在试听克隆声音效果'
      });
      
      // 播放
      audioContext.play();
      
      // 由于这只是一个示例，我们会在5秒后自动停止播放
      setTimeout(() => {
        if (that.data.isPlaying) {
          that.stopPlaying();
        }
      }, 5000);
    }, 1500);
  },

  /**
   * 播放示例
   */
  playExample: function () {
    // 如果正在播放，先停止
    if (this.data.isPlaying) {
      this.stopPlaying();
      return;
    }
    
    // 播放示例录音
    const that = this;
    
    // 创建内部音频上下文
    const audioContext = wx.createInnerAudioContext();
    
    // 使用示例URL
    audioContext.src = 'https://example.com/sample-recording.mp3';
    
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
      util.showError('播放失败');
      that.setData({
        isPlaying: false,
        audioContext: null
      });
    });
    
    // 设置状态并开始播放
    that.setData({
      isPlaying: true,
      audioContext: audioContext,
      playingText: '正在播放示例录音'
    });
    
    // 播放
    audioContext.play();
  },

  /**
   * 停止播放
   */
  stopPlaying: function () {
    if (this.data.audioContext) {
      this.data.audioContext.stop();
    }
    
    this.setData({
      isPlaying: false,
      audioContext: null
    });
  },

  /**
   * 音色名称输入
   */
  inputVoiceName: function (e) {
    this.setData({
      voiceName: e.detail.value
    });
  },

  /**
   * 保存音色
   */
  saveVoice: function () {
    const voiceName = this.data.voiceName.trim();
    
    if (!voiceName) {
      util.showError('请输入音色名称');
      return;
    }
    
    // 生成一个随机ID
    const voiceId = 'custom_' + util.randomString(8);
    
    // 创建自定义音色对象
    const customVoice = {
      id: voiceId,
      name: voiceName,
      category: '自定义音色',
      tag: '我的克隆声音'
    };
    
    // 添加到全局音色列表
    app.addCustomVoice(customVoice);
    
    // 显示成功提示
    util.showSuccess('保存成功');
    
    // 延迟返回上一页
    setTimeout(() => {
      wx.navigateBack();
    }, 1500);
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    // 清除所有计时器
    if (this.data.recordTimer) {
      clearInterval(this.data.recordTimer);
    }
    
    if (this.data.progressTimer) {
      clearInterval(this.data.progressTimer);
    }
    
    // 停止播放
    if (this.data.audioContext) {
      this.data.audioContext.stop();
    }
    
    // 停止录音
    if (this.data.isRecording && this.data.recorderManager) {
      this.data.recorderManager.stop();
    }
  }
}); 