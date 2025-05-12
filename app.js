// 应用入口
App({
  // 全局数据
  globalData: {
    userInfo: null,
    hasUserInfo: false,
    // 默认音色配置
    defaultVoice: {
      id: 'female_soft',
      name: '女声-温柔',
      category: '预设音色'
    },
    // 预设音色列表
    voiceList: [
      { id: 'female_soft', name: '女声-温柔', category: '预设音色', tag: '适合故事朗读' },
      { id: 'female_sweet', name: '女声-甜美', category: '预设音色', tag: '适合客服问候' },
      { id: 'male_deep', name: '男声-沉稳', category: '预设音色', tag: '适合新闻播报' },
      { id: 'male_strong', name: '男声-有力', category: '预设音色', tag: '适合商业广告' },
      { id: 'child', name: '童声-活泼', category: '预设音色', tag: '适合儿童内容' }
    ],
    // 用户自定义音色列表
    customVoiceList: []
  },
  
  onLaunch: function() {
    // 初始化云开发环境
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        // env 参数说明：
        //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
        //   此处请填入环境 ID, 如不填则使用默认环境（第一个创建的环境）
        env: 'cloud1-2gtmgkifb9d2860d', // 请替换为您自己的云环境ID
        traceUser: true,
      });
    }
    
    // 启动时检查用户登录态和授权状态
    this.checkUserInfo();
    // 获取保存的自定义音色
    this.getCustomVoices();
  },
  
  // 检查用户登录态
  checkUserInfo: function() {
    const that = this;
    // 获取本地存储中的用户信息
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      that.globalData.userInfo = userInfo;
      that.globalData.hasUserInfo = true;
    }
  },
  
  // 从本地存储获取自定义音色
  getCustomVoices: function() {
    const customVoices = wx.getStorageSync('customVoiceList');
    if (customVoices) {
      this.globalData.customVoiceList = customVoices;
    }
  },
  
  // 保存自定义音色到本地存储
  saveCustomVoices: function() {
    wx.setStorageSync('customVoiceList', this.globalData.customVoiceList);
  },
  
  // 添加自定义音色
  addCustomVoice: function(voice) {
    this.globalData.customVoiceList.push(voice);
    this.saveCustomVoices();
  },
  
  // 删除自定义音色
  removeCustomVoice: function(voiceId) {
    this.globalData.customVoiceList = this.globalData.customVoiceList.filter(voice => voice.id !== voiceId);
    this.saveCustomVoices();
  },
  
  // 设置默认音色
  setDefaultVoice: function(voice) {
    this.globalData.defaultVoice = voice;
    wx.setStorageSync('defaultVoice', voice);
  },
  
  // 获取用户信息
  getUserProfile: function() {
    return new Promise((resolve, reject) => {
      wx.getUserProfile({
        desc: '用于完善用户资料',
        success: (res) => {
          this.globalData.userInfo = res.userInfo;
          this.globalData.hasUserInfo = true;
          wx.setStorageSync('userInfo', res.userInfo);
          resolve(res.userInfo);
        },
        fail: (err) => {
          reject(err);
        }
      });
    });
  }
}); 