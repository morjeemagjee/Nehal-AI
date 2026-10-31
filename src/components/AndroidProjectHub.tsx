import React, { useState } from 'react';
import {
  FolderTree,
  FileCode,
  Download,
  Copy,
  Check,
  Terminal,
  Shield,
  Smartphone,
  CheckCircle,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { ANDROID_FILES, ProjectFile, generateAndroidProjectZip } from '../data/androidProjectData';

export const AndroidProjectHub: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<ProjectFile>(ANDROID_FILES[0]);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyCommand = (cmd: string, id: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const handleDownloadZip = async () => {
    setIsDownloadingZip(true);
    try {
      const blob = await generateAndroidProjectZip();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'NahalAI_Android_Project.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate ZIP:', err);
    } finally {
      setIsDownloadingZip(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 mb-1">
              <span>KOTLIN 2.2.20</span>
              <span>•</span>
              <span>AGP 8.13.2</span>
              <span>•</span>
              <span>ANDROID SDK 36</span>
              <span>•</span>
              <span>API 29+</span>
            </div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-emerald-400" />
              <span>NahalAI v0.1 Android Engine Repository</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Native Kotlin + Jetpack Compose prototype capturing 16 kHz Mono 16-bit PCM WAV audio into app-private storage. Zero <code className="text-slate-300 font-mono">INTERNET</code> permission.
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <button
              type="button"
              onClick={handleDownloadZip}
              disabled={isDownloadingZip}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-emerald-500/10"
            >
              <Download className="w-4 h-4" />
              <span>{isDownloadingZip ? 'Generating ZIP...' : 'Download Android Project (.zip)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Code Browser Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: File Tree */}
        <div className="lg:col-span-4 rounded-xl bg-slate-900/80 border border-slate-800 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
            <FolderTree className="w-4 h-4 text-emerald-400" />
            <span>Project Workspace</span>
          </div>

          <div className="space-y-1">
            <div className="text-[11px] font-mono text-slate-500 px-2 py-1">ROOT CONFIGURATION</div>
            {ANDROID_FILES.filter((f) => !f.path.startsWith('app/')).map((file) => (
              <button
                key={file.path}
                type="button"
                onClick={() => setSelectedFile(file)}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center justify-between transition-colors ${
                  selectedFile.path === file.path
                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <FileCode className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                  <span className="truncate">{file.path}</span>
                </div>
                {file.isOriginalAttachment && (
                  <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-slate-800 text-slate-400 shrink-0">
                    Attachment
                  </span>
                )}
              </button>
            ))}

            <div className="text-[11px] font-mono text-slate-500 px-2 pt-3 pb-1">APP SOURCE CODE (:app)</div>
            {ANDROID_FILES.filter((f) => f.path.startsWith('app/')).map((file) => (
              <button
                key={file.path}
                type="button"
                onClick={() => setSelectedFile(file)}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center justify-between transition-colors ${
                  selectedFile.path === file.path
                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <FileCode className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                  <span className="truncate">{file.path.replace('app/', '')}</span>
                </div>
                <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-400 shrink-0 font-sans">
                  Kotlin
                </span>
              </button>
            ))}
          </div>

          {/* Quick specs card */}
          <div className="mt-6 p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400 space-y-1.5">
            <div className="font-semibold text-slate-300">Audio Record Specs:</div>
            <div>• Sample Rate: 16,000 Hz</div>
            <div>• Channel: AudioFormat.CHANNEL_IN_MONO</div>
            <div>• Encoding: AudioFormat.ENCODING_PCM_16BIT</div>
            <div>• Container: 44-byte RIFF WAV Header</div>
            <div>• Target Dir: context.filesDir/recordings</div>
          </div>
        </div>

        {/* Right: Code Viewer */}
        <div className="lg:col-span-8 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex flex-col">
          {/* File Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-slate-200 truncate">
                  {selectedFile.path}
                </span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                  {selectedFile.language}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                {selectedFile.description}
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors shrink-0 ml-3"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Code display with line numbers */}
          <div className="p-4 overflow-x-auto font-mono text-xs text-slate-300 leading-relaxed max-h-[580px] overflow-y-auto">
            <pre className="grid grid-cols-[auto_1fr] gap-x-4">
              <span className="text-slate-600 select-none text-right">
                {selectedFile.content.split('\n').map((_, i) => `${i + 1}\n`)}
              </span>
              <code>{selectedFile.content}</code>
            </pre>
          </div>
        </div>
      </div>

      {/* Build & Run Terminal Commands */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-slate-200">
            Build & Deployment Commands (Physical Device or Emulator)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">1. Compile Debug APK</span>
              <button
                type="button"
                onClick={() => handleCopyCommand('gradlew.bat assembleDebug', 'cmd1')}
                className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
              >
                {copiedCmd === 'cmd1' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>Copy</span>
              </button>
            </div>
            <code className="block bg-slate-900 px-3 py-2 rounded text-xs font-mono text-emerald-300">
              gradlew.bat assembleDebug
            </code>
            <p className="text-[11px] text-slate-500">
              Outputs APK to: <code className="text-slate-400">app/build/outputs/apk/debug/app-debug.apk</code>
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">2. Install via ADB</span>
              <button
                type="button"
                onClick={() => handleCopyCommand('adb install -r app/build/outputs/apk/debug/app-debug.apk', 'cmd2')}
                className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
              >
                {copiedCmd === 'cmd2' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>Copy</span>
              </button>
            </div>
            <code className="block bg-slate-900 px-3 py-2 rounded text-xs font-mono text-emerald-300">
              adb install -r app/build/outputs/apk/debug/app-debug.apk
            </code>
            <p className="text-[11px] text-slate-500">
              Requires USB debugging enabled on Android 10+ device.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
