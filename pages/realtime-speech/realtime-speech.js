// 引入工具函数
const util = require('../../utils/util.js');
// 引入配置和加密方法
const config = require('../../utils/config.js');
const CryptoJS = require('../../utils/crypto-js.js');
// 获取全局应用实例
const app = getApp();

Page({
  // 页面的初始数据
  data: {
    textContent: '', // 文本内容
    textLength: 0, // 文本长度
    
    // 语音设置
    volume: 80, // 音量
    
    // 播放状态
    isSpeaking: false, // 是否正在播报
    playProgress: 0, // 播放进度
    currentTime: '00:00', // 当前播放时间
    totalTime: '00:00', // 总时长
    
    // 模板
    showTemplateModal: false, // 是否显示模板弹窗
    templates: [
      { id: 1, name: '欢迎词', content: '欢迎各位来宾，今天我们非常荣幸地...' },
      { id: 2, name: '新闻开头', content: '这里是今日新闻，我是主播...' },
      { id: 3, name: '会议开场', content: '各位领导、各位同事，今天我们召开...' },
      { id: 4, name: '天气预报', content: '今天天气晴朗，气温20到28度，微风...' },
      { id: 5, name: '公告提醒', content: '请注意，本次活动将于下午3点开始...' }
    ],
    
    // 音频控制
    audioContext: null, // 音频上下文
    timer: null, // 定时器
    socketTask: null, // WebSocket任务
    audioData: [] // 收集音频数据
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 检查麦克风权限
    this.checkMicPermission();
  },

  /**
   * 检查麦克风权限
   */
  checkMicPermission: function () {
    wx.getSetting({
      success: (res) => {
        if (!res.authSetting['scope.record']) {
          wx.authorize({
            scope: 'scope.record',
            success: () => {
              console.log('已授权麦克风');
            },
            fail: () => {
              util.showModal('提示', '需要麦克风权限才能使用实时播报功能，请在设置中允许使用麦克风').then(confirmed => {
                if (confirmed) {
                  wx.openSetting();
                }
              });
            }
          });
        }
      }
    });
  },

  /**
   * 文本输入处理
   */
  onTextInput: function (e) {
    const text = e.detail.value;
    this.setData({
      textContent: text,
      textLength: text.length
    });
  },

  /**
   * 显示模板选择
   */
  showTemplates: function () {
    this.setData({
      showTemplateModal: true
    });
  },

  /**
   * 隐藏模板选择
   */
  hideTemplates: function () {
    this.setData({
      showTemplateModal: false
    });
  },

  /**
   * 选择模板
   */
  selectTemplate: function (e) {
    const templateId = e.currentTarget.dataset.id;
    const template = this.data.templates.find(t => t.id === templateId);
    
    if (template) {
      this.setData({
        textContent: template.content,
        textLength: template.content.length,
        showTemplateModal: false
      });
    }
  },

  /**
   * 调整音量
   */
  onVolumeChange: function (e) {
    const volume = e.detail.value;
    this.setData({
      volume: volume
    });
    
    // 如果正在播放，实时调整音量
    if (this.data.audioContext) {
      this.data.audioContext.volume = volume / 100;
    }
  },

  /**
   * 切换播报状态
   */
  toggleSpeech: function () {
    if (this.data.isSpeaking) {
      this.stopSpeech();
    } else {
      this.startSpeech();
    }
  },

  /**
   * 开始播报
   */
  startSpeech: function () {
    let audioData = [];
    const text = this.data.textContent.trim();
    if (!text) {
      util.showError('请先输入文字');
      return;
    }
    const that = this;
    util.showLoading('准备语音合成...');
    this.getApiKeys()
      .then(apiKeys => {
        util.hideLoading();
        const appId = apiKeys.appId;
        const apiKey = apiKeys.apiKey;
        const apiSecret = apiKeys.apiSecret;
        const url = config.xfyun.ttsWebsocketUrl;
        const host = url.replace(/^wss?:\/\//, '').replace(/\/.*$/, '');
        const date = new Date().toGMTString();
        const signatureOrigin = `host: ${host}\ndate: ${date}\nGET /v2/tts HTTP/1.1`;
        const signatureSha = CryptoJS.HmacSHA256(signatureOrigin, apiSecret);
        const signature = CryptoJS.enc.Base64.stringify(signatureSha);
        const authUrl = config.xfyun.getAuthUrl(apiSecret, apiKey);
        // 生成Base64编码的参数
        const businessParams = {
          aue: 'lame',
          auf: config.xfyun.audioFormat,
          vcn: config.xfyun.voiceType,
          speed: 50,
          volume: that.data.volume,
          pitch: 50,
          bgs: 0,
          tte: 'UTF8'
        };
        const textBase64 = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(text));
        const frame = {
          common: { app_id: appId },
          business: businessParams,
          data: {
            status: 2,
            text: textBase64
          }
        };
        
        // 创建WebSocket连接
        const socketTask = wx.connectSocket({
          url: authUrl,
          success: () => {
            console.log('WebSocket连接成功');
          },
          fail: err => {
            console.error('WebSocket连接失败', err);
            util.showError('语音合成服务连接失败');
            that.setData({
              isSpeaking: false
            });
          }
        });
        
        // 监听WebSocket事件
        socketTask.onOpen(() => {
          console.log('WebSocket已打开');
          
          // 发送业务参数帧
          socketTask.send({
            data: JSON.stringify(frame),
            success: () => {
              console.log('参数帧发送成功');
              that.setData({
                isSpeaking: true,
                socketTask: socketTask
              });
            },
            fail: (err) => {
              console.error('参数帧发送失败', err);
              socketTask.close();
              util.showError('语音合成请求失败');
            }
          });
        });
        
        socketTask.onMessage((res) => {
          const message = JSON.parse(res.data);
          
          // 检查合成结果
          if (message.code !== 0) {
            console.error('合成错误', message);
            util.showError(`语音合成失败: ${message.message}`);
            socketTask.close();
            return;
          }
          
          // 处理音频数据
          if (message.data && message.data.audio) {
            const audio = wx.base64ToArrayBuffer(message.data.audio);
            audioData.push(audio);
            
            // 估算音频时长（假设16kHz采样率，16位采样）
            const seconds = audio.byteLength / (16000 * 2);
            that.setData({
              playProgress: Math.min(message.data.status === 2 ? 100 : Math.floor((message.data.idx / message.data.total) * 100), 100),
              currentTime: util.formatAudioTime(seconds),
              totalTime: util.formatAudioTime(seconds)
            });
          }
          
          if (message.data && message.data.status === 2) {
            // 合成结束，拼接所有音频帧
            const totalLength = audioData.reduce((acc, buf) => acc + buf.byteLength, 0);
            const result = new Uint8Array(totalLength);
            let offset = 0;
            audioData.forEach(buf => {
              result.set(new Uint8Array(buf), offset);
              offset += buf.byteLength;
            });
            const fs = wx.getFileSystemManager();
            const tempFilePath = `${wx.env.USER_DATA_PATH}/tts_${Date.now()}.mp3`;
            fs.writeFile({
              filePath: tempFilePath,
              data: result.buffer,
              success: () => {
                const audioContext = wx.createInnerAudioContext();
                audioContext.src = tempFilePath;
                audioContext.onPlay(() => {
                  that.setData({ isSpeaking: true, audioContext });
                });
                audioContext.onEnded(() => {
                  that.setData({ isSpeaking: false, audioContext: null });
                  fs.unlink({ filePath: tempFilePath });
                });
                audioContext.onError((err) => {
                  util.showError('播放失败');
                  that.setData({ isSpeaking: false, audioContext: null });
                });
                audioContext.play();
              },
              fail: (err) => {
                util.showError('音频处理失败');
                that.setData({ isSpeaking: false });
              }
            });
            socketTask.close();
          }
        });
        
        socketTask.onClose(() => {
          console.log('WebSocket已关闭');
        });
        
        socketTask.onError((err) => {
          console.error('WebSocket错误', err);
          util.showError('语音合成服务异常');
          that.setData({
            isSpeaking: false
          });
        });
      })
      .catch(err => {
        util.hideLoading();
        console.error('获取API密钥失败', err);
        util.showError('语音合成服务初始化失败');
      });
  },

  /**
   * 获取API密钥
   * 从云函数安全获取API凭证
   */
  getApiKeys: function() {
    return config.getSecureApiKeys();
  },

  /**
   * 停止播报
   */
  stopSpeech: function () {
    if (this.data.audioContext) {
      this.data.audioContext.stop();
    }
    
    if (this.data.timer) {
      clearInterval(this.data.timer);
    }
    
    // 关闭WebSocket连接
    if (this.data.socketTask) {
      this.data.socketTask.close();
    }
    
    this.setData({
      isSpeaking: false,
      playProgress: 0,
      currentTime: '00:00',
      audioContext: null,
      timer: null,
      socketTask: null,
      audioData: []
    });
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    // 页面卸载时清理资源
    if (this.data.audioContext) {
      this.data.audioContext.stop();
    }
    
    if (this.data.timer) {
      clearInterval(this.data.timer);
    }
    
    // 关闭WebSocket连接
    if (this.data.socketTask) {
      this.data.socketTask.close();
    }
  }
}); 