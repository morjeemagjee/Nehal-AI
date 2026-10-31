import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Pause,
  Play,
  Upload,
  Shield,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  FileAudio,
  CheckCircle2,
  HardDrive,
  Cpu,
} from 'lucide-react';
import { NahalAudioRecorder, AudioVisualizerData } from '../utils/audioRecorder';
import { AudioVisualizerCanvas } from './AudioVisualizerCanvas';
import { StoredRecording, saveRecordingToVault } from '../utils/storage';
import { getSampleRecordings } from '../data/sampleRecordings';

interface VoiceStudioProps {
  onRecordingSaved: (recording: StoredRecording) => void;
  onNavigateToIntelligence: (recording: StoredRecording) => void;
  privacyMode: 'local' | 'hybrid';
  setPrivacyMode: (mode: 'local' | 'hybrid') => void;
}

export const VoiceStudio: React.FC<VoiceStudioProps> = ({
  onRecordingSaved,
  onNavigateToIntelligence,
  privacyMode,
  setPrivacyMode,
}) => {
  const [recorderState, setRecorderState] = useState<'idle' | 'recording' | 'paused' | 'processing'>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [visualizerData, setVisualizerData] = useState<AudioVisualizerData | null>(null);
  const [hasConsent, setHasConsent] = useState(true);
  const [sessionTitle, setSessionTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastSavedSession, setLastSavedSession] = useState<StoredRecording | null>(null);

  const recorderRef = useRef<NahalAudioRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (recorderRef.current && recorderState === 'recording') {
        recorderRef.current.stop().catch(() => {});
      }
    };
  }, [recorderState]);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartRecording = async () => {
    setErrorMessage(null);
    setLastSavedSession(null);

    try {
      const recorder = new NahalAudioRecorder();
      recorderRef.current = recorder;

      recorder.onVisualizerUpdate = (data) => {
        setVisualizerData(data);
      };

      recorder.onTimerUpdate = (sec) => {
        setElapsedSeconds(sec);
      };

      await recorder.start();
      setRecorderState('recording');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Permission') || msg.includes('permission') || msg.includes('NotAllowedError')) {
        setErrorMessage('Microphone access was denied. Please allow microphone permissions in your browser or test with a sample file below.');
      } else {
        setErrorMessage(`Audio capture failed: ${msg}`);
      }
      setRecorderState('idle');
    }
  };

  const handlePauseResume = () => {
    if (!recorderRef.current) return;
    if (recorderState === 'recording') {
      recorderRef.current.pause();
      setRecorderState('paused');
    } else if (recorderState === 'paused') {
      recorderRef.current.resume();
      setRecorderState('recording');
    }
  };

  const handleStopRecording = async () => {
    if (!recorderRef.current) return;
    setRecorderState('processing');

    try {
      const { blob, base64, duration, sizeBytes } = await recorderRef.current.stop();

      const title = sessionTitle.trim() || `Capture ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
      const newRecording: StoredRecording = {
        id: `rec-${Date.now()}`,
        title,
        createdAt: Date.now(),
        duration,
        sizeBytes,
        sampleRate: 16000,
        channels: 1,
        bitDepth: 16,
        blob,
        base64,
        notes: `Recorded with NahalAudio 16kHz mono engine. Consent confirmed: ${hasConsent ? 'Yes' : 'No'}.`,
      };

      await saveRecordingToVault(newRecording);
      setLastSavedSession(newRecording);
      onRecordingSaved(newRecording);
      setSessionTitle('');
      setRecorderState('idle');
      setElapsedSeconds(0);
      setVisualizerData(null);
    } catch (err: unknown) {
      setErrorMessage(`Failed to process recording: ${err instanceof Error ? err.message : String(err)}`);
      setRecorderState('idle');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRecorderState('processing');
    setErrorMessage(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

      // Downsample to 16kHz Mono
      const offlineCtx = new OfflineAudioContext(1, Math.ceil(audioBuffer.duration * 16000), 16000);
      const source = offlineCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(offlineCtx.destination);
      source.start(0);

      const renderedBuffer = await offlineCtx.startRendering();
      const pcmData = renderedBuffer.getChannelData(0);

      // Encode to 16-bit PCM WAV
      const wavBuffer = new ArrayBuffer(44 + pcmData.length * 2);
      const view = new DataView(wavBuffer);

      const writeStr = (offset: number, str: string) => {
        for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
      };

      writeStr(0, 'RIFF');
      view.setUint32(4, 36 + pcmData.length * 2, true);
      writeStr(8, 'WAVE');
      writeStr(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true); // PCM
      view.setUint16(22, 1, true); // Mono
      view.setUint32(24, 16000, true);
      view.setUint32(28, 32000, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      writeStr(36, 'data');
      view.setUint32(40, pcmData.length * 2, true);

      let offset = 44;
      for (let i = 0; i < pcmData.length; i++) {
        const s = Math.max(-1, Math.min(1, pcmData[i]));
        const int16 = s < 0 ? s * 0x8000 : s * 0x7fff;
        view.setInt16(offset, int16, true);
        offset += 2;
      }

      const wavBlob = new Blob([view], { type: 'audio/wav' });

      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1] || '';
        const importedRecording: StoredRecording = {
          id: `imp-${Date.now()}`,
          title: file.name.replace(/\.[^/.]+$/, ''),
          createdAt: Date.now(),
          duration: Math.round(renderedBuffer.duration * 10) / 10,
          sizeBytes: wavBlob.size,
          sampleRate: 16000,
          channels: 1,
          bitDepth: 16,
          blob: wavBlob,
          base64,
          notes: `Imported audio resampled to 16 kHz Mono WAV. Original file: ${file.name}`,
        };

        await saveRecordingToVault(importedRecording);
        setLastSavedSession(importedRecording);
        onRecordingSaved(importedRecording);
        setRecorderState('idle');
      };
      reader.readAsDataURL(wavBlob);
    } catch (err: unknown) {
      setErrorMessage(`Could not decode audio file: ${err instanceof Error ? err.message : String(err)}`);
      setRecorderState('idle');
    }
  };

  const handleLoadSample = async (sampleIndex: number) => {
    const samples = getSampleRecordings();
    const selected = samples[sampleIndex];
    if (selected) {
      await saveRecordingToVault(selected);
      setLastSavedSession(selected);
      onRecordingSaved(selected);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Mode & Consent */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Mode Selector Card */}
        <div className="md:col-span-2 rounded-xl bg-slate-900/90 border border-slate-800 p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-lg ${privacyMode === 'local' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                {privacyMode === 'local' ? <Shield className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-100">
                    {privacyMode === 'local' ? 'Local Air-Gapped Mode (NahalAI v0.1)' : 'Gemini Hybrid Intelligence (v0.2 Preview)'}
                  </h3>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    {privacyMode === 'local' ? 'ZERO NETWORK' : 'CLOUD REASONING'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {privacyMode === 'local'
                    ? 'Strict sandbox. 100% on-device capture & heuristic analysis. Zero network payloads leave this device.'
                    : 'Captures 16kHz PCM locally, with multimodal Gemini 3.8 Flash for diarization & structured action items.'}
                </p>
              </div>
            </div>

            <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 self-stretch sm:self-auto justify-center">
              <button
                type="button"
                onClick={() => setPrivacyMode('local')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  privacyMode === 'local'
                    ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Local Only
              </button>
              <button
                type="button"
                onClick={() => setPrivacyMode('hybrid')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  privacyMode === 'hybrid'
                    ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Gemini AI
              </button>
            </div>
          </div>
        </div>

        {/* Ethical Consent Card */}
        <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 flex flex-col justify-between">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-xs font-semibold text-slate-200">Consent & Safety Rule</h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                As codified in NahalAI README: Only record conversations when all participants are informed and agree.
              </p>
            </div>
          </div>
          <label className="mt-3 flex items-center gap-2 cursor-pointer select-none text-xs text-slate-300">
            <input
              type="checkbox"
              checked={hasConsent}
              onChange={(e) => setHasConsent(e.target.checked)}
              className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500/20"
            />
            <span className="text-[11px] text-slate-400">All participants have given verbal consent</span>
          </label>
        </div>
      </div>

      {/* Main Capture Console */}
      <div className="rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 p-6 md:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${recorderState === 'recording' ? 'bg-red-500 animate-ping' : 'bg-emerald-500'}`} />
              {recorderState === 'recording' ? 'Live Audio Capture Active' : recorderState === 'paused' ? 'Recording Paused' : '16 kHz Studio Standby'}
            </span>
            <h2 className="text-xl md:text-2xl font-bold text-slate-100 mt-1">
              Nahal Audio Engine
            </h2>
          </div>

          {/* Session Title Input */}
          <div className="w-full md:w-80">
            <input
              type="text"
              placeholder="Session Title (e.g., Sprint Planning, Client Briefing)"
              value={sessionTitle}
              onChange={(e) => setSessionTitle(e.target.value)}
              disabled={recorderState === 'recording'}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>
        </div>

        {/* Live Visualizer Canvas */}
        <div className="mb-6">
          <AudioVisualizerCanvas
            data={visualizerData}
            isRecording={recorderState === 'recording'}
            isPaused={recorderState === 'paused'}
          />
        </div>

        {/* Telemetry Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <div>
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Elapsed Time</div>
            <div className="text-lg font-mono font-bold text-slate-100">
              {formatTimer(elapsedSeconds)}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Estimated Data</div>
            <div className="text-lg font-mono font-bold text-emerald-400">
              {(elapsedSeconds * 32).toLocaleString()} KB
            </div>
          </div>
          <div>
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Sample Format</div>
            <div className="text-sm font-mono text-slate-300 mt-0.5">
              16kHz • 16-bit PCM
            </div>
          </div>
          <div>
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">App Storage</div>
            <div className="text-sm font-mono text-slate-300 mt-0.5 flex items-center gap-1">
              <HardDrive className="w-3.5 h-3.5 text-slate-400" />
              <span>App-Private Vault</span>
            </div>
          </div>
        </div>

        {/* Error message banner */}
        {errorMessage && (
          <div className="mb-6 p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="text-xs text-red-300 leading-relaxed">
              {errorMessage}
            </div>
          </div>
        )}

        {/* Primary Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {recorderState === 'idle' && (
            <>
              <button
                type="button"
                onClick={handleStartRecording}
                className="relative group flex items-center gap-3 px-8 py-3.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
              >
                <div className="w-3 h-3 rounded-full bg-slate-950 group-hover:scale-110 transition-transform" />
                <span>Start 16kHz Recording</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-5 py-3 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
              >
                <Upload className="w-4 h-4 text-slate-400" />
                <span>Import Audio (.wav, .mp3)</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </>
          )}

          {(recorderState === 'recording' || recorderState === 'paused') && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handlePauseResume}
                className="flex items-center gap-2 px-5 py-3 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
              >
                {recorderState === 'recording' ? (
                  <>
                    <Pause className="w-4 h-4 text-amber-400" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 text-emerald-400" />
                    <span>Resume</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleStopRecording}
                className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-red-500 hover:bg-red-400 text-white font-semibold text-sm transition-all shadow-lg shadow-red-500/20 active:scale-95"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>Stop & Save to Vault</span>
              </button>
            </div>
          )}

          {recorderState === 'processing' && (
            <div className="flex items-center gap-3 text-slate-400 text-sm font-mono py-3">
              <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <span>Resampling & writing 16-bit WAV headers...</span>
            </div>
          )}
        </div>
      </div>

      {/* Just Saved Session Notification with Quick Analyze */}
      {lastSavedSession && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-slate-200">
                "{lastSavedSession.title}" saved to App-Private Vault
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                {lastSavedSession.duration}s • {(lastSavedSession.sizeBytes / 1024).toFixed(1)} KB • 16kHz Mono WAV
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => onNavigateToIntelligence(lastSavedSession)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>Analyze Intelligence Now</span>
            </button>
          </div>
        </div>
      )}

      {/* Pre-packaged Realistic NahalAI Sample Library */}
      <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileAudio className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-slate-200">
              Quick Test Library (NahalAI Pre-loaded Sessions)
            </h3>
          </div>
          <span className="text-xs text-slate-500">Instant test without microphone</span>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Load verified 16 kHz sessions pre-analyzed with speaker diarization, intent extraction, and action items:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div
            onClick={() => handleLoadSample(0)}
            className="group cursor-pointer rounded-lg bg-slate-950/70 border border-slate-800 hover:border-emerald-500/50 p-3.5 transition-all"
          >
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-1">
              <span>32s • 3 Speakers</span>
              <span className="text-emerald-400 text-[10px] uppercase font-bold">Verified</span>
            </div>
            <h4 className="text-sm font-medium text-slate-200 group-hover:text-emerald-300 transition-colors">
              NahalAI Core Team Sync
            </h4>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
              Discussion on 16kHz PCM pipeline, absence of INTERNET permissions, and offline STT roadmap.
            </p>
          </div>

          <div
            onClick={() => handleLoadSample(1)}
            className="group cursor-pointer rounded-lg bg-slate-950/70 border border-slate-800 hover:border-emerald-500/50 p-3.5 transition-all"
          >
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-1">
              <span>45s • 2 Speakers</span>
              <span className="text-emerald-400 text-[10px] uppercase font-bold">Clinical</span>
            </div>
            <h4 className="text-sm font-medium text-slate-200 group-hover:text-emerald-300 transition-colors">
              Clinical Intake & Prescription
            </h4>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
              Doctor-patient blood pressure review, ACE inhibitor cough triage, and Losartan switch.
            </p>
          </div>

          <div
            onClick={() => handleLoadSample(2)}
            className="group cursor-pointer rounded-lg bg-slate-950/70 border border-slate-800 hover:border-emerald-500/50 p-3.5 transition-all"
          >
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-1">
              <span>28s • 2 Speakers</span>
              <span className="text-emerald-400 text-[10px] uppercase font-bold">UX/UI</span>
            </div>
            <h4 className="text-sm font-medium text-slate-200 group-hover:text-emerald-300 transition-colors">
              Android Voice Assistant UI
            </h4>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
              Jetpack Compose amplitude animation and ethical recording disclosure banner design.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
