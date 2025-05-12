// 科大讯飞API配置
// 使用云开发方式安全存储API凭证

module.exports = {
  xfyun: {
    // API接口地址
    ttsWebsocketUrl: 'wss://tts-api.xfyun.cn/v2/tts',
    
    // 音频相关配置
    audioFormat: 'audio/L16;rate=16000',
    voiceType: 'aisxping', // 默认音色
    
    // 获取认证URL
    getAuthUrl: function(apiSecret, apiKey) {
      const url = this.ttsWebsocketUrl;
      const host = url.replace(/^wss?:\/\//, '').replace(/\/.*$/, '');
      const date = new Date().toGMTString();
      const algorithm = 'hmac-sha256';
      const headers = 'host date request-line';
      const signatureOrigin = `host: ${host}\ndate: ${date}\nGET /v2/tts HTTP/1.1`;
      const signatureSha = CryptoJS.HmacSHA256(signatureOrigin, apiSecret);
      const signature = CryptoJS.enc.Base64.stringify(signatureSha);
      const authorizationOrigin = `api_key="${apiKey}", algorithm="${algorithm}", headers="${headers}", signature="${signature}"`;
      const authorization = btoa(authorizationOrigin);
      
      return `${url}?authorization=${authorization}&date=${encodeURIComponent(date)}&host=${host}`;
    }
  },
  
  // 从云函数安全获取API密钥
  getSecureApiKeys: function() {
    return new Promise((resolve, reject) => {
      // 调用云函数获取API凭证
      wx.cloud.callFunction({
        name: 'getXfyunApiKeys',
        data: {},
        success: (res) => {
          if (res.result && res.result.appId && res.result.apiKey && res.result.apiSecret) {
            // 获取成功，返回密钥信息
            resolve({
              appId: res.result.appId,
              apiKey: res.result.apiKey,
              apiSecret: res.result.apiSecret
            });
          } else {
            reject(new Error('获取API密钥失败：云函数未返回完整的密钥信息'));
          }
        },
        fail: (err) => {
          console.error('调用云函数失败', err);
          reject(new Error('获取API密钥失败：' + err.errMsg));
        }
      });
    });
  }
}; 