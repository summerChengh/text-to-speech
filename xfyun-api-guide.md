# 科大讯飞WebAPI配置指南 (安全版)

本指南将帮助您配置科大讯飞语音合成WebAPI，以实现文字转语音功能。

## 1. 注册科大讯飞开放平台账号

1. 访问 [科大讯飞开放平台](https://www.xfyun.cn/)
2. 注册并登录开发者账号
3. 完成实名认证（企业或个人认证）

## 2. 创建语音合成应用

1. 在控制台中选择"创建新应用"
2. 应用名称填写"文字转语音小程序"
3. 选择"语音能力"中的"在线语音合成"
4. 完成创建后获取APPID

## 3. 获取API密钥

1. 在应用详情页面找到"接口认证信息"
2. 记录APPID、APIKey和APISecret
3. 这些信息将用于API调用的鉴权

## 4. 在小程序中配置密钥

现在我们提供了两种方式配置API密钥：

### 方式一：通过UI界面配置（推荐）

1. 打开小程序，点击首页右上角的"API"按钮
2. 在配置页面中输入您的APPID、APIKey和APISecret
3. 点击"保存配置"按钮

这种方式会将密钥信息安全地存储在设备的本地存储中，仅在本设备内使用。

### 方式二：通过代码配置

如果您是开发者，也可以在代码中配置：

1. 打开`utils/config.js`文件
2. 修改以下内容：
   ```javascript
   module.exports = {
     // 填入您的科大讯飞API信息
     xfyunApi: {
       appId: 'YOUR_APPID', // 您的APPID
       apiKey: 'YOUR_API_KEY', // 您的APIKey
       apiSecret: 'YOUR_API_SECRET' // 您的APISecret
     }
   };
   ```
3. 将上述配置中的占位符替换为您的实际API信息

## 5. 配置request合法域名

在微信小程序管理后台的"开发"->"开发设置"->"服务器域名"中添加以下域名：

- socket合法域名: `wss://tts-api.xfyun.cn`

## 6. 测试应用

1. 确保您已完成API配置
2. 编译并运行小程序
3. 输入文本内容
4. 点击"语音播放"按钮
5. 如果配置正确，您应该能听到语音播放

## 7. 常见问题

### 7.1 鉴权失败
- 检查APPID、APIKey和APISecret是否正确
- 确认接口是否在有效期内
- 检查时间格式是否正确

### 7.2 播放失败
- 检查网络连接
- 确认socket合法域名配置是否正确
- 检查返回的音频数据格式

### 7.3 免费额度
- 科大讯飞一般提供免费的调用额度
- 超出免费额度后，需要购买付费服务

### 7.4 API密钥安全
- 通过UI界面设置的API密钥存储在设备本地
- 请勿将API密钥暴露给其他人
- 如发现密钥泄露，请立即在科大讯飞开放平台重置

## 8. 参考资料

- [科大讯飞语音合成API文档](https://www.xfyun.cn/doc/tts/online_tts/API.html)
- [WebAPI鉴权方式说明](https://www.xfyun.cn/doc/tts/online_tts/API.html#%E6%8E%A5%E5%8F%A3%E9%89%B4%E6%9D%83)
- [请求参数说明](https://www.xfyun.cn/doc/tts/online_tts/API.html#%E8%AF%B7%E6%B1%82%E5%8F%82%E6%95%B0) 