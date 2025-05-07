// editor.js
Page({
  data: {
    content: '' // 文本内容
  },

  // 页面加载时获取传入的文本内容
  onLoad: function(options) {
    if (options.content) {
      this.setData({
        content: decodeURIComponent(options.content)
      });
    }
  },

  // 监听文本输入变化
  onContentChange: function(e) {
    this.setData({
      content: e.detail.value
    });
  },

  // 清空文本内容
  clearContent: function() {
    this.setData({
      content: ''
    });
  },

  // 保存内容并返回
  saveContent: function() {
    // 获取页面栈
    const pages = getCurrentPages();
    // 获取上一页
    const prevPage = pages[pages.length - 2];
    
    // 将编辑后的文本传回首页
    prevPage.setData({
      newTextContent: this.data.content
    });
    
    // 返回上一页
    wx.navigateBack({
      delta: 1
    });
  },

  // 取消编辑并返回
  cancelEdit: function() {
    wx.navigateBack({
      delta: 1
    });
  }
}); 