// 引入公共工具函数
const util = require('../../utils/util.js')

// 获取应用实例
const app = getApp()

Page({
  // 页面数据
  data: {
    // 用户信息
    userInfo: {},
    hasUserInfo: false,
    
    // 是否已授权麦克风权限
    hasMicPermission: false,
    
    // 功能卡片列表
    features: [
      {
        id: 'text-to-speech',
        title: '文本转语音',
        icon: '/assets/icons/document-sound.png',
        desc: '上传文件生成语音',
        navigateTo: '/pages/text-to-speech/text-to-speech'
      },
      {
        id: 'realtime-speech',
        title: '实时输入播报',
        icon: '/assets/icons/keyboard-mic.png',
        desc: '输入文字实时播报',
        navigateTo: '/pages/realtime-speech/realtime-speech'
      },
      {
        id: 'voice-selection',
        title: '音色选择',
        icon: '/assets/icons/voices.png',
        desc: '切换/管理音色',
        navigateTo: '/pages/voice-selection/voice-selection'
      },
      {
        id: 'voice-clone',
        title: '语音克隆',
        icon: '/assets/icons/mic-dna.png',
        desc: '克隆我的声音',
        navigateTo: '/pages/voice-clone/voice-clone'
      }
    ]
  },
  
  // 页面加载
  onLoad() {
    // 检查用户信息状态
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    }
    
    // 检查麦克风权限
    this.checkMicPermission()
  },
  
  // 页面显示
  onShow() {
    // 刷新用户信息
    if (app.globalData.hasUserInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    }
  },
  
  // 检查麦克风权限
  checkMicPermission() {
    wx.getSetting({
      success: (res) => {
        if (res.authSetting['scope.record']) {
          this.setData({
            hasMicPermission: true
          })
        } else {
          this.setData({
            hasMicPermission: false
          })
        }
      }
    })
  },
  
  // 请求麦克风权限
  requestMicPermission() {
    wx.authorize({
      scope: 'scope.record',
      success: () => {
        this.setData({
          hasMicPermission: true
        })
        util.showSuccess('授权成功')
      },
      fail: () => {
        // 如果用户拒绝过授权，则引导用户去设置页打开授权
        wx.showModal({
          title: '提示',
          content: '语音功能需要麦克风权限，请在设置中允许使用麦克风',
          confirmText: '去设置',
          success: (res) => {
            if (res.confirm) {
              wx.openSetting({
                success: (settingRes) => {
                  if (settingRes.authSetting['scope.record']) {
                    this.setData({
                      hasMicPermission: true
                    })
                    util.showSuccess('授权成功')
                  }
                }
              })
            }
          }
        })
      }
    })
  },
  
  // 获取用户信息
  getUserProfile() {
    app.getUserProfile().then(userInfo => {
      this.setData({
        userInfo: userInfo,
        hasUserInfo: true
      })
    }).catch(err => {
      console.error('获取用户信息失败', err)
    })
  },
  
  // 跳转到用户中心
  goToUserCenter() {
    wx.navigateTo({
      url: '/pages/user-center/user-center'
    })
  },
  
  // 跳转到功能页面
  navigateToFeature(e) {
    const feature = e.currentTarget.dataset.feature
    
    // 如果是需要麦克风权限的功能，先检查权限
    if ((feature.id === 'voice-clone' || feature.id === 'realtime-speech') && !this.data.hasMicPermission) {
      wx.showModal({
        title: '需要授权',
        content: '此功能需要麦克风权限，是否立即授权？',
        confirmText: '去授权',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            this.requestMicPermission()
          }
        }
      })
      return
    }
    
    // 跳转到对应页面
    wx.navigateTo({
      url: feature.navigateTo
    })
  }
}) 