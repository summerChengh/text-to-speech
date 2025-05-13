// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
  // 从云环境变量或数据库获取科大讯飞API凭证
  // 实际部署时，请在云开发控制台 -> 云函数 -> 该函数 -> 设置 -> 环境变量 中设置以下值
 console.log("测试一下：")
  console.log('process.env:', process.env);

  const appId = process.env.XFYUN_APPID;
  const apiKey = process.env.XFYUN_API_KEY;
  const apiSecret = process.env.XFYUN_API_SECRET;
  
  console.log('xfappId:', appId);
  console.log('xfapiKey:', apiKey);
  console.log('xfapiSecret:', apiSecret);

  // 对访问进行简单校验，可根据需求增强安全性
  const { OPENID } = cloud.getWXContext();
  
  if (!OPENID) {
    return {
      success: false,
      message: '未授权的访问'
    };
  }
  
  // 可以添加更多安全验证，例如：
  // 1. 检查用户是否在白名单内
  // 2. 是否有权限访问该API
  // 3. 是否超过调用限制
  
  // 如果API凭证未在环境变量中设置，返回错误
  if (!appId || !apiKey || !apiSecret) {
    return {
      success: false,
      message: 'API凭证未配置，请联系管理员'
    };
  }
  
  // 记录使用日志，便于审计和监控
  await cloud.database().collection('api_access_logs').add({
    data: {
      openid: OPENID,
      api: 'xfyun_tts',
      timestamp: new Date(),
      ip: cloud.getWXContext().CLIENTIP || 'unknown'
    }
  }).catch(err => {
    console.error('记录访问日志失败', err);
  });
  
  // 返回API凭证
  return {
    success: true,
    appId,
    apiKey,
    apiSecret
  };
} 