/**
 * NahalAI 16 kHz Mono 16-bit PCM Audio Recorder & WAV Encoder
 * Conforms to NahalAI Android AudioCapture specifications:
 * - Sample Rate: 16,000 Hz
 * - Channel: Mono (1 Channel)
 * - Bit Depth: 16-bit Linear PCM
 * - Format: RIFF Wave (.wav)
 */

export interface AudioVisualizerData {
  timeDomain: Uint8Array;
  frequency: Uint8Array;
  decibels: number;
  clipping: boolean;
}

export class NahalAudioRecorder {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private pcmChunks: Float32Array[] = [];
  private totalSamples = 0;
  private isRecording = false;
  private isPaused = false;
  private startTime = 0;
  private elapsedSeconds = 0;
  private timerInterval: number | null = null;

  public onVisualizerUpdate?: (data: AudioVisualizerData) => void;
  public onTimerUpdate?: (seconds: number) => void;

  async start(): Promise<void> {
    if (this.isRecording) return;

    this.pcmChunks = [];
    this.totalSamples = 0;
    this.elapsedSeconds = 0;

    // Request audio stream with high quality voice constraints
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    this.mediaStream = stream;
    // Modern AudioContext
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.audioContext = new AudioCtx();

    this.sourceNode = this.audioContext.createMediaStreamSource(stream);

    // Analyser node for live oscilloscope and decibel meter
    this.analyserNode = this.audioContext.createAnalyser();
    this.analyserNode.fftSize = 256;
    this.sourceNode.connect(this.analyserNode);

    // ScriptProcessor to collect raw PCM buffers
    // 4096 buffer size gives good balance of latency and performance
    this.processorNode = this.audioContext.createScriptProcessor(4096, 1, 1);
    this.sourceNode.connect(this.processorNode);
    this.processorNode.connect(this.audioContext.destination);

    this.processorNode.onaudioprocess = (e) => {
      if (!this.isRecording || this.isPaused) return;

      const inputBuffer = e.inputBuffer.getChannelData(0);
      // Clone chunk
      const chunk = new Float32Array(inputBuffer);
      this.pcmChunks.push(chunk);
      this.totalSamples += chunk.length;

      // Dispatch visualization data
      if (this.analyserNode && this.onVisualizerUpdate) {
        const timeDomain = new Uint8Array(this.analyserNode.fftSize);
        const frequency = new Uint8Array(this.analyserNode.frequencyBinCount);
        this.analyserNode.getByteTimeDomainData(timeDomain);
        this.analyserNode.getByteFrequencyData(frequency);

        // Compute RMS & Decibels
        let sumSquares = 0;
        let peak = 0;
        for (let i = 0; i < inputBuffer.length; i++) {
          const val = inputBuffer[i];
          const abs = Math.abs(val);
          if (abs > peak) peak = abs;
          sumSquares += val * val;
        }
        const rms = Math.sqrt(sumSquares / inputBuffer.length);
        const db = rms > 0 ? Math.max(-60, Math.min(0, 20 * Math.log10(rms))) : -60;
        const clipping = peak >= 0.99;

        this.onVisualizerUpdate({
          timeDomain,
          frequency,
          decibels: Math.round(db * 10) / 10,
          clipping,
        });
      }
    };

    this.isRecording = true;
    this.isPaused = false;
    this.startTime = Date.now();

    this.timerInterval = window.setInterval(() => {
      if (this.isRecording && !this.isPaused) {
        this.elapsedSeconds += 1;
        this.onTimerUpdate?.(this.elapsedSeconds);
      }
    }, 1000);
  }

  pause(): void {
    if (!this.isRecording) return;
    this.isPaused = true;
  }

  resume(): void {
    if (!this.isRecording) return;
    this.isPaused = false;
  }

  async stop(): Promise<{ blob: Blob; base64: string; duration: number; sizeBytes: number }> {
    this.isRecording = false;
    this.isPaused = false;

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    const currentSampleRate = this.audioContext?.sampleRate || 44100;
    if (this.audioContext && this.audioContext.state !== 'closed') {
      await this.audioContext.close();
      this.audioContext = null;
    }

    // Merge recorded PCM chunks
    const mergedPcm = new Float32Array(this.totalSamples);
    let offset = 0;
    for (const chunk of this.pcmChunks) {
      mergedPcm.set(chunk, offset);
      offset += chunk.length;
    }

    // Downsample to NahalAI standard: 16,000 Hz
    const targetSampleRate = 16000;
    const downsampledPcm = this.resampleAudio(mergedPcm, currentSampleRate, targetSampleRate);

    // Encode to 16-bit Mono WAV
    const wavBlob = this.encodeWAV(downsampledPcm, targetSampleRate);
    const base64 = await this.blobToBase64(wavBlob);

    const duration = Math.round((downsampledPcm.length / targetSampleRate) * 10) / 10;

    return {
      blob: wavBlob,
      base64,
      duration: Math.max(duration, 0.5),
      sizeBytes: wavBlob.size,
    };
  }

  private resampleAudio(sourceAudio: Float32Array, sourceRate: number, targetRate: number): Float32Array {
    if (sourceRate === targetRate) return sourceAudio;

    const ratio = sourceRate / targetRate;
    const targetLength = Math.round(sourceAudio.length / ratio);
    const result = new Float32Array(targetLength);

    for (let i = 0; i < targetLength; i++) {
      const originalIndex = i * ratio;
      const leftIndex = Math.floor(originalIndex);
      const rightIndex = Math.min(leftIndex + 1, sourceAudio.length - 1);
      const fraction = originalIndex - leftIndex;

      // Linear interpolation
      result[i] = sourceAudio[leftIndex] * (1 - fraction) + sourceAudio[rightIndex] * fraction;
    }

    return result;
  }

  private encodeWAV(samples: Float32Array, sampleRate: number): Blob {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    // RIFF chunk descriptor
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true); // File size - 8
    this.writeString(view, 8, 'WAVE');

    // fmt sub-chunk
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
    view.setUint16(22, 1, true); // NumChannels (1 = Mono)
    view.setUint32(24, sampleRate, true); // SampleRate (16000)
    view.setUint32(28, sampleRate * 2, true); // ByteRate (SampleRate * NumChannels * BitsPerSample/8 = 16000 * 1 * 2 = 32000)
    view.setUint16(32, 2, true); // BlockAlign (NumChannels * BitsPerSample/8 = 2)
    view.setUint16(34, 16, true); // BitsPerSample (16 bits)

    // data sub-chunk
    this.writeString(view, 36, 'data');
    view.setUint32(40, samples.length * 2, true); // Subchunk2Size

    // Write 16-bit PCM samples
    let index = 44;
    for (let i = 0; i < samples.length; i++) {
      // Clamp between -1.0 and 1.0
      const s = Math.max(-1, Math.min(1, samples[i]));
      // Convert to 16-bit signed integer (-32768 to 32767)
      const int16 = s < 0 ? s * 0x8000 : s * 0x7fff;
      view.setInt16(index, int16, true);
      index += 2;
    }

    return new Blob([view], { type: 'audio/wav' });
  }

  private writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Strip data:audio/wav;base64, prefix
        const base64 = result.split(',')[1] || '';
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  get state(): { isRecording: boolean; isPaused: boolean; elapsedSeconds: number } {
    return {
      isRecording: this.isRecording,
      isPaused: this.isPaused,
      elapsedSeconds: this.elapsedSeconds,
    };
  }
}
