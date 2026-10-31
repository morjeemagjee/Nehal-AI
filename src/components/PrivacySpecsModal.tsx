import React from 'react';
import { X, Shield, Lock, Radio, Cpu, FileAudio, CheckCircle2 } from 'lucide-react';

interface PrivacySpecsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacySpecsModal: React.FC<PrivacySpecsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                NahalAI Architecture & Privacy Constitution
              </h3>
              <p className="text-xs text-slate-400">
                Technical standards behind the v0.1 prototype and v0.2 intelligence roadmap
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-5 space-y-5 text-xs text-slate-300 leading-relaxed">
          {/* Section 1 */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
              <Radio className="w-4 h-4 text-emerald-400" />
              <span>1. Why 16 kHz Mono 16-Bit PCM WAV?</span>
            </div>
            <p className="text-slate-400">
              16,000 Hz covers human speech frequencies (up to 8 kHz Nyquist limit) with minimal noise overhead. It is the universal input expected by modern speech models (Whisper, Vosk, Gemini, Google Speech API). Recording directly in 16-bit linear PCM avoids lossy MP3/AAC compression artifacts that degrade transcription accuracy.
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>2. App-Private Scoped Storage</span>
            </div>
            <p className="text-slate-400">
              In Android, audio is saved under <code className="bg-slate-950 px-1 py-0.5 rounded text-slate-200 font-mono">context.filesDir</code>. These files are sandboxed and completely invisible to gallery apps, file managers, and third-party apps. Uninstalling the app removes all data. In this web studio, files are kept strictly within your browser's local IndexedDB sandbox.
            </p>
          </div>

          {/* Section 3 */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>3. Zero-Cloud / Air-Gapped Mode</span>
            </div>
            <p className="text-slate-400">
              NahalAI v0.1 Android app contains NO <code className="bg-slate-950 px-1 py-0.5 rounded text-slate-200 font-mono">android.permission.INTERNET</code>. The OS physically prevents the application from making any network requests. In this studio, the "Local Air-Gapped" mode respects this exact constraint, ensuring zero bytes leave your machine.
            </p>
          </div>

          {/* Section 4 */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>4. Ethical Recording & Multi-Party Consent</span>
            </div>
            <p className="text-slate-400">
              Conversations must only be recorded when all participants have been clearly informed and have agreed. Both the mobile prototype and this studio enforce visible on-screen recording states and proactive consent verification to prohibit covert recording.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Close Constitution
          </button>
        </div>
      </div>
    </div>
  );
};
