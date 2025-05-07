// settings.js
Page({
  data: {
    volumeValue: 50, // 默认音量50
    voiceTones: [
      { id: 'xiaoyan', name: '小燕 (女声)' },
      { id: 'aisjiuxu', name: '许久 (男声)' },
      { id: 'aisxping', name: '小萍 (女声)' },
      { id: 'aisjinger', name: '小婧 (女声)' },
      { id: 'aisbabyxu', name: '儿童 (童声)' }
    ],
    selectedVoiceId: 'xiaoyan', // 默认选中小燕
    index: 0, // 音色选择器索引
    languages: [
      { id: 'zh-CN', name: '中文' },
      { id: 'en-US', name: '英文' }
    ],
    selectedLanguage: 'zh-CN', // 默认选中中文
    langIndex: 0 // 语言选择器索引
  },

  onLoad: function() {
    // 从缓存中加载设置
    const settings = wx.getStorageSync('ttsSettings');
    if (settings) {
      // 查找音色索引
      const voiceIndex = this.data.voiceTones.findIndex(item => item.id === (settings.voiceId || 'xiaoyan'));
      // 查找语言索引
      const langIndex = this.data.languages.findIndex(item => item.id === (settings.language || 'zh-CN'));
      
      this.setData({
        volumeValue: settings.volume || 50,
        selectedVoiceId: settings.voiceId || 'xiaoyan',
        selectedLanguage: settings.language || 'zh-CN',
        index: voiceIndex !== -1 ? voiceIndex : 0,
        langIndex: langIndex !== -1 ? langIndex : 0
      });
    }
  },

  // 音量调节
  onVolumeChange: function(e) {
    this.setData({
      volumeValue: e.detail.value
    });
  },

  // 音色选择
  onVoiceChange: function(e) {
    const index = e.detail.value;
    const selectedVoice = this.data.voiceTones[index];
    
    this.setData({
      index: index,
      selectedVoiceId: selectedVoice.id
    });
  },

  // 语言选择
  onLanguageChange: function(e) {
    const index = e.detail.value;
    const selectedLang = this.data.languages[index];
    
    this.setData({
      langIndex: index,
      selectedLanguage: selectedLang.id
    });
  },

  // 保存设置
  saveSettings: function() {
    // 保存到本地缓存
    wx.setStorageSync('ttsSettings', {
      volume: this.data.volumeValue,
      voiceId: this.data.selectedVoiceId,
      language: this.data.selectedLanguage
    });

    wx.showToast({
      title: '设置已保存',
      icon: 'success',
      duration: 2000
    });

    // 返回上一页
    setTimeout(() => {
      wx.navigateBack({
        delta: 1
      });
    }, 2000);
  }
}); 