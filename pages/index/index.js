// 定义全局变量
const CryptoJS = require('../../utils/crypto-js');
const configUtils = require('../../utils/config');

// base64编码函数，微信小程序中没有内置btoa函数
function btoa(str) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  let i = 0;
  
  while (i < str.length) {
    const chr1 = str.charCodeAt(i++);
    const chr2 = i < str.length ? str.charCodeAt(i++) : 0;
    const chr3 = i < str.length ? str.charCodeAt(i++) : 0;
    
    const enc1 = chr1 >> 2;
    const enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
    const enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
    const enc4 = chr3 & 63;
    
    output += chars.charAt(enc1) + chars.charAt(enc2) + 
              (i > str.length - 2 ? '=' : chars.charAt(enc3)) +
              (i > str.length - 3 ? '=' : chars.charAt(enc4));
  }
  
  return output;
}

Page({
  data: {
    textContent: '', // 文本内容
    isPlaying: false, // 是否正在播放
    playProgress: 0, // 播放进度
    volume: 50, // 音量
    voiceName: '小燕 (女声)', // 音色名称
    voiceId: 'xiaoyan', // 音色ID
    language: 'zh-CN', // 语言
    audioContext: null, // 音频上下文
    apiBaseUrl: 'wss://tts-api.xfyun.cn/v2/tts', // 科大讯飞API地址
    apiConfigured: false, // API配置状态
  },

  onLoad: function() {
    // 页面加载时执行
    this.loadSettings();
    this.checkApiConfig();
  },

  // 检查API配置
  checkApiConfig: function() {
    try {
      // 从本地存储获取配置
      const apiConfig = wx.getStorageSync('xfyunApiConfig');
      
      if (apiConfig && apiConfig.appId && apiConfig.apiKey && apiConfig.apiSecret) {
        this.setData({
          apiConfigured: true
        });
      } else {
        // 如果本地存储没有，检查配置文件
        const config = configUtils.xfyunApi;
        if (config && config.appId && config.apiKey && config.apiSecret) {
          this.setData({
            apiConfigured: true
          });
        } else {
          this.setData({
            apiConfigured: false
          });
          
          // 提示用户配置API
          wx.showModal({
            title: '提示',
            content: '您尚未配置科大讯飞API，请先完成配置才能使用语音播放功能',
            confirmText: '去配置',
            cancelText: '稍后再说',
            success: (res) => {
              if (res.confirm) {
                wx.navigateTo({
                  url: '/pages/config/config'
                });
              }
            }
          });
        }
      }
    } catch (e) {
      console.error('检查API配置失败', e);
    }
  },

  // 加载设置
  loadSettings: function() {
    const settings = wx.getStorageSync('ttsSettings');
    if (settings) {
      // 查找音色名称
      const voiceTones = [
        { id: 'xiaoyan', name: '小燕 (女声)' },
        { id: 'aisjiuxu', name: '许久 (男声)' },
        { id: 'aisxping', name: '小萍 (女声)' },
        { id: 'aisjinger', name: '小婧 (女声)' },
        { id: 'aisbabyxu', name: '儿童 (童声)' }
      ];
      
      const selectedVoice = voiceTones.find(v => v.id === settings.voiceId) || voiceTones[0];
      
      this.setData({
        volume: settings.volume || 50,
        voiceId: settings.voiceId || 'xiaoyan',
        voiceName: selectedVoice.name,
        language: settings.language || 'zh-CN'
      });
    }
  },

  // 编辑文本功能
  editText: function() {
    wx.navigateTo({
      url: '/pages/editor/editor?content=' + encodeURIComponent(this.data.textContent)
    });
  },

  // 转到设置页面
  goToSettings: function() {
    wx.navigateTo({
      url: '/pages/settings/settings'
    });
  },

  // 转到API配置页面
  goToApiConfig: function() {
    wx.navigateTo({
      url: '/pages/config/config'
    });
  },

  // 显示文本功能
  showText: function() {
    if (!this.data.textContent) {
      wx.showToast({
        title: '暂无文本内容',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    wx.showModal({
      title: '文本内容',
      content: this.data.textContent,
      showCancel: false,
      confirmText: '确定'
    });
  },

  // 获取API配置
  getApiConfig: function() {
    try {
      // 尝试从本地存储获取配置
      const apiConfig = wx.getStorageSync('xfyunApiConfig');
      if (apiConfig && apiConfig.appId && apiConfig.apiKey && apiConfig.apiSecret) {
        return apiConfig;
      }
      
      // 如果本地存储没有，尝试从配置文件获取
      const config = configUtils.xfyunApi;
      if (config && config.appId && config.apiKey && config.apiSecret) {
        return config;
      }
      
      return null;
    } catch (e) {
      console.error('获取API配置失败', e);
      return null;
    }
  },

  // 科大讯飞API鉴权签名
  getWebsocketUrl: function() {
    // 从安全存储获取API配置
    const apiConfig = this.getApiConfig();
    
    if (!apiConfig) {
      wx.showToast({
        title: '未找到API配置',
        icon: 'none',
        duration: 2000
      });
      return null;
    }
    
    const APPID = apiConfig.appId;
    const API_SECRET = apiConfig.apiSecret;
    const API_KEY = apiConfig.apiKey;
    
    const host = 'tts-api.xfyun.cn';
    const path = '/v2/tts';
    const url = 'wss://' + host + path;
    const date = new Date().toGMTString();
    const algorithm = 'hmac-sha256';
    const headers = 'host date request-line';
    const signatureOrigin = `host: ${host}\ndate: ${date}\nGET ${path} HTTP/1.1`;
    const signatureSha = CryptoJS.HmacSHA256(signatureOrigin, API_SECRET);
    const signature = CryptoJS.enc.Base64.stringify(signatureSha);
    const authorizationOrigin = `api_key="${API_KEY}", algorithm="${algorithm}", headers="${headers}", signature="${signature}"`;
    const authorization = btoa(authorizationOrigin);
    
    return `${url}?authorization=${authorization}&date=${encodeURI(date)}&host=${host}`;
  },

  // 播放语音功能
  playAudio: function() {
    if (!this.data.textContent) {
      wx.showToast({
        title: '请先添加文本内容',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    // 检查API是否已配置
    if (!this.data.apiConfigured) {
      wx.showModal({
        title: '提示',
        content: '您尚未配置科大讯飞API，请先完成配置才能使用语音播放功能',
        confirmText: '去配置',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            this.goToApiConfig();
          }
        }
      });
      return;
    }

    // 如果已经在播放中，执行暂停
    if (this.data.isPlaying && this.data.audioContext) {
      this.data.audioContext.pause();
      this.setData({
        isPlaying: false
      });
      return;
    }

    const that = this;
    that.setData({
      isPlaying: true,
      playProgress: 0
    });

    // 显示加载中
    wx.showLoading({
      title: '语音合成中...',
    });

    // 获取API配置
    const apiConfig = this.getApiConfig();
    if (!apiConfig) {
      wx.hideLoading();
      that.setData({
        isPlaying: false
      });
      return;
    }

    // 构建参数
    const params = {
      common: {
        app_id: apiConfig.appId
      },
      business: {
        aue: 'lame', // 音频编码，mp3格式
        sfl: 1, // 流式返回
        auf: 'audio/L16;rate=16000',
        vcn: that.data.voiceId, // 发音人
        speed: 50, // 语速
        volume: that.data.volume, // 音量
        pitch: 50, // 音高
        tte: 'UTF8' // 文本编码
      },
      data: {
        status: 2, // 2表示完成
        text: CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(that.data.textContent))
      }
    };

    // 创建临时音频文件路径
    const tempFilePath = wx.env.USER_DATA_PATH + '/temp_audio.mp3';
    const fs = wx.getFileSystemManager();
    
    try {
      // 创建WebSocket连接
      const websocketUrl = this.getWebsocketUrl();
      if (!websocketUrl) {
        wx.hideLoading();
        that.setData({
          isPlaying: false
        });
        return;
      }

      const socketTask = wx.connectSocket({
        url: websocketUrl,
        success: () => {
          console.log('WebSocket连接成功');
        },
        fail: (err) => {
          console.error('WebSocket连接失败', err);
          that.setData({
            isPlaying: false
          });
          wx.hideLoading();
          wx.showToast({
            title: '连接失败',
            icon: 'none',
            duration: 2000
          });
        }
      });
      
      // 二进制数据数组
      let audioData = [];
      
      // 监听WebSocket连接打开
      socketTask.onOpen(() => {
        console.log('WebSocket已连接');
        // 发送参数
        socketTask.send({
          data: JSON.stringify(params),
          success: () => {
            console.log('参数发送成功');
          },
          fail: (err) => {
            console.error('参数发送失败', err);
          }
        });
      });
      
      // 监听WebSocket接收到服务器的消息
      socketTask.onMessage((res) => {
        const data = JSON.parse(res.data);
        if (data.code !== 0) {
          console.error('科大讯飞API返回错误', data);
          wx.hideLoading();
          wx.showToast({
            title: '语音合成失败',
            icon: 'none',
            duration: 2000
          });
          socketTask.close();
          return;
        }
        
        // 接收音频数据
        const audioBase64 = data.data.audio;
        const audioBinary = wx.base64ToArrayBuffer(audioBase64);
        audioData.push(audioBinary);
        
        // 如果是最后一帧数据
        if (data.data.status === 2) {
          // 将所有音频数据合并
          const totalLength = audioData.reduce((acc, curr) => acc + curr.byteLength, 0);
          const buffer = new ArrayBuffer(totalLength);
          const uint8Array = new Uint8Array(buffer);
          let offset = 0;
          
          for (const data of audioData) {
            uint8Array.set(new Uint8Array(data), offset);
            offset += data.byteLength;
          }
          
          // 写入临时文件
          try {
            fs.writeFileSync(tempFilePath, buffer, 'binary');
            
            // 隐藏加载提示
            wx.hideLoading();
            
            // 创建音频播放上下文
            const innerAudioContext = wx.createInnerAudioContext();
            innerAudioContext.src = tempFilePath;
            
            // 设置音量
            innerAudioContext.volume = that.data.volume / 100;
            
            // 记录音频上下文
            that.setData({
              audioContext: innerAudioContext
            });
            
            // 监听播放状态
            innerAudioContext.onPlay(() => {
              console.log('开始播放');
            });
            
            innerAudioContext.onTimeUpdate(() => {
              // 更新播放进度
              if (innerAudioContext.duration > 0) {
                const progress = (innerAudioContext.currentTime / innerAudioContext.duration) * 100;
                that.setData({
                  playProgress: progress
                });
              }
            });
            
            innerAudioContext.onEnded(() => {
              console.log('播放结束');
              that.setData({
                isPlaying: false,
                playProgress: 100,
                audioContext: null
              });
              
              // 延迟重置进度
              setTimeout(() => {
                that.setData({
                  playProgress: 0
                });
              }, 1000);
            });
            
            innerAudioContext.onError((res) => {
              console.log('播放错误', res);
              that.setData({
                isPlaying: false,
                audioContext: null
              });
              wx.showToast({
                title: '播放失败',
                icon: 'none',
                duration: 2000
              });
            });
            
            // 开始播放
            innerAudioContext.play();
            
          } catch (err) {
            console.error('写入音频文件失败', err);
            that.setData({
              isPlaying: false
            });
            wx.hideLoading();
            wx.showToast({
              title: '音频处理失败',
              icon: 'none',
              duration: 2000
            });
          }
          
          // 关闭WebSocket连接
          socketTask.close();
        }
      });
      
      // 监听WebSocket错误
      socketTask.onError((err) => {
        console.error('WebSocket错误', err);
        that.setData({
          isPlaying: false
        });
        wx.hideLoading();
        wx.showToast({
          title: '连接错误',
          icon: 'none',
          duration: 2000
        });
      });
      
      // 监听WebSocket关闭
      socketTask.onClose(() => {
        console.log('WebSocket已关闭');
      });
      
    } catch (err) {
      console.error('WebSocket连接异常', err);
      that.setData({
        isPlaying: false
      });
      wx.hideLoading();
      wx.showToast({
        title: '连接异常',
        icon: 'none',
        duration: 2000
      });
    }
  },
  
  // 停止播放
  stopAudio: function() {
    if (this.data.audioContext) {
      this.data.audioContext.stop();
      this.setData({
        isPlaying: false,
        playProgress: 0,
        audioContext: null
      });
    }
  },
  
  // 进度条调整
  onProgressChange: function(e) {
    if (this.data.audioContext && this.data.isPlaying) {
      const value = e.detail.value;
      const duration = this.data.audioContext.duration;
      const seekTime = (value / 100) * duration;
      
      this.data.audioContext.seek(seekTime);
      this.setData({
        playProgress: value
      });
    }
  },

  // 页面显示时获取从编辑页面传回的数据和设置数据
  onShow: function() {
    // 重新加载设置
    this.loadSettings();
    
    // 检查API配置状态
    this.checkApiConfig();
    
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    
    // 如果是从编辑页面返回并且有新的文本内容
    if (currentPage.data.newTextContent !== undefined) {
      this.setData({
        textContent: currentPage.data.newTextContent
      });
      // 清除临时数据
      currentPage.data.newTextContent = undefined;
    }
  },
  
  // 页面卸载时停止播放
  onUnload: function() {
    if (this.data.audioContext) {
      this.data.audioContext.stop();
    }
  }
}); 