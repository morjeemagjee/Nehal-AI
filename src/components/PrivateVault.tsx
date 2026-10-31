import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Download,
  Trash2,
  Sparkles,
  Search,
  HardDrive,
  Clock,
  FileAudio,
  Star,
  CheckCircle2,
  Edit2,
  Check,
  X,
  Volume2,
  RotateCcw,
  FastForward,
} from 'lucide-react';
import { StoredRecording, deleteRecordingFromVault, updateRecordingInVault } from '../utils/storage';

interface PrivateVaultProps {
  recordings: StoredRecording[];
  onSelectRecordingForAnalysis: (recording: StoredRecording) => void;
  onRefreshRecordings: () => void;
  onLoadSamples: () => void;
}

export const PrivateVault: React.FC<PrivateVaultProps> = ({
  recordings,
  onSelectRecordingForAnalysis,
  onRefreshRecordings,
  onLoadSamples,
}) => {
  const [activeRecordingId, setActiveRecordingId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const activeRecording = recordings.find((r) => r.id === activeRecordingId);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const playRecording = (recording: StoredRecording) => {
    if (activeRecordingId === recording.id && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
      return;
    }

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    let audioSrc = '';
    if (recording.blob) {
      audioSrc = URL.createObjectURL(recording.blob);
      objectUrlRef.current = audioSrc;
    } else if (recording.base64) {
      audioSrc = `data:audio/wav;base64,${recording.base64}`;
    }

    if (!audioSrc) return;

    setActiveRecordingId(recording.id);
    setCurrentTime(0);

    if (audioRef.current) {
      audioRef.current.src = audioSrc;
      audioRef.current.playbackRate = playbackRate;
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleSkip = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(audioRef.current.duration, audioRef.current.currentTime + seconds));
    }
  };

  const handleRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const handleDownloadWav = (recording: StoredRecording) => {
    let url = '';
    if (recording.blob) {
      url = URL.createObjectURL(recording.blob);
    } else if (recording.base64) {
      url = `data:audio/wav;base64,${recording.base64}`;
    }
    if (!url) return;

    const a = document.createElement('a');
    a.href = url;
    a.download = `${recording.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_16kHz.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDelete = async (id: string) => {
    if (activeRecordingId === id && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      setActiveRecordingId(null);
    }
    await deleteRecordingFromVault(id);
    setDeleteConfirmId(null);
    onRefreshRecordings();
  };

  const handleSaveTitle = async (id: string) => {
    if (editTitle.trim()) {
      await updateRecordingInVault(id, { title: editTitle.trim() });
      onRefreshRecordings();
    }
    setEditingId(null);
  };

  const handleToggleFavorite = async (recording: StoredRecording) => {
    await updateRecordingInVault(recording.id, { isFavorite: !recording.isFavorite });
    onRefreshRecordings();
  };

  const filteredRecordings = recordings.filter((r) =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.notes && r.notes.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatSec = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Vault Header & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-emerald-400" />
            <span>NahalAI App-Private Vault</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Simulating Android's <code className="text-slate-300 bg-slate-900 px-1 py-0.5 rounded">context.filesDir</code>. Scoped strictly to client sandbox.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search recordings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>
        </div>
      </div>

      {/* Floating Audio Player Bar (when active) */}
      {activeRecording && (
        <div className="sticky top-2 z-20 rounded-xl bg-slate-900/95 backdrop-blur border border-emerald-500/30 p-4 shadow-2xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                type="button"
                onClick={() => playRecording(activeRecording)}
                className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center shrink-0 shadow-md transition-colors"
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-slate-100 truncate">{activeRecording.title}</h4>
                <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
                  <span>16 kHz PCM</span>
                  <span>•</span>
                  <span>{formatSec(currentTime)} / {formatSec(duration || activeRecording.duration)}</span>
                </div>
              </div>
            </div>

            {/* Scrubber slider */}
            <div className="flex items-center gap-3 w-full md:flex-1 max-w-xl">
              <span className="text-[11px] font-mono text-slate-400">{formatSec(currentTime)}</span>
              <input
                type="range"
                min={0}
                max={duration || activeRecording.duration}
                step={0.1}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <span className="text-[11px] font-mono text-slate-400">{formatSec(duration || activeRecording.duration)}</span>
            </div>

            {/* Quick action buttons & speed */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSkip(-5)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                title="Rewind 5s"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleSkip(5)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                title="Forward 5s"
              >
                <FastForward className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center bg-slate-950 rounded-lg border border-slate-800 p-0.5 text-[11px] font-mono">
                {[1, 1.25, 1.5].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => handleRateChange(rate)}
                    className={`px-1.5 py-0.5 rounded ${playbackRate === rate ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'text-slate-400'}`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => onSelectRecordingForAnalysis(activeRecording)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-xs font-medium transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Intelligence</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recordings List */}
      {filteredRecordings.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-12 text-center">
          <FileAudio className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-medium text-slate-300">No recordings in private vault</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Record a live 16kHz PCM audio session in the Voice Studio or load pre-built demo recordings.
          </p>
          <button
            type="button"
            onClick={onLoadSamples}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-colors"
          >
            <span>Load NahalAI Demo Recordings</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredRecordings.map((recording) => {
            const isThisPlaying = activeRecordingId === recording.id && isPlaying;
            const hasAnalysis = Boolean(recording.analysis);

            return (
              <div
                key={recording.id}
                className={`group rounded-xl border p-4 transition-all ${
                  activeRecordingId === recording.id
                    ? 'bg-slate-900/90 border-emerald-500/50 shadow-md'
                    : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => playRecording(recording)}
                      className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 ${
                        isThisPlaying
                          ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                          : 'bg-slate-800 group-hover:bg-slate-700 text-slate-200 border border-slate-700'
                      }`}
                    >
                      {isThisPlaying ? (
                        <Pause className="w-5 h-5 fill-current" />
                      ) : (
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      {editingId === recording.id ? (
                        <div className="flex items-center gap-2 mb-1">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveTitle(recording.id)}
                            className="p-1 rounded bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="p-1 rounded bg-slate-800 text-slate-400 hover:text-slate-200"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-slate-100 truncate">
                            {recording.title}
                          </h3>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(recording.id);
                              setEditTitle(recording.title);
                            }}
                            className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-slate-300 p-0.5 transition-opacity"
                            title="Edit Title"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleFavorite(recording)}
                            className={`p-0.5 ${recording.isFavorite ? 'text-amber-400' : 'text-slate-600 hover:text-slate-400'}`}
                            title="Favorite"
                          >
                            <Star className="w-3.5 h-3.5 fill-current" />
                          </button>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-400 font-mono">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>{formatSec(recording.duration)}</span>
                        </span>
                        <span>•</span>
                        <span>{(recording.sizeBytes / 1024).toFixed(1)} KB</span>
                        <span>•</span>
                        <span className="text-emerald-400/90">16 kHz Mono WAV</span>
                        <span>•</span>
                        <span className="text-slate-500 font-sans">
                          {new Date(recording.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Badges & Buttons */}
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 border-slate-800/80 pt-3 sm:pt-0">
                    <button
                      type="button"
                      onClick={() => onSelectRecordingForAnalysis(recording)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        hasAnalysis
                          ? 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-sm'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{hasAnalysis ? 'View Intelligence' : 'Analyze'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownloadWav(recording)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 transition-colors"
                      title="Download 16kHz WAV"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    {deleteConfirmId === recording.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDelete(recording.id)}
                          className="px-2 py-1 rounded bg-red-500 hover:bg-red-400 text-white text-[10px] font-bold"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-2 py-1 rounded bg-slate-800 text-slate-400 text-[10px]"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(recording.id)}
                        className="p-2 rounded-lg bg-slate-800/60 hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors"
                        title="Delete from Vault"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Snippet summary if analysis exists */}
                {recording.analysis && (
                  <div className="mt-3 pt-3 border-t border-slate-800/70 text-xs text-slate-400 flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <p className="line-clamp-1 italic">
                      "{recording.analysis.summary}"
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
