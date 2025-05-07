// app.js
App({
  onLaunch: function() {
    // 小程序启动时执行
    this.requestAudioPermission();
  },
  
  // 请求音频权限
  requestAudioPermission: function() {
    // 检查是否有录音权限
    wx.getSetting({
      success: (res) => {
        if (!res.authSetting['scope.record']) {
          wx.authorize({
            scope: 'scope.record',
            success: () => {
              console.log('录音权限获取成功');
            },
            fail: () => {
              console.log('用户拒绝授权录音');
              // 如果用户拒绝授权，可以引导用户打开设置页面重新授权
              wx.showModal({
                title: '提示',
                content: '需要录音权限才能使用语音功能，请在设置中打开权限',
                confirmText: '去设置',
                cancelText: '取消',
                success: function(res) {
                  if (res.confirm) {
                    wx.openSetting({
                      success: (res) => {
                        console.log('用户打开设置页面');
                      }
                    });
                  }
                }
              });
            }
          });
        }
      }
    });
  },
  
  globalData: {
    // 全局数据
    apiBaseUrl: 'https://your-backend-api-url', // 需要替换为实际的API地址
  }
}) 