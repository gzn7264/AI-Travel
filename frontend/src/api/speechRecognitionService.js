// 语音识别服务 - 集成讯飞API
export default {
  // 讯飞API配置
  apiConfig: {
    // 请替换为实际的API Key
    appid: '', // 从需求文档中获取
    apiKey: '', // 从需求文档中获取
    apiSecret: '', // 从需求文档中获取
    host: 'ws-api.xfyun.cn',
    port: 443,
    path: '/v2/iat',
    algorithm: 'hmac-sha256'
  },
  
  // WebSocket连接对象
  wsConnection: null,
  
  // 是否正在录音
  isRecording: false,
  
  // 录音器管理器
  recorderManager: null,
  
  // 初始化语音识别服务
  init(config = {}) {
    // 合并配置
    this.apiConfig = { ...this.apiConfig, ...config };
    
    // 检查是否有必要的配置
    if (!this.apiConfig.appid || !this.apiConfig.apiKey || !this.apiConfig.apiSecret) {
      console.warn('讯飞API配置不完整，请提供appid、apiKey和apiSecret');
    }
    
    console.log('语音识别服务初始化完成');
  },
  
  // 生成WebSocket连接URL
  generateWebSocketUrl() {
    const { host, port, path, appid, apiKey, apiSecret, algorithm } = this.apiConfig;
    const date = new Date().toUTCString();
    const signatureOrigin = `host: ${host}\ndate: ${date}\nGET ${path} HTTP/1.1`;
    
    // 这里应该使用crypto库生成签名，但在浏览器环境中需要特殊处理
    // 以下是简化版，实际使用时需要正确实现HMAC-SHA256签名
    const signature = this.generateMockSignature(signatureOrigin, apiSecret);
    
    const authorizationOrigin = `api_key="${apiKey}", algorithm="${algorithm}", headers="host date request-line", signature="${signature}"`;
    const authorization = btoa(authorizationOrigin);
    
    return `wss://${host}:${port}${path}?authorization=${authorization}&date=${encodeURIComponent(date)}&host=${host}`;
  },
  
  // 生成模拟签名（实际应用中需要使用crypto库）
  generateMockSignature(origin, secret) {
    // 这只是一个模拟实现，实际使用时需要正确计算HMAC-SHA256
    console.warn('使用模拟签名，请在生产环境中实现正确的HMAC-SHA256签名');
    return 'mock_signature_' + Date.now();
  },
  
  // 开始语音识别
  async startSpeechRecognition(options = {}) {
    try {
      // 检查配置
      if (!this.apiConfig.appid || !this.apiConfig.apiKey || !this.apiConfig.apiSecret) {
        throw new Error('讯飞API配置不完整，请提供appid、apiKey和apiSecret');
      }
      
      // 初始化RecorderManager
      if (!this.recorderManager) {
        // 尝试导入RecorderManager
        try {
          const RecorderManagerModule = await import('../assets/recorder/RecorderManager');
          this.recorderManager = new RecorderManagerModule.default();
        } catch (importError) {
          console.error('导入RecorderManager失败:', importError);
          // 使用降级方案
          this.recorderManager = this.createFallbackRecorderManager();
        }
      }
      
      // 创建WebSocket连接
      const wsUrl = this.generateWebSocketUrl();
      this.wsConnection = new WebSocket(wsUrl);
      
      // WebSocket事件处理
      this.setupWebSocketEvents(options);
      
      // 开始录音
      await this.recorderManager.start();
      this.isRecording = true;
      
      if (options.onStart) {
        options.onStart();
      }
      
      return true;
    } catch (error) {
      console.error('开始语音识别失败:', error);
      
      if (options.onError) {
        options.onError(error);
      }
      
      return false;
    }
  },
  
  // 设置WebSocket事件处理
  setupWebSocketEvents(options) {
    if (!this.wsConnection) return;
    
    // 连接打开事件
    this.wsConnection.onopen = () => {
      console.log('WebSocket连接已打开');
      
      // 发送初始化参数
      const initParams = this.createInitParams(options);
      this.wsConnection.send(JSON.stringify({
        common: initParams.common,
        business: initParams.business,
        data: {
          status: 0,
          format: 'audio/L16;rate=16000',
          encoding: 'raw',
          audio: ''
        }
      }));
      
      // 开始发送音频数据
      this.startAudioStreaming();
    };
    
    // 接收消息事件
    this.wsConnection.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // 处理识别结果
        if (data.data && data.data.result) {
          const result = data.data.result;
          const text = result.text ? result.text.join('') : '';
          const isFinal = result.rls === 1;
          
          if (options.onResult) {
            options.onResult({
              text: text,
              isFinal: isFinal,
              result: result
            });
          }
        }
        
        // 处理错误
        if (data.code !== 0) {
          const error = new Error(`${data.message} (code: ${data.code})`);
          console.error('语音识别错误:', error);
          
          if (options.onError) {
            options.onError(error);
          }
        }
      } catch (error) {
        console.error('解析WebSocket消息失败:', error);
      }
    };
    
    // 连接关闭事件
    this.wsConnection.onclose = () => {
      console.log('WebSocket连接已关闭');
      
      if (options.onClose) {
        options.onClose();
      }
    };
    
    // 连接错误事件
    this.wsConnection.onerror = (error) => {
      console.error('WebSocket连接错误:', error);
      
      if (options.onError) {
        options.onError(error);
      }
    };
  },
  
  // 创建初始化参数
  createInitParams(options) {
    return {
      common: {
        app_id: this.apiConfig.appid
      },
      business: {
        language: options.language || 'zh_cn',
        domain: options.domain || 'iat',
        accent: options.accent || 'mandarin',
        vad_eos: options.vad_eos || 10000,
        vad_bos: options.vad_bos || 2000,
        ptt: options.ptt || 0
      }
    };
  },
  
  // 开始音频流传输
  startAudioStreaming() {
    if (!this.recorderManager || !this.wsConnection) return;
    
    // 监听录音数据
    this.recorderManager.onAudioData = (audioData) => {
      if (this.isRecording && this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
        // 将音频数据转换为Base64
        const base64Data = this.arrayBufferToBase64(audioData);
        
        // 发送音频数据
        this.wsConnection.send(JSON.stringify({
          data: {
            status: 1,
            format: 'audio/L16;rate=16000',
            encoding: 'raw',
            audio: base64Data
          }
        }));
      }
    };
  },
  
  // 停止语音识别
  async stopSpeechRecognition(options = {}) {
    try {
      this.isRecording = false;
      
      // 停止录音
      if (this.recorderManager) {
        await this.recorderManager.stop();
      }
      
      // 发送结束标识
      if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
        this.wsConnection.send(JSON.stringify({
          data: {
            status: 2,
            format: 'audio/L16;rate=16000',
            encoding: 'raw',
            audio: ''
          }
        }));
        
        // 关闭WebSocket连接
        setTimeout(() => {
          if (this.wsConnection) {
            this.wsConnection.close();
            this.wsConnection = null;
          }
        }, 1000);
      }
      
      if (options.onStop) {
        options.onStop();
      }
      
      return true;
    } catch (error) {
      console.error('停止语音识别失败:', error);
      
      if (options.onError) {
        options.onError(error);
      }
      
      return false;
    }
  },
  
  // 取消语音识别
  async cancelSpeechRecognition(options = {}) {
    try {
      this.isRecording = false;
      
      // 停止录音
      if (this.recorderManager) {
        await this.recorderManager.stop();
      }
      
      // 关闭WebSocket连接
      if (this.wsConnection) {
        this.wsConnection.close();
        this.wsConnection = null;
      }
      
      if (options.onCancel) {
        options.onCancel();
      }
      
      return true;
    } catch (error) {
      console.error('取消语音识别失败:', error);
      return false;
    }
  },
  
  // ArrayBuffer转换为Base64
  arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    
    return btoa(binary);
  },
  
  // 创建降级版录音管理器
  createFallbackRecorderManager() {
    console.warn('使用降级版录音管理器');
    
    let mediaRecorder = null;
    let audioChunks = [];
    let onAudioDataCallback = null;
    let stream = null;
    
    return {
      start: async () => {
        try {
          // 请求麦克风权限
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          
          // 创建MediaRecorder
          mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'audio/webm;codecs=pcm'
          });
          
          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              audioChunks.push(event.data);
              
              // 尝试将数据转换为ArrayBuffer并回调
              if (onAudioDataCallback) {
                const reader = new FileReader();
                reader.onload = () => {
                  onAudioDataCallback(reader.result);
                };
                reader.readAsArrayBuffer(event.data);
              }
            }
          };
          
          mediaRecorder.start(100); // 每100ms发送一次数据
          
          return true;
        } catch (error) {
          console.error('启动录音失败:', error);
          throw error;
        }
      },
      
      stop: async () => {
        return new Promise((resolve) => {
          if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.onstop = () => {
              // 停止所有轨道
              if (stream) {
                stream.getTracks().forEach(track => track.stop());
              }
              
              audioChunks = [];
              resolve(true);
            };
            
            mediaRecorder.stop();
          } else {
            resolve(true);
          }
        });
      },
      
      // 设置音频数据回调
      set onAudioData(callback) {
        onAudioDataCallback = callback;
      }
    };
  },
  
  // 检查浏览器是否支持语音识别
  checkBrowserSupport() {
    return {
      mediaDevices: 'mediaDevices' in navigator,
      getUserMedia: 'getUserMedia' in navigator.mediaDevices,
      webSocket: 'WebSocket' in window,
      mediaRecorder: 'MediaRecorder' in window
    };
  },
  
  // 请求麦克风权限
  async requestMicrophonePermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // 停止流
      stream.getTracks().forEach(track => track.stop());
      
      return true;
    } catch (error) {
      console.error('请求麦克风权限失败:', error);
      return false;
    }
  },
  
  // 获取模拟的语音识别结果（用于测试）
  getMockRecognitionResult() {
    const mockTexts = [
      '我想去北京旅游三天',
      '上海迪士尼乐园一日游',
      '杭州西湖周末游',
      '成都美食之旅五天',
      '西安兵马俑和古城墙',
      '三亚海滩度假一个星期',
      '重庆火锅和洪崖洞夜景'
    ];
    
    return mockTexts[Math.floor(Math.random() * mockTexts.length)];
  },
  
  // 模拟语音识别（用于无API Key测试）
  simulateSpeechRecognition(options = {}) {
    this.isRecording = true;
    
    if (options.onStart) {
      options.onStart();
    }
    
    // 模拟识别过程
    setTimeout(() => {
      if (this.isRecording) {
        const mockText = this.getMockRecognitionResult();
        
        if (options.onResult) {
          options.onResult({
            text: mockText,
            isFinal: true,
            result: { text: [mockText], rls: 1 }
          });
        }
        
        this.isRecording = false;
        
        if (options.onStop) {
          options.onStop();
        }
      }
    }, 2000);
    
    return {
      stop: () => {
        this.isRecording = false;
        if (options.onStop) {
          options.onStop();
        }
      }
    };
  },
  
  // 清理资源
  cleanup() {
    this.isRecording = false;
    
    // 停止录音
    if (this.recorderManager) {
      try {
        this.recorderManager.stop();
      } catch (error) {
        console.warn('停止录音时出错:', error);
      }
    }
    
    // 关闭WebSocket连接
    if (this.wsConnection) {
      try {
        this.wsConnection.close();
      } catch (error) {
        console.warn('关闭WebSocket连接时出错:', error);
      }
      this.wsConnection = null;
    }
  }
};