/**
 * NahalAI Studio — Private Audio Capture & Voice Intelligence
 * Based on NahalAI Android v0.1 Audio Capture Prototype & v0.2 AI Roadmap
 */

import React, { useState, useEffect } from 'react';
import {
  Mic,
  HardDrive,
  Sparkles,
  Smartphone,
  Shield,
  ShieldAlert,
  Info,
  Radio,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { VoiceStudio } from './components/VoiceStudio';
import { PrivateVault } from './components/PrivateVault';
import { VoiceIntelligenceView } from './components/VoiceIntelligenceView';
import { AndroidProjectHub } from './components/AndroidProjectHub';
import { PrivacySpecsModal } from './components/PrivacySpecsModal';
import { StoredRecording, getAllRecordings, saveRecordingToVault } from './utils/storage';
import { getSampleRecordings } from './data/sampleRecordings';

export default function App() {
  const [activeTab, setActiveTab] = useState<'studio' | 'vault' | 'intelligence' | 'android'>('studio');
  const [recordings, setRecordings] = useState<StoredRecording[]>([]);
  const [selectedRecording, setSelectedRecording] = useState<StoredRecording | null>(null);
  const [privacyMode, setPrivacyMode] = useState<'local' | 'hybrid'>('hybrid');
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);

  // Load vault recordings from IndexedDB
  const refreshRecordings = async () => {
    try {
      const records = await getAllRecordings();
      if (records.length === 0) {
        // First-run seed with NahalAI samples
        const samples = getSampleRecordings();
        for (const s of samples) {
          await saveRecordingToVault(s);
        }
        setRecordings(samples);
        setSelectedRecording(samples[0]);
      } else {
        setRecordings(records);
        if (!selectedRecording && records.length > 0) {
          setSelectedRecording(records[0]);
        }
      }
    } catch (e) {
      console.error('Error loading recordings from vault:', e);
    }
  };

  useEffect(() => {
    refreshRecordings();

    // Check server status
    fetch('/api/status')
      .then((res) => res.json())
      .then((data) => {
        setServerOnline(data.status === 'online');
      })
      .catch(() => {
        setServerOnline(false);
      });
  }, []);

  const handleRecordingSaved = (newRecording: StoredRecording) => {
    setRecordings((prev) => [newRecording, ...prev]);
    setSelectedRecording(newRecording);
  };

  const handleNavigateToIntelligence = (recording: StoredRecording) => {
    setSelectedRecording(recording);
    setActiveTab('intelligence');
  };

  const handleLoadSamples = async () => {
    const samples = getSampleRecordings();
    for (const s of samples) {
      await saveRecordingToVault(s);
    }
    await refreshRecordings();
    setSelectedRecording(samples[0]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Top Application Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800/90 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950 font-black tracking-tight">
              <Radio className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">NahalAI</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 font-bold border border-slate-700">
                  v0.2 STUDIO
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                16 kHz PCM Audio Capture & Voice Intelligence
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('studio')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'studio'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Capture Studio</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('vault')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'vault'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>Vault ({recordings.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('intelligence')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'intelligence'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Intelligence</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('android')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'android'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Android Engine</span>
            </button>
          </nav>

          {/* Right Header Status & Info */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPrivacyModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs border border-slate-800 transition-colors"
              title="Architecture & Privacy Constitution"
            >
              <Info className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden md:inline">Constitution</span>
            </button>

            <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-mono px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400">
              {privacyMode === 'local' ? (
                <>
                  <WifiOff className="w-3 h-3 text-amber-400" />
                  <span className="text-amber-300">Air-Gapped</span>
                </>
              ) : (
                <>
                  <Wifi className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-300">Gemini Cloud</span>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main App Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'studio' && (
          <VoiceStudio
            onRecordingSaved={handleRecordingSaved}
            onNavigateToIntelligence={handleNavigateToIntelligence}
            privacyMode={privacyMode}
            setPrivacyMode={setPrivacyMode}
          />
        )}

        {activeTab === 'vault' && (
          <PrivateVault
            recordings={recordings}
            onSelectRecordingForAnalysis={handleNavigateToIntelligence}
            onRefreshRecordings={refreshRecordings}
            onLoadSamples={handleLoadSamples}
          />
        )}

        {activeTab === 'intelligence' && (
          <VoiceIntelligenceView
            recording={selectedRecording}
            privacyMode={privacyMode}
            onRefreshRecordings={refreshRecordings}
            onSwitchToStudio={() => setActiveTab('studio')}
          />
        )}

        {activeTab === 'android' && <AndroidProjectHub />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span>NahalAI v0.1 & v0.2</span>
            <span>•</span>
            <span>16 kHz Mono 16-bit PCM Audio Specification</span>
          </div>
          <div className="text-[11px] text-slate-600">
            Compliant with participant consent rules & Android Scoped App-Private Storage
          </div>
        </div>
      </footer>

      {/* Privacy Specs & Constitution Modal */}
      <PrivacySpecsModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
      />
    </div>
  );
}
