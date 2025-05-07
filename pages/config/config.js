// config.js
const configUtils = require('../../utils/config');

Page({
  data: {
    appId: '',
    apiKey: '',
    apiSecret: '',
    showApiKey: false,
    showApiSecret: false,
    isSaved: false
  },

  onLoad: function() {
    try {
      // 尝试从本地存储获取密钥信息
      const apiConfig = wx.getStorageSync('xfyunApiConfig');
      if (apiConfig) {
        this.setData({
          appId: apiConfig.appId || '',
          apiKey: apiConfig.apiKey || '',
          apiSecret: apiConfig.apiSecret || ''
        });
      } else {
        // 如果本地存储没有，尝试从配置文件获取
        const config = configUtils.xfyunApi;
        if (config && config.appId) {
          this.setData({
            appId: config.appId || '',
            apiKey: config.apiKey || '',
            apiSecret: config.apiSecret || ''
          });
        }
      }
    } catch (e) {
      console.error('获取配置失败', e);
    }
  },

  // 处理appId输入
  onAppIdInput: function(e) {
    this.setData({
      appId: e.detail.value,
      isSaved: false
    });
  },

  // 处理apiKey输入
  onApiKeyInput: function(e) {
    this.setData({
      apiKey: e.detail.value,
      isSaved: false
    });
  },

  // 处理apiSecret输入
  onApiSecretInput: function(e) {
    this.setData({
      apiSecret: e.detail.value,
      isSaved: false
    });
  },

  // 切换显示/隐藏apiKey
  toggleApiKeyVisibility: function() {
    this.setData({
      showApiKey: !this.data.showApiKey
    });
  },

  // 切换显示/隐藏apiSecret
  toggleApiSecretVisibility: function() {
    this.setData({
      showApiSecret: !this.data.showApiSecret
    });
  },

  // 保存配置
  saveConfig: function() {
    // 验证输入
    if (!this.data.appId.trim()) {
      wx.showToast({
        title: 'AppID不能为空',
        icon: 'none'
      });
      return;
    }

    if (!this.data.apiKey.trim()) {
      wx.showToast({
        title: 'API Key不能为空',
        icon: 'none'
      });
      return;
    }

    if (!this.data.apiSecret.trim()) {
      wx.showToast({
        title: 'API Secret不能为空',
        icon: 'none'
      });
      return;
    }

    // 保存到本地存储
    try {
      wx.setStorageSync('xfyunApiConfig', {
        appId: this.data.appId,
        apiKey: this.data.apiKey,
        apiSecret: this.data.apiSecret
      });

      this.setData({
        isSaved: true
      });

      wx.showToast({
        title: '配置已保存',
        icon: 'success'
      });

      // 返回上一页
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } catch (e) {
      console.error('保存配置失败', e);
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      });
    }
  }
}); 