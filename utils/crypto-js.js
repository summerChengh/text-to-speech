/**
 * 简化版CryptoJS，仅包含科大讯飞API鉴权需要的功能
 */

// 将字符串转换为wordArray
function stringToWordArray(str) {
  const words = [];
  for (let i = 0; i < str.length; i += 4) {
    words.push(
      (str.charCodeAt(i) << 24) |
      ((i + 1 < str.length ? str.charCodeAt(i + 1) : 0) << 16) |
      ((i + 2 < str.length ? str.charCodeAt(i + 2) : 0) << 8) |
      (i + 3 < str.length ? str.charCodeAt(i + 3) : 0)
    );
  }
  return {
    words: words,
    sigBytes: str.length
  };
}

// wordArray转换为Base64字符串
function wordArrayToBase64(wordArray) {
  const words = wordArray.words;
  const sigBytes = wordArray.sigBytes;
  const map = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

  // 将每3个字节转换为4个Base64字符
  const base64Chars = [];
  for (let i = 0; i < sigBytes; i += 3) {
    const byte1 = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
    const byte2 = i + 1 < sigBytes ? (words[(i + 1) >>> 2] >>> (24 - ((i + 1) % 4) * 8)) & 0xff : 0;
    const byte3 = i + 2 < sigBytes ? (words[(i + 2) >>> 2] >>> (24 - ((i + 2) % 4) * 8)) & 0xff : 0;

    const triplet = (byte1 << 16) | (byte2 << 8) | byte3;

    for (let j = 0; j < 4 && i + j * 0.75 < sigBytes; j++) {
      base64Chars.push(map.charAt((triplet >>> (6 * (3 - j))) & 0x3f));
    }
  }

  // 添加填充
  const paddingChar = map.charAt(64);
  if (sigBytes % 3 === 1) {
    base64Chars.push(paddingChar);
    base64Chars.push(paddingChar);
  } else if (sigBytes % 3 === 2) {
    base64Chars.push(paddingChar);
  }

  return base64Chars.join('');
}

// HmacSHA256实现
function hmacSHA256(message, key) {
  const blockSize = 64;
  const outputSize = 32;
  const oKeyPad = new Array(blockSize);
  const iKeyPad = new Array(blockSize);
  
  // 处理key
  let processedKey = key;
  if (key.length > blockSize) {
    processedKey = sha256(key).toString();
  }
  
  // 填充key
  for (let i = 0; i < blockSize; i++) {
    iKeyPad[i] = (processedKey.charCodeAt(i) || 0) ^ 0x36;
    oKeyPad[i] = (processedKey.charCodeAt(i) || 0) ^ 0x5c;
  }
  
  // 计算hash
  const innerHash = sha256(String.fromCharCode.apply(null, iKeyPad) + message);
  const result = sha256(String.fromCharCode.apply(null, oKeyPad) + innerHash);
  
  return {
    words: result.words,
    sigBytes: outputSize
  };
}

// SHA256实现
function sha256(message) {
  // SHA256常量
  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  // 初始化哈希值
  let H = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];
  
  // 转换为字节
  const M = stringToWordArray(message);
  const words = M.words;
  const sigBytes = M.sigBytes;
  
  // 填充
  words[sigBytes >> 2] |= 0x80 << (24 - (sigBytes % 4) * 8);
  words[(((sigBytes + 64) >> 9) << 4) + 15] = sigBytes * 8;
  
  // 处理区块
  for (let i = 0; i < words.length; i += 16) {
    const W = new Array(64);
    
    // 初始化前16个字
    for (let j = 0; j < 16; j++) {
      W[j] = words[i + j] || 0;
    }
    
    // 扩展
    for (let j = 16; j < 64; j++) {
      const gamma0x = ((W[j - 15] >>> 7) | (W[j - 15] << 25)) ^
                      ((W[j - 15] >>> 18) | (W[j - 15] << 14)) ^
                      (W[j - 15] >>> 3);
                      
      const gamma1x = ((W[j - 2] >>> 17) | (W[j - 2] << 15)) ^
                      ((W[j - 2] >>> 19) | (W[j - 2] << 13)) ^
                      (W[j - 2] >>> 10);
                      
      W[j] = (gamma0x + W[j - 7] + gamma1x + W[j - 16]) | 0;
    }
    
    // 工作变量
    let a = H[0];
    let b = H[1];
    let c = H[2];
    let d = H[3];
    let e = H[4];
    let f = H[5];
    let g = H[6];
    let h = H[7];
    
    // 主循环
    for (let j = 0; j < 64; j++) {
      const sigma1 = ((e >>> 6) | (e << 26)) ^
                    ((e >>> 11) | (e << 21)) ^
                    ((e >>> 25) | (e << 7));
                    
      const ch = (e & f) ^ (~e & g);
      const t1 = h + sigma1 + ch + K[j] + W[j];
      
      const sigma0 = ((a >>> 2) | (a << 30)) ^
                    ((a >>> 13) | (a << 19)) ^
                    ((a >>> 22) | (a << 10));
                    
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = sigma0 + maj;
      
      h = g;
      g = f;
      f = e;
      e = (d + t1) | 0;
      d = c;
      c = b;
      b = a;
      a = (t1 + t2) | 0;
    }
    
    // 更新哈希值
    H[0] = (H[0] + a) | 0;
    H[1] = (H[1] + b) | 0;
    H[2] = (H[2] + c) | 0;
    H[3] = (H[3] + d) | 0;
    H[4] = (H[4] + e) | 0;
    H[5] = (H[5] + f) | 0;
    H[6] = (H[6] + g) | 0;
    H[7] = (H[7] + h) | 0;
  }
  
  return {
    words: H,
    sigBytes: 32
  };
}

// Base64编码
function base64Encode(str) {
  const wordArray = stringToWordArray(str);
  return wordArrayToBase64(wordArray);
}

// UTF8编码
function utf8Encode(str) {
  const utf8 = [];
  for (let i = 0; i < str.length; i++) {
    let charCode = str.charCodeAt(i);
    if (charCode < 0x80) {
      // ASCII字符
      utf8.push(charCode);
    } else if (charCode < 0x800) {
      // 2字节字符
      utf8.push(0xc0 | (charCode >> 6), 
                0x80 | (charCode & 0x3f));
    } else if (charCode < 0xd800 || charCode >= 0xe000) {
      // 3字节字符
      utf8.push(0xe0 | (charCode >> 12), 
                0x80 | ((charCode >> 6) & 0x3f), 
                0x80 | (charCode & 0x3f));
    } else {
      // 处理Unicode代理对
      i++;
      charCode = 0x10000 + (((charCode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
      utf8.push(0xf0 | (charCode >> 18), 
                0x80 | ((charCode >> 12) & 0x3f), 
                0x80 | ((charCode >> 6) & 0x3f), 
                0x80 | (charCode & 0x3f));
    }
  }
  
  return String.fromCharCode.apply(null, utf8);
}

// 导出函数
module.exports = {
  HmacSHA256: function(message, key) {
    return hmacSHA256(message, key);
  },
  enc: {
    Base64: {
      stringify: function(wordArray) {
        return wordArrayToBase64(wordArray);
      }
    },
    Utf8: {
      parse: function(str) {
        return stringToWordArray(utf8Encode(str));
      }
    }
  }
}; 