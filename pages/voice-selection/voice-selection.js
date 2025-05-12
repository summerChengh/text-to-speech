// 引入工具函数
const util = require('../../utils/util.js');

// 获取全局应用实例
const app = getApp();

Page({
  // 页面的初始数据
  data: {
    activeTab: 'preset', // 当前激活的标签
    presetVoices: [], // 预设音色列表
    customVoices: [], // 自定义音色列表
    defaultVoice: {}, // 默认音色
    
    // 播放状态
    isPlaying: false, // 是否正在播放
    currentPlayingVoice: null, // 当前播放的音色
    
    // 音频控制
    audioContext: null // 音频上下文
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 加载音色列表
    this.loadVoiceData();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // 每次页面显示时刷新数据，以获取最新的音色列表
    this.loadVoiceData();
  },

  /**
   * 加载音色数据
   */
  loadVoiceData: function () {
    this.setData({
      presetVoices: app.globalData.voiceList,
      customVoices: app.globalData.customVoiceList,
      defaultVoice: app.globalData.defaultVoice
    });
  },

  /**
   * 切换标签
   */
  switchTab: function (e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      activeTab: tab
    });
    
    // 切换标签时停止播放
    this.stopPlaying();
  },

  /**
   * 试听音色
   */
  listenVoice: function (e) {
    const voice = e.currentTarget.dataset.voice;
    
    // 如果是同一个音色，并且正在播放，则停止播放
    if (this.data.isPlaying && this.data.currentPlayingVoice && this.data.currentPlayingVoice.id === voice.id) {
      this.stopPlaying();
      return;
    }
    
    // 如果正在播放另一个音色，先停止
    if (this.data.isPlaying) {
      this.stopPlaying();
    }
    
    // 开始播放指定音色
    this.startPlaying(voice);
  },

  /**
   * 开始播放
   */
  startPlaying: function (voice) {
    // 这里应该调用语音合成API播放示例文本
    // 这是一个示例，实际项目中需要对接语音合成服务
    const that = this;
    
    util.showLoading('准备试听...');
    
    // 模拟加载过程
    setTimeout(() => {
      util.hideLoading();
      
      // 创建内部音频上下文
      const audioContext = wx.createInnerAudioContext();
      
      // 使用系统TTS功能（仅作为示例，实际项目中应对接第三方语音合成服务）
      audioContext.src = 'https://example.com/voice-sample.mp3'; // 示例URL
      
      audioContext.onPlay(() => {
        console.log('开始播放');
      });
      
      audioContext.onEnded(() => {
        console.log('播放结束');
        that.setData({
          isPlaying: false,
          currentPlayingVoice: null,
          audioContext: null
        });
      });
      
      audioContext.onError((err) => {
        console.error('播放错误', err);
        util.showError('播放失败');
        that.setData({
          isPlaying: false,
          currentPlayingVoice: null,
          audioContext: null
        });
      });
      
      // 设置状态并开始播放
      that.setData({
        isPlaying: true,
        currentPlayingVoice: voice,
        audioContext: audioContext
      });
      
      // 播放
      audioContext.play();
      
      // 由于这只是一个示例，我们会在5秒后自动停止播放
      setTimeout(() => {
        if (that.data.isPlaying) {
          that.stopPlaying();
        }
      }, 5000);
    }, 1000);
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
      currentPlayingVoice: null,
      audioContext: null
    });
  },

  /**
   * 设置默认音色
   */
  setAsDefault: function (e) {
    const voice = e.currentTarget.dataset.voice;
    
    // 如果已经是默认音色，不做任何操作
    if (this.data.defaultVoice.id === voice.id) {
      return;
    }
    
    // 更新默认音色
    app.setDefaultVoice(voice);
    
    // 更新页面数据
    this.setData({
      defaultVoice: voice
    });
    
    util.showSuccess('已设为默认音色');
  },

  /**
   * 删除自定义音色
   */
  deleteVoice: function (e) {
    const voice = e.currentTarget.dataset.voice;
    
    // 确认是否删除
    wx.showModal({
      title: '确认删除',
      content: `确认删除音色"${voice.name}"吗？此操作不可恢复。`,
      confirmText: '删除',
      confirmColor: '#FF3B30',
      success: (res) => {
        if (res.confirm) {
          // 如果正在播放，停止播放
          if (this.data.isPlaying && this.data.currentPlayingVoice && this.data.currentPlayingVoice.id === voice.id) {
            this.stopPlaying();
          }
          
          // 删除音色
          app.removeCustomVoice(voice.id);
          
          // 如果删除的是默认音色，重置默认音色为第一个预设音色
          if (this.data.defaultVoice.id === voice.id) {
            const newDefault = app.globalData.voiceList[0];
            app.setDefaultVoice(newDefault);
            this.setData({
              defaultVoice: newDefault
            });
          }
          
          // 更新页面数据
          this.setData({
            customVoices: app.globalData.customVoiceList
          });
          
          util.showSuccess('已删除');
        }
      }
    });
  },

  /**
   * 跳转到语音克隆页
   */
  navigateToClone: function () {
    wx.navigateTo({
      url: '/pages/voice-clone/voice-clone'
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