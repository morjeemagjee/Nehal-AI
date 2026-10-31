import React, { useState } from 'react';
import {
  Sparkles,
  Users,
  CheckSquare,
  Compass,
  FileText,
  Copy,
  Check,
  Download,
  AlertCircle,
  Clock,
  Send,
  MessageSquare,
  Shield,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { StoredRecording, VoiceAnalysisResult, updateRecordingInVault } from '../utils/storage';

interface VoiceIntelligenceViewProps {
  recording: StoredRecording | null;
  privacyMode: 'local' | 'hybrid';
  onRefreshRecordings: () => void;
  onSwitchToStudio: () => void;
}

export const VoiceIntelligenceView: React.FC<VoiceIntelligenceViewProps> = ({
  recording,
  privacyMode,
  onRefreshRecordings,
  onSwitchToStudio,
}) => {
  const [activeTab, setActiveTab] = useState<'transcript' | 'summary' | 'actions' | 'intents' | 'ask'>('summary');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [customQuestion, setCustomQuestion] = useState('');
  const [customAnswer, setCustomAnswer] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState(false);
  const [searchTranscript, setSearchTranscript] = useState('');
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  if (!recording) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-12 text-center">
        <Sparkles className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-medium text-slate-300">No Session Selected</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Select a recorded session from your Private Vault or capture a new 16kHz audio session to run speech transcription & intent reasoning.
        </p>
        <button
          type="button"
          onClick={onSwitchToStudio}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold transition-colors"
        >
          <span>Open Voice Studio</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const analysis = recording.analysis;

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    setErrorNotice(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: recording.base64,
          mimeType: 'audio/wav',
          context: recording.title,
          simulated: privacyMode === 'local',
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const result: VoiceAnalysisResult = await response.json();
      await updateRecordingInVault(recording.id, { analysis: result });
      recording.analysis = result;
      onRefreshRecordings();
    } catch (err: unknown) {
      setErrorNotice(
        `Failed to complete speech intelligence analysis: ${
          err instanceof Error ? err.message : String(err)
        }. Ensure GEMINI_API_KEY is configured or toggle to Local Air-Gapped Mode.`
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCustomQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuestion.trim() || isAsking) return;

    setIsAsking(true);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: recording.base64,
          mimeType: 'audio/wav',
          context: `User query: "${customQuestion}". Provide a direct, factual answer strictly grounded in the audio.`,
          simulated: privacyMode === 'local',
        }),
      });
      const data = await response.json();
      setCustomAnswer(data.summary || 'Answer generated based on recording audio context.');
    } catch {
      setCustomAnswer('Could not generate answer. Check connectivity or model keys.');
    } finally {
      setIsAsking(false);
    }
  };

  const copyToClipboard = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const exportAsMarkdown = () => {
    if (!analysis) return;
    const md = `# NahalAI Voice Intelligence Report
**Title:** ${recording.title}
**Date:** ${new Date(recording.createdAt).toLocaleString()}
**Format:** 16,000 Hz Mono 16-bit PCM WAV
**Duration:** ${recording.duration}s
**Engine:** ${analysis.model} (${analysis.source})

---

## Executive Summary
${analysis.summary}

## Key Decisions
${analysis.keyDecisions.map((d) => `- ${d}`).join('\n')}

## Action Items
${analysis.actionItems.map((a) => `- [ ] **${a.task}** (Owner: ${a.owner} | Priority: ${a.priority.toUpperCase()} | Deadline: ${a.deadline})`).join('\n')}

## Diarized Transcript
${analysis.transcript.map((t) => `**[${t.timeOffset}] ${t.speaker}:** ${t.text}`).join('\n\n')}

## Detected Intents
${analysis.intents.map((i) => `- **${i.intent}** (${Math.round(i.confidence * 100)}%): ${i.explanation}`).join('\n')}

## Entities
${analysis.entities.map((e) => `- ${e.name} (${e.category})`).join('\n')}
`;

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${recording.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_Intelligence_Report.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Session Header Card */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 mb-1">
              <span>{recording.sampleRate} Hz MONO</span>
              <span>•</span>
              <span>{recording.duration}s DURATION</span>
              <span>•</span>
              <span className="text-slate-500">{new Date(recording.createdAt).toLocaleDateString()}</span>
            </div>
            <h2 className="text-lg md:text-xl font-bold text-slate-100">
              {recording.title}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {recording.notes || 'No session notes provided.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            {analysis ? (
              <>
                <button
                  type="button"
                  onClick={handleRunAnalysis}
                  disabled={isAnalyzing}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isAnalyzing ? 'Re-analyzing...' : 'Re-Run Intelligence'}</span>
                </button>
                <button
                  type="button"
                  onClick={exportAsMarkdown}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Report (.md)</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleRunAnalysis}
                disabled={isAnalyzing}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md active:scale-95"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Extracting Speech & Reasoning...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Run Speech-to-Text & Reasoning</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {errorNotice && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
            <span>{errorNotice}</span>
          </div>
        )}
      </div>

      {!analysis && !isAnalyzing && (
        <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/60 p-10 text-center">
          <Layers className="w-10 h-10 text-emerald-400/80 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-200">
            Fulfill NahalAI V0.2 Integration Milestone
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
            As outlined in NahalAI's README roadmap: speech-to-text, speaker diarization, intent analysis, and structured action items are the next milestones.
          </p>
          <button
            type="button"
            onClick={handleRunAnalysis}
            className="mt-4 px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
          >
            Execute Milestone 0.2 Pipeline Now
          </button>
        </div>
      )}

      {isAnalyzing && (
        <div className="rounded-xl border border-emerald-500/30 bg-slate-900/80 p-12 text-center">
          <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h3 className="text-base font-semibold text-slate-100">
            Decoding 16kHz Audio & Running Multimodal Reasoning
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Processing PCM audio chunks, distinguishing speakers, transcribing speech turns, and extracting actionable intents.
          </p>
        </div>
      )}

      {analysis && !isAnalyzing && (
        <div className="space-y-6">
          {/* Metadata & Model Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/70 border border-slate-800 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-mono text-emerald-400 font-semibold">{analysis.model}</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">
                {analysis.audioStats?.speakerCount || 2} Speakers Diarized
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">
                {analysis.audioStats?.estimatedWordCount || 0} Words
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400 capitalize">
                Sentiment: {analysis.sentiment}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
              <Shield className="w-3.5 h-3.5 text-slate-500" />
              <span>Pipeline: {analysis.source}</span>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1 border-b border-slate-800 pb-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('summary')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'summary'
                  ? 'bg-slate-800 text-emerald-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Summary & Decisions</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('transcript')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'transcript'
                  ? 'bg-slate-800 text-emerald-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Diarized Transcript ({analysis.transcript.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('actions')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'actions'
                  ? 'bg-slate-800 text-emerald-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>Action Items ({analysis.actionItems.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('intents')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'intents'
                  ? 'bg-slate-800 text-emerald-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Intents & Entities</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ask')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'ask'
                  ? 'bg-slate-800 text-emerald-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Ask NahalAI Q&A</span>
            </button>
          </div>

          {/* TAB 1: Summary & Decisions */}
          {activeTab === 'summary' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-5">
                <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-slate-200">Executive Summary</h3>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(analysis.summary, 'summary')}
                      className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
                    >
                      {copiedSection === 'summary' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSection === 'summary' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                    {analysis.summary}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-5">
                  <h3 className="text-sm font-semibold text-slate-200 mb-3">Key Decisions</h3>
                  {analysis.keyDecisions && analysis.keyDecisions.length > 0 ? (
                    <ul className="space-y-2.5">
                      {analysis.keyDecisions.map((dec, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                          <span>{dec}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500">No explicit decisions detected in this snippet.</p>
                  )}
                </div>
              </div>

              {/* Sidebar Quick Stats */}
              <div className="space-y-4">
                <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-4">
                  <h4 className="text-xs font-semibold text-slate-300 mb-3">Session Metrics</h4>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between text-slate-400">
                      <span>Sampling Rate:</span>
                      <span className="text-slate-200">16,000 Hz</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Audio Encoding:</span>
                      <span className="text-slate-200">16-bit PCM Linear</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Channels:</span>
                      <span className="text-slate-200">1 (Mono)</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Detected Language:</span>
                      <span className="text-emerald-400 uppercase">{analysis.audioStats?.detectedLanguage || 'EN-US'}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-4">
                  <h4 className="text-xs font-semibold text-slate-300 mb-2">Participant Diarization</h4>
                  <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                    Identified speakers from vocal timber and turn-taking cadence:
                  </p>
                  <div className="space-y-1.5">
                    {Array.from(new Set(analysis.transcript.map((t) => t.speaker))).map((spk, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-slate-300 bg-slate-950 px-2.5 py-1.5 rounded border border-slate-800">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span className="font-medium">{spk}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Diarized Transcript */}
          {activeTab === 'transcript' && (
            <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <input
                  type="text"
                  placeholder="Filter dialogue text..."
                  value={searchTranscript}
                  onChange={(e) => setSearchTranscript(e.target.value)}
                  className="w-full sm:w-64 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                />
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      analysis.transcript.map((t) => `[${t.timeOffset}] ${t.speaker}: ${t.text}`).join('\n\n'),
                      'transcript'
                    )
                  }
                  className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5"
                >
                  {copiedSection === 'transcript' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSection === 'transcript' ? 'Copied Transcript' : 'Copy All Dialogue'}</span>
                </button>
              </div>

              <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-2">
                {analysis.transcript
                  .filter((t) => !searchTranscript || t.text.toLowerCase().includes(searchTranscript.toLowerCase()) || t.speaker.toLowerCase().includes(searchTranscript.toLowerCase()))
                  .map((turn, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-emerald-400 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          {turn.speaker}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{turn.timeOffset}</span>
                        </span>
                      </div>
                      <p className="text-xs md:text-sm text-slate-200 leading-relaxed">
                        {turn.text}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB 3: Action Items */}
          {activeTab === 'actions' && (
            <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">
                    Extracted Action Items & Follow-ups
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Synthesized from audio commitments and assigned responsibilities.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      analysis.actionItems.map((a) => `- [ ] ${a.task} (@${a.owner}, ${a.priority}, ${a.deadline})`).join('\n'),
                      'actions'
                    )
                  }
                  className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5"
                >
                  {copiedSection === 'actions' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSection === 'actions' ? 'Copied' : 'Copy Tasks'}</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {analysis.actionItems.map((item, idx) => (
                  <div key={idx} className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-4 h-4 rounded border border-emerald-500/50 flex items-center justify-center mt-0.5 shrink-0 bg-emerald-500/10">
                        <Check className="w-3 h-3 text-emerald-400" />
                      </div>
                      <div>
                        <h4 className="text-xs md:text-sm font-medium text-slate-200">{item.task}</h4>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                          <span>Assignee: <strong className="text-slate-300 font-normal">{item.owner}</strong></span>
                          <span>•</span>
                          <span>Deadline: <strong className="text-slate-300 font-normal">{item.deadline}</strong></span>
                        </div>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      item.priority === 'high' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      item.priority === 'medium' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}>
                      {item.priority}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Intents & Entities */}
          {activeTab === 'intents' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Intents */}
              <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-5 space-y-4">
                <h3 className="text-sm font-semibold text-slate-200">
                  Detected User Intents & Goals
                </h3>
                <div className="space-y-3">
                  {analysis.intents.map((intent, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-slate-200">{intent.intent}</span>
                        <span className="text-[11px] font-mono text-emerald-400 font-bold">
                          {Math.round(intent.confidence * 100)}%
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{intent.explanation}</p>
                      {/* Confidence bar */}
                      <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full"
                          style={{ width: `${Math.round(intent.confidence * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Entities */}
              <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-5 space-y-4">
                <h3 className="text-sm font-semibold text-slate-200">
                  Named Entities & Domains
                </h3>
                <div className="space-y-2">
                  {analysis.entities.map((entity, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded bg-slate-950 border border-slate-800/80 text-xs">
                      <span className="font-medium text-slate-200">{entity.name}</span>
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {entity.category}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Ask NahalAI Q&A */}
          {activeTab === 'ask' && (
            <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-5 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-200">
                  Contextual Audio Q&A
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Query the audio recording directly using Gemini Multimodal reasoning.
                </p>
              </div>

              <form onSubmit={handleCustomQuestionSubmit} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. What were the specific concerns about battery drain or permissions?"
                  value={customQuestion}
                  onChange={(e) => setCustomQuestion(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  disabled={isAsking || !customQuestion.trim()}
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isAsking ? 'Thinking...' : 'Ask'}</span>
                </button>
              </form>

              {customAnswer && (
                <div className="p-4 rounded-lg bg-slate-950 border border-emerald-500/30 text-xs text-slate-300 leading-relaxed">
                  <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider mb-1 font-bold">
                    NahalAI Audio Grounded Response:
                  </div>
                  {customAnswer}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
