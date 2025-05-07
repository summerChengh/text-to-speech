# 文字转语音小程序部署指南

本文档提供了部署文字转语音小程序的详细步骤，包括后端服务部署和小程序发布。

## 1. 科大讯飞开放平台配置

### 1.1 注册科大讯飞开放平台账号
1. 访问 [科大讯飞开放平台](https://www.xfyun.cn/)
2. 注册并登录开发者账号
3. 完成实名认证（企业或个人认证）

### 1.2 创建语音合成应用
1. 在控制台中选择"创建新应用"
2. 应用名称填写"文字转语音小程序"
3. 选择"语音能力"中的"语音合成"
4. 完成创建后获取 AppID、APIKey 和 APISecret

### 1.3 配额与计费
- 免费账号每日有500次调用限制
- 如需更多配额，可以购买商用版

## 2. 后端服务部署

### 2.1 环境准备
- Node.js 环境 (v12.0.0 或更高版本)
- npm 或 yarn 包管理工具
- 已备案的域名和SSL证书（微信小程序要求）

### 2.2 部署步骤
1. 克隆或下载服务端代码
2. 安装依赖：
   ```bash
   npm install
   ```
3. 修改配置文件：
   - 设置 XF_APP_ID, XF_API_KEY, XF_API_SECRET 为你的科大讯飞应用信息
   - 配置服务器端口、日志等信息

4. 启动服务：
   ```bash
   npm start
   ```

### 2.3 使用 PM2 守护进程
1. 安装 PM2：
   ```bash
   npm install -g pm2
   ```
2. 启动服务：
   ```bash
   pm2 start app.js --name "tts-service"
   ```
3. 设置开机自启：
   ```bash
   pm2 startup
   pm2 save
   ```

### 2.4 配置 Nginx 反向代理
```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 3. 小程序配置与发布

### 3.1 注册微信小程序账号
1. 访问 [微信公众平台](https://mp.weixin.qq.com/)
2. 注册小程序账号并完成认证

### 3.2 配置小程序
1. 在 app.js 中修改 apiBaseUrl 为你的后端服务地址
   ```javascript
   globalData: {
     apiBaseUrl: 'https://your-domain.com'
   }
   ```
2. 在 project.config.json 中修改 appid 为你的小程序 AppID

### 3.3 配置服务器域名
在微信公众平台的"开发"->"开发设置"->"服务器域名"中:
1. request合法域名: https://your-domain.com
2. downloadFile合法域名: https://your-domain.com

### 3.4 上传和发布
1. 使用微信开发者工具上传代码
2. 提交审核
3. 审核通过后发布

## 4. 测试与验证
1. 检查文本输入功能
2. 验证不同音色的转换效果
3. 测试播放控制功能
4. 验证音量调节是否有效

## 5. 常见问题

### 5.1 接口调用失败
- 检查科大讯飞的 AppID、APIKey 和 APISecret 是否正确
- 检查服务器域名是否已添加到小程序的合法域名列表
- 验证后端服务是否正常运行

### 5.2 音频播放问题
- 检查音频格式是否为MP3
- 验证是否请求了后台播放音频的权限
- 检查网络连接是否正常

### 5.3 小程序审核未通过
- 确保应用符合微信小程序的规范和政策
- 检查是否有敏感内容或功能
- 修复审核反馈中提到的问题并重新提交

## 6. 后续优化建议
- 添加音频缓存机制，避免重复请求
- 优化用户界面，提升用户体验
- 添加更多音色和语言支持
- 实现个性化推荐功能 