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
    const that = this;
    const text = this.data.textContent.trim();
    if (!text) {
      util.showError('请先输入文本');
      return;
    }
    util.showLoading('正在合成语音...');

    // 获取API密钥
    const config = require('../../utils/config.js');
    const CryptoJS = require('../../utils/crypto-js.js');

    this.getApiKeys()
      .then(apiKeys => {
        util.hideLoading();
        // 生成WebSocket鉴权URL
        const authUrl = config.xfyun.getAuthUrl(apiKeys.apiSecret, apiKeys.apiKey);

        // 业务参数
        const businessParams = {
          aue: 'lame', // 让讯飞返回mp3格式
          auf: config.xfyun.audioFormat,
          vcn: this.data.currentVoice.id || config.xfyun.voiceType,
          speed: this.data.speed,
          volume: 50,
          pitch: 50,
          bgs: 0,
          tte: 'UTF8'
        };
        // 文本base64编码
        const textBase64 = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(text));
        // WebSocket首帧
        const frame = {
          common: { app_id: apiKeys.appId },
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
            util.showError('语音合成服务连接失败');
            that.setData({ isProcessing: false });
          }
        });

        // 监听WebSocket事件
        let audioData = [];
        socketTask.onOpen(() => {
          socketTask.send({
            data: JSON.stringify(frame),
            success: () => {
              that.setData({ isProcessing: true, progressPercent: 10, progressText: '正在合成...' });
            },
            fail: (err) => {
              util.showError('语音合成请求失败');
              socketTask.close();
              that.setData({ isProcessing: false });
            }
          });
        });

        socketTask.onMessage((res) => {
          const message = JSON.parse(res.data);
          if (message.code !== 0) {
            util.showError(`语音合成失败: ${message.message}`);
            socketTask.close();
            that.setData({ isProcessing: false });
            return;
          }
          if (message.data && message.data.audio) {
            const audio = wx.base64ToArrayBuffer(message.data.audio);
            audioData.push(audio);
            that.setData({ progressPercent: 60, progressText: '正在接收音频...' });
          }
          if (message.data && message.data.status === 2) {
            // 合成结束，拼接音频并播放
            const totalLength = audioData.reduce((acc, buf) => acc + buf.byteLength, 0);
            const result = new Uint8Array(totalLength);
            let offset = 0;
            audioData.forEach(buf => {
              result.set(new Uint8Array(buf), offset);
              offset += buf.byteLength;
            });
            const fs = wx.getFileSystemManager();
            const tempFilePath = `${wx.env.USER_DATA_PATH}/tts_${Date.now()}.pcm`;
            fs.writeFile({
              filePath: tempFilePath,
              data: result.buffer,
              success: () => {
                const audioContext = wx.createInnerAudioContext();
                audioContext.src = tempFilePath;
                audioContext.onPlay(() => {
                  that.setData({ isPlaying: true, isProcessing: false, progressPercent: 100, progressText: '播放中', audioContext });
                });
                audioContext.onEnded(() => {
                  that.setData({ isPlaying: false, audioContext: null });
                  fs.unlink({ filePath: tempFilePath });
                });
                audioContext.onError((err) => {
                  util.showError('播放失败');
                  that.setData({ isPlaying: false, audioContext: null });
                });
                audioContext.play();
              },
              fail: (err) => {
                util.showError('音频处理失败');
                that.setData({ isProcessing: false });
              }
            });
            socketTask.close();
          }
        });

        socketTask.onError((err) => {
          util.showError('WebSocket错误');
          that.setData({ isProcessing: false });
        });

        socketTask.onClose(() => {
          that.setData({ isProcessing: false });
        });
      })
      .catch(err => {
        util.hideLoading();
        util.showError('语音合成服务初始化失败');
        that.setData({ isProcessing: false });
      });
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
  },

  getApiKeys: function() {
    const config = require('../../utils/config.js');
    return config.getSecureApiKeys();
  }
}); 