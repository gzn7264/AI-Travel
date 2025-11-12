class RecorderManager {
  constructor(processorPath) {
    this.processorPath = processorPath;
    this.audioContext = null;
    this.mediaRecorder = null;
    this.audioStream = null;
    this.worker = null;
    this.isRecording = false;
    this.frameSize = 0;
    this.sampleRate = 0;
    this.audioBuffers = [];
    this.onStart = null;
    this.onStop = null;
    this.onFrameRecorded = null;
  }

  async start(options = {}) {
    try {
      this.sampleRate = options.sampleRate || 16000;
      this.frameSize = options.frameSize || 1280;
      this.arrayBufferType = options.arrayBufferType || 'short16';

      // 获取用户媒体设备权限
      this.audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // 创建音频上下文
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: this.sampleRate
      });

      const source = this.audioContext.createMediaStreamSource(this.audioStream);
      const processor = this.audioContext.createScriptProcessor(this.frameSize, 1, 1);

      // 处理音频数据
      processor.onaudioprocess = (event) => {
        if (!this.isRecording) return;

        const audioData = event.inputBuffer.getChannelData(0);
        const frameBuffer = this.convertAudioData(audioData);
        
        this.audioBuffers.push(frameBuffer);
        
        if (this.onFrameRecorded) {
          this.onFrameRecorded({
            isLastFrame: false,
            frameBuffer: frameBuffer
          });
        }
      };

      source.connect(processor);
      processor.connect(this.audioContext.destination);
      
      this.isRecording = true;
      
      if (this.onStart) {
        this.onStart();
      }

    } catch (error) {
      console.error('录音启动失败:', error);
    }
  }

  stop() {
    if (!this.isRecording) return;

    this.isRecording = false;

    // 停止所有音频相关对象
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
    }
    
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
    }
    
    if (this.audioContext) {
      this.audioContext.close();
    }

    // 处理最后一帧数据
    if (this.onFrameRecorded) {
      this.onFrameRecorded({
        isLastFrame: true,
        frameBuffer: new ArrayBuffer(0)
      });
    }

    // 触发停止回调
    if (this.onStop) {
      this.onStop(this.audioBuffers);
    }
  }

  convertAudioData(audioData) {
    const buffer = new ArrayBuffer(audioData.length * 2); // 16位PCM
    const view = new DataView(buffer);
    
    for (let i = 0; i < audioData.length; i++) {
      const sample = Math.max(-1, Math.min(1, audioData[i]));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(i * 2, intSample, true);
    }
    
    return buffer;
  }
}

// 导出到全局作用域
window.RecorderManager = RecorderManager;