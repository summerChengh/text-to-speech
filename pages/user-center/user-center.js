// 引入工具函数
const util = require('../../utils/util.js');

// 获取全局应用实例
const app = getApp();

Page({
  // 页面的初始数据
  data: {
    userInfo: {}, // 用户信息
    hasUserInfo: false, // 是否已登录
    
    // 弹窗控制
    showAboutModal: false, // 是否显示关于我们弹窗
    showFeedbackModal: false, // 是否显示意见反馈弹窗
    
    // 反馈表单
    feedbackContent: '', // 反馈内容
    contactInfo: '' // 联系方式
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 获取用户信息
    this.setData({
      userInfo: app.globalData.userInfo,
      hasUserInfo: app.globalData.hasUserInfo
    });
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // 每次页面显示时刷新用户信息
    this.setData({
      userInfo: app.globalData.userInfo,
      hasUserInfo: app.globalData.hasUserInfo
    });
  },

  /**
   * 获取用户信息
   */
  getUserProfile: function () {
    app.getUserProfile().then(userInfo => {
      this.setData({
        userInfo: userInfo,
        hasUserInfo: true
      });
      
      util.showSuccess('登录成功');
    }).catch(err => {
      console.error('获取用户信息失败', err);
      util.showError('登录失败，请重试');
    });
  },

  /**
   * 跳转到我的音色页面
   */
  navigateToVoices: function () {
    wx.navigateTo({
      url: '/pages/voice-selection/voice-selection'
    });
  },

  /**
   * 跳转到使用记录页面
   */
  navigateToHistory: function () {
    // 这个页面尚未实现，显示提示
    util.showError('该功能暂未开放');
  },

  /**
   * 跳转到设置页面
   */
  navigateToSettings: function () {
    // 这个页面尚未实现，显示提示
    util.showError('该功能暂未开放');
  },

  /**
   * 显示关于我们弹窗
   */
  showAbout: function () {
    this.setData({
      showAboutModal: true
    });
  },

  /**
   * 隐藏关于我们弹窗
   */
  hideAbout: function () {
    this.setData({
      showAboutModal: false
    });
  },

  /**
   * 显示意见反馈弹窗
   */
  showFeedback: function () {
    this.setData({
      showFeedbackModal: true
    });
  },

  /**
   * 隐藏意见反馈弹窗
   */
  hideFeedback: function () {
    this.setData({
      showFeedbackModal: false,
      feedbackContent: '',
      contactInfo: ''
    });
  },

  /**
   * 反馈内容输入
   */
  onFeedbackInput: function (e) {
    this.setData({
      feedbackContent: e.detail.value
    });
  },

  /**
   * 联系方式输入
   */
  onContactInput: function (e) {
    this.setData({
      contactInfo: e.detail.value
    });
  },

  /**
   * 提交反馈
   */
  submitFeedback: function () {
    const content = this.data.feedbackContent.trim();
    
    if (!content) {
      util.showError('请输入反馈内容');
      return;
    }
    
    // 这里应该调用接口提交反馈，这是一个示例
    util.showLoading('正在提交...');
    
    // 模拟提交过程
    setTimeout(() => {
      util.hideLoading();
      util.showSuccess('提交成功');
      
      // 隐藏弹窗并清空表单
      this.setData({
        showFeedbackModal: false,
        feedbackContent: '',
        contactInfo: ''
      });
    }, 1500);
  }
}); 