// 引入工具函数
const util = require('../../utils/util.js');

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
    socketTask: null // WebSocket任务
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
    const text = this.data.textContent.trim();
    
    if (!text) {
      util.showError('请先输入文字');
      return;
    }
    
    // 获取配置和密钥
    const config = require('../../utils/config.js');
    const that = this;
    
    util.showLoading('准备语音合成...');
    
    // 安全地获取API密钥
    this.getApiKeys()
      .then(apiKeys => {
        util.hideLoading();
        
        // 生成Base64编码的参数
        const businessParams = {
          aue: 'raw',
          auf: config.xfyun.audioFormat,
          vcn: config.xfyun.voiceType,
          speed: 50,
          volume: that.data.volume,
          pitch: 50,
          bgs: 0,
          tte: 'UTF8'
        };
        
        const businessParamsBase64 = wx.arrayBufferToBase64(new Uint8Array([...JSON.stringify(businessParams)].map(char => char.charCodeAt(0))));
        
        // 计算认证URL
        const authUrl = config.xfyun.getAuthUrl(apiKeys.apiSecret, apiKeys.apiKey);
        
        // 准备音频数据
        let audioData = [];
        let totalDuration = 0;
        let isFirstFrame = true;
        let audioContext = null;
        
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
          const frame = {
            common: {
              app_id: apiKeys.appId
            },
            business: JSON.parse(new TextDecoder().decode(wx.base64ToArrayBuffer(businessParamsBase64))),
            data: {
              status: 2,
              text: wx.arrayBufferToBase64(new Uint8Array([...text].map(char => char.charCodeAt(0))))
            }
          };
          
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
            totalDuration += seconds;
            
            // 更新进度
            const progressPercent = Math.min(message.data.status === 2 ? 100 : Math.floor((message.data.idx / message.data.total) * 100), 100);
            that.setData({
              playProgress: progressPercent,
              currentTime: util.formatAudioTime(totalDuration * (progressPercent / 100)),
              totalTime: util.formatAudioTime(totalDuration)
            });
            
            // 如果是第一帧数据，开始播放
            if (isFirstFrame) {
              isFirstFrame = false;
              
              // 创建临时文件来存储音频
              const fs = wx.getFileSystemManager();
              const tempFilePath = `${wx.env.USER_DATA_PATH}/temp_speech_${Date.now()}.pcm`;
              
              fs.writeFile({
                filePath: tempFilePath,
                data: that.mergeArrayBuffers(audioData),
                success: () => {
                  // 创建音频上下文
                  audioContext = wx.createInnerAudioContext();
                  audioContext.src = tempFilePath;
                  audioContext.volume = that.data.volume / 100;
                  
                  // 监听播放事件
                  audioContext.onPlay(() => {
                    console.log('开始播放合成语音');
                  });
                  
                  audioContext.onEnded(() => {
                    console.log('播放结束');
                    that.setData({
                      isSpeaking: false,
                      playProgress: 0,
                      currentTime: '00:00',
                      audioContext: null
                    });
                    
                    // 清理临时文件
                    fs.unlink({
                      filePath: tempFilePath,
                      fail: (err) => console.error('删除临时文件失败', err)
                    });
                  });
                  
                  audioContext.onError((err) => {
                    console.error('播放错误', err);
                    util.showError('播放失败');
                    that.setData({
                      isSpeaking: false,
                      audioContext: null
                    });
                  });
                  
                  that.setData({
                    audioContext: audioContext
                  });
                  
                  // 播放
                  audioContext.play();
                },
                fail: (err) => {
                  console.error('写入临时音频文件失败', err);
                  util.showError('音频处理失败');
                  that.setData({
                    isSpeaking: false
                  });
                }
              });
            } else if (message.data.status === 2) {
              // 最后一帧数据，更新音频文件
              const fs = wx.getFileSystemManager();
              const tempFilePath = `${wx.env.USER_DATA_PATH}/temp_speech_${Date.now()}.pcm`;
              
              fs.writeFile({
                filePath: tempFilePath,
                data: that.mergeArrayBuffers(audioData),
                success: () => {
                  // 更新音频源
                  if (that.data.audioContext) {
                    that.data.audioContext.src = tempFilePath;
                    that.data.audioContext.play();
                  }
                },
                fail: (err) => console.error('更新音频文件失败', err)
              });
            }
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
    const config = require('../../utils/config.js');
    
    return config.getSecureApiKeys();
  },

  /**
   * 合并ArrayBuffer数组
   */
  mergeArrayBuffers: function(buffers) {
    // 计算总长度
    const totalLength = buffers.reduce((acc, buffer) => acc + buffer.byteLength, 0);
    
    // 创建新的ArrayBuffer
    const result = new Uint8Array(totalLength);
    
    // 复制数据
    let offset = 0;
    buffers.forEach(buffer => {
      result.set(new Uint8Array(buffer), offset);
      offset += buffer.byteLength;
    });
    
    return result.buffer;
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
      socketTask: null
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