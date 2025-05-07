# 科大讯飞语音合成API集成指南

## 1. 注册开发者账号

1. 访问科大讯飞开放平台官网 https://www.xfyun.cn/
2. 注册并登录开发者账号
3. 创建应用，获取 AppID、APIKey 和 APISecret

## 2. 部署后端服务

由于微信小程序无法直接调用第三方API，需要搭建一个中间服务器来处理请求。以下是使用Node.js的示例代码:

```javascript
const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

// 科大讯飞API配置
const XF_APP_ID = 'YOUR_APP_ID'; // 替换为你的AppID
const XF_API_KEY = 'YOUR_API_KEY'; // 替换为你的APIKey
const XF_API_SECRET = 'YOUR_API_SECRET'; // 替换为你的APISecret

// 接口地址
const XF_API_URL = 'https://api.xfyun.cn/v1/service/v1/tts';

// 计算接口签名
function getXFSign(apiKey, xParamBase64, curTime) {
  const signStr = apiKey + curTime + xParamBase64;
  return crypto.createHash('md5').update(signStr).digest('hex');
}

// 文本转语音接口
app.post('/api/tts', async (req, res) => {
  try {
    const { text } = req.body;
    
    // 判断文本是否为空
    if (!text || text.trim() === '') {
      return res.status(400).json({ error: '文本内容不能为空' });
    }
    
    // 当前时间戳
    const curTime = Math.floor(Date.now() / 1000);
    
    // 语音合成参数
    const params = {
      aue: 'lame', // 音频编码，lame：mp3格式
      auf: 'audio/L16;rate=16000', // 音频采样率
      voice_name: 'xiaoyan', // 发音人
      speed: 50, // 语速
      volume: 50, // 音量
      pitch: 50, // 音高
      engine_type: 'intp65', // 引擎类型
      text_type: 'text' // 文本类型
    };
    
    // 生成X-Param参数的base64编码
    const xParamBase64 = Buffer.from(JSON.stringify(params)).toString('base64');
    
    // 计算签名
    const checkSum = getXFSign(XF_API_KEY, xParamBase64, curTime);
    
    // 发送请求
    const response = await axios({
      method: 'post',
      url: XF_API_URL,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
        'X-CurTime': curTime,
        'X-Param': xParamBase64,
        'X-Appid': XF_APP_ID,
        'X-CheckSum': checkSum
      },
      data: `text=${encodeURIComponent(text)}`,
      responseType: 'arraybuffer'
    });
    
    // 生成唯一的文件名
    const fileName = `tts_${Date.now()}.mp3`;
    const filePath = path.join(__dirname, 'public', 'audio', fileName);
    
    // 确保目录存在
    if (!fs.existsSync(path.join(__dirname, 'public', 'audio'))) {
      fs.mkdirSync(path.join(__dirname, 'public', 'audio'), { recursive: true });
    }
    
    // 保存音频文件
    fs.writeFileSync(filePath, response.data);
    
    // 返回音频URL
    const audioUrl = `${req.protocol}://${req.get('host')}/audio/${fileName}`;
    
    res.json({
      success: true,
      audioUrl: audioUrl
    });
    
  } catch (error) {
    console.error('语音合成请求失败:', error);
    res.status(500).json({
      success: false,
      error: '语音合成请求失败'
    });
  }
});

// 提供静态文件访问
app.use('/audio', express.static(path.join(__dirname, 'public', 'audio')));

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});
```

## 3. 在小程序中调用API

1. 在小程序中通过wx.request调用后端服务
2. 配置request合法域名
3. 处理返回的音频URL并播放

## 4. API参数说明

### 主要参数

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| text | 需要转换的文本内容 | string | - |
| aue | 音频编码格式 | string | lame (mp3) |
| voice_name | 发音人 | string | xiaoyan (讯飞小燕) |
| speed | 语速 | int | 50 |
| volume | 音量 | int | 50 |
| pitch | 音高 | int | 50 |

### 发音人列表

- xiaoyan: 讯飞小燕（青年女声）
- aisjiuxu: 讯飞许久（青年男声）
- aisxping: 讯飞小萍（青年女声）
- aisjinger: 讯飞小婧（青年女声）
- 更多发音人请参考科大讯飞官方文档

## 5. 注意事项

1. 科大讯飞API有调用次数限制，免费账号每日500次调用限制
2. 文本长度限制为1000个字符
3. 请确保域名已备案并配置HTTPS
4. 小程序上线前必须配置合法域名
5. 建议设置音频缓存机制，避免重复请求同样的内容 