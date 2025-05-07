// backend-implementation.js
// 此文件用于示例服务器端API实现

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
    const { text, voiceId, volume, language } = req.body;
    
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
      voice_name: voiceId || 'xiaoyan', // 发音人
      speed: 50, // 语速
      volume: parseInt(volume) || 50, // 音量
      pitch: 50, // 音高
      engine_type: 'intp65', // 引擎类型
      text_type: 'text', // 文本类型
      lang: language === 'en-US' ? 1 : 0 // 语言，0：中文，1：英文
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

// 获取可用音色列表
app.get('/api/voices', (req, res) => {
  // 返回支持的音色列表
  const voices = [
    { id: 'xiaoyan', name: '小燕 (女声)' },
    { id: 'aisjiuxu', name: '许久 (男声)' },
    { id: 'aisxping', name: '小萍 (女声)' },
    { id: 'aisjinger', name: '小婧 (女声)' },
    { id: 'aisbabyxu', name: '儿童 (童声)' }
  ];
  
  res.json({
    success: true,
    voices: voices
  });
});

// 获取支持的语言列表
app.get('/api/languages', (req, res) => {
  // 返回支持的语言列表
  const languages = [
    { id: 'zh-CN', name: '中文' },
    { id: 'en-US', name: '英文' }
  ];
  
  res.json({
    success: true,
    languages: languages
  });
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});

// 为了避免文件过多占用空间，定期清理音频文件
setInterval(() => {
  const audioDir = path.join(__dirname, 'public', 'audio');
  if (fs.existsSync(audioDir)) {
    fs.readdir(audioDir, (err, files) => {
      if (err) return;
      
      const now = Date.now();
      files.forEach(file => {
        const filePath = path.join(audioDir, file);
        fs.stat(filePath, (err, stats) => {
          if (err) return;
          
          // 删除超过1小时的文件
          if (now - stats.mtime.getTime() > 3600000) {
            fs.unlink(filePath, () => {});
          }
        });
      });
    });
  }
}, 1800000); // 每30分钟执行一次清理 