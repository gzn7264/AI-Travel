<template>
  <div class="speech-input-container">
    <div class="input-wrapper">
      <el-input
        v-model="textValue"
        type="textarea"
        placeholder="语音识别已优化，支持开始/结束录音"
        :rows="4"
        resize="none"
      />
      <div class="button-group">
        <!-- 开始录音按钮 -->
        <el-button
          type="primary"
          :icon="'el-icon-video-camera'"
          @click="startRecording"
          :loading="isConnecting"
          :disabled="isConnecting || isRecording"
        >
          开始录音
        </el-button>
        <!-- 结束录音按钮 -->
        <el-button 
          v-if="isRecording" 
          type="danger" 
          :icon="'el-icon-circle-close'"
          @click="stopRecording"
          size="large"
        >
          🔴 结束录音
        </el-button>
        <el-button type="default" @click="clearText">清空</el-button>
        <el-button type="success" @click="submitText" :disabled="!textValue.trim()">提交</el-button>
      </div>
    </div>
    <div v-if="message" class="message" :class="messageType">
      {{ message }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';

// 定义props和emits
const props = defineProps({
  placeholder: {
    type: String,
    default: '请输入旅行需求或费用信息'
  },
  modelValue: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:modelValue', 'submit']);

// 状态管理
const textValue = ref(props.modelValue);
const isRecording = ref(false);
const isConnecting = ref(false);
const message = ref('');
const messageType = ref('info');
const buttonText = ref('开始录音');
const btnStatus = ref('UNDEFINED'); // "UNDEFINED" "CONNECTING" "OPEN" "CLOSING" "CLOSED"
const countdownInterval = ref(null);

let recorder = null;
let iatWS = null;
let resultText = '';
let resultTextTemp = '';

// 从环境变量中读取讯飞API配置
const APPID = import.meta.env.VITE_IFLYTEK_APPID || '';
const API_KEY = import.meta.env.VITE_IFLYTEK_API_KEY || '';
const API_SECRET = import.meta.env.VITE_IFLYTEK_API_SECRET || '';

// 模拟语音识别函数 - 不使用预设数据
const simulateSpeechRecognition = () => {
  isRecording.value = true;
  changeBtnStatus('OPEN');
  
  // 随机延迟1-3秒模拟语音识别过程
  const delay = Math.floor(Math.random() * 2000) + 1000;
  
  // 倒计时
  let seconds = 6;
  const mockCountdownInterval = setInterval(() => {
    seconds -= 1;
    if (seconds <= 0) {
      clearInterval(mockCountdownInterval);
      
      // 不使用预设数据，保持输入框为空
      isRecording.value = false;
      changeBtnStatus('CLOSED');
      showMessage('模拟语音识别结束', 'success');
    } else {
      buttonText.value = `录音中（${seconds}s）`;
    }
  }, 1000);
};

// 监听textValue变化，同步到父组件
const watchTextValue = () => {
  emit('update:modelValue', textValue.value);
};

// 监听props变化，更新本地值
const updateLocalValue = (newValue) => {
  if (newValue !== textValue.value) {
    textValue.value = newValue;
  }
};

// 显示消息
const showMessage = (msg, type = 'info') => {
  message.value = msg;
  messageType.value = type;
  setTimeout(() => {
    message.value = '';
  }, 3000);
};

// 倒计时函数
const countdown = () => {
  let seconds = 60;
  buttonText.value = `录音中（${seconds}s）`;
  countdownInterval.value = setInterval(() => {
    seconds -= 1;
    if (seconds <= 0) {
      clearInterval(countdownInterval.value);
      stopRecording();
    } else {
      buttonText.value = `录音中（${seconds}s）`;
    }
  }, 1000);
};

// 改变按钮状态
const changeBtnStatus = (status) => {
  btnStatus.value = status;
  if (status === 'CONNECTING') {
    buttonText.value = '建立连接中';
    showMessage('正在连接语音识别服务...', 'info');
    resultText = '';
    resultTextTemp = '';
  } else if (status === 'OPEN') {
    isRecording.value = true;
    countdown();
    showMessage('开始录音，请说话...', 'success');
  } else if (status === 'CLOSING') {
    buttonText.value = '识别中...';
    showMessage('正在处理语音识别结果...', 'info');
  } else if (status === 'CLOSED') {
    isRecording.value = false;
    buttonText.value = '开始录音';
  }
};

// 渲染识别结果函数已在模拟功能中实现

// 渲染识别结果
const renderResult = (resultData) => {
  try {
    const jsonData = JSON.parse(resultData);
    if (jsonData.data && jsonData.data.result) {
      const data = jsonData.data.result;
      let str = '';
      const ws = data.ws;
      for (let i = 0; i < ws.length; i++) {
        str += ws[i].cw[0].w;
      }
      
      // 处理动态修正
      if (data.pgs) {
        if (data.pgs === 'apd') {
          resultText = resultTextTemp;
        }
        resultTextTemp = resultText + str;
      } else {
        resultText = resultText + str;
      }
      
      // 更新输入框的值
      textValue.value = resultTextTemp || resultText || '';
      watchTextValue();
    }
    
    if (jsonData.code === 0 && jsonData.data.status === 2) {
      iatWS.close();
    }
    
    if (jsonData.code !== 0) {
      iatWS.close();
      console.error('语音识别错误:', jsonData);
      showMessage('语音识别失败: ' + jsonData.message, 'error');
    }
  } catch (error) {
    console.error('解析识别结果失败:', error);
  }
};

// HMAC-SHA256算法实现 - 正确版本
const hmacSha256 = (message, key) => {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const messageData = encoder.encode(message);
  
  return window.crypto.subtle.importKey(
    'raw', keyData, { name: 'HMAC', hash: { name: 'SHA-256' } },
    false, ['sign']
  ).then(importedKey => {
    return window.crypto.subtle.sign(
      'HMAC', importedKey, messageData
    ).then(signature => {
      return Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    });
  });
};

// 将十六进制转换为Base64
const hexToBase64 = (hex) => {
  const bytes = new Uint8Array(hex.match(/[\da-f]{2}/gi).map(h => parseInt(h, 16)));
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

// 获取WebSocket URL - 正确实现
const getWebSocketUrl = async () => {
  const url = 'wss://iat-api.xfyun.cn/v2/iat';
  const host = 'iat-api.xfyun.cn';
  const date = new Date().toGMTString();
  const algorithm = 'hmac-sha256';
  const headers = 'host date request-line';
  const signatureOrigin = `host: ${host}\ndate: ${date}\nGET /v2/iat HTTP/1.1`;
  
  try {
    // 计算HMAC-SHA256签名
    const signatureHex = await hmacSha256(signatureOrigin, API_SECRET);
    const signatureBase64 = hexToBase64(signatureHex);
    
    // 构建授权头
    const authorizationOrigin = `api_key="${API_KEY}", algorithm="${algorithm}", headers="${headers}", signature="${signatureBase64}"`;
    const authorization = btoa(authorizationOrigin);
    
    // 构建完整的WebSocket URL
    return `${url}?authorization=${encodeURIComponent(authorization)}&date=${encodeURIComponent(date)}&host=${encodeURIComponent(host)}`;
  } catch (error) {
    console.error('计算签名失败:', error);
    // 为了调试，记录API配置是否存在
    console.log('API配置状态:', { APPID: !!APPID, API_KEY: !!API_KEY, API_SECRET: !!API_SECRET });
    throw error;
  }
};

// 连接WebSocket - 异步实现
const connectWebSocket = async () => {
  try {
    changeBtnStatus('CONNECTING');
    
    // 异步获取WebSocket URL
    const websocketUrl = await getWebSocketUrl();
    console.log('WebSocket URL:', websocketUrl);
    
    if ('WebSocket' in window) {
      iatWS = new WebSocket(websocketUrl);
    } else if ('MozWebSocket' in window) {
      iatWS = new MozWebSocket(websocketUrl);
    } else {
      showMessage('浏览器不支持WebSocket', 'error');
      return;
    }
    
    iatWS.onopen = () => {
      console.log('WebSocket连接已建立');
      // 开始录音
      recorder.start({
        sampleRate: 16000,
        frameSize: 1024, // 改为1024，这是一个有效的2的幂次方值(2^10)
      });
      
      // 配置参数 - 按照科大讯飞文档要求设置
      const params = {
        common: {
          app_id: APPID,
        },
        business: {
          language: 'zh_cn',
          domain: 'iat',
          accent: 'mandarin',
          vad_eos: 5000,
          dwa: 'wpgs',
        },
        data: {
          status: 0,
          format: 'audio/L16;rate=16000',
          encoding: 'raw',
        },
      };
      
      iatWS.send(JSON.stringify(params));
      console.log('已发送初始化参数');
    };
    
    iatWS.onmessage = (e) => {
      console.log('收到识别结果:', e.data);
      renderResult(e.data);
    };
    
    iatWS.onerror = (e) => {
      console.error('WebSocket错误:', e);
      stopRecording();
      showMessage('语音识别服务连接失败', 'error');
    };
    
    iatWS.onclose = (e) => {
      console.log('WebSocket连接已关闭:', e);
      // 只有正常关闭才显示成功消息
      if (e.code === 1000) {
        changeBtnStatus('CLOSED');
        showMessage('语音识别完成', 'success');
      } else {
        changeBtnStatus('CLOSED');
        showMessage(`语音识别服务已断开 (${e.code})`, 'info');
      }
    };
  } catch (error) {
    console.error('连接WebSocket失败:', error);
    showMessage('初始化语音识别失败', 'error');
    // 重置状态
    isConnecting.value = false;
    isRecording.value = false;
    changeBtnStatus('CLOSED');
  }
};

// 转换为Base64
const toBase64 = (buffer) => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

// 开始录音 - 改进版
const startRecording = async () => {
  try {
    isConnecting.value = true;
    
    // 重置结果
    resultText = '';
    resultTextTemp = '';
    
    // 检查API配置
    if (!APPID || !API_KEY || !API_SECRET) {
      showMessage('讯飞API配置未完成，请检查环境变量', 'error');
      isConnecting.value = false;
      return;
    }
    
    // 检查浏览器支持
    if (!window.crypto || !window.crypto.subtle) {
      showMessage('当前浏览器不支持加密操作，请使用最新版Chrome或Firefox', 'error');
      isConnecting.value = false;
      return;
    }
    
    // 请求麦克风权限
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        } 
      });
      // 立即停止这个测试流，稍后由RecorderManager正确处理
      stream.getTracks().forEach(track => track.stop());
      showMessage('麦克风权限已获取，正在连接语音识别服务...', 'info');
    } catch (err) {
      console.warn('无法获取麦克风权限:', err);
      showMessage('无法获取麦克风权限，请检查浏览器设置', 'error');
      isConnecting.value = false;
      return;
    }
    
    // 创建录音管理器实例
    recorder = new RecorderManager('/src/assets/recorder');
    
    recorder.onStart = () => {
      console.log('录音已开始');
      changeBtnStatus('OPEN');
      isConnecting.value = false;
    };
    
    recorder.onFrameRecorded = ({ isLastFrame, frameBuffer }) => {
      if (iatWS && iatWS.readyState === iatWS.OPEN) {
        // 发送音频数据
        iatWS.send(
          JSON.stringify({
            data: {
              status: isLastFrame ? 2 : 1,
              format: 'audio/L16;rate=16000',
              encoding: 'raw',
              audio: toBase64(frameBuffer),
            },
          })
        );
        
        if (isLastFrame) {
          changeBtnStatus('CLOSING');
        }
      }
    };
    
    recorder.onStop = () => {
      if (countdownInterval.value) {
        clearInterval(countdownInterval.value);
      }
      console.log('录音已停止');
    };
    
    // 连接WebSocket开始语音识别
    await connectWebSocket();
  } catch (error) {
    isConnecting.value = false;
    console.error('录音初始化失败:', error);
    showMessage('启动语音识别失败: ' + error.message, 'error');
  }
};

// 停止录音 - 改进版
const stopRecording = () => {
  console.log('停止录音操作开始');
  
  // 清除倒计时
  if (countdownInterval.value) {
    clearInterval(countdownInterval.value);
  }
  
  // 停止录音
  if (recorder) {
    recorder.stop();
  }
  
  // 关闭WebSocket连接（如果存在且处于打开状态）
  if (iatWS && (iatWS.readyState === WebSocket.OPEN || iatWS.readyState === WebSocket.CONNECTING)) {
    changeBtnStatus('CLOSING');
    // 发送最后的完成状态
    if (iatWS.readyState === WebSocket.OPEN) {
      iatWS.send(
        JSON.stringify({
          data: {
            status: 2, // 表示结束
            format: 'audio/L16;rate=16000',
            encoding: 'raw',
            audio: '',
          },
        })
      );
    }
    // 等待结果处理完成后再关闭
    setTimeout(() => {
      iatWS.close();
    }, 500);
  } else {
    // 如果WebSocket已经关闭，直接更新状态
    isRecording.value = false;
    changeBtnStatus('CLOSED');
    showMessage('语音识别已手动结束', 'info');
  }
};

// 切换录音状态
const toggleRecording = () => {
  if (isRecording.value) {
    stopRecording();
  } else {
    startRecording();
  }
};

// 清空文本
const clearText = () => {
  textValue.value = '';
  watchTextValue();
};

// 提交文本
const submitText = () => {
  if (!textValue.value.trim()) {
    showMessage('请输入内容后再提交', 'warning');
    return;
  }
  
  emit('submit', textValue.value);
  showMessage('提交成功', 'success');
};

// 组件挂载时初始化
onMounted(() => {
  console.log('SpeechInput组件已挂载');
  
  // 检查API配置
  if (!APPID || !API_KEY || !API_SECRET) {
    console.warn('科大讯飞API配置不完整，请设置环境变量: VITE_IFLYTEK_APPID, VITE_IFLYTEK_API_KEY, VITE_IFLYTEK_API_SECRET');
  }
  
  // 检查浏览器支持情况
  const checkBrowserSupport = () => {
    const support = {
      mediaDevices: 'mediaDevices' in navigator,
      getUserMedia: 'getUserMedia' in navigator.mediaDevices,
      websocket: 'WebSocket' in window,
      crypto: 'crypto' in window && 'subtle' in window.crypto
    };
    console.log('浏览器支持情况:', support);
    
    if (!support.mediaDevices || !support.getUserMedia) {
      showMessage('当前浏览器不支持音频录制功能', 'warning');
    }
    if (!support.websocket) {
      showMessage('当前浏览器不支持WebSocket', 'warning');
    }
    if (!support.crypto) {
      showMessage('当前浏览器不支持加密功能', 'warning');
    }
  };
  
  checkBrowserSupport();
});

// 组件卸载时清理
onUnmounted(() => {
  stopRecording();
  if (countdownInterval.value) {
    clearInterval(countdownInterval.value);
  }
});
</script>

<style scoped>
.speech-input-container {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

.input-wrapper {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.button-group {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.message {
  margin-top: 15px;
  padding: 10px 15px;
  border-radius: 4px;
  font-size: 14px;
}

.message.info {
  background-color: #f0f9eb;
  color: #67c23a;
  border: 1px solid #e1f3d8;
}

.message.success {
  background-color: #f0f9eb;
  color: #67c23a;
  border: 1px solid #e1f3d8;
}

.message.warning {
  background-color: #fdf6ec;
  color: #e6a23c;
  border: 1px solid #faecd8;
}

.message.error {
  background-color: #fef0f0;
  color: #f56c6c;
  border: 1px solid #fde2e2;
}
</style>